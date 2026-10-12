export type PortfolioGroup = {
  /** 分组标题（中文） */
  title: string;
  /** 分组英文副标题 */
  en: string;
  /** 分组内的条目（作品或要点） */
  items: string[];
};

export type PortfolioRoute = {
  number: string;
  path: string;
  /** 单页滚动锚点 id（不含 #） */
  sectionId: string;
  /** 顶部导航显示的文字 */
  navLabel: string;
  title: string;
  label: string;
  color: string;
  /** 该栏目在首页的说明文字 */
  intro: string;
  /** 栏目内的分组内容（占位结构，后续替换为真实作品） */
  groups: PortfolioGroup[];
};

export const PORTFOLIO_ROUTES: PortfolioRoute[] = [
  {
    number: '01',
    path: '/',
    sectionId: 'home',
    navLabel: 'HOME',
    title: 'HOME',
    label: '首页',
    color: '#F48472',
    intro: '',
    groups: [],
  },
  {
    number: '02',
    path: '/about',
    sectionId: 'about',
    navLabel: 'ABOUT',
    title: 'ABOUT ME',
    label: '个人简历',
    color: '#58A8E8',
    intro: '个人简介、工作经历与技能。',
    groups: [
      {
        title: '个人简介',
        en: 'PROFILE',
        items: ['一句话介绍自己：我是谁、做什么、擅长什么【待补充】'],
      },
      {
        title: '工作经历',
        en: 'EXPERIENCE',
        items: ['【待补充】公司 / 职位 / 时间', '【待补充】公司 / 职位 / 时间', '【待补充】公司 / 职位 / 时间'],
      },
      {
        title: '技能',
        en: 'SKILLS',
        items: ['Photoshop', 'Illustrator', 'Figma', 'Premiere', 'ComfyUI / Stable Diffusion', 'Midjourney'],
      },
    ],
  },
  {
    number: '03',
    path: '/visual-design',
    sectionId: 'visual-design',
    navLabel: 'VISUAL',
    title: 'VISUAL DESIGN',
    label: '视觉设计',
    color: '#D98B4E',
    intro: '海报、Banner、字体、IP 形象与 VI 延展。',
    groups: [
      { title: '海报', en: 'POSTER', items: ['作品占位 01', '作品占位 02'] },
      { title: 'Banner', en: 'BANNER', items: ['作品占位 01', '作品占位 02'] },
      { title: '字体设计', en: 'TYPOGRAPHY', items: ['作品占位 01', '作品占位 02'] },
      { title: 'IP 形象', en: 'IP DESIGN', items: ['作品占位 01', '作品占位 02'] },
      { title: 'VI 延展', en: 'VI EXTENSION', items: ['作品占位 01', '作品占位 02'] },
    ],
  },
  {
    number: '04',
    path: '/ai-film',
    sectionId: 'ai-film',
    navLabel: 'AI FILM',
    title: 'AI FILM',
    label: 'AI影视作品',
    color: '#5E9A70',
    intro: 'AI 漫剧、AI 短片与 AI 广告。',
    groups: [
      { title: 'AI 漫剧', en: 'AI COMIC DRAMA', items: ['作品占位 01', '作品占位 02'] },
      { title: 'AI 短片', en: 'AI SHORT FILM', items: ['作品占位 01', '作品占位 02'] },
      { title: 'AI 广告', en: 'AI COMMERCIAL', items: ['作品占位 01', '作品占位 02'] },
    ],
  },
  {
    number: '05',
    path: '/app-projects',
    sectionId: 'app-projects',
    navLabel: 'APP',
    title: 'APP PRODUCT',
    label: 'APP产品',
    color: '#202124',
    intro: '今页 JINYE — 私人生活记录与待办管理应用，Android 下载与完整界面展示。',
    groups: [
      { title: '产品介绍', en: 'PRODUCT', items: ['产品占位 01', '产品占位 02'] },
      { title: 'UI 界面', en: 'UI SCREENS', items: ['界面占位 01', '界面占位 02'] },
      { title: '交互设计', en: 'INTERACTION', items: ['交互占位 01', '交互占位 02'] },
    ],
  },
  {
    number: '06',
    path: '/contact',
    sectionId: 'contact',
    navLabel: 'CONTACT',
    title: 'CONTACT',
    label: '联系方式',
    color: '#0F3A44',
    intro: '手机、邮箱、微信 — 欢迎随时联系我。',
    groups: [
      { title: '手机', en: 'PHONE', items: ['19993666547'] },
      { title: '邮箱', en: 'EMAIL', items: ['19993666547@163.com'] },
      { title: '微信', en: 'WECHAT', items: ['Yu19993666547'] },
    ],
  },
];

export function normalizePath(pathname: string) {
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** 依据旧路径或 hash 找到对应栏目（用于旧链接兼容与刷新定位） */
export function resolveSectionId(rawPath: string, rawHash: string) {
  const hash = rawHash.replace(/^#/, '');
  if (hash && PORTFOLIO_ROUTES.some((route) => route.sectionId === hash)) return hash;

  const path = normalizePath(rawPath.split('#')[0] || '/');
  if (path === '/') return 'home';
  const matched = PORTFOLIO_ROUTES.find((route) => route.path !== '/' && route.path === path);
  return matched ? matched.sectionId : 'home';
}
