/**
 * 首页 Hero 四屏视觉验收：
 * 逐屏截图 + 捕捉切换中间帧（验证交叉淡入淡出是否平滑）。
 * 用法：node tools/hero-slides.mjs
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9397;
const BASE = 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-hero-${Date.now()}`,
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => { try { child.kill(); } catch { /* ignore */ } });

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
  writeFileSync(`C:/Users/PC/Desktop/个人网站/.shots/${name}.png`, Buffer.from(res.data, 'base64'));
  console.log('shot', name);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `${BASE}/` });
await sleep(4200);

for (let i = 0; i < 4; i += 1) {
  if (i > 0) {
    // 点下一部并抓中间帧，验证过渡是交叉淡入而非硬切
    await send('Page.navigate', { url: `${BASE}/` });
    await sleep(3200);
  }
  for (let k = 0; k < i; k += 1) {
    await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); 'ok'`);
    await sleep(760);
  }
  await sleep(700);
  await shot(`hero-slide-${i + 1}`);
  console.log('slide', i + 1, await evalJs(`(() => {
    const bgs = [...document.querySelectorAll('.figurine-bg')];
    const imgs = [...document.querySelectorAll('.figurine-item img.figurine-reflect')];
    return JSON.stringify({
      activeBg: bgs.findIndex((b) => Number(b.style.opacity) === 1),
      bgOpacities: bgs.map((b) => b.style.opacity),
      reflections: imgs.length,
      reflectVisible: imgs.map((x) => getComputedStyle(x).opacity),
    });
  })()`));
}

/* 中间帧：点击后 ~300ms 抓一帧，确认背景处于两屏叠化的中间态 */
await send('Page.navigate', { url: `${BASE}/` });
await sleep(3200);
await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); 'ok'`);
await sleep(300);
await shot('hero-transition-mid');
console.log('transition mid frame captured');

/* 移动端 390px */
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: `${BASE}/` });
await sleep(3600);
await shot('hero-mobile');
console.log('mobile captured');

process.exit(0);
