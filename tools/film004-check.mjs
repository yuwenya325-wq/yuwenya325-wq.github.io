/**
 * 《旧味道》（film-004，AI真人剧第2部）上传验收：
 * 1. AI真人剧分类下 2 个项目可切换；
 * 2. 首页：封面/名称/类型/VIEW PROJECT + 集数切换（上集 0:43 BV1VLp464EaY / 下集 3:52 BV17Mp46wEuB）；
 * 3. 详情页 01 播放器 / 02 项目介绍 / 03 人物 12 张 / 04 场景 8 张 / 05 道具 8 张；
 * 4. 全部图片加载成功 + 灯箱高清预览；
 * 5. 禁词检查；移动端 390px；控制台零错误。
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9385;
const BASE = 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-f4-${Date.now()}`,
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
  writeFileSync(new URL(`../.shots/jw/${name}.png`, import.meta.url), Buffer.from(res.data, 'base64'));
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

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

/* ── 1. 首页：AI真人剧 → 第二部 ─────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label="影视分类"] [role="tab"]')].find((t) => t.textContent.includes('AI真人剧'))?.click(); 'ok'`);
await sleep(1100);
const nav = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    dots: section.querySelectorAll('[aria-current]').length,
    hasNext: !!section.querySelector('[aria-label="下一部作品"]'),
  });
})()`);
const n = JSON.parse(nav);
check('AI真人剧分类出现 2 个项目（导航条 + 指示点）', n.hasNext && n.dots === 2, JSON.stringify(n));
await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
await sleep(900);

const home = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  const tabs = [...section.querySelectorAll('[role="tablist"][aria-label*="集数切换"] [role="tab"]')];
  const stage = section.querySelector('.aspect-video');
  const img = stage ? stage.querySelector('img') : null;
  return JSON.stringify({
    hasTitle: section.textContent.includes('旧味道'),
    hasCatEn: section.textContent.includes('AI LIVE DRAMA'),
    tabTexts: tabs.map((t) => t.textContent.trim()),
    coverSrc: img ? img.getAttribute('src') : null,
    hasViewProject: [...section.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith('VIEW PROJECT')),
  });
})()`);
const h = JSON.parse(home);
check('标题《旧味道》+ 类型 AI LIVE DRAMA', h.hasTitle && h.hasCatEn);
check('集数切换条：上集 0:43 / 下集 3:52', h.tabTexts.join('|').includes('上集') && h.tabTexts.join('|').includes('0:43') && h.tabTexts.join('|').includes('下集') && h.tabTexts.join('|').includes('3:52'), h.tabTexts.join(' | '));
check('上集封面为老街双店外观场景图', (h.coverSrc ?? '').includes('film-004-scene-01'), h.coverSrc ?? 'none');
check('VIEW PROJECT 入口存在', h.hasViewProject);
await shot('film004-home-ep1');

/* ── 2. 下集封面 + 播放 ──────────────────────────────────────── */
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label*="集数切换"] [role="tab"]')].find((t) => t.textContent.includes('下集'))?.click(); 'ok'`);
await sleep(700);
const ep2Cover = await evalJs(`document.querySelector('#ai-film .aspect-video img')?.getAttribute('src') ?? null`);
check('下集封面为雨棚坠落事件场景图', (ep2Cover ?? '').includes('film-004-scene-07'), ep2Cover ?? 'none');
await evalJs(`document.querySelector('#ai-film .aspect-video button')?.click(); 'play'`);
await sleep(1800);
await shot('film004-home-ep2-iframe');
const iframe1 = await evalJs(`document.querySelector('#ai-film .aspect-video iframe')?.src ?? null`);
check('下集 iframe 为 BV17Mp46wEuB', (iframe1 ?? '').includes('bvid=BV17Mp46wEuB'), iframe1 ?? 'no iframe');
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label*="集数切换"] [role="tab"]')].find((t) => t.textContent.includes('上集'))?.click(); 'ok'`);
await sleep(1600);
const iframe2 = await evalJs(`document.querySelector('#ai-film .aspect-video iframe')?.src ?? null`);
check('切回上集 iframe 为 BV1VLp464EaY', (iframe2 ?? '').includes('bvid=BV1VLp464EaY'), iframe2 ?? 'no iframe');

/* ── 3. 详情页 ───────────────────────────────────────────────── */
await evalJs(`[...document.querySelectorAll('#ai-film button')].find((b) => b.textContent.trim().startsWith('VIEW PROJECT'))?.click(); 'go'`);
await sleep(4200);
await shot('film004-detail-top');
const detail = await evalJs(`(() => {
  const main = document.querySelector('main');
  const heads = [...main.querySelectorAll('header')].map((h) => h.textContent.replace(/\\s+/g, ' ').trim());
  const rows = [...main.querySelectorAll('dl div')].map((r) => r.textContent.replace(/\\s+/g, ' ').trim());
  const imgs = [...main.querySelectorAll('img')];
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
  const tabs = [...document.querySelectorAll('[role="tablist"][aria-label*="集数切换"] [role="tab"]')].map((t) => t.textContent.trim());
  return JSON.stringify({
    url: location.pathname,
    heads: heads.filter((h) => /\\d\\d\\s*\\//.test(h)),
    durationRow: rows.find((r) => r.includes('影片时长')) ?? null,
    toolsRow: rows.find((r) => r.includes('制作工具')) ?? null,
    roleRow: rows.find((r) => r.includes('个人负责')) ?? null,
    imgTotal: imgs.length,
    broken,
    tabs,
    synopsis: [...main.querySelectorAll('p')].some((p) => p.textContent.includes('降价 17 元')),
  });
})()`);
const d = JSON.parse(detail);
check('详情页路由 /film/film-004', d.url === '/film/film-004', d.url);
check('模块 02-05 编号标题齐全（01 为播放器卡片自身）', d.heads.length === 4 && d.heads.join(' ').includes('02') && d.heads.join(' ').includes('05'), d.heads.join(' | '));
check('人物 12 + 场景 8 + 道具 8（图片总数 ≥ 29）', d.imgTotal >= 29, `total=${d.imgTotal}`);
check('全部图片加载成功（无 broken）', d.broken.length === 0, d.broken.slice(0, 2).join(','));
check('影片时长「上集 0:43 · 下集 3:52」', (d.durationRow ?? '').includes('上集 0:43') && (d.durationRow ?? '').includes('下集 3:52'), d.durationRow ?? 'missing');
check('制作工具行', (d.toolsRow ?? '').includes('即梦'), d.toolsRow ?? 'missing');
check('个人负责行', (d.roleRow ?? '').includes('AI 影视项目策划'), d.roleRow ?? 'missing');
check('详情页集数切换条', d.tabs.length === 2, d.tabs.join(' | '));
check('剧本概述为真实剧本内容', d.synopsis);

/* ── 4. 灯箱高清预览 ─────────────────────────────────────────── */
await evalJs(`(() => {
  const btn = [...document.querySelectorAll('main button[aria-label^="预览："]')][0];
  btn?.click();
  return 'open';
})()`);
await sleep(1400);
await shot('film004-lightbox');
const lightbox = await evalJs(`(() => {
  const lb = document.querySelector('.vw-fade-in');
  const img = lb ? lb.querySelector('img') : null;
  return JSON.stringify({ open: !!lb, src: img ? img.getAttribute('src') : null });
})()`);
const lb = JSON.parse(lightbox);
check('灯箱打开并加载高清图', lb.open && (lb.src ?? '').includes('full'), lb.src ?? 'none');
await evalJs(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 'esc'`);
await sleep(600);
const lbClosed = await evalJs(`!document.querySelector('[aria-modal="true"], [role="dialog"]')`);
check('Esc 关闭灯箱', lbClosed);

/* ── 5. 禁词检查 ─────────────────────────────────────────────── */
const forbidden = await evalJs(`(() => {
  const text = document.body.innerText;
  const words = ['分镜', 'Prompt', 'STORYBOARD', '提示词', '时间线', '生成流程'];
  return words.filter((w) => text.includes(w)).join(',');
})()`);
check('无禁词（分镜/Prompt/时间线等）', !forbidden, forbidden || 'clean');

/* ── 6. 移动端 390px ─────────────────────────────────────────── */
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label="影视分类"] [role="tab"]')].find((t) => t.textContent.includes('AI真人剧'))?.click(); 'ok'`);
await sleep(1100);
await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
await sleep(900);
await shot('film004-mobile');
const mobile = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    hasTitle: section.textContent.includes('旧味道'),
    noHScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  });
})()`);
const m = JSON.parse(mobile);
check('移动端《旧味道》正常展示', m.hasTitle);
check('移动端无横向滚动', m.noHScroll, `scrollW=${m.scrollW} innerW=${m.innerW}`);

/* ── 7. 控制台 ───────────────────────────────────────────────── */
check('控制台零错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '));

const failed = results.filter((r) => !r.ok);
console.log(`\n===== ${results.length - failed.length}/${results.length} passed =====`);
process.exit(failed.length ? 1 : 0);
