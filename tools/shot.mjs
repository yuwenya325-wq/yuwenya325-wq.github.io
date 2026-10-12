/**
 * 无头 Edge + CDP 截图（本地视觉验证用，不参与打包）。
 *
 * 用法：
 *   node tools/shot.mjs <url> <outPng> [width] [height] [clipSelector]
 * 说明：
 *   - 有 clipSelector 时按该元素的实际高度整段截图（captureBeyondViewport）；
 *   - 无 clipSelector 时截当前视口。
 * 输出为绝对路径 PNG。
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9333;

const url = process.argv[2];
const out = process.argv[3];
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 1080);
const clipSelector = process.argv[6] ?? '';
const scale = Number(process.argv[7] ?? 1);

if (!url || !out) {
  console.error('usage: node tools/shot.mjs <url> <outPng> [width] [height] [clipSelector]');
  process.exit(2);
}

const PROFILE = `C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-${Date.now()}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const child = spawn(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--force-device-scale-factor=1',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`,
  `--window-size=${width},${height}`,
  'about:blank',
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
    } catch {
      // 浏览器还没起来，继续等
    }
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
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: width < 700 });

  await send('Page.navigate', { url });
  await sleep(3500);
  // 触发懒加载 / 揭示动画
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight); void 0;' });
  await sleep(900);
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0); void 0;' });
  await sleep(900);

  let clip;
  if (clipSelector) {
    const rect = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(clipSelector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
      })()`,
    });
    const box = rect.result?.value;
    console.log('clip-box', JSON.stringify(box));
    if (box && box.width > 0 && box.height > 0) {
      clip = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height), scale };
    }
  } else {
    const metrics = await send('Page.getLayoutMetrics');
    const vp = metrics.cssLayoutViewport ?? metrics.layoutViewport;
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${vp.pageY ?? 0}); void 0;` });
  }

  const shot = await send('Page.captureScreenshot', clip
    ? { format: 'png', captureBeyondViewport: true, clip }
    : { format: 'png' });

  fs.mkdirSync(out.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('OK', out, clip ? `${clip.width}x${clip.height}` : `${width}x${height}`);
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  child.kill();
  await sleep(300);
  process.exit(0);
}
