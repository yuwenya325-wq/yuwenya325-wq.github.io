/**
 * 四部 AI 短片（short-001~004）上传验收：
 * 1. AI短片分类（AI SHORT FILM）下 4 个项目；
 * 2. 每部：标题/封面/VIEW PROJECT；四部 iframe BV 均正确（003 = BV1LGp46bEVZ）；
 * 3. 详情页区块为 03 视觉资产 / 04 场景资产 / 05 关键画面（VISUAL/ENVIRONMENT ASSETS/KEY FRAMES）；
 * 4. 图片全 WebP、无 broken、灯箱正常；禁词 clean；移动端 390px；控制台零错误；
 * 5. 其他三个分类不受影响。
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9391;
const BASE = 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-f9-${Date.now()}`,
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
  writeFileSync(`C:/Users/PC/Desktop/个人网站/.shots/st/${name}.png`, Buffer.from(res.data, 'base64'));
};

await send('Page.enable');
await send('Runtime.enable');
const consoleErrors = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(m.params.exceptionDetails?.text + (m.params.exceptionDetails?.exception?.description ?? ''));
  }
});

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); };

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

/* ── 1. 首页：AI短片分类 ───────────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
const tabState = await evalJs(`(() => {
  const tabs = [...document.querySelectorAll('#ai-film [role="tablist"][aria-label="影视分类"] [role="tab"]')];
  return JSON.stringify({ count: tabs.length, names: tabs.map((t) => t.textContent.trim()), hasShort: tabs.some((t) => t.textContent.includes('AI短片') && t.textContent.includes('AI SHORT FILM')) });
})()`);
const t0 = JSON.parse(tabState);
check('分类胶囊共 4 个且含「AI短片 / AI SHORT FILM」', t0.count === 4 && t0.hasShort, t0.names.join(' | '));
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label="影视分类"] [role="tab"]')].find((t) => t.textContent.includes('AI短片'))?.click(); 'ok'`);
await sleep(1100);
const nav = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    dots: section.querySelectorAll('[aria-current]').length,
    hasNext: !!section.querySelector('[aria-label="下一部作品"]'),
  });
})()`);
const n = JSON.parse(nav);
check('AI短片分类出现 4 个项目', n.hasNext && n.dots === 4, JSON.stringify(n));

const TITLES = ['炸鸡女王穿越中世纪', '演化身体', '电梯换装：从起床到气场全开', '从始至终'];
const COVERS = ['short-001-cover', 'short-002-cover', 'short-003-cover', 'short-004-cover'];
for (let i = 0; i < 4; i += 1) {
  if (i > 0) {
    await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
    await sleep(900);
  }
  const state = await evalJs(`(() => {
    const section = document.querySelector('#ai-film');
    const img = section.querySelector('.aspect-video img');
    return JSON.stringify({
      title: section.textContent.includes(${JSON.stringify(TITLES[i])}),
      hasCatEn: section.textContent.includes('AI SHORT FILM'),
      cover: img ? img.getAttribute('src') : null,
      viewProject: [...section.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith('VIEW PROJECT')),
    });
  })()`);
  const s = JSON.parse(state);
  check(`0${i + 1} 标题「${TITLES[i]}」+ 类型 AI SHORT FILM`, s.title && s.hasCatEn);
  check(`0${i + 1} 封面为 ${COVERS[i]}`, (s.cover ?? '').includes(COVERS[i]), s.cover ?? 'none');
  check(`0${i + 1} VIEW PROJECT 入口存在`, s.viewProject);
}
await shot('short-home-001');

/* ── 2. 播放验证 ────────────────────────────────────────────── */
// 此时轮播停在第 4 部，先循环回第 1 部再点播放
await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
await sleep(900);
// short-001（回到第 1 部）：点击挂 iframe
await evalJs(`document.querySelector('#ai-film .aspect-video button')?.click(); 'play'`);
await sleep(1800);
const if1 = await evalJs(`document.querySelector('#ai-film .aspect-video iframe')?.src ?? null`);
check('short-001 iframe 为 BV1qMp46wE28', (if1 ?? '').includes('bvid=BV1qMp46wE28'), if1 ?? 'no iframe');
await shot('short-home-play');
// short-003：已接入链接 → iframe 为 BV1LGp46bEVZ（从第 1 部向后点 2 次到第 3 部）
await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
await sleep(900);
await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'ok'`);
await sleep(900);
await evalJs(`document.querySelector('#ai-film .aspect-video button')?.click(); 'play'`);
await sleep(1800);
const s3 = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    title: section.textContent.includes('电梯换装'),
    pending: section.textContent.includes('B站播放链接待补充'),
    iframe: section.querySelector('.aspect-video iframe')?.src ?? null,
  });
})()`);
const s3j = JSON.parse(s3);
check('short-003 标题命中且 iframe 为 BV1LGp46bEVZ', s3j.title && (s3j.iframe ?? '').includes('bvid=BV1LGp46bEVZ'), JSON.stringify(s3j));

/* ── 3. 四个详情页逐个检查 ───────────────────────────────────── */
const DETAIL_EXPECT = [
  { slug: 'short-001', bv: 'BV1qMp46wE28', dur: '4:21', imgs: 17, synopsis: '垃圾食品女王' },
  { slug: 'short-002', bv: 'BV15Vp46ZECw', dur: '3:28', imgs: 15, synopsis: '演化身体' },
  { slug: 'short-003', bv: 'BV1LGp46bEVZ', dur: '0:31', imgs: 14, synopsis: '斑马丝巾包' },
  { slug: 'short-004', bv: 'BV1VLp464Eod', dur: '0:46', imgs: 9, synopsis: '从始至终' },
];
for (let i = 0; i < 4; i += 1) {
  const exp = DETAIL_EXPECT[i];
  await send('Page.navigate', { url: `${BASE}/film/${exp.slug}` });
  await sleep(3600);
  const d = await evalJs(`(() => {
    const main = document.querySelector('main');
    const heads = [...main.querySelectorAll('header')].map((h) => h.textContent.replace(/\\s+/g, ' ').trim());
    const rows = [...main.querySelectorAll('dl div')].map((r) => r.textContent.replace(/\\s+/g, ' ').trim());
    const imgs = [...main.querySelectorAll('img')];
    const broken = imgs.filter((x) => x.complete && x.naturalWidth === 0).map((x) => x.src);
    const nonWebp = imgs.map((x) => x.currentSrc || x.src).filter((s) => s && !s.includes('.webp'));
    return JSON.stringify({
      url: location.pathname,
      title: document.querySelector('h1')?.textContent ?? '',
      hasVisual: heads.some((h) => h.includes('视觉资产') && h.includes('VISUAL ASSETS')),
      hasEnv: heads.some((h) => h.includes('场景资产') && h.includes('ENVIRONMENT ASSETS')),
      hasFrames: heads.some((h) => h.includes('关键画面') && h.includes('KEY FRAMES')),
      noOldHeads: !heads.some((h) => h.includes('人物资产') || h.includes('道具资产') || h.includes('产品资产')),
      durRow: rows.find((r) => r.includes('影片时长')) ?? null,
      toolsRow: rows.find((r) => r.includes('制作工具')) ?? null,
      roleRow: rows.find((r) => r.includes('个人负责')) ?? null,
      synopsisOk: main.textContent.includes(${JSON.stringify(exp.synopsis)}),
      pending: main.textContent.includes('B站播放链接待补充'),
      imgTotal: imgs.length,
      broken, nonWebp,
    });
  })()`);
  const r = JSON.parse(d);
  check(`S0${i + 1} 路由 /film/${exp.slug} + 标题`, r.url === `/film/${exp.slug}` && r.title.includes(TITLES[i]), `${r.url} | ${r.title}`);
  check(`S0${i + 1} 03 视觉资产 VISUAL ASSETS`, r.hasVisual);
  check(`S0${i + 1} 04 场景资产 ENVIRONMENT ASSETS`, r.hasEnv);
  check(`S0${i + 1} 05 关键画面 KEY FRAMES`, r.hasFrames);
  check(`S0${i + 1} 无旧「人物/道具/产品资产」区块`, r.noOldHeads);
  check(`S0${i + 1} 时长 ${exp.dur} + 工具 + 职责`, (r.durRow ?? '').includes(exp.dur) && (r.toolsRow ?? '').includes('即梦') && (r.roleRow ?? '').includes('AI 视觉创意'), r.durRow ?? 'missing');
  check(`S0${i + 1} 剧本概述为真实内容`, r.synopsisOk);
  if (exp.bv) {
    await evalJs(`document.querySelector('main .aspect-video button')?.click(); 'play'`);
    await sleep(1600);
    const src = await evalJs(`document.querySelector('main .aspect-video iframe')?.src ?? null`);
    check(`S0${i + 1} iframe 为 ${exp.bv}`, (src ?? '').includes(`bvid=${exp.bv}`), src ?? 'no iframe');
  } else {
    check('S03 无链接 → 播放位显示待补充提示', r.pending);
  }
  check(`S0${i + 1} 图片 ≥ ${exp.imgs} 且全部 WebP 加载成功`, r.imgTotal >= exp.imgs && r.broken.length === 0 && r.nonWebp.length === 0, `total=${r.imgTotal} broken=${r.broken.length} nonWebp=${r.nonWebp.length}`);
  if (i === 0) await shot('short-detail-001');
  if (i === 3) await shot('short-detail-004');
}

/* ── 4. 灯箱（short-002 详情页上） ───────────────────────────── */
await send('Page.navigate', { url: `${BASE}/film/short-002` });
await sleep(3600);
await evalJs(`(() => { [...document.querySelectorAll('main button[aria-label^="预览："]')][0]?.click(); return 'open'; })()`);
await sleep(1400);
await shot('short-lightbox');
const lb = await evalJs(`(() => {
  const box = document.querySelector('.vw-fade-in');
  const img = box ? box.querySelector('img') : null;
  return JSON.stringify({ open: !!box, src: img ? img.getAttribute('src') : null });
})()`);
const lbj = JSON.parse(lb);
check('灯箱打开并加载高清图', lbj.open && (lbj.src ?? '').includes('full'), lbj.src ?? 'none');
await evalJs(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); 'esc'`);
await sleep(600);

/* ── 5. 禁词 + 其他分类不受影响 ──────────────────────────────── */
const forbidden = await evalJs(`(() => {
  const text = document.body.innerText;
  const words = ['分镜', 'Prompt', '提示词', '时间线', '生成流程', '风格锁定', '素材映射', '首帧提示词'];
  return words.filter((w) => text.includes(w)).join(',');
})()`);
check('无禁词（分镜/Prompt/风格锁定/素材映射等）', !forbidden, forbidden || 'clean');

await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4200);
const cats = await evalJs(`(async () => {
  const section = document.querySelector('#ai-film');
  const clickTab = (label) => [...section.querySelectorAll('[role="tablist"][aria-label="影视分类"] [role="tab"]')].find((t) => t.textContent.includes(label))?.click();
  clickTab('AI漫剧');
  await new Promise((r) => setTimeout(r, 1000));
  const animeOk = section.textContent.includes('雪灾猎户买妻') && section.querySelectorAll('[aria-current]').length === 2;
  clickTab('AI真人剧');
  await new Promise((r) => setTimeout(r, 1000));
  const liveOk = section.textContent.includes('各奔前程') && section.querySelectorAll('[aria-current]').length === 4;
  clickTab('TVC广告');
  await new Promise((r) => setTimeout(r, 1000));
  const tvcOk = section.textContent.includes('PEACH 桃味气泡水') && section.querySelectorAll('[aria-current]').length === 4;
  clickTab('AI短片');
  await new Promise((r) => setTimeout(r, 1000));
  const shortOk = section.textContent.includes('炸鸡女王穿越中世纪') && section.querySelectorAll('[aria-current]').length === 4;
  return JSON.stringify({ animeOk, liveOk, tvcOk, shortOk });
})()`);
const c = JSON.parse(cats);
check('AI漫剧分类不受影响（2 项目）', c.animeOk);
check('AI真人剧分类不受影响（4 项目）', c.liveOk);
check('TVC广告分类不受影响（4 项目）', c.tvcOk);
check('AI短片分类 4 项目', c.shortOk);

/* ── 6. 移动端 390px ─────────────────────────────────────────── */
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label="影视分类"] [role="tab"]')].find((t) => t.textContent.includes('AI短片'))?.click(); 'ok'`);
await sleep(1100);
await shot('short-mobile');
const mobile = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    hasTitle: section.textContent.includes('炸鸡女王穿越中世纪'),
    noHScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  });
})()`);
const m = JSON.parse(mobile);
check('移动端 AI短片正常展示', m.hasTitle);
check('移动端无横向滚动', m.noHScroll, `scrollW=${m.scrollW} innerW=${m.innerW}`);

/* ── 7. 控制台 ───────────────────────────────────────────────── */
check('控制台零错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '));

const failed = results.filter((r) => !r.ok);
console.log(`\n===== ${results.length - failed.length}/${results.length} passed =====`);
process.exit(failed.length ? 1 : 0);
