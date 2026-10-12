/**
 * IP DESIGN & VI 全链路验证（本地视觉验证用，不参与打包）。
 * 用法：node tools/ip-check.mjs
 * 检查：列表两个 IP 入口 → 详情直开（模块显隐）→ 未知 id 回落 →
 *       点击进详情 / 返回恢复位置 → 灯箱打开 / Esc 关闭 → 移动端布局。
 */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9351;
const BASE = 'http://127.0.0.1:5173';

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--no-first-run', '--disable-extensions',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-${Date.now()}`,
  '--window-size=1440,1080', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(2500);

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params) => new Promise((r) => { seq += 1; pending.set(seq, r); ws.send(JSON.stringify({ id: seq, method, params })); });
const evalJs = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return res.result?.value;
};
const nav = async (url) => { await send('Page.navigate', { url }); await sleep(3200); };

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');

// ── 1. IP 列表页 ──
await nav(`${BASE}/visual/ip-vi`);
console.log('LIST:', await evalJs(`(() => {
  const imgs = [...document.querySelectorAll('main img')];
  const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img'));
  return JSON.stringify({
    imgLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    imgTotal: imgs.length,
    entryLabels: cards.map((c) => c.querySelector('span')?.textContent),
    names: [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img')).map((c) => c.textContent.slice(0, 40)),
    broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    cols: getComputedStyle(document.querySelector('main [data-vw-reveal]').parentElement).gridTemplateColumns.split(' ').length,
  });
})()`));

// ── 2. 点击第一个 IP 入口 → 详情 ──
const y = await evalJs('window.scrollTo(0, 560); window.scrollY');
await sleep(300);
await evalJs(`(() => { const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img')); cards[0].click(); return 'ok'; })()`);
await sleep(1500);
console.log('ENTER:', await evalJs(`JSON.stringify({
  path: location.pathname,
  h1: document.querySelector('h1')?.textContent,
  sections: [...document.querySelectorAll('main section')].map((s) => s.getAttribute('aria-label')),
  savedY: sessionStorage.getItem('ip:return-y'),
})`));

// ── 3. 浏览器后退 → 列表 + 恢复位置 ──
await evalJs('history.back(); "ok"');
await sleep(1500);
console.log('BACK:', await evalJs(`JSON.stringify({ path: location.pathname, scrollY: window.scrollY, expected: ${y} })`));

// ── 4. 详情直开：bomi（有 VI 无 APPLICATION）/ ali（无 VI）/ 未知 id 回落 ──
await nav(`${BASE}/ip/bomi`);
console.log('BOMI:', await evalJs(`JSON.stringify({
  h1: document.querySelector('h1')?.textContent,
  sections: [...document.querySelectorAll('main section')].map((s) => s.getAttribute('aria-label')),
  imgLoaded: [...document.querySelectorAll('main img')].filter((i) => i.complete && i.naturalWidth > 0).length,
  imgTotal: document.querySelectorAll('main img').length,
  title: document.title,
})`));

// 灯箱：点击封面 → 打开 → Esc 关闭
await evalJs(`(() => { const btns = [...document.querySelectorAll('main button[aria-label*="放大"]')]; btns[0].click(); return 'ok'; })()`);
await sleep(1200);
const dlg = await evalJs(`(() => {
  const d = document.querySelector('[role="dialog"]');
  return JSON.stringify({ open: !!d, img: d ? d.querySelector('img:last-of-type')?.src.split('/').pop() : null });
})()`);
await evalJs(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 'ok'; })()`);
await sleep(600);
const dlgClosed = await evalJs(`JSON.stringify({ open: !!document.querySelector('[role="dialog"]') })`);
console.log('LIGHTBOX:', dlg, '→ after Esc:', dlgClosed);

await nav(`${BASE}/ip/ali`);
console.log('ALI:', await evalJs(`JSON.stringify({
  h1: document.querySelector('h1')?.textContent,
  sections: [...document.querySelectorAll('main section')].map((s) => s.getAttribute('aria-label')),
})`));

await nav(`${BASE}/ip/unknown-x`);
console.log('UNKNOWN:', await evalJs(`JSON.stringify({ path: location.pathname, isList: location.pathname === '/visual/ip-vi' || !!document.querySelector('main [data-vw-reveal]') })`));

// ── 5. 移动端布局 ──
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await nav(`${BASE}/visual/ip-vi`);
console.log('MOBILE:', await evalJs(`JSON.stringify({
  cols: getComputedStyle(document.querySelector('main [data-vw-reveal]').parentElement).gridTemplateColumns.split(' ').length,
  imgLoaded: [...document.querySelectorAll('main img')].filter((i) => i.complete && i.naturalWidth > 0).length,
})`));
await send('Emulation.clearDeviceMetricsOverride');

// 控制台错误检查
const errors = await evalJs(`JSON.stringify(window.__errs || [])`);
console.log('CONSOLE_ERRORS:', errors);

child.kill();
process.exit(0);
