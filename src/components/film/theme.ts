/**
 * AI FILM 栏目配色：TOONHUB CINEMA（暖奶油电影展厅）。
 *
 * 设计方向：「暖奶油白 + 高级灰 + 暖橙强调 + 电影质感」。
 * 只在本栏目使用，不污染其他栏目；与首页 3D 潮玩、ABOUT 黑白荧光黄、
 * VISUAL DESIGN 奶油白彩色图标同属一个作品集，但气质各不相同。
 */
export const FILM = {
  /** 页面背景（暖灰奶油纸张） */
  bg: '#F4F0EA',
  /** 背景渐变上端（略浅） */
  bgTop: '#F8F5F1',
  /** 背景渐变下端（略深） */
  bgBottom: '#EDE7DF',

  /** 作品展板（漂浮在页面上的白色容器） */
  panel: '#FFFFFF',
  /** 次级底板（视频区 / 资产卡底） */
  tile: '#F7F4EF',

  /** 主要文字（中文大标题） */
  text: '#181818',
  /** 英文辅助标题 */
  muted: '#81766D',
  /** 正文 */
  body: '#5E554D',
  /** 顶部章节小标题 */
  label: '#A58E7A',

  /** 强调色（暖橙） */
  accent: '#E7A16A',
  /** 强调色 hover / 深一档 */
  accentBright: '#CE8A50',
  /** 强调色柔光（选中按钮阴影 / 光晕） */
  accentSoft: 'rgba(231,161,106,.25)',

  /** 边框（暖灰） */
  border: '#C8BDB3',
  /** 分隔线（更浅） */
  divider: '#EAE4DC',
  /** 展板阴影 */
  shadow: '0 20px 60px rgba(0,0,0,.08)',
} as const;

/** 强调色（暖橙）底上的文字色 */
export const FILM_ON_ACCENT = '#FFFFFF';
