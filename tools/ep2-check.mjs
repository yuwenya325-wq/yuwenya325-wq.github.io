/**
 * 《雪灾猎户买妻》第二集（BV1sr421T7ZX）接入验证：
 * 1. 首页 #ai-film：集数切换条（上集 2:13 / 下集 2:10）；
 * 2. 点击「下集」→ 封面切为 ep2 封面；点击播放 → iframe BV1sr421T7ZX；
 * 3. 切回「上集」→ iframe BV1YS421Q7hA；
 * 4. /film/film-001 详情页：切换条 + 影片时长「上集 2:13 · 下集 2:10」+ 简介含 4 分 24 秒；
 * 5. 控制台零错误 + 截图存档。
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9381;
const BASE = 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-ep2-${Date.now()}`,
  '--window-size=1440,1080', 'about:blank',
], { stdio: 'ignore' });

const cleanup = () => { try { child.kill(); } catch { /* ignore */ } process.exit(0); };
process.on('exit', cleanup);

await sleep(2500);
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let seq = 0; const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((r) => { seq += 1; pending.set(seq, r); ws.send(JSON.stringify({ id: seq, method, params })); });
const evalJs = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return res.result?.value;
};
const shot = async (name) => {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(new URL(`../.shots/ep2/${name}.png`, import.meta.url), Buffer.from(res.data, 'base64'));
};

await send('Page.enable');
await send('Runtime.enable');
const consoleErrors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(m.params.exceptionDetails.text + (m.params.exceptionDetails.exception?.description ?? ''));
  }
});

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

/* ── 1. 首页 #ai-film：集数切换条 ─────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);

const homeState = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  if (!section) return JSON.stringify({ fail: 'no #ai-film' });
  const tabs = [...section.querySelectorAll('[role="tablist"][aria-label*="集数切换"] [role="tab"]')];
  const stage = section.querySelector('.aspect-video');
  const coverImg = stage ? stage.querySelector('img') : null;
  const playBtn = stage ? stage.querySelector('button') : null;
  return JSON.stringify({
    tabCount: tabs.length,
    tabTexts: tabs.map((t) => t.textContent.trim()),
    selectedTab: tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'),
    coverSrc: coverImg ? coverImg.getAttribute('src') : null,
    hasPlay: !!playBtn,
  });
})()`);
const h = JSON.parse(homeState);
check('首页切换条出现（2 个 tab）', h.tabCount === 2, JSON.stringify(h.tabTexts));
check('tab 文案含上集/下集与时长', h.tabTexts.join('|').includes('上集') && h.tabTexts.join('|').includes('2:13') && h.tabTexts.join('|').includes('下集') && h.tabTexts.join('|').includes('2:10'), h.tabTexts.join(' | '));
check('默认选中第 1 个 tab', h.selectedTab === 0);
check('默认封面为第一集', (h.coverSrc ?? '').includes('film-001-cover'), h.coverSrc ?? 'none');

/* ── 2. 点击「下集」→ 封面切换 → 播放 → BV1sr421T7ZX ─────────── */
await evalJs(`(() => {
  const tabs = [...document.querySelectorAll('#ai-film [role="tablist"][aria-label*="集数切换"] [role="tab"]')];
  tabs.find((t) => t.textContent.includes('下集'))?.click();
  return 'clicked';
})()`);
await sleep(700);
await shot('home-ep2-cover');
const ep2Cover = await evalJs(`(() => {
  const stage = document.querySelector('#ai-film .aspect-video');
  const img = stage ? stage.querySelector('img') : null;
  return img ? img.getAttribute('src') : null;
})()`);
check('下集封面为 ep2', (ep2Cover ?? '').includes('film-001-ep2-cover'), ep2Cover ?? 'none');

await evalJs(`(() => {
  const stage = document.querySelector('#ai-film .aspect-video');
  stage?.querySelector('button')?.click();
  return 'play';
})()`);
await sleep(1800);
await shot('home-ep2-iframe');
const iframe1 = await evalJs(`(() => {
  const f = document.querySelector('#ai-film .aspect-video iframe');
  return f ? f.src : null;
})()`);
check('下集 iframe 为 BV1sr421T7ZX', (iframe1 ?? '').includes('bvid=BV1sr421T7ZX'), iframe1 ?? 'no iframe');

/* ── 3. 切回「上集」→ iframe BV1YS421Q7hA ─────────────────────── */
await evalJs(`(() => {
  const tabs = [...document.querySelectorAll('#ai-film [role="tablist"][aria-label*="集数切换"] [role="tab"]')];
  tabs.find((t) => t.textContent.includes('上集'))?.click();
  return 'switched';
})()`);
await sleep(1800);
const iframe2 = await evalJs(`(() => {
  const f = document.querySelector('#ai-film .aspect-video iframe');
  return f ? f.src : null;
})()`);
check('切回上集 iframe 为 BV1YS421Q7hA', (iframe2 ?? '').includes('bvid=BV1YS421Q7hA'), iframe2 ?? 'no iframe');

/* ── 4. 详情页 /film/film-001 ─────────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/film/film-001` });
await sleep(4200);
await shot('detail-top');
const detail = await evalJs(`(() => {
  const tabs = [...document.querySelectorAll('[role="tablist"][aria-label*="集数切换"] [role="tab"]')];
  const rows = [...document.querySelectorAll('dl div')].map((r) => r.textContent.replace(/\\s+/g, ' ').trim());
  const desc = [...document.querySelectorAll('main p')].map((p) => p.textContent).find((t) => t.includes('雪灾')) ?? '';
  const goto = [...document.querySelectorAll('a')].find((a) => a.textContent.includes('前往B站观看'));
  return JSON.stringify({
    tabCount: tabs.length,
    tabTexts: tabs.map((t) => t.textContent.trim()),
    durationRow: rows.find((r) => r.includes('影片时长')) ?? null,
    descHasTotal: desc.includes('4 分 24 秒'),
    gotoHref: goto ? goto.href : null,
    title: document.title,
  });
})()`);
const d = JSON.parse(detail);
check('详情页切换条存在', d.tabCount === 2, d.tabTexts.join(' | '));
check('影片时长逐集显示', d.durationRow?.includes('上集 2:13') && d.durationRow?.includes('下集 2:10'), d.durationRow ?? 'missing');
check('简介含总时长 4 分 24 秒', d.descHasTotal);
check('前往B站默认指向上集', (d.gotoHref ?? '').includes('BV1YS421Q7hA'), d.gotoHref ?? 'none');
check('详情页标题正确', d.title.includes('雪灾猎户买妻'), d.title);

/* ── 5. 控制台 ────────────────────────────────────────────────── */
check('控制台零错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '));

const failed = results.filter((r) => !r.ok);
console.log(`\\n===== ${results.length - failed.length}/${results.length} passed =====`);
process.exit(failed.length ? 1 : 0);
