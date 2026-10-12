/**
 * APP PRODUCT 栏目配色：极简产品发布风（Apple 产品页气质）。
 *
 * 方向：「浅灰纸面 + 近黑标题 + 产品品牌绿强调」。
 * 品牌绿 #4B6246 取自今页真实 UI 的主操作按钮，让产品展示与产品本身同源。
 * 只在本栏目使用，不影响其他栏目。
 */
export const APPC = {
  /** 页面背景（极简浅灰） */
  bg: '#F7F7F5',
  /** 背景渐变下端（略深，极轻微） */
  bgBottom: '#F1F1EE',

  /** 卡片 */
  card: '#FFFFFF',

  /** 主标题 / 主要文字 */
  text: '#111111',
  /** 英文辅助标题 */
  muted: '#777777',
  /** 正文 */
  body: '#555555',
  /** 顶部章节小标题 */
  label: '#8A8A82',

  /** 强调色（今页品牌绿） */
  accent: '#4B6246',
  /** 强调色 hover / 深一档 */
  accentBright: '#3C5038',
  /** 强调色浅底（图标圆底 / 标签底） */
  accentSoft: '#EEF2EA',
  /** 强调色描边 */
  accentLine: '#C9D4C3',

  /** 边框 */
  border: '#E6E6E2',
  /** 分隔线 */
  divider: '#EDEDEA',

  /** 大卡片阴影（柔和） */
  shadow: '0 24px 70px rgba(17,17,17,.08)',
  /** 小卡片阴影 */
  shadowSmall: '0 10px 30px rgba(17,17,17,.06)',
  /** 手机投影（椭圆柔影） */
  phoneShadow: '0 60px 90px -30px rgba(17,17,17,.35)',
} as const;
