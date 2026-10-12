/**
 * CONTACT 栏目配色：纯白极简（高留白作品集联系页）。
 *
 * 方向：「纯白纸面 + 近黑标题 + 浅灰辅助 + 白卡细边」。
 * 只在本栏目使用，不影响其他栏目。
 */
export const CONTACTC = {
  /** 页面背景（纯白） */
  bg: '#FFFFFF',

  /** 卡片 */
  card: '#FFFFFF',

  /** 主标题 / 主要内容 */
  text: '#111111',
  /** 辅助文字（英文标签、动作提示、底部结语） */
  muted: '#999999',
  /** 顶部章节编号 */
  label: '#A8A8A8',

  /** 卡片边框 */
  border: '#E5E5E5',
  /** hover 时的边框（略深一档） */
  borderHover: '#D8D8D8',

  /** 圆形图标底 */
  iconBg: '#111111',
  /** 圆形图标笔画 */
  iconStroke: '#FFFFFF',

  /** 卡片默认阴影 */
  shadow: '0 10px 40px rgba(0,0,0,.05)',
  /** 卡片 hover 阴影（增强） */
  shadowHover: '0 22px 60px rgba(0,0,0,.10)',
} as const;
