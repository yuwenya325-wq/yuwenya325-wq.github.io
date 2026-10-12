/**
 * B 站视频链接工具（对应《素材发布规范》第四条）。
 *
 * 只做「识别 + 构造官方播放器地址」：
 * - 不下载视频文件；
 * - 不使用任何第三方解析服务；
 * - 播放统一走官方 player.bilibili.com iframe。
 */

/** BV 号格式：BV + 10 位数字/字母（Base58 字符集，不含易混字符，宽松校验即可） */
const BVID_RE = /^BV[0-9A-Za-z]{10}$/;

/** 常规视频页链接：/video/BVxxxxxx，可带 ?p=2 分 P */
const PAGE_RE = /\/video\/(BV[0-9A-Za-z]{10})/i;

/**
 * 从任意输入（纯 BV 号或完整链接）提取 BV 号。
 * 支持：
 *   BV1abc2def3
 *   https://www.bilibili.com/video/BV1abc2def3?p=2
 *   https://www.bilibili.com/video/BV1abc2def3/
 * 注意：b23.tv 短链无法在前端安全解析，请提供展开后的链接（或直接给 BV 号）。
 */
export function extractBvid(input: string): string | null {
  const trimmed = input.trim();
  if (BVID_RE.test(trimmed)) return trimmed;
  const match = trimmed.match(PAGE_RE);
  return match ? match[1] : null;
}

/** 从链接中提取分 P（?p=N，缺省 1） */
export function extractPage(input: string): number {
  const match = input.match(/[?&]p=(\d+)/);
  if (!match) return 1;
  const page = Number.parseInt(match[1], 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/** 校验 BV 号 */
export function isBvid(value: string): boolean {
  return BVID_RE.test(value);
}

/** 官方嵌入式播放器地址（autoplay 默认关闭，避免打扰） */
export function embedUrl(bvid: string, page = 1, autoplay = false): string {
  if (!isBvid(bvid)) return '';
  return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(bvid)}`
    + `&page=${Math.max(1, page)}&autoplay=${autoplay ? 1 : 0}&high_quality=1&danmaku=0`;
}

/** 「前往B站观看」的原始链接 */
export function watchUrl(bvid: string, page = 1): string {
  if (!isBvid(bvid)) return '';
  const query = page > 1 ? `?p=${page}` : '';
  return `https://www.bilibili.com/video/${bvid}${query}`;
}
