/**
 * Banner 列表页 DOM 验证（本地视觉验证用，不参与打包）。
 * 用法：node tools/banner-check.mjs [url]
 * 检查：图片数量 / 加载成功数 / 卡片标题顺序 / Featured 标签 / 坏图。
 */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9341;
const url = process.argv[2] ?? 'http://127.0.0.1:5173/visual/banner';

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
await send('Page.navigate', { url });
await sleep(4000);

const res = await send('Runtime.evaluate', {
  expression: `(() => {
    const imgs = [...document.querySelectorAll('main img')];
    const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img'));
    return JSON.stringify({
      imgCount: imgs.length,
      loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      cardTitles: cards.map((c) => c.querySelector('.truncate')?.textContent),
      featured: document.body.innerText.includes('FEATURED'),
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    }, null, 1);
  })()`,
  returnByValue: true,
});
console.log(res.result.value);

// 顺便验证详情路由直开
await send('Page.navigate', { url: 'http://127.0.0.1:5173/banner/banner-05' });
await sleep(2500);
const res2 = await send('Runtime.evaluate', {
  expression: `(() => {
    const h1 = document.querySelector('h1')?.textContent;
    const sections = [...document.querySelectorAll('main section')].map((s) => s.getAttribute('aria-label'));
    const imgs = [...document.querySelectorAll('main img')];
    return JSON.stringify({
      h1,
      sections,
      imgLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      imgTotal: imgs.length,
      title: document.title,
    });
  })()`,
  returnByValue: true,
});
console.log(res2.result.value);

child.kill();
process.exit(0);
