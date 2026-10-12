/**
 * ABOUT 整段截图：模拟真实用户滚动（分步经过区块），让 IntersectionObserver
 * 正常触发后再整段截图。用法：node tools/ab-shot.mjs <url> <outPng> <width> <height>
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9339;

const url = process.argv[2];
const out = process.argv[3];
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 1080);
const sectionId = process.argv[6] ?? 'about';
if (!url || !out) {
  console.error('usage: node tools/ab-shot.mjs <url> <outPng> [w] [h] [sectionId]');
  process.exit(2);
}

const PROFILE = `C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-${Date.now()}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--force-device-scale-factor=1', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, `--window-size=${width},${height}`, 'about:blank',
], { stdio: 'ignore' });

let ws;
function makeSender(socket) {
  let seq = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  });
  return (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function waitForTarget() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* 浏览器还没起来 */ }
    await sleep(250);
  }
  throw new Error('CDP target not found');
}

try {
  const target = await waitForTarget();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  const send = makeSender(ws);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
  await send('Page.navigate', { url });
  await sleep(3200);

  // 分步滚过目标区块（每步 260px、停 160ms），触发沿途的入场动画
  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.value;
  };
  const range = await evalJs(`(() => {
    const el = document.getElementById(${JSON.stringify(sectionId)});
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
  })()`);
  for (let y = range.top - 200; y <= range.top + range.height; y += 260) {
    await evalJs(`window.scrollTo(0, ${Math.max(0, y)}); void 0;`);
    await sleep(160);
  }
  await sleep(600);
  await evalJs(`window.scrollTo(0, ${Math.max(0, range.top)}); void 0;`);
  await sleep(700);

  const rect = await evalJs(`(() => {
    const el = document.getElementById(${JSON.stringify(sectionId)});
    const r = el.getBoundingClientRect();
    return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
  })()`);
  const capture = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), scale: 1 },
  });
  fs.writeFileSync(out, Buffer.from(capture.data, 'base64'));
  console.log('OK', out, `${Math.round(rect.width)}x${Math.round(rect.height)}`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  child.kill();
  await sleep(300);
  process.exit(0);
}
