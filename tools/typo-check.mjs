/**
 * TYPOGRAPHY 页面与灯箱验证（本地验证用，不参与打包）。
 * 用法：node tools/typo-check.mjs
 * 检查：4 张作品顺序 / 图片加载 / 点击开灯箱 / 缩放 transform / Esc 关闭 / 控制台错误。
 */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9345;

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
const consoleErrors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    consoleErrors.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  }
});
const send = (method, params) => new Promise((r) => { seq += 1; pending.set(seq, r); ws.send(JSON.stringify({ id: seq, method, params })); });
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:5173/visual/typography' });
await sleep(4000);

const listCheck = await evalJs(`(() => {
  const imgs = [...document.querySelectorAll('main img')];
  const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img'));
  return JSON.stringify({
    title: document.title,
    h1: document.querySelector('h1')?.textContent,
    cardTitles: cards.map((c) => c.querySelector('.truncate')?.textContent),
    imgTotal: imgs.length,
    imgLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    revealArmed: document.querySelectorAll('[data-vw-reveal]').length,
    revealIn: document.querySelectorAll('[data-vw-reveal].is-inview').length,
    cols: getComputedStyle(document.querySelector('[data-vw-reveal]').parentElement).gridTemplateColumns.split(' ').length,
  });
})()`);

// 点击第一张 → 灯箱
await evalJs(`(() => { const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img')); cards[0].click(); return 'ok'; })()`);
await sleep(1800);
const lightboxOpen = await evalJs(`(() => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return JSON.stringify({ open: false });
  const img = dlg.querySelector('img.max-h-full') ?? dlg.querySelectorAll('img')[dlg.querySelectorAll('img').length - 1];
  return JSON.stringify({
    open: true,
    counter: dlg.querySelector('p')?.textContent,
    caption: [...dlg.querySelectorAll('p')].map((p) => p.textContent).slice(-2),
    src: img?.getAttribute('src'),
    loaded: img?.complete && img?.naturalWidth > 0,
  });
})()`);

// 点击图片 → 缩放
await evalJs(`(() => { const dlg = document.querySelector('[role="dialog"]'); const imgs = [...dlg.querySelectorAll('img')]; imgs[imgs.length - 1].click(); return 'ok'; })()`);
await sleep(600);
const zoomed = await evalJs(`(() => {
  const dlg = document.querySelector('[role="dialog"]');
  const imgs = [...dlg.querySelectorAll('img')];
  const img = imgs[imgs.length - 1];
  return JSON.stringify({ transform: img?.style?.transform ?? getComputedStyle(img).transform, cursor: img?.style?.cursor });
})()`);

// Esc 关闭
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await sleep(600);
const afterEsc = await evalJs(`JSON.stringify({ dialogGone: !document.querySelector('[role="dialog"]'), scrollY: window.scrollY })`);

console.log('list:', listCheck);
console.log('lightbox:', lightboxOpen);
console.log('zoom:', zoomed);
console.log('afterEsc:', afterEsc);
console.log('consoleErrors:', JSON.stringify(consoleErrors));
child.kill();
process.exit(0);
