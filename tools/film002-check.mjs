/**
 * 《十万块的咖啡店》（film-002）上传验收：
 * 1. 首页 AI FILM：AI漫剧下 2 个项目可切换，第二部封面/名称/类型/VIEW PROJECT；
 * 2. 集数切换（上集 1:34 BV16T421z7AA / 下集 1:20 BV1iGp46bEA7）；
 * 3. 详情页 01 播放器 / 02 项目介绍 / 03 人物 10 张 / 04 场景 3 张 / 05 道具 3 张；
 * 4. 全部图片加载成功 + 灯箱高清预览；
 * 5. 禁词检查（分镜/Prompt/STORYBOARD/时间线）；
 * 6. 移动端 390px 无横向滚动；控制台零错误。
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9383;
const BASE = 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-f2-${Date.now()}`,
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

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

/* ── 1. 首页：切到第二部 ─────────────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
const nav = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  const next = [...section.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === '下一部作品');
  const dots = section.querySelectorAll('[aria-current]').length;
  return JSON.stringify({ hasNext: !!next, dots });
})()`);
const n = JSON.parse(nav);
check('AI漫剧分类出现 2 个项目（导航条 + 指示点）', n.hasNext && n.dots === 2, JSON.stringify(n));

await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
await sleep(900);
const second = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  const tabs = [...section.querySelectorAll('[role="tablist"][aria-label*="集数切换"] [role="tab"]')];
  const stage = section.querySelector('.aspect-video');
  const img = stage ? stage.querySelector('img') : null;
  return JSON.stringify({
    hasTitle: section.textContent.includes('十万块的咖啡店'),
    tabTexts: tabs.map((t) => t.textContent.trim()),
    coverSrc: img ? img.getAttribute('src') : null,
    hasViewProject: [...section.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith('VIEW PROJECT')),
  });
})()`);
const s = JSON.parse(second);
check('第二部标题《十万块的咖啡店》', s.hasTitle);
check('集数切换条：上集 1:34 / 下集 1:20', s.tabTexts.join('|').includes('上集') && s.tabTexts.join('|').includes('1:34') && s.tabTexts.join('|').includes('下集') && s.tabTexts.join('|').includes('1:20'), s.tabTexts.join(' | '));
check('上集封面为烧烤店包间场景图', (s.coverSrc ?? '').includes('film-002-scene-01'), s.coverSrc ?? 'none');
check('VIEW PROJECT 入口存在', s.hasViewProject);
await shot('film002-home-ep1');

/* ── 2. 下集封面 + 播放 ──────────────────────────────────────── */
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label*="集数切换"] [role="tab"]')].find((t) => t.textContent.includes('下集'))?.click(); 'ok'`);
await sleep(700);
const ep2Cover = await evalJs(`document.querySelector('#ai-film .aspect-video img')?.getAttribute('src') ?? null`);
check('下集封面为旧早餐铺外观场景图', (ep2Cover ?? '').includes('film-002-scene-02'), ep2Cover ?? 'none');
await evalJs(`document.querySelector('#ai-film .aspect-video button')?.click(); 'play'`);
await sleep(1800);
await shot('film002-home-ep2-iframe');
const iframe1 = await evalJs(`document.querySelector('#ai-film .aspect-video iframe')?.src ?? null`);
check('下集 iframe 为 BV1iGp46bEA7', (iframe1 ?? '').includes('bvid=BV1iGp46bEA7'), iframe1 ?? 'no iframe');
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label*="集数切换"] [role="tab"]')].find((t) => t.textContent.includes('上集'))?.click(); 'ok'`);
await sleep(1600);
const iframe2 = await evalJs(`document.querySelector('#ai-film .aspect-video iframe')?.src ?? null`);
check('切回上集 iframe 为 BV16T421z7AA', (iframe2 ?? '').includes('bvid=BV16T421z7AA'), iframe2 ?? 'no iframe');

/* ── 3. 详情页 ───────────────────────────────────────────────── */
await evalJs(`[...document.querySelectorAll('#ai-film button')].find((b) => b.textContent.trim().startsWith('VIEW PROJECT'))?.click(); 'go'`);
await sleep(4200);
await shot('film002-detail-top');
const detail = await evalJs(`(() => {
  const main = document.querySelector('main');
  const heads = [...main.querySelectorAll('header')].map((h) => h.textContent.replace(/\\s+/g, ' ').trim());
  const rows = [...main.querySelectorAll('dl div')].map((r) => r.textContent.replace(/\\s+/g, ' ').trim());
  const imgs = [...main.querySelectorAll('img')];
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
  const tabs = [...document.querySelectorAll('[role="tablist"][aria-label*="集数切换"] [role="tab"]')].map((t) => t.textContent.trim());
  return JSON.stringify({
    url: location.pathname,
    title: document.title,
    heads: heads.filter((h) => /\\d\\d\\s*\\//.test(h)),
    durationRow: rows.find((r) => r.includes('影片时长')) ?? null,
    toolsRow: rows.find((r) => r.includes('制作工具')) ?? null,
    roleRow: rows.find((r) => r.includes('个人负责')) ?? null,
    imgTotal: imgs.length,
    broken,
    tabs,
    synopsis: [...main.querySelectorAll('p')].some((p) => p.textContent.includes('你们只准备好当老板')),
  });
})()`);
const d = JSON.parse(detail);
check('详情页路由 /film/film-002', d.url === '/film/film-002', d.url);
check('模块 02-05 编号标题齐全（01 为播放器卡片自身）', d.heads.length === 4 && d.heads.join(' ').includes('02') && d.heads.join(' ').includes('05'), d.heads.join(' | '));
check('人物资产 10 张 + 场景 3 + 道具 3（图片总数 ≥ 16）', d.imgTotal >= 16, `total=${d.imgTotal}`);
check('全部图片加载成功（无 broken）', d.broken.length === 0, d.broken.slice(0, 2).join(','));
check('影片时长「上集 1:34 · 下集 1:20」', (d.durationRow ?? '').includes('上集 1:34') && (d.durationRow ?? '').includes('下集 1:20'), d.durationRow ?? 'missing');
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
await shot('film002-lightbox');
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
await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
await sleep(900);
await shot('film002-mobile');
const mobile = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    hasTitle: section.textContent.includes('十万块的咖啡店'),
    noHScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  });
})()`);
const m = JSON.parse(mobile);
check('移动端第二部正常展示', m.hasTitle);
check('移动端无横向滚动', m.noHScroll, `scrollW=${m.scrollW} innerW=${m.innerW}`);

/* ── 7. 控制台 ───────────────────────────────────────────────── */
check('控制台零错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '));

const failed = results.filter((r) => !r.ok);
console.log(`\\n===== ${results.length - failed.length}/${results.length} passed =====`);
process.exit(failed.length ? 1 : 0);
