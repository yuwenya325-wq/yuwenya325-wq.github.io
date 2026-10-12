/**
 * APP PRODUCT 栏目数据单源。
 *
 * 当前只展示一个 APP 产品（今页 JINYE）——所有文案均来自产品 README
 * 与官方网站的真实资料，不编造功能与数据。
 * 结构预留为「产品数组」：未来增加第二个 APP 时，往 APP_PRODUCTS
 * 追加一项即可，页面组件按 PRIMARY_APP（或选中项）渲染，无需改版式。
 */

/** APP 界面展示（真实 UI 截图，经 tools/media/optimize.py 压缩为 WebP） */
export type AppScreen = {
  id: string;
  /** 中文页签名 */
  label: string;
  /** 英文页签名（展示用） */
  en: string;
  /** 界面截图（single 档 WebP） */
  image: string;
  /** 截图原始宽高（用于占位防跳动） */
  width: number;
  height: number;
  /** 一句话说明 */
  description: string;
  /** 在手机模型里是否可作为主屏幕切换（编辑器等次级页不进入切换） */
  primary: boolean;
};

/** 核心功能卡 */
export type AppFeature = {
  id: string;
  /** 编号（01 起） */
  number: string;
  title: string;
  en: string;
  description: string;
  /** lucide 图标名（组件内映射，数据层不依赖 UI 库） */
  icon: 'plan' | 'record' | 'revisit' | 'private';
};

/** 设计理念条目 */
export type AppConcept = {
  id: string;
  title: string;
  en: string;
  description: string;
};

export type AppProduct = {
  id: string;
  /** 产品名称（中文） */
  name: string;
  /** 英文名称 */
  englishName: string;
  /** 一句产品定位 */
  tagline: string;
  taglineEn: string;
  /** 产品简介 */
  description: string;
  /** 图标（WebP） */
  icon: string;
  /** 当前版本 */
  version: string;
  /** 平台要求 */
  platform: string;
  /** 安装包体积（展示文本） */
  sizeLabel: string;
  /** 下载入口（站点内 APK） */
  downloadUrl: string;
  /** 下载文件名 */
  downloadName: string;
  /** 产品官网（线上发布地址，含 APK 下载与网页版体验） */
  officialUrl: string;
  /** 强调色（产品品牌色，卡片与按钮复用） */
  accent: string;
  features: AppFeature[];
  screens: AppScreen[];
  concepts: AppConcept[];
};

export const APP_PRODUCTS: AppProduct[] = [
  {
    id: 'jinye',
    name: '今页',
    englishName: 'JINYE',
    tagline: '给今天，留一页空白。',
    taglineEn: 'Make room for today.',
    description:
      '今页是一款私人生活记录与待办管理应用：安排小事，收藏心情，回看日常。' +
      '没有社区、关注或点赞，数据保存在本机并可随时导出备份——记录今天，也安排今天。',
    icon: '/app/jinye-icon.webp',
    version: 'v1.0.2',
    platform: 'Android 8.0+',
    sizeLabel: '111 KB',
    downloadUrl: '/downloads/app/jinye-1.0.2.apk',
    downloadName: '今页-1.0.2.apk',
    officialUrl: 'https://yuwenya325-wq.github.io/jinye-website/',
    accent: '#4B6246',
    features: [
      {
        id: 'plan',
        number: '01',
        title: '安排今天',
        en: 'PLAN TODAY',
        description: '从空白开始，由你添加生活、学习和工作待办。完成一件，轻轻勾选。',
        icon: 'plan',
      },
      {
        id: 'record',
        number: '02',
        title: '记录今天',
        en: 'RECORD TODAY',
        description: '文字、图片与心情，留下普通日子里的小小瞬间。',
        icon: 'record',
      },
      {
        id: 'revisit',
        number: '03',
        title: '回看今天',
        en: 'REVISIT TODAY',
        description: '在日历中回看某一天，也可以用关键词找到记录。',
        icon: 'revisit',
      },
      {
        id: 'private',
        number: '04',
        title: '私密无社交',
        en: 'PRIVATE BY DESIGN',
        description: '没有社区、关注或点赞。你的生活，留给自己。',
        icon: 'private',
      },
    ],
    screens: [
      {
        id: 'home',
        label: '今天',
        en: 'TODAY',
        image: '/works/app/home-full.webp',
        width: 375,
        height: 811,
        description: '首页：今天要做的、今天完成的与今天发生的。',
        primary: true,
      },
      {
        id: 'calendar',
        label: '日历',
        en: 'CALENDAR',
        image: '/works/app/calendar-full.webp',
        width: 375,
        height: 811,
        description: '在日历中回看某一天的生活记录。',
        primary: true,
      },
      {
        id: 'todos',
        label: '待办',
        en: 'TODOS',
        image: '/works/app/todos-full.webp',
        width: 390,
        height: 843,
        description: '生活、学习和工作的待办清单，支持按日期与分类排序。',
        primary: true,
      },
      {
        id: 'profile',
        label: '我的',
        en: 'PROFILE',
        image: '/works/app/profile-full.webp',
        width: 375,
        height: 811,
        description: '个人数据管理：统计、导出备份与设置。',
        primary: true,
      },
      {
        id: 'editor',
        label: '记录编辑',
        en: 'COMPOSER',
        image: '/works/app/record-editor-full.webp',
        width: 390,
        height: 843,
        description: '全屏记录编辑器：日期、心情、本地图片与标签。',
        primary: false,
      },
    ],
    concepts: [
      {
        id: 'philosophy',
        title: '设计理念',
        en: 'PHILOSOPHY',
        description: '「给今天，留一页空白。」安静、留白的纸感界面，让记录像轻轻翻过今天的一页，而不是填一张表格。',
      },
      {
        id: 'needs',
        title: '用户需求',
        en: 'USER NEEDS',
        description: '安排小事，收藏心情，回看日常。它是一个人使用的私人记录工具——不需要展示给谁，也不需要被点赞。',
      },
      {
        id: 'goals',
        title: '设计目标',
        en: 'DESIGN GOALS',
        description: '用最低的记录成本换取最轻的心理负担：本机存储、导出备份、随手可记，翻开就能写下今天。',
      },
    ],
  },
];

/** 当前展示的产品（未来多产品时可改为按路由/选择器取值） */
export const PRIMARY_APP: AppProduct = APP_PRODUCTS[0];

/** 手机模型里可切换的主屏幕（编辑器等次级页只在 UI SCREEN 区展示） */
export function primaryScreens(product: AppProduct): AppScreen[] {
  return product.screens.filter((screen) => screen.primary);
}
