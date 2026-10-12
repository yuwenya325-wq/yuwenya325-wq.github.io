/**
 * Banner 交互链路验证（本地验证用，不参与打包）。
 * 用法：node tools/banner-flow.mjs
 * 检查：滚动后点击卡片进详情 → 返回列表恢复滚动位置 → 海报列表回归正常。
 */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9343;

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
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

await send('Page.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:5173/visual/banner' });
await sleep(3500);

// 1. 滚动到列表中部，记录位置
const y = await evalJs(`window.scrollTo(0, 1600); new Promise(r=>setTimeout(()=>r(window.scrollY), 300))`);

// 2. 点击第 4 张卡片（LUNA HERB）进详情
await evalJs(`
  const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img'));
  cards[3].click();
  'clicked'`);
await sleep(1200);
const detail = await evalJs(`JSON.stringify({ path: location.pathname, h1: document.querySelector('h1')?.textContent })`);

// 3. 浏览器后退 → 应回到列表并恢复滚动位置
await evalJs('history.back(); "ok"');
await sleep(1500);
const backRaw = await evalJs(`JSON.stringify({ path: location.pathname, scrollY: window.scrollY, expected: ${y} })`);
const back = backRaw ?? '{"path":"?","scrollY":-1,"expected":-1}';

// 4. 海报列表回归检查
await send('Page.navigate', { url: 'http://127.0.0.1:5173/visual/poster' });
await sleep(3000);
const poster = await evalJs(`
  const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img'));
  JSON.stringify({ path: location.pathname, posterCards: cards.length, h1: document.querySelector('h1')?.textContent })`);

console.log(JSON.stringify({ scrollBeforeClick: y, detail: JSON.parse(detail), back: JSON.parse(back), poster: JSON.parse(poster) }, null, 1));
child.kill();
process.exit(0);
