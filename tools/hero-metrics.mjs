/**
 * 首页 Hero 度量探针：读取主角色实际渲染尺寸占视口高度的比例，
 * 以及 AIGC 大字的实际渲染高度、小角色尺寸，便于按数据微调（不靠肉眼猜）。
 * 用法：node tools/hero-metrics.mjs [width] [height]
 */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9399;
const BASE = 'http://127.0.0.1:5180';
const W = Number(process.argv[2] ?? 1440);
const H = Number(process.argv[3] ?? 900);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 角色 PNG 的不透明包围盒（含透明边），用于把元素盒换算成「肉眼可见的角色高度」 */
const ALPHA = {
  'bomi-wave': { tipTop: 67 / 1536, bottomPad: 0 },
  'bomi-walk': { tipTop: 39 / 1536, bottomPad: (1536 - 1514) / 1536 },
  'forest-wave': { tipTop: 4 / 1536, bottomPad: 0 },
  'forest-walk': { tipTop: 2 / 1536, bottomPad: (1536 - 1524) / 1536 },
};

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-metrics-${Date.now()}`,
  `--window-size=${W},${H}`, 'about:blank',
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

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });
await send('Page.navigate', { url: `${BASE}/` });
await sleep(4200);

const raw = await evalJs(`(() => {
  const items = [...document.querySelectorAll('.figurine-item')];
  const out = items.map((item) => {
    const role = item.querySelector('.figurine-lift')?.dataset.role ?? '?';
    const img = item.querySelector('img.figurine-image');
    const r = img ? img.getBoundingClientRect() : null;
    const bd = document.querySelector('.figurine-backdrop span');
    const b = bd ? bd.getBoundingClientRect() : null;
    return {
      role,
      src: img ? (img.currentSrc || img.src).split('/').pop() : null,
      boxW: r ? Math.round(r.width) : 0,
      boxH: r ? Math.round(r.height) : 0,
      backdropH: b ? Math.round(b.height) : 0,
      backdropTop: b ? Math.round(b.top) : 0,
    };
  });
  return JSON.stringify({ vh: window.innerHeight, vw: window.innerWidth, items: out });
})()`);
const data = JSON.parse(raw);
console.log(`viewport ${data.vw}x${data.vh}`);

for (const it of data.items) {
  const key = (it.src ?? '').replace('-cover.webp', '');
  const a = ALPHA[key] ?? { tipTop: 0, bottomPad: 0 };
  // object-fit: contain（元素盒 0.6:1，图 0.667:1）→ 图像内容高度 = 盒高 × 0.9
  const contentH = it.boxH * 0.9;
  const visible = contentH * (1 - a.tipTop - a.bottomPad);
  console.log(
    `${it.role.padEnd(6)} ${String(it.src).padEnd(24)} box=${it.boxW}x${it.boxH} `
    + `可见角色 ≈ ${Math.round(visible)}px = 视口 ${(visible / data.vh * 100).toFixed(1)}%`,
  );
}
console.log(`AIGC 大字渲染高度 = ${data.items[0].backdropH}px = 视口 ${(data.items[0].backdropH / data.vh * 100).toFixed(1)}%（top ${data.items[0].backdropTop}px）`);

process.exit(0);
