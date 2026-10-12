/**
 * 站点单一数据源。
 * 轮播配色与导航项都从这里读取，避免出现两套容易不同步的数据。
 */

/** 四张潮玩角色轮播画面的原始配置（图片路径、背景色、面板色均保持原样，未做任何替换/裁剪/压缩）。 */
export type Figurine = {
  src: string;
  /** 轮播页背景主色，同时作为全屏菜单的默认背景色 */
  bg: string;
  /** 次级面板色（保留原有数据，供后续扩展使用） */
  panel: string;
};

export const FIGURINES: readonly Figurine[] = [
  { src: '/characters/bomi-wave.png', bg: '#F48472', panel: '#F79B8C' },
  { src: '/characters/bomi-walk.png', bg: '#58A8E8', panel: '#7ABAF0' },
  { src: '/characters/forest-wave.png', bg: '#D98B4E', panel: '#E6A56E' },
  { src: '/characters/forest-walk.png', bg: '#5E9A70', panel: '#7CAF8B' },
];

/** 全屏导航项：左侧两位编号 / 中间英文大标题 / 右侧中文名称 / 对应路由地址。 */
export type NavItem = {
  id: string;
  number: string;
  en: string;
  zh: string;
  path: string;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', number: '01', en: 'HOME', zh: '首页', path: '/' },
  { id: 'about', number: '02', en: 'ABOUT ME', zh: '个人简历', path: '/about' },
  { id: 'visual-design', number: '03', en: 'VISUAL DESIGN', zh: '视觉设计', path: '/visual-design' },
  { id: 'ai-film', number: '04', en: 'AI FILM', zh: 'AI影视作品', path: '/ai-film' },
  { id: 'app-projects', number: '05', en: 'APP PROJECTS', zh: 'APP项目', path: '/app-projects' },
  { id: 'contact', number: '06', en: 'CONTACT', zh: '联系我', path: '/contact' },
];

/** 站点统一的胶片颗粒纹理（原本内联在首页，抽出复用，视觉参数完全不变）。 */
export const GRAIN =
  `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;
