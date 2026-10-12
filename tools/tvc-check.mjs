/**
 * 四部 AI TVC 广告（tvc-001~004）上传验收：
 * 1. TVC广告分类下 4 个项目；
 * 2. 每部：标题/封面/单集播放 iframe BV 正确（无集数切换条）；
 * 3. 详情页区块为 03 产品资产 / 04 场景资产 / 05 视觉素材（PRODUCT/ENVIRONMENT/VISUAL ASSETS）；
 * 4. 图片全 WebP、无 broken、灯箱正常；禁词 clean；移动端 390px；控制台零错误；
 * 5. AI漫剧 / AI真人剧分类不受影响。
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9389;
const BASE = 'http://127.0.0.1:5180';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const child = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=C:\\Users\\PC\\AppData\\Local\\Temp\\edge-cdp-f8-${Date.now()}`,
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
  writeFileSync(`C:/Users/PC/Desktop/个人网站/.shots/tvc/${name}.png`, Buffer.from(res.data, 'base64'));
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

/* ── 1. 首页：TVC广告分类 ───────────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label="影视分类"] [role="tab"]')].find((t) => t.textContent.includes('TVC广告'))?.click(); 'ok'`);
await sleep(1100);
const nav = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    dots: section.querySelectorAll('[aria-current]').length,
    hasNext: !!section.querySelector('[aria-label="下一部作品"]'),
    noEpisodeTabs: section.querySelectorAll('[role="tablist"][aria-label*="集数切换"]').length,
  });
})()`);
const n = JSON.parse(nav);
check('TVC广告分类出现 4 个项目', n.hasNext && n.dots === 4, JSON.stringify(n));
check('单视频广告不显示集数切换条', n.noEpisodeTabs === 0);

const TITLES = ['PEACH 桃味气泡水', 'Coco-lala：夏日冰爽一口', 'TYOOO coffee：从产地到杯中', '一滴水的奇幻旅程'];
const COVERS = ['tvc-001-cover', 'tvc-002-cover', 'tvc-003-cover', 'tvc-004-cover'];
const BVS = ['BV17Mp46wETE', 'BV17Mp46wELy', 'BV17Mp46wEjL', 'BV1BKp46YE1u'];
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
      hasCatEn: section.textContent.includes('TVC COMMERCIAL'),
      cover: img ? img.getAttribute('src') : null,
      viewProject: [...section.querySelectorAll('button')].some((b) => b.textContent.trim().startsWith('VIEW PROJECT')),
    });
  })()`);
  const s = JSON.parse(state);
  check(`0${i + 1} 标题「${TITLES[i]}」+ 类型 TVC COMMERCIAL`, s.title && s.hasCatEn);
  check(`0${i + 1} 封面为 ${COVERS[i]}`, (s.cover ?? '').includes(COVERS[i]), s.cover ?? 'none');
  check(`0${i + 1} VIEW PROJECT 入口存在`, s.viewProject);
}
await shot('tvc-home-001');

/* ── 2. 播放：第 4 部点「下一部」循环回第 1 部，点击后挂正确 iframe ── */
await evalJs(`document.querySelector('#ai-film [aria-label="下一部作品"]')?.click(); 'next'`);
await sleep(900);
const backTitle = await evalJs(`document.querySelector('#ai-film').textContent.includes('PEACH 桃味气泡水')`);
check('循环导航回到第 1 部', backTitle);
await evalJs(`document.querySelector('#ai-film .aspect-video button')?.click(); 'play'`);
await sleep(1800);
const iframe = await evalJs(`document.querySelector('#ai-film .aspect-video iframe')?.src ?? null`);
check('TVC-01 iframe 为 BV17Mp46wETE', (iframe ?? '').includes('bvid=BV17Mp46wETE'), iframe ?? 'no iframe');
await shot('tvc-home-play');

/* ── 3. 四个详情页逐个检查 ───────────────────────────────────── */
const DETAIL_EXPECT = [
  { slug: 'tvc-001', bv: 'BV17Mp46wETE', dur: '0:26', imgs: 7, synopsis: 'PEACH — SPARKLING WATER', prod: 1, env: 3, vis: 2 },
  { slug: 'tvc-002', bv: 'BV17Mp46wELy', dur: '0:19', imgs: 5, synopsis: 'CoCo-Lala', prod: 2, env: 1, vis: 1 },
  { slug: 'tvc-003', bv: 'BV17Mp46wEjL', dur: '0:39', imgs: 9, synopsis: 'TYOOO coffee', prod: 3, env: 3, vis: 2 },
  { slug: 'tvc-004', bv: 'BV1BKp46YE1u', dur: '0:32', imgs: 4, synopsis: '粉红色双轨', prod: 1, env: 1, vis: 1 },
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
      hasProduct: heads.some((h) => h.includes('产品资产') && h.includes('PRODUCT ASSETS')),
      hasEnv: heads.some((h) => h.includes('场景资产') && h.includes('ENVIRONMENT ASSETS')),
      hasVisual: heads.some((h) => h.includes('视觉素材') && h.includes('VISUAL ASSETS')),
      noOldHeads: !heads.some((h) => h.includes('人物资产') || h.includes('道具资产')),
      durRow: rows.find((r) => r.includes('影片时长')) ?? null,
      toolsRow: rows.find((r) => r.includes('制作工具')) ?? null,
      roleRow: rows.find((r) => r.includes('个人负责')) ?? null,
      synopsisOk: main.textContent.includes(${JSON.stringify(exp.synopsis)}),
      imgTotal: imgs.length,
      broken, nonWebp,
    });
  })()`);
  const r = JSON.parse(d);
  check(`TVC-0${i + 1} 路由 /film/${exp.slug} + 标题`, r.url === `/film/${exp.slug}` && r.title.includes(TITLES[i]), `${r.url} | ${r.title}`);
  check(`TVC-0${i + 1} 03 产品资产 PRODUCT ASSETS`, r.hasProduct);
  check(`TVC-0${i + 1} 04 场景资产 ENVIRONMENT ASSETS`, r.hasEnv);
  check(`TVC-0${i + 1} 05 视觉素材 VISUAL ASSETS`, r.hasVisual);
  check(`TVC-0${i + 1} 无旧「人物/道具资产」区块`, r.noOldHeads);
  check(`TVC-0${i + 1} 时长 ${exp.dur} + 工具 + 职责`, (r.durRow ?? '').includes(exp.dur) && (r.toolsRow ?? '').includes('即梦') && (r.roleRow ?? '').includes('AI 广告创意策划'), r.durRow ?? 'missing');
  check(`TVC-0${i + 1} 剧本概述为真实内容`, r.synopsisOk);
  check(`TVC-0${i + 1} 图片 ≥ ${exp.imgs} 且全部 WebP 加载成功`, r.imgTotal >= exp.imgs && r.broken.length === 0 && r.nonWebp.length === 0, `total=${r.imgTotal} broken=${r.broken.length} nonWebp=${r.nonWebp.length}`);
  if (i === 0) await shot('tvc-detail-001');
  if (i === 3) await shot('tvc-detail-004');
}

/* ── 4. 灯箱（tvc-001 详情页上） ─────────────────────────────── */
await send('Page.navigate', { url: `${BASE}/film/tvc-001` });
await sleep(3600);
await evalJs(`(() => { [...document.querySelectorAll('main button[aria-label^="预览："]')][0]?.click(); return 'open'; })()`);
await sleep(1400);
await shot('tvc-lightbox');
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
  const words = ['分镜', 'Prompt', 'STORYBOARD', '提示词', '时间线', '生成流程', '风格锁定', '素材映射'];
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
  return JSON.stringify({ animeOk, liveOk, tvcOk });
})()`);
const c = JSON.parse(cats);
check('AI漫剧分类不受影响（2 项目，含《雪灾猎户买妻》）', c.animeOk);
check('AI真人剧分类不受影响（4 项目）', c.liveOk);
check('TVC广告分类 4 项目', c.tvcOk);

/* ── 6. 移动端 390px ─────────────────────────────────────────── */
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: `${BASE}/#ai-film` });
await sleep(4500);
await evalJs(`[...document.querySelectorAll('#ai-film [role="tablist"][aria-label="影视分类"] [role="tab"]')].find((t) => t.textContent.includes('TVC广告'))?.click(); 'ok'`);
await sleep(1100);
await shot('tvc-mobile');
const mobile = await evalJs(`(() => {
  const section = document.querySelector('#ai-film');
  return JSON.stringify({
    hasTitle: section.textContent.includes('PEACH 桃味气泡水'),
    noHScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  });
})()`);
const m = JSON.parse(mobile);
check('移动端 TVC广告正常展示', m.hasTitle);
check('移动端无横向滚动', m.noHScroll, `scrollW=${m.scrollW} innerW=${m.innerW}`);

/* ── 7. 控制台 ───────────────────────────────────────────────── */
check('控制台零错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' || '));

const failed = results.filter((r) => !r.ok);
console.log(`\n===== ${results.length - failed.length}/${results.length} passed =====`);
process.exit(failed.length ? 1 : 0);
