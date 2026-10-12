/**
 * VISUAL DESIGN 四个分类的统一数据源。
 *
 * 首页入口的四个分类图标、四个独立作品页，全部由这里驱动：
 * 新增一个作品，只要往对应分类的 `works`（或 IP 分类的 `projects`）里加一条即可，
 * 不需要改动任何组件。图片经 tools/media/optimize.py 处理后放 `public/works/<分类 id>/` 下，
 * 完整流程见 tools/media/README.md。
 */

export type VisualWork = {
  /** 统一资源名（与 public/works/<分类>/ 下的文件名对应，如 poster-001） */
  slug?: string;
  /**
   * 图片地址（单档兜底写法）。
   * 推荐改用 thumb / cover / full 三档，由 WorkImage 组件按设备自动选档：
   * thumb ≈600w 列表用、cover ≈1200w 网格用、full ≈1920w 灯箱放大用。
   */
  src?: string;
  thumb?: string;
  cover?: string;
  full?: string;
  /** 原始宽高（用于占位防跳动与 srcset 描述符） */
  width?: number;
  height?: number;
  /** 作品名（用于预览标题与 alt） */
  title: string;
  /** 补充说明：尺寸 / 年份 / 客户 / 用途 */
  meta?: string;
  /** 仅用于加载前的占位比例（如 '3 / 4'），不影响真实图片比例 */
  ratio?: string;
  /** ── 详情页字段（poster 分类使用）────────────────────────────── */
  /** 设计说明（详情页 PROJECT INFO 展示） */
  description?: string;
  /** 创作工具 / 途径 */
  tools?: string;
  /** 创作年份 */
  year?: string;
  /** 创作过程图（草图 / AI 生成 / 修改稿）；为空时详情页不显示 PROCESS 模块 */
  process?: { src: string; width: number; height: number; title: string }[];
  /** 应用效果图（网站首页 / 活动页 / 移动端展示）；为空时详情页不显示 MOCKUP 模块 */
  mockups?: { src: string; width: number; height: number; title: string }[];
};

/** 把作品的媒体字段整理成 WorkImage 需要的 sources（宽度小的在前） */
export function workSources(work: VisualWork) {
  const thumbWidth = work.thumb?.includes('thumb-lg') ? 800 : 600;
  const sources = [
    work.thumb && { src: work.thumb, width: thumbWidth },
    work.cover && { src: work.cover, width: 1200 },
    work.src && { src: work.src },
    work.full && { src: work.full, width: 1920 },
  ].filter(Boolean) as { src: string; width?: number }[];
  if (!sources.length) sources.push({ src: '' });
  return sources;
}

/** 灯箱放大时优先用 full，没有则逐级回落 */
export function workFullSrc(work: VisualWork): string {
  return work.full || work.cover || work.src || work.thumb || '';
}

export type VisualGroup = {
  title: string;
  en: string;
  items: VisualWork[];
  /** 详情页归属模块：角色设计（默认）/ 视觉识别 / 应用延展；为空时对应模块不显示 */
  section?: 'character' | 'vi' | 'application';
};

/** IP 分类下的单个项目（封面 / 角色设定 / 品牌故事 / VI 延展） */
export type VisualProject = {
  /** 项目 slug（详情路由 /ip/<id>） */
  id: string;
  /** 中文名（如：波米） */
  name: string;
  /** 英文名（如：BOMI） */
  en: string;
  /** 一句话介绍（列表页展示） */
  note: string;
  /** IP 口号（取自设定卡，不虚构） */
  tagline?: string;
  /** 主视觉封面（角色设定卡，详情页 01 IP COVER） */
  cover?: { src: string; thumb?: string; width: number; height: number };
  /** 角色档案（BRAND STORY 区的档案表，取自设定卡原文） */
  profile?: { label: string; value: string }[];
  /** 品牌故事段落（BRAND STORY 区正文） */
  story?: string[];
  /** 分组素材：角色（三视图 / 表情 / 动作 / 服装）与 VI 延展 */
  groups: VisualGroup[];
};

export type VisualCategoryId = 'poster' | 'banner' | 'typography' | 'ip-vi';

/** 作品区布局：竖版瀑布流 / 横向宽幅 / 大尺寸展示 / 按 IP 项目分组 */
export type VisualLayout = 'masonry' | 'wide' | 'display' | 'project';

export type VisualCategory = {
  id: VisualCategoryId;
  /** 入口编号 01—04 */
  number: string;
  /** 英文名（入口与页面大标题） */
  en: string;
  /** 中文名 */
  cn: string;
  /** 独立作品页路由 */
  path: string;
  /** 正式图标素材（static 3D 渲染图，WebP；原图归档在 assets/originals/icons/） */
  icon: string;
  /** 该分类的柔和强调色（页面主题 / 悬停强调，与图标素材配色对应） */
  accent: string;
  /** 图标概念说明（无障碍描述 + 页面文案） */
  concept: string;
  /** 作品页副标题 */
  summary: string;
  /** 作品区布局 */
  layout: VisualLayout;
  /** 该分类计划收录的资产类型（空状态提示用） */
  assetTypes: string[];
  /** 平面作品（海报 / Banner / 字体） */
  works: VisualWork[];
  /** IP 与 VI 延展：按项目组织 */
  projects: VisualProject[];
};

export const VISUAL_CATEGORIES: VisualCategory[] = [
  {
    id: 'poster',
    number: '01',
    en: 'POSTER DESIGN',
    cn: '海报设计',
    path: '/visual/poster',
    icon: '/icons/icon-poster.webp',
    accent: '#F48472',
    concept: '三层悬浮的海报叠层：暖色抽象风景版式，前后错位形成空间感。',
    summary: '竖版海报与系列印刷品，按发布节奏与系列感组织。',
    layout: 'masonry',
    assetTypes: ['竖版海报', '系列海报', '印刷尺寸与出血', '材质与工艺'],
    works: [
      {
        slug: 'poster-01',
        title: '花语灵感 FLORAL IMPRESSION',
        thumb: '/works/poster/poster-01-thumb.webp',
        full: '/works/poster/poster-01-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '植物花卉主题展览海报。以黄白花束为主体铺陈春日生机，蓝黄撞色的衬线与手写体在纸质纹理上交错排布，通过字体层级与色彩关系构建温暖明快的展览氛围，探索 AI 视觉生成与平面排版的结合方式。',
      },
      {
        slug: 'poster-02',
        title: 'SHINE WILD 野生发光',
        thumb: '/works/poster/poster-02-thumb.webp',
        full: '/works/poster/poster-02-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '以一只蓝色斑点鹿与盛放的向日葵构成超现实对视，玫粉色底色把荒诞与活力推到极致。气泡字标题与手写标语传递「表达即自由」的主题——色彩是一种声音，做明亮、勇敢、完整的自己。',
      },
      {
        slug: 'poster-03',
        title: 'NEON HARBOR 霓虹港湾',
        thumb: '/works/poster/poster-03-thumb.webp',
        full: '/works/poster/poster-03-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '孟菲斯风格的城市漫步海报。以墨镜轮廓取景港湾天际线，霓虹粉黄撞色与贴纸式标签堆叠出周末假期的松弛节奏，街景、游艇与摩天楼在插画质感里交织成一场热闹的 City Walk。',
      },
      {
        slug: 'poster-04',
        title: '把风留给旷野',
        thumb: '/works/poster/poster-04-thumb.webp',
        full: '/works/poster/poster-04-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '治愈系生活方式海报。红色沙发落在开满野花的草坡上，手绘线条小人舒展四肢，与「松弛有度」的涂鸦字呼应——把风留给旷野，把快乐还给自己。真实质感与涂鸦笔迹的反差构成画面的呼吸感。',
      },
      {
        slug: 'poster-05',
        title: '远方 DREAM ROUTE',
        thumb: '/works/poster/poster-05-thumb.webp',
        full: '/works/poster/poster-05-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '奇幻旅行主题海报。一列攀满花草的列车悬浮在云海之上，提灯的旅人立于车顶，与远方雪山和花田构成「有些地方只存在于更温柔的地图」的想象叙事，宋体大标题与英文衬线排版强化复古杂志气质。',
      },
      {
        slug: 'poster-06',
        title: 'MAKE ROOM FOR JOY',
        thumb: '/works/poster/poster-06-thumb.webp',
        full: '/works/poster/poster-06-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '屋顶夜晚野餐场景与巨型粉色爆炸字体的叠加——熟悉的伙伴、微暗的天空与串灯，被「为快乐腾出空间」的口号式版式重新点亮。字体笔画切割画面、荧光星形穿插其间，构成情绪化的文字海报实验。',
      },
      {
        slug: 'poster-07',
        title: '风在发光',
        thumb: '/works/poster/poster-07-thumb.webp',
        full: '/works/poster/poster-07-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '春日节奏主题海报。奔跑少女扬起红丝带，橙色毛笔书法纵贯画面，与摄影质感的山野光线互为表里——「风穿过山野，把平凡的日子吹成发光的形状」。书法笔势与照片动势共同指向自由的春天。',
      },
      {
        slug: 'poster-08',
        title: 'BREEZE 夏日微风',
        thumb: '/works/poster/poster-08-thumb.webp',
        full: '/works/poster/poster-08-full.webp',
        width: 1086,
        height: 1448,
        meta: '2026 · Poster Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '夏日庭院主题海报。青蓝色天空与粉色云朵落在开满蔷薇的小院里，两把舒服的椅子朝着大海的方向——「soft air, bright sky and a quiet place to dream」。右侧青蓝竖排 BREEZE 大字与手绘线稿小图构成杂志式分栏版式。',
      },
    ],
    projects: [],
  },
  {
    id: 'banner',
    number: '02',
    en: 'BANNER',
    cn: 'Banner 设计',
    path: '/visual/banner',
    icon: '/icons/icon-banner.webp',
    accent: '#58A8E8',
    concept: '蓝白科技感的立体横幅展示牌：宽幅画面立在发光底座上。',
    summary: '横向宽幅视觉：电商、活动、社媒与投放位 Banner。',
    layout: 'wide',
    assetTypes: ['电商主图 Banner', '活动 KV', '社媒投放位', '多尺寸适配'],
    works: [
      {
        slug: 'banner-01',
        title: 'Winter Edit 冬日新作',
        thumb: '/works/banner/banner-01-thumb.webp',
        cover: '/works/banner/banner-01-cover.webp',
        full: '/works/banner/banner-01-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '女装冬季新品推广 Banner。驼色大衣与暖棕拼色构建冬日氛围，衬线大字标题与「新品上市 / 精选外套低至 7 折」的促销按钮形成清晰视觉层级，左侧编辑感小图与 01–04 编号排版增添杂志质感，完成电商首页头图的信息传达与品牌调性统一。',
      },
      {
        slug: 'banner-02',
        title: '春季上新 THE SPRING EDIT',
        thumb: '/works/banner/banner-02-thumb.webp',
        cover: '/works/banner/banner-02-cover.webp',
        full: '/works/banner/banner-02-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '春季女装促销 Banner。粉蓝撞色的柔彩色块与竖排衬线「SPRING」叠加樱花与米白针织质感，主标题「春季上新」黑红对比醒目，「精选单品 低至 7 折」通过双色块按钮传达促销层级，整体轻盈柔和，呼应春日上新主题。',
      },
      {
        slug: 'banner-03',
        title: '潮流新作 限定登场',
        thumb: '/works/banner/banner-03-thumb.webp',
        cover: '/works/banner/banner-03-cover.webp',
        full: '/works/banner/banner-03-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '街头潮流品牌促销 Banner。正红底色叠加做旧笔刷与描边大字 STREET / STYLE，米色巨号「24」与模特街拍姿态构成前中后三层空间，黑红撞色的标题与「态度上场」口号强化限定发售的紧迫感与街头态度。',
      },
      {
        slug: 'banner-04',
        title: 'LUNA HERB 植萃润养',
        thumb: '/works/banner/banner-04-thumb.webp',
        cover: '/works/banner/banner-04-cover.webp',
        full: '/works/banner/banner-04-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '护肤品牌推广 Banner。香槟金与奶油白的柔和渐变铺陈自然奢华感，精华滴落与花朵、水泡特写呼应「植萃润养 焕亮新肌」的产品卖点，衬线中英文字体组合与两个勾选卖点形成信任感排版，适合品牌首页与投放位使用。',
      },
      {
        slug: 'banner-05',
        title: '森野假日 周末野餐时光',
        thumb: '/works/banner/banner-05-thumb.webp',
        cover: '/works/banner/banner-05-cover.webp',
        full: '/works/banner/banner-05-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '周末主题活动 Banner。低饱和草绿色底上搭建 3D 微缩野餐场景——遮阳伞、野餐篮、吉他与格纹餐布，PICNIC 底纹大字与手写体 Weekend escape 叠加轻松假日气息，「野餐 × 音乐 × 市集 × 微风」的活动信息以标签形式清晰传达。',
      },
      {
        slug: 'banner-06',
        title: 'MINT MODE 轻潮新作',
        thumb: '/works/banner/banner-06-thumb.webp',
        cover: '/works/banner/banner-06-cover.webp',
        full: '/works/banner/banner-06-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '美妆造型工作室推广 Banner。薄荷绿主色调贯穿背景与服装，左右双模特对称构图夹持中央标题区，白色细线网格与 MINT MODE 立体字营造清爽科技感，底部三个服务标签与「预约造型体验」按钮完成转化路径引导。',
      },
      {
        slug: 'banner-07',
        title: 'NOVA DISTRICT City Shift',
        thumb: '/works/banner/banner-07-thumb.webp',
        cover: '/works/banner/banner-07-cover.webp',
        full: '/works/banner/banner-07-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '潮牌新季系列品牌 Banner。黑橙撞色的涂鸦肌理与未来城市夜景构建街头科幻氛围，三人群像叠压 CITY SHIFT 笔刷大字，橙色星形符号贯穿版面，英文标语分区排版呈现完整的品牌视觉系统与街头态度。',
      },
      {
        slug: 'banner-08',
        title: 'Style Edit 新季甄选',
        thumb: '/works/banner/banner-08-thumb.webp',
        cover: '/works/banner/banner-08-cover.webp',
        full: '/works/banner/banner-08-full.webp',
        width: 1672,
        height: 941,
        meta: '2026 · Banner Design',
        year: '2026',
        tools: 'AI 图像生成 + 版式设计',
        description:
          '简约风女装促销 Banner。米白摄影背景上巨号衬线 Style Edit 横贯画面并与人物自然叠压，右侧棕金色促销卡「UP TO 30% OFF」与「新季甄选」形成色彩重心，大面积留白传递 EFFORTLESS 的日常穿搭态度。',
      },
    ],
    projects: [],
  },
  {
    id: 'typography',
    number: '03',
    en: 'TYPOGRAPHY',
    cn: '字体设计',
    path: '/visual/typography',
    icon: '/icons/icon-typography.webp',
    accent: '#9B8BF4',
    concept: '紫蓝色调的立体 Aa 字母雕塑：圆润体块与撞色细节。',
    summary: '中英文字体设计与字体视觉应用，按字形与气质分类。',
    layout: 'display',
    assetTypes: ['字体设定', '字形推演', '字体应用', '动态字效'],
    works: [
      {
        slug: 'type-01',
        title: '把自由写进风里',
        thumb: '/works/typography/type-01-thumb-lg.webp',
        full: '/works/typography/type-01-full.webp',
        width: 1536,
        height: 1024,
        meta: '2026 · Font Design',
        year: '2026',
        tools: 'AI 辅助生成 + 手写书法',
        description:
          '手写书法字体设计。毛笔笔触粗犷奔放，笔画间保留飞白与溅墨质感，红金色水彩笔势与风声、远山、飞鸟呼应「自由 / 热烈 / 力量 / 旅途」的关键词，底部附规范字格与单字结构对照，展示笔触细节、飞白效果与收笔细节三处设计要点。',
      },
      {
        slug: 'type-02',
        title: '晚岸小聚',
        thumb: '/works/typography/type-02-thumb-lg.webp',
        full: '/works/typography/type-02-full.webp',
        width: 1536,
        height: 1024,
        meta: '2026 · Font Design',
        year: '2026',
        tools: 'AI 辅助生成 + 字形设计',
        description:
          '中文现代展示字体设计。字面饱满、笔画带有手写顿笔与飞白，红金渐变铺满笔道并保留纸纹肌理，与湖畔暮色、帆船灯火画面互相呼应「温暖 / 浪漫 / 轻松 / 生活」的气质，配套展示笔画细节、渐变质感、收笔细节与结构韵律四个设计要点。',
      },
      {
        slug: 'type-03',
        title: '森野营地 WiLD',
        thumb: '/works/typography/type-03-thumb-lg.webp',
        full: '/works/typography/type-03-full.webp',
        width: 1536,
        height: 1024,
        meta: '2026 · Font Design',
        year: '2026',
        tools: 'AI 辅助生成 + 字形设计',
        description:
          '创意图形字体设计。笔画以森林绿块面构成，木纹肌理与山形、树冠等自然元素融入字形结构，中英文字标组合排布于山野营地插画之上，传递「活力 / 自然 / 趣味 / 探索」的户外氛围，配套展示自然元素、图形融合与笔画蕴含三处设计要点。',
      },
      {
        slug: 'type-04',
        title: '云岫 YUNXIU',
        thumb: '/works/typography/type-04-thumb-lg.webp',
        full: '/works/typography/type-04-full.webp',
        width: 1536,
        height: 1024,
        meta: '2026 · Font Design',
        year: '2026',
        tools: 'AI 辅助生成 + 字形设计',
        description:
          '现代宋体设计字体。横细竖粗、转折利落，墨绿云纹渐变填充笔道并与青绿山水、银杏与仙鹤画面互文，传递「现代 / 优雅 / 自然 / 诗意」的气质，配套展示横画细节、竖画细节与转折细节三处设计要点。',
      },
    ],
    projects: [],
  },
  {
    id: 'ip-vi',
    number: '04',
    en: 'IP & VI',
    cn: 'IP 设计与 VI 延展',
    path: '/visual/ip-vi',
    icon: '/icons/icon-ip-vi.webp',
    accent: '#F5C463',
    concept: '原创 3D 吉祥物：奶油色小家伙与它的色卡、徽章和 VI 资产。',
    summary: '原创 IP 形象与品牌视觉延展，按 IP 项目组织。',
    layout: 'project',
    assetTypes: ['角色设定', '三视图', '表情', '动作', '服装', 'VI 延展'],
    works: [],
    projects: [
      {
        id: 'bomi',
        name: '波米',
        en: 'BOMI',
        note: '来自云端星球的情绪陪伴智能羊，软萌治愈的云端小伙伴。',
        tagline: '啵一下，坏心情就飞走啦。',
        cover: { src: '/works/ip/bomi-cover-full.webp', thumb: '/works/ip/bomi-cover-thumb.webp', width: 1672, height: 941 },
        groups: [
          { title: '三视图', en: 'TURNAROUND', section: 'character', items: [
            { src: '/works/ip/bomi-views-full.webp', thumb: '/works/ip/bomi-views-thumb.webp', width: 1672, height: 941, title: '波米三视图（正面 / 侧面 / 背面）' },
          ] },
          { title: '服装延展', en: 'COSTUME', section: 'character', items: [
            { src: '/works/ip/bomi-costume-full.webp', thumb: '/works/ip/bomi-costume-thumb.webp', width: 1672, height: 941, title: '波米服装延展（日常 / 运动 / 睡衣 / 冬日 / 雨天 / 探索 / 派对 / 太空）' },
          ] },
          { title: '动作延展', en: 'ACTION', section: 'character', items: [
            { src: '/works/ip/bomi-action-full.webp', thumb: '/works/ip/bomi-action-thumb.webp', width: 1672, height: 941, title: '波米动作延展（招手 / 奔跑 / 跳跃 / 拥抱 / 比心 / 思考 / 睡觉 / 飞行）' },
          ] },
          { title: '表情延展', en: 'EXPRESSION', section: 'character', items: [
            { src: '/works/ip/bomi-expression-full.webp', thumb: '/works/ip/bomi-expression-thumb.webp', width: 1672, height: 941, title: '波米表情延展（开心 / 害羞 / 委屈 / 生气 / 惊讶 / 困困 / 哭哭 / 疑惑 / 爱心）' },
          ] },
          { title: 'VI 延展', en: 'VI EXTENSION', section: 'vi', items: [
            { src: '/works/ip/bomi-vi-full.webp', thumb: '/works/ip/bomi-vi-thumb.webp', width: 1672, height: 941, title: '波米品牌视觉（品牌标识 / 品牌色彩 / 辅助图形 / 应用延展）' },
          ] },
        ],
      },
      {
        id: 'ali',
        name: '阿栗',
        en: 'ALI',
        note: '治愈成长型森林 IP，住在栗果森林里的小果实采集员。',
        tagline: '慢慢长大，也会有好事发生。',
        cover: { src: '/works/ip/ali-cover-full.webp', thumb: '/works/ip/ali-cover-thumb.webp', width: 1672, height: 941 },
        groups: [
          { title: '三视图', en: 'TURNAROUND', section: 'character', items: [
            { src: '/works/ip/ali-views-full.webp', thumb: '/works/ip/ali-views-thumb.webp', width: 1672, height: 941, title: '阿栗三视图（正面 / 侧面 / 背面）' },
          ] },
          { title: '服装延展', en: 'COSTUME', section: 'character', items: [
            { src: '/works/ip/ali-costume-full.webp', thumb: '/works/ip/ali-costume-thumb.webp', width: 1672, height: 941, title: '阿栗 IP 服装延展（日常系列 / 主题系列）' },
          ] },
          { title: '动作延展', en: 'ACTION', section: 'character', items: [
            { src: '/works/ip/ali-action-full.webp', thumb: '/works/ip/ali-action-thumb.webp', width: 1672, height: 941, title: '阿栗动作延展（挥手 / 奔跑 / 跳跃 / 坐下 / 抱栗子 / 散步 / 指路 / 打招呼）' },
          ] },
          { title: '表情延展', en: 'EXPRESSION', section: 'character', items: [
            { src: '/works/ip/ali-expression-full.webp', thumb: '/works/ip/ali-expression-thumb.webp', width: 1672, height: 941, title: '阿栗表情延展（开心 / 害羞 / 惊讶 / 委屈 / 生气 / 思考 / 期待 / 困惑 / 睡意 / 调皮 / 比心）' },
          ] },
          { title: 'VI 延展', en: 'VI EXTENSION', section: 'vi', items: [
            { src: '/works/ip/ali-vi-full.webp', thumb: '/works/ip/ali-vi-thumb.webp', width: 1672, height: 941, title: '阿栗 IP 形象 VI 延展（秋日文创周边展示）' },
          ] },
        ],
      },
    ],
  },
];

/** 十六进制强调色 → 带透明度的 rgba（用于悬停底色等柔和场景） */
export function accentAlpha(accent: string, alpha: number): string {
  const value = accent.replace('#', '');
  if (value.length !== 6) return accent;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 该路径是否为 VISUAL 分类作品页 */
export function findVisualCategory(pathname: string): VisualCategory | undefined {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return VISUAL_CATEGORIES.find((category) => category.path === normalized);
}

/** 解析海报详情路径（/visual/poster/<slug>），返回对应作品；不匹配返回 undefined */
export function findPosterWork(pathname: string): VisualWork | undefined {
  const match = pathname.replace(/\/+$/, '').match(/^\/visual\/poster\/([a-z0-9-]+)$/);
  if (!match) return undefined;
  const poster = VISUAL_CATEGORIES.find((category) => category.id === 'poster');
  return poster?.works.find((work) => work.slug === match[1]);
}

/** 上一篇 / 下一篇海报（按上传顺序循环；海报详情页底部导流用） */
export function siblingPosterWorks(slug: string) {
  const poster = VISUAL_CATEGORIES.find((category) => category.id === 'poster');
  const works = poster?.works ?? [];
  const index = works.findIndex((work) => work.slug === slug);
  const safeIndex = index < 0 ? 0 : index;
  return {
    previous: works[(safeIndex + works.length - 1) % works.length],
    next: works[(safeIndex + 1) % works.length],
  };
}

/** 解析 Banner 详情路径（/banner/<slug>），返回对应作品；不匹配返回 undefined */
export function findBannerWork(pathname: string): VisualWork | undefined {
  const match = pathname.replace(/\/+$/, '').match(/^\/banner\/([a-z0-9-]+)$/);
  if (!match) return undefined;
  const banner = VISUAL_CATEGORIES.find((category) => category.id === 'banner');
  return banner?.works.find((work) => work.slug === match[1]);
}

/** 该路径是否为 Banner 相关路径（列表 / 详情 / 未知详情兜底） */
export function isBannerPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized === '/visual/banner' || normalized.startsWith('/banner');
}

/** IP & VI 分类对象（列表 / 详情共用） */
export function ipViCategory() {
  return VISUAL_CATEGORIES.find((category) => category.id === 'ip-vi');
}

/** 解析 IP 项目详情路径（/ip/<slug>），返回对应项目；不匹配返回 undefined */
export function findIpProject(pathname: string): VisualProject | undefined {
  const match = pathname.replace(/\/+$/, '').match(/^\/ip\/([a-z0-9-]+)$/);
  if (!match) return undefined;
  return ipViCategory()?.projects.find((project) => project.id === match[1]);
}

/** 上一个 / 下一个 IP 项目（按数据顺序循环；详情页底部导流用） */
export function siblingIpProjects(id: string) {
  const projects = ipViCategory()?.projects ?? [];
  const index = projects.findIndex((project) => project.id === id);
  const safeIndex = index < 0 ? 0 : index;
  return {
    previous: projects[(safeIndex + projects.length - 1) % projects.length],
    next: projects[(safeIndex + 1) % projects.length],
  };
}

/** 上一篇 / 下一篇 Banner（按上传顺序循环；Banner 详情页底部导流用） */
export function siblingBannerWorks(slug: string) {
  const banner = VISUAL_CATEGORIES.find((category) => category.id === 'banner');
  const works = banner?.works ?? [];
  const index = works.findIndex((work) => work.slug === slug);
  const safeIndex = index < 0 ? 0 : index;
  return {
    previous: works[(safeIndex + works.length - 1) % works.length],
    next: works[(safeIndex + 1) % works.length],
  };
}

/** 上一个 / 下一个分类（作品页底部互相导流） */
export function siblingCategories(id: VisualCategoryId) {
  const index = VISUAL_CATEGORIES.findIndex((category) => category.id === id);
  return {
    previous: VISUAL_CATEGORIES[(index + VISUAL_CATEGORIES.length - 1) % VISUAL_CATEGORIES.length],
    next: VISUAL_CATEGORIES[(index + 1) % VISUAL_CATEGORIES.length],
  };
}
