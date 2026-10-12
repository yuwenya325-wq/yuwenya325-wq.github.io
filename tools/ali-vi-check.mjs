/** 快速验证 /ip/ali 的模块与 VI 图（一次性验证脚本，不参与打包） */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9363;
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

await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:5173/ip/ali' });
await sleep(5000);
const res = await send('Runtime.evaluate', {
  expression: `(() => {
    const imgs = [...document.querySelectorAll('main img')];
    return JSON.stringify({
      sections: [...document.querySelectorAll('main section h2')].map((h) => h.textContent.slice(0, 26)),
      viGroupTitle: [...document.querySelectorAll('main h3')].map((h) => h.textContent.slice(0, 24)),
      viImgLoaded: imgs.some((i) => i.complete && i.naturalWidth > 0 && i.src.includes('ali-vi')),
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
      pageHeight: document.body.scrollHeight,
    });
  })()`,
  returnByValue: true,
});
console.log(res.result.value);
child.kill();
process.exit(0);
