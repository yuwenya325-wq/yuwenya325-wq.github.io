/** 全站搜索「创意工作室」出现位置：首页 + film-005 详情页，dump 相关文本与截图 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C://Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9387;
const BASE = 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C://Users//PC//AppData//Local//Temp//edge-cdp-f6-${Date.now()}`,
  '--window-size=1440,1080', 'about:blank',
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
  writeFileSync(`C:/Users/PC/Desktop/个人网站/.shots/jw2/${name}.png`, Buffer.from(res.data, 'base64'));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

// 1) 首页
await send('Page.navigate', { url: BASE + '/' });
await sleep(4000);
const homeText = await evalJs(`document.body.innerText`);
console.log('=== 首页含「创意工作室」?', homeText.includes('创意工作室'));
console.log('=== 首页含「C&L」?', homeText.includes('C&L'));
const homeCtx = homeText.split('\n').filter((l) => l.includes('C&L') || l.includes('工作室'));
console.log('首页相关行:', JSON.stringify(homeCtx, null, 2));
await shot('find-home');

// 2) film-005 详情页
await send('Page.navigate', { url: BASE + '/film/film-005' });
await sleep(3500);
const detailText = await evalJs(`document.body.innerText`);
console.log('=== 详情页含「创意工作室」?', detailText.includes('创意工作室'));
console.log('=== 详情页含「C&L」?', detailText.includes('C&L'));
const dCtx = detailText.split('\n').filter((l) => l.includes('C&L') || l.includes('工作室'));
console.log('详情页相关行:', JSON.stringify(dCtx, null, 2));
await shot('find-detail');

// 全部元素级搜索，定位具体节点
const hits = await evalJs(`
  [...document.querySelectorAll('*')]
    .filter((el) => el.children.length === 0 && (el.textContent || '').includes('C&L'))
    .map((el) => ({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 80), text: el.textContent.trim().slice(0, 120) }))
`);
console.log('元素级命中:', JSON.stringify(hits, null, 2));
process.exit(0);
