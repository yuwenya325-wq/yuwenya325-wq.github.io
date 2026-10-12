/**
 * CDP 控制台错误检查（本地验证用）。
 * 用法：node tools/console-check.mjs <url>
 */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9335;

const url = process.argv[2];
if (!url) {
  console.error('usage: node tools/console-check.mjs <url>');
  process.exit(2);
}

const PROFILE = `C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-${Date.now()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, 'about:blank',
], { stdio: 'ignore' });

let ws;
function makeSender(socket) {
  let seq = 0;
  const pending = new Map();
  const handlers = [];
  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      handlers.forEach((h) => h(msg));
    }
  });
  return {
    call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++seq;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    onEvent(handler) { handlers.push(handler); },
  };
}

const errors = [];
try {
  let page;
  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) break;
    } catch { /* retry */ }
    await sleep(250);
  }
  if (!page) throw new Error('no target');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  const cdp = makeSender(ws);
  cdp.onEvent((msg) => {
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails?.exception?.description ?? msg.params.exceptionDetails?.text ?? 'exception');
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      errors.push(`[${msg.params.entry.source}] ${msg.params.entry.text}`);
    }
  });
  await cdp.call('Runtime.enable');
  await cdp.call('Log.enable');
  await cdp.call('Page.enable');
  await cdp.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
  await cdp.call('Page.navigate', { url });
  await sleep(6000);
  await cdp.call('Runtime.evaluate', { expression: "window.scrollTo(0, document.body.scrollHeight)" });
  await sleep(1200);
  await cdp.call('Runtime.evaluate', { expression: "window.scrollTo(0, 0)" });
  await sleep(1200);

  if (errors.length === 0) {
    console.log('NO CONSOLE ERRORS');
  } else {
    console.log(`${errors.length} console error(s):`);
    errors.forEach((e) => console.log(' -', e.slice(0, 300)));
  }
} finally {
  try { ws?.close(); } catch { /* ignore */ }
  child.kill();
  await sleep(200);
  process.exit(0);
}
