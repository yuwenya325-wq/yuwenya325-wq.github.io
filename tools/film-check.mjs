/**
 * AI FILM 上传验证脚本：
 * 1. 首页 #ai-film 区域：项目入口（封面/标题/类型/VIEW PROJECT）+ 三资产卡；
 * 2. 点击 VIEW PROJECT → /film/film-001 详情页；
 * 3. 详情页模块结构（01 播放器 / 02 项目介绍 / 03 人物 / 04 场景 / 05 道具）；
 * 4. 禁止出现的内容：分镜 / Prompt / STORYBOARD / AI 生成流程 / 时间线；
 * 5. 图片加载（含灯箱）+ Esc 关闭 + 返回恢复浏览位置。
 */
import { spawn } from 'node:child_process';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9371;
const BASE = 'http://127.0.0.1:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-film-${Date.now()}`,
  '--window-size=1440,1080', 'about:blank',
], { stdio: 'ignore' });

const cleanup = () => { try { child.kill(); } catch { /* ignore */ } process.exit(0); };
process.on('exit', cleanup);

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
const consoleErrors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(m.params.exceptionDetails.text + (m.params.exceptionDetails.exception?.description ?? ''));
  }
});

// 视口（否则页面按窄屏渲染，结论失真）
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

/* ── 1. 首页 #ai-film ─────────────────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
const home = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  if (!section) return JSON.stringify({ fail: 'no #ai-film' });
  const btns = [...section.querySelectorAll('button')];
  const viewProject = btns.find((b) => b.textContent.trim().startsWith('VIEW PROJECT'));
  const imgs = [...section.querySelectorAll('img')];
  return JSON.stringify({
    title: section.bodyText?.slice(0, 0) ?? null,
    hasTitle: section.textContent.includes('雪灾猎户买妻'),
    hasCategory: section.textContent.includes('AI COMIC DRAMA'),
    hasViewProject: !!viewProject,
    assetCards: [...section.querySelectorAll('button')].filter((b) => /CHARACTER|ENVIRONMENT|PROP/.test(b.textContent)).length,
    imgTotal: imgs.length,
    imgLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    hasDuration: section.textContent.includes('2:13'),
    hasTools: section.textContent.includes('即梦'),
  });
})()`);
console.log('HOME:', home);

/* ── 2. 点击 VIEW PROJECT → 详情页 ────────────────────────────── */
await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  const btn = [...section.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('VIEW PROJECT'));
  window.scrollTo(0, 900);
  btn.click();
  return 'ok';
})()`);
await sleep(2000);
const path = await evalJs('location.pathname');
console.log('AFTER CLICK path:', path);

/* ── 3. 详情页结构 ────────────────────────────────────────────── */
await sleep(2500);
const detail = await evalJs(`(() => {
  const text = document.body.innerText;
  const heads = [...document.querySelectorAll('main span, main h2')].map((el) => el.textContent.trim()).filter((t) => /^0\\d \\/$/.test(t));
  const sections = [...document.querySelectorAll('main section h2')].map((h) => h.textContent.trim());
  const imgs = [...document.querySelectorAll('main img')];
  return JSON.stringify({
    path: location.pathname,
    title: document.title,
    heads,
    sections,
    hasSynopsis: text.includes('大雪封山'),
    hasInfoTable: text.includes('影片类型') && text.includes('制作工具') && text.includes('个人负责'),
    hasPlayerNote: text.includes('B 站播放链接待补充') || text.includes('官方嵌入方式'),
    hasPlayer: !!document.querySelector('main .aspect-video'),
    imgTotal: imgs.length,
    imgLoaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    imgBroken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
    forbidden: {
      storyboard: /STORYBOARD|关键分镜|分镜/.test(text),
      prompt: /PROMPT|提示词/.test(text),
      timeline: /时间线|制作流程|AI 生成流程/.test(text),
    },
  });
})()`);
console.log('DETAIL:', detail);

/* ── 4. 灯箱 + Esc ────────────────────────────────────────────── */
const clickAsset = await evalJs(`(() => {
  const cards = [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img'));
  if (!cards.length) return 'no-cards';
  cards[cards.length - 1].click();
  return 'clicked ' + cards.length;
})()`);
await sleep(1500);
const lightbox = await evalJs(`JSON.stringify({ dlg: !!document.querySelector('[role="dialog"]'), img: (() => { const d = document.querySelector('[role="dialog"]'); if (!d) return null; const i = [...d.querySelectorAll('img')].pop(); return i ? { src: i.src.split('/').pop(), loaded: i.complete && i.naturalWidth > 0 } : null; })() })`);
console.log('LIGHTBOX OPEN:', clickAsset, lightbox);
await evalJs(`(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 'esc'; })()`);
await sleep(800);
console.log('AFTER ESC:', await evalJs(`JSON.stringify({ dlgClosed: !document.querySelector('[role="dialog"]') })`));

/* ── 5. 返回恢复浏览位置 ──────────────────────────────────────── */
await evalJs(`window.scrollTo(0, 860); 'ok'`);
await sleep(400);
await evalJs(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'BACK TO AI FILM'); b?.click(); return 'back'; })()`);
await sleep(2500);
console.log('BACK:', await evalJs(`JSON.stringify({ path: location.pathname, scrollY: Math.round(window.scrollY) })`));

console.log('CONSOLE EXCEPTIONS:', consoleErrors.length ? consoleErrors : 'none');
cleanup();
