/**
 * AI FILM 栏目的作品数据（对应《素材发布规范》第四、五条）。
 *
 * 新增一部作品 = 在 AI_FILM_PROJECTS 里加一条，页面布局不需要改动：
 *  1. 图片先走统一入口转 WebP（保留原图，生成 thumb / full 两档）：
 *     python tools/media/optimize.py 原图.png --category ai-film --preset work --slug film-001-cover
 *     产出 public/works/ai-film/film-001-cover-thumb.webp（600w）与 -full.webp（1920w）；
 *  2. coverUrl 填 -full.webp（组件会按需取，列表用小图时浏览器自行缩放）；
 *  3. assets 填三张制作资产（人物 / 场景 / 道具），缩略图用 -thumb.webp、灯箱用 -full.webp；
 *  4. bilibiliUrl 给 BV 号或完整链接（组件自动提取 BV 号与分 P），不上传视频文件、
 *     不使用第三方解析服务，嵌入受限时回落为「封面 + 前往B站观看」；
 *  5. detail 里只填真实存在的资料，没有就留空数组 / 空字符串 → 详情页显示空状态，
 *     绝不编造剧本、人物或分镜内容。
 */

export type AiFilmCategory = 'anime' | 'live' | 'commercial' | 'short';

export type AiFilmCategoryMeta = {
  id: AiFilmCategory;
  /** 中文名（分类按钮） */
  cn: string;
  /** 英文名（按钮副标 / 详情页眉题） */
  en: string;
};

export const AI_FILM_CATEGORIES: AiFilmCategoryMeta[] = [
  { id: 'anime', cn: 'AI漫剧', en: 'AI COMIC DRAMA' },
  { id: 'live', cn: 'AI真人剧', en: 'AI LIVE DRAMA' },
  { id: 'commercial', cn: 'TVC广告', en: 'TVC COMMERCIAL' },
  { id: 'short', cn: 'AI短片', en: 'AI SHORT FILM' },
];

export type FilmAssetKind = 'character' | 'scene' | 'prop' | 'storyboard';

export type FilmAsset = {
  id: string;
  kind: FilmAssetKind;
  /** 资产名（灯箱标题 / 缩略图 alt） */
  title: string;
  /** 缩略图（WebP，最大宽 600） */
  thumb: string;
  /** 详情浏览图（WebP，最大宽 1920，点击缩略图后按需加载） */
  full: string;
  width: number;
  height: number;
  /** 补充说明（可选） */
  note?: string;
};

/** 详情页自定义资产区块（可选）：TVC 广告等作品用它展示「产品/场景/视觉」等非标准分区 */
export type FilmDetailSection = {
  /** 区块键（渲染 key 与灯箱顺序用） */
  id: string;
  /** 中文标题（如「产品资产」） */
  title: string;
  /** 英文副题（如 "PRODUCT ASSETS"） */
  en: string;
  assets: FilmAsset[];
};

/** 项目详情页内容：没有真实资料就留空，页面自动显示空状态 */
export type FilmDetail = {
  /** 剧本概述 */
  synopsis: string;
  /** 人物设定 */
  characters: FilmAsset[];
  /** 场景设定 */
  scenes: FilmAsset[];
  /** 道具设定 */
  props: FilmAsset[];
  /** 关键分镜 */
  storyboards: FilmAsset[];
  /** 自定义资产区块（可选）：存在且非空时详情页按它渲染 03 起的区块，替代默认的人物/场景/道具三槽 */
  assetSections?: FilmDetailSection[];
};

/** 单集播放源：一部作品可以有上/下集，每集各自的 B 站链接、封面与时长 */
export type FilmEpisode = {
  id: string;
  /** 集名（切换按钮文案，如「上集」「下集」） */
  label: string;
  /** B 站链接或 BV 号（只做官方嵌入，不下载视频） */
  bilibiliUrl: string;
  /** 本集时长（如 "2:13"，可选） */
  duration?: string;
  /** 本集封面（WebP，可选；缺省时回落 project.coverUrl） */
  coverUrl?: string;
};

export type AiFilmProject = {
  id: string;
  /** 作品名 */
  title: string;
  /** 英文名（可选） */
  englishTitle?: string;
  category: AiFilmCategory;
  /** 一句话简介 */
  description: string;
  /** 封面（WebP，留空则显示简洁占位封面，不伪造画面） */
  coverUrl?: string;
  /** B 站链接或 BV 号（单集作品的简化写法；多集作品改用 episodes） */
  bilibiliUrl?: string;
  /** 影片时长（如 "2:13"，可选） */
  duration?: string;
  /** 制作工具（如 "即梦 / Seedance / 剪映"，可选） */
  tools?: string;
  /** 个人负责内容（一句话，可选） */
  myRole?: string;
  /** 多集播放源：存在且非空时播放器显示集数切换 */
  episodes?: FilmEpisode[];
  /** 制作资产缩略图（主体区展示前 3 张） */
  assets: FilmAsset[];
  /** 项目详情页地址：/film/<detailSlug> */
  detailSlug: string;
  detail: FilmDetail;
};

/** 空详情：没有资料时用它，保证详情页结构与空状态一致 */
export const EMPTY_FILM_DETAIL: FilmDetail = {
  synopsis: '',
  characters: [],
  scenes: [],
  props: [],
  storyboards: [],
};

/** 项目详情页路径前缀 */
export const FILM_DETAIL_PREFIX = '/film/';

/**
 * AI 影视作品清单。
 * 目前尚未上传真实影片 → 保持为空，页面显示结构化的空状态（不编造内容）。
 * 上传后按上面的字段补数据即可。
 */
export const AI_FILM_PROJECTS: AiFilmProject[] = [
  {
    id: 'film-001',
    title: '雪灾猎户买妻',
    category: 'anime',
    description:
      '古装雪灾生存题材 AI 漫剧，上、下两集共约 4 分 24 秒。大雪封山的灾年，能听懂动物心声的少女小舞被人牙婆贩卖，寡言猎户陆湛带着巨型黑犬大黑将她买下；嘴硬心软的陆母暗中收留——先婚后爱的暖意在冷灰雪景与暖橙灶火之间生长。',
    episodes: [
      {
        id: 'ep1',
        label: '上集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1YS421Q7hA/',
        duration: '2:13',
        coverUrl: '/works/ai-film/film-001-cover-full.webp',
      },
      {
        id: 'ep2',
        label: '下集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1sr421T7ZX/',
        duration: '2:10',
        coverUrl: '/works/ai-film/film-001-ep2-cover-full.webp',
      },
    ],
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 影视项目策划、角色设计、场景设计、AI 生成及后期剪辑。',
    detailSlug: 'film-001',
    assets: [
      { id: 'a1', kind: 'character', title: '人物资产', thumb: '/works/ai-film/film-001-char-01-thumb.webp', full: '/works/ai-film/film-001-char-01-full.webp', width: 1672, height: 941, note: 'CHARACTER' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/film-001-scene-01-thumb.webp', full: '/works/ai-film/film-001-scene-01-full.webp', width: 1916, height: 821, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'prop', title: '道具资产', thumb: '/works/ai-film/film-001-prop-01-thumb.webp', full: '/works/ai-film/film-001-prop-01-full.webp', width: 1672, height: 941, note: 'PROP' },
    ],
    detail: {
      synopsis:
        '大雪封山、饥荒蔓延。能听懂动物心声的少女小舞被养家以三两银子卖给人牙婆，受尽虐待、将要冻死时，山中猎户陆湛带着巨型黑犬大黑路过。大黑一眼认定小舞是"家里小媳妇"，催促主人救人；陆湛沉默买下她，并警告人牙婆不得再碰她。回到山中小院，陆母表面嫌弃儿子败家、命令天亮送人，暗里却拿出白面、鸡蛋和老山参给小舞补身。嘴硬心软的一家人，就此收留了她。',
      characters: [
        { id: 'c1', kind: 'character', title: '陆湛 · 三视图', thumb: '/works/ai-film/film-001-char-01-thumb.webp', full: '/works/ai-film/film-001-char-01-full.webp', width: 1672, height: 941, note: '寡言强悍的山中猎户' },
        { id: 'c2', kind: 'character', title: '小舞 · 三视图', thumb: '/works/ai-film/film-001-char-02-thumb.webp', full: '/works/ai-film/film-001-char-02-full.webp', width: 1672, height: 941, note: '被卖少女，能听懂动物心声' },
        { id: 'c3', kind: 'character', title: '大黑 · 三视图', thumb: '/works/ai-film/film-001-char-03-thumb.webp', full: '/works/ai-film/film-001-char-03-full.webp', width: 1672, height: 941, note: '巨型黑犬，凶猛外表、话痨内心' },
        { id: 'c4', kind: 'character', title: '陆母 · 三视图', thumb: '/works/ai-film/film-001-char-04-thumb.webp', full: '/works/ai-film/film-001-char-04-full.webp', width: 1672, height: 941, note: '独眼老妇，刀子嘴豆腐心' },
        { id: 'c5', kind: 'character', title: '人牙婆 · 三视图', thumb: '/works/ai-film/film-001-char-05-thumb.webp', full: '/works/ai-film/film-001-char-05-full.webp', width: 1672, height: 941, note: '欺软怕硬的反派' },
        { id: 'c6', kind: 'character', title: '黑羽母鸡 · 三视图', thumb: '/works/ai-film/film-001-char-06-thumb.webp', full: '/works/ai-film/film-001-char-06-full.webp', width: 1672, height: 941, note: '以吐槽 OS 揭穿陆母嘴硬' },
      ],
      scenes: [
        { id: 's1', kind: 'scene', title: '雪镇集市 · 连续性板', thumb: '/works/ai-film/film-001-scene-01-thumb.webp', full: '/works/ai-film/film-001-scene-01-full.webp', width: 1916, height: 821, note: '集市结构、雪量、摊位、主街方向' },
        { id: 's2', kind: 'scene', title: '陆家山院 · 连续性板', thumb: '/works/ai-film/film-001-scene-02-thumb.webp', full: '/works/ai-film/film-001-scene-02-full.webp', width: 1916, height: 821, note: '院落、正屋、鸡窝、灶房、西屋' },
      ],
      props: [
        { id: 'p1', kind: 'prop', title: '关键道具合集', thumb: '/works/ai-film/film-001-prop-01-thumb.webp', full: '/works/ai-film/film-001-prop-01-full.webp', width: 1672, height: 941, note: '银袋、麻绳、项圈、木拐、鸡蛋、药与热面' },
      ],
      storyboards: [],
    },
  },
  {
    id: 'film-002',
    title: '十万块的咖啡店',
    category: 'anime',
    description:
      '都市女性创业题材 AI 漫剧，上、下两集共约 2 分 54 秒。沈清欢在七人饭局上拆穿「七十万开全女咖啡店、三个月回本」的美梦，被嘲笑后带着自己的十万块租下旧铺——用一张租赁合同和一份精算到咖啡机的预算清单，把「准备好当老板」和「准备好干活」分了个明白。',
    episodes: [
      {
        id: 'ep1',
        label: '上集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV16T421z7AA/',
        duration: '1:34',
        coverUrl: '/works/ai-film/film-002-scene-01-full.webp',
      },
      {
        id: 'ep2',
        label: '下集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1iGp46bEA7/',
        duration: '1:20',
        coverUrl: '/works/ai-film/film-002-scene-02-full.webp',
      },
    ],
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 影视项目策划、角色设计、场景设计、AI 生成及后期剪辑。',
    detailSlug: 'film-002',
    assets: [
      { id: 'a1', kind: 'character', title: '人物资产', thumb: '/works/ai-film/film-002-char-02-thumb.webp', full: '/works/ai-film/film-002-char-02-full.webp', width: 1672, height: 941, note: 'CHARACTER' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/film-002-scene-01-thumb.webp', full: '/works/ai-film/film-002-scene-01-full.webp', width: 1672, height: 941, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'prop', title: '道具资产', thumb: '/works/ai-film/film-002-prop-01-thumb.webp', full: '/works/ai-film/film-002-prop-01-full.webp', width: 1086, height: 1448, note: 'PROP' },
    ],
    detail: {
      synopsis:
        '第1集「你们只准备好当老板」：城市烧烤店包间的七人饭局上，众人劝沈清欢加入「一人十万、七十万开全女咖啡店、三个月回本」的计划。沈清欢反问「你们谁会做咖啡」，被指消极、被逼表态后平静离席——「你们没有一个人准备好干活，你们只是准备好当老板」。第2集「十万块怎么花」：次日傍晚，沈清欢独自站上空置旧早餐铺，与房东三万三千六一年一次付清签下租赁合同；随后打开「新店预算清单」逐项精算——咖啡机一万五、磨豆机三千、冰箱两千，「这些都不需要最好的，但都要够用」，最后拿出卷尺丈量门头。别人在谈店，她已经开始干活。',
      characters: [
        { id: 'c1', kind: 'character', title: '沈清欢 · 饭局造型', thumb: '/works/ai-film/film-002-char-01-thumb.webp', full: '/works/ai-film/film-002-char-01-full.webp', width: 941, height: 1672, note: '灰褪色做旧针织上衣与黑色长裤' },
        { id: 'c2', kind: 'character', title: '沈清欢 · 饭局三视图', thumb: '/works/ai-film/film-002-char-02-thumb.webp', full: '/works/ai-film/film-002-char-02-full.webp', width: 1672, height: 941, note: '务实冷静的咖啡师，自带十万块开店' },
        { id: 'c3', kind: 'character', title: '沈清欢 · 看铺造型', thumb: '/works/ai-film/film-002-char-03-thumb.webp', full: '/works/ai-film/film-002-char-03-full.webp', width: 941, height: 1672, note: '浅蓝针织开衫、白色吊带与乳白长裤' },
        { id: 'c4', kind: 'character', title: '沈清欢 · 看铺三视图', thumb: '/works/ai-film/film-002-char-04-thumb.webp', full: '/works/ai-film/film-002-char-04-full.webp', width: 1672, height: 941, note: '压力下语速更慢，姿态很直' },
        { id: 'c5', kind: 'character', title: '梦瑶姐 · 造型', thumb: '/works/ai-film/film-002-char-05-thumb.webp', full: '/works/ai-film/film-002-char-05-full.webp', width: 941, height: 1672, note: '「全女咖啡店」概念发起者' },
        { id: 'c6', kind: 'character', title: '梦瑶姐 · 三视图', thumb: '/works/ai-film/film-002-char-06-thumb.webp', full: '/works/ai-film/film-002-char-06-full.webp', width: 1672, height: 941, note: '擅长讲概念与当老板，对具体劳动没有准备' },
        { id: 'c7', kind: 'character', title: '白色挂脖上衣女 · 造型', thumb: '/works/ai-film/film-002-char-07-thumb.webp', full: '/works/ai-film/film-002-char-07-full.webp', width: 941, height: 1672, note: '金属圆环耳饰，聚会装扮' },
        { id: 'c8', kind: 'character', title: '白色挂脖上衣女 · 三视图', thumb: '/works/ai-film/film-002-char-08-thumb.webp', full: '/works/ai-film/film-002-char-08-full.webp', width: 1672, height: 941, note: '激进支持者，承担群体压力中的攻击性表达' },
        { id: 'c9', kind: 'character', title: '房东 · 造型', thumb: '/works/ai-film/film-002-char-09-thumb.webp', full: '/works/ai-film/film-002-char-09-full.webp', width: 941, height: 1672, note: '深灰 Polo 衫，熟悉街面生意' },
        { id: 'c10', kind: 'character', title: '房东 · 三视图', thumb: '/works/ai-film/film-002-char-10-thumb.webp', full: '/works/ai-film/film-002-char-10-full.webp', width: 1672, height: 941, note: '说话朴实直接，欣赏爽快的租客' },
      ],
      scenes: [
        { id: 's1', kind: 'scene', title: '烧烤店包间', thumb: '/works/ai-film/film-002-scene-01-thumb.webp', full: '/works/ai-film/film-002-scene-01-full.webp', width: 1672, height: 941, note: '第1集七人饭局长桌 · 夜' },
        { id: 's2', kind: 'scene', title: '旧早餐铺外观', thumb: '/works/ai-film/film-002-scene-02-thumb.webp', full: '/works/ai-film/film-002-scene-02-full.webp', width: 1916, height: 821, note: '蓝灰卷帘门与人行道 · 傍晚' },
        { id: 's3', kind: 'scene', title: '旧早餐铺室内', thumb: '/works/ai-film/film-002-scene-03-thumb.webp', full: '/works/ai-film/film-002-scene-03-full.webp', width: 1672, height: 941, note: '空铺、简易吧台与磨旧水泥地' },
      ],
      props: [
        { id: 'p1', kind: 'prop', title: '商铺租赁合同', thumb: '/works/ai-film/film-002-prop-01-thumb.webp', full: '/works/ai-film/film-002-prop-01-full.webp', width: 1086, height: 1448, note: '年租三万三千六，一年一次付清' },
        { id: 'p2', kind: 'prop', title: '新店预算手机', thumb: '/works/ai-film/film-002-prop-02-thumb.webp', full: '/works/ai-film/film-002-prop-02-full.webp', width: 1086, height: 1448, note: '「新店预算清单」备忘录逐项精算' },
        { id: 'p3', kind: 'prop', title: '金属卷尺', thumb: '/works/ai-film/film-002-prop-03-thumb.webp', full: '/works/ai-film/film-002-prop-03-full.webp', width: 1086, height: 1448, note: '丈量门头，开始干活' },
      ],
      storyboards: [],
    },
  },
  {
    id: 'film-003',
    title: '各奔前程',
    category: 'live',
    description:
      '年代重生题材 AI 真人剧，上、下两集共约 1 分 39 秒。1970 年代末北方乡村，新婚夜铁生提出离村做生意——重活一次的王翠柳没有像上辈子那样骂他没出息，而是支持他出去闯，自己留在村里备考高考；面对姐姐的讥讽，她垂眼翻书，暗中追赶。',
    episodes: [
      {
        id: 'ep1',
        label: '上集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1VLp464E2A/',
        duration: '0:58',
        coverUrl: '/works/ai-film/film-003-scene-01-full.webp',
      },
      {
        id: 'ep2',
        label: '下集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV15Lp464Egd/',
        duration: '0:41',
        coverUrl: '/works/ai-film/film-003-scene-02-full.webp',
      },
    ],
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 影视项目策划、角色设计、场景设计、AI 生成及后期剪辑。',
    detailSlug: 'film-003',
    assets: [
      { id: 'a1', kind: 'character', title: '人物资产', thumb: '/works/ai-film/film-003-char-02-thumb.webp', full: '/works/ai-film/film-003-char-02-full.webp', width: 1672, height: 941, note: 'CHARACTER' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/film-003-scene-01-thumb.webp', full: '/works/ai-film/film-003-scene-01-full.webp', width: 1672, height: 941, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'prop', title: '道具资产', thumb: '/works/ai-film/film-003-prop-01-thumb.webp', full: '/works/ai-film/film-003-prop-01-full.webp', width: 1086, height: 1448, note: 'PROP' },
    ],
    detail: {
      synopsis:
        '第1集「新婚夜」：土坯婚房里红烛燃烧、墙上贴着双喜字，王翠柳穿暗红婚服端坐床沿。铁生几次欲言又止，终于开口：「我想离开村里，去外面做生意。你愿意跟我走吗？」王翠柳想起上辈子——她骂他没出息、不务正业，他当晚走了再也没回来。这一次她说「不去」，但要他支持自己留在村里参加高考：「等我考上大学，你想去哪儿，我都陪你。」铁生猛地抬头：「好！我去给你挣学费！」第2集「离别与追赶」：清晨薄雾压着田野，婆婆站在院门内叹「铁生这孩子留不住」，王翠柳只说「娘，让他去吧」，目送他沿土路走进雾里。之后她白天在村仓库整理农具，空闲就取出高中课本自学，夜里在暖灯下演算——有了上一辈子打下的基础，很快找到了学习方法。廊下姐姐讥笑「听说妹妹老公跑了」「你这种人天生就是受穷的命」，她垂眼压住书页，神色克制而坚定：姐姐自以为胜券在握，王翠柳已在暗中追赶。',
      characters: [
        { id: 'c1', kind: 'character', title: '王翠柳 · 工作学习装三视图', thumb: '/works/ai-film/film-003-char-01-thumb.webp', full: '/works/ai-film/film-003-char-01-full.webp', width: 1672, height: 941, note: '浅灰斜襟棉布衫，重活一次的备考人' },
        { id: 'c2', kind: 'character', title: '王翠柳 · 新婚装三视图', thumb: '/works/ai-film/film-003-char-02-thumb.webp', full: '/works/ai-film/film-003-char-02-full.webp', width: 1672, height: 941, note: '暗红婚服，新婚夜端坐床沿' },
        { id: 'c3', kind: 'character', title: '铁生 · 三视图', thumb: '/works/ai-film/film-003-char-03-thumb.webp', full: '/works/ai-film/film-003-char-03-full.webp', width: 1672, height: 941, note: '蓝色劳动装，想出去闯荡做生意' },
        { id: 'c4', kind: 'character', title: '婆婆 · 三视图', thumb: '/works/ai-film/film-003-char-04-thumb.webp', full: '/works/ai-film/film-003-char-04-full.webp', width: 1672, height: 941, note: '深蓝上衣与棕色围裙，院门目送' },
        { id: 'c5', kind: 'character', title: '姐姐 · 三视图', thumb: '/works/ai-film/film-003-char-05-thumb.webp', full: '/works/ai-film/film-003-char-05-full.webp', width: 1672, height: 941, note: '艳红碎花上衣，等着高考完回城' },
      ],
      scenes: [
        { id: 's1', kind: 'scene', title: '土坯新婚房 · 夜', thumb: '/works/ai-film/film-003-scene-01-thumb.webp', full: '/works/ai-film/film-003-scene-01-full.webp', width: 1672, height: 941, note: '红烛、双喜字与暗色土墙' },
        { id: 's2', kind: 'scene', title: '农家院门与雾中土路 · 清晨', thumb: '/works/ai-film/film-003-scene-02-thumb.webp', full: '/works/ai-film/film-003-scene-02-full.webp', width: 1916, height: 821, note: '薄雾压着田野，铁生背影走向土路尽头' },
        { id: 's3', kind: 'scene', title: '村仓库 · 白天', thumb: '/works/ai-film/film-003-scene-03-thumb.webp', full: '/works/ai-film/film-003-scene-03-full.webp', width: 1672, height: 941, note: '斜射阳光里整理农具' },
        { id: 's4', kind: 'scene', title: '简陋夜读桌 · 夜', thumb: '/works/ai-film/film-003-scene-04-thumb.webp', full: '/works/ai-film/film-003-scene-04-full.webp', width: 1672, height: 941, note: '一盏暖灯，课本与演算' },
        { id: 's5', kind: 'scene', title: '仓库院内廊下 · 白天', thumb: '/works/ai-film/film-003-scene-05-thumb.webp', full: '/works/ai-film/film-003-scene-05-full.webp', width: 1672, height: 941, note: '廊柱边读书，与姐姐交锋' },
      ],
      props: [
        { id: 'p1', kind: 'prop', title: '双红婚烛与木烛台', thumb: '/works/ai-film/film-003-prop-01-thumb.webp', full: '/works/ai-film/film-003-prop-01-full.webp', width: 1086, height: 1448, note: '新婚夜前景的暖光来源' },
        { id: 'p2', kind: 'prop', title: '高中教材与练习本', thumb: '/works/ai-film/film-003-prop-02-thumb.webp', full: '/works/ai-film/film-003-prop-02-full.webp', width: 1086, height: 1448, note: '从布包里取出的备考书本' },
        { id: 'p3', kind: 'prop', title: '黑色老式钢笔', thumb: '/works/ai-film/film-003-prop-03-thumb.webp', full: '/works/ai-film/film-003-prop-03-full.webp', width: 1086, height: 1448, note: '灯下快速演算' },
        { id: 'p4', kind: 'prop', title: '长柄四齿铁叉', thumb: '/works/ai-film/film-003-prop-04-thumb.webp', full: '/works/ai-film/film-003-prop-04-full.webp', width: 1086, height: 1448, note: '仓库农具，靠墙扶稳' },
      ],
      storyboards: [],
    },
  },
  {
    id: 'film-004',
    title: '旧味道',
    category: 'live',
    description:
      '写实生活流题材 AI 真人剧，上、下两集共约 4 分 35 秒。送菜十几年的潘嫂被桂芝当街翻了脸，汤馆生意随之一落千丈；大庆摘下「降价17元」的牌子，把汤熬回老味道；暴雨夜雨棚坠落，对门的陈守良舍身把桂芝从坠落区拉了出来。',
    episodes: [
      {
        id: 'ep1',
        label: '上集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1VLp464EaY/',
        duration: '0:43',
        coverUrl: '/works/ai-film/film-004-scene-01-full.webp',
      },
      {
        id: 'ep2',
        label: '下集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV17Mp46wEuB/',
        duration: '3:52',
        coverUrl: '/works/ai-film/film-004-scene-07-full.webp',
      },
    ],
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 影视项目策划、角色设计、场景设计、AI 生成及后期剪辑。',
    detailSlug: 'film-004',
    assets: [
      { id: 'a1', kind: 'character', title: '人物资产', thumb: '/works/ai-film/film-004-char-02-thumb.webp', full: '/works/ai-film/film-004-char-02-full.webp', width: 1672, height: 941, note: 'CHARACTER' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/film-004-scene-01-thumb.webp', full: '/works/ai-film/film-004-scene-01-full.webp', width: 1916, height: 821, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'prop', title: '道具资产', thumb: '/works/ai-film/film-004-prop-01-thumb.webp', full: '/works/ai-film/film-004-prop-01-full.webp', width: 1086, height: 1448, note: 'PROP' },
    ],
    detail: {
      synopsis:
        '第1集「当街翻脸」：老街两家饭馆门口，一捆青菜横在中间。桂芝要潘嫂把菜拿走，话里带刺——「弄得像我舍不得你这捆菜」；送了十多年菜的潘嫂把笑收住，何秀云端着自己订的菜进门：「你们的旧交情你们自己讲，别隔着我的门讲。」一对食客听见争执转身去了前街，桂芝把火撒向潘嫂，索性宣布以后不用她家的菜。第2集「降价反噬 · 找回老味道 · 暴雨救人」：当晚前厅空无一人，大庆转达老客的话——「最近的汤没以前香，肉也薄」；他摘下「降价 17 元」的价牌，决定明天按以前的做：汤熬浓、肉切回原来的厚薄，「老味道回来，总有人愿意进门试一碗」。雨夜风起，雨棚支架的生锈螺钉松脱，桂芝冲出门拽绳，框架轰然坠落的一瞬，骑车的陈守良弃车冲来把她拉开，肩膀被金属边缘擦破、鲜血浸出黑色外套——强硬的桂芝第一次松了脸色。',
      characters: [
        { id: 'c1', kind: 'character', title: '桂芝 · 基础造型', thumb: '/works/ai-film/film-004-char-01-thumb.webp', full: '/works/ai-film/film-004-char-01-full.webp', width: 941, height: 1672, note: '牛肉汤馆老板娘，下颌绷紧、话硬心气高' },
        { id: 'c2', kind: 'character', title: '桂芝 · 设定板', thumb: '/works/ai-film/film-004-char-02-thumb.webp', full: '/works/ai-film/film-004-char-02-full.webp', width: 1672, height: 941, note: '角色设定与服装' },
        { id: 'c3', kind: 'character', title: '大庆 · 基础造型', thumb: '/works/ai-film/film-004-char-03-thumb.webp', full: '/works/ai-film/film-004-char-03-full.webp', width: 941, height: 1672, note: '桂芝丈夫，守着后厨与汤锅，务实' },
        { id: 'c4', kind: 'character', title: '大庆 · 设定板', thumb: '/works/ai-film/film-004-char-04-thumb.webp', full: '/works/ai-film/film-004-char-04-full.webp', width: 1672, height: 941, note: '角色设定与服装' },
        { id: 'c5', kind: 'character', title: '潘嫂 · 基础造型', thumb: '/works/ai-film/film-004-char-05-thumb.webp', full: '/works/ai-film/film-004-char-05-full.webp', width: 941, height: 1672, note: '送了十几年菜的菜贩，笑慢慢收住' },
        { id: 'c6', kind: 'character', title: '潘嫂 · 设定板', thumb: '/works/ai-film/film-004-char-06-thumb.webp', full: '/works/ai-film/film-004-char-06-full.webp', width: 1672, height: 941, note: '角色设定与服装' },
        { id: 'c7', kind: 'character', title: '何秀云 · 基础造型', thumb: '/works/ai-film/film-004-char-07-thumb.webp', full: '/works/ai-film/film-004-char-07-full.webp', width: 941, height: 1672, note: '对门新开炖菜馆的店主' },
        { id: 'c8', kind: 'character', title: '何秀云 · 设定板', thumb: '/works/ai-film/film-004-char-08-thumb.webp', full: '/works/ai-film/film-004-char-08-full.webp', width: 1672, height: 941, note: '角色设定与服装' },
        { id: 'c9', kind: 'character', title: '陈守良 · 基础造型', thumb: '/works/ai-film/film-004-char-09-thumb.webp', full: '/works/ai-film/film-004-char-09-full.webp', width: 941, height: 1672, note: '雨夜弃车冲来救人的骑车人' },
        { id: 'c10', kind: 'character', title: '陈守良 · 设定板', thumb: '/works/ai-film/film-004-char-10-thumb.webp', full: '/works/ai-film/film-004-char-10-full.webp', width: 1672, height: 941, note: '角色设定与服装' },
        { id: 'c11', kind: 'character', title: '桂芝 · 雨夜状态', thumb: '/works/ai-film/film-004-char-11-thumb.webp', full: '/works/ai-film/film-004-char-11-full.webp', width: 941, height: 1672, note: '暴雨夜拽绳，惊魂未定' },
        { id: 'c12', kind: 'character', title: '陈守良 · 受伤状态', thumb: '/works/ai-film/film-004-char-12-thumb.webp', full: '/works/ai-film/film-004-char-12-full.webp', width: 941, height: 1672, note: '肩膀被金属边缘擦破，血浸出黑色外套' },
      ],
      scenes: [
        { id: 's1', kind: 'scene', title: '老街双店 · 外观', thumb: '/works/ai-film/film-004-scene-01-thumb.webp', full: '/works/ai-film/film-004-scene-01-full.webp', width: 1916, height: 821, note: '秀云炖菜馆与桂芝牛肉汤馆比邻 · 日' },
        { id: 's2', kind: 'scene', title: '双店 · 户型骨架', thumb: '/works/ai-film/film-004-scene-02-thumb.webp', full: '/works/ai-film/film-004-scene-02-full.webp', width: 1672, height: 941, note: '两家店的空间结构' },
        { id: 's3', kind: 'scene', title: '桂芝汤馆 · 前厅', thumb: '/works/ai-film/film-004-scene-03-thumb.webp', full: '/works/ai-film/film-004-scene-03-full.webp', width: 1672, height: 941, note: '营业时间后空无一人的前厅 · 夜' },
        { id: 's4', kind: 'scene', title: '桂芝汤馆 · 后厨', thumb: '/works/ai-film/film-004-scene-04-thumb.webp', full: '/works/ai-film/film-004-scene-04-full.webp', width: 1672, height: 941, note: '热气漂出的大锅与切肉案 · 夜' },
        { id: 's5', kind: 'scene', title: '老街 · 雨夜', thumb: '/works/ai-film/film-004-scene-05-thumb.webp', full: '/works/ai-film/film-004-scene-05-full.webp', width: 1916, height: 821, note: '暴雨骤然倾下的街道' },
        { id: 's6', kind: 'scene', title: '老街 · 雨夜（另一氛围）', thumb: '/works/ai-film/film-004-scene-06-thumb.webp', full: '/works/ai-film/film-004-scene-06-full.webp', width: 1916, height: 821, note: '雨夜街面反光与灯光' },
        { id: 's7', kind: 'scene', title: '雨棚坠落 · 事件', thumb: '/works/ai-film/film-004-scene-07-thumb.webp', full: '/works/ai-film/film-004-scene-07-full.webp', width: 1916, height: 821, note: '门头雨棚轰然坠落后' },
        { id: 's8', kind: 'scene', title: '雨棚坠落 · 事件（另一角度）', thumb: '/works/ai-film/film-004-scene-08-thumb.webp', full: '/works/ai-film/film-004-scene-08-full.webp', width: 1916, height: 821, note: '坠落铁架与湿漉街面' },
      ],
      props: [
        { id: 'p1', kind: 'prop', title: '青菜', thumb: '/works/ai-film/film-004-prop-01-thumb.webp', full: '/works/ai-film/film-004-prop-01-full.webp', width: 1086, height: 1448, note: '横在两家店中间的那捆青菜' },
        { id: 'p2', kind: 'prop', title: '送菜三轮车', thumb: '/works/ai-film/film-004-prop-02-thumb.webp', full: '/works/ai-film/film-004-prop-02-full.webp', width: 1086, height: 1448, note: '潘嫂送了十几年的车' },
        { id: 'p3', kind: 'prop', title: '降价牌', thumb: '/works/ai-film/film-004-prop-03-thumb.webp', full: '/works/ai-film/film-004-prop-03-full.webp', width: 1086, height: 1448, note: '「降价 17 元」，大庆当晚摘下' },
        { id: 'p4', kind: 'prop', title: '汤锅', thumb: '/works/ai-film/film-004-prop-04-thumb.webp', full: '/works/ai-film/film-004-prop-04-full.webp', width: 1086, height: 1448, note: '倒掉旧汤、洗净重熬的不锈钢大锅' },
        { id: 'p5', kind: 'prop', title: '小菜缸', thumb: '/works/ai-film/film-004-prop-05-thumb.webp', full: '/works/ai-film/film-004-prop-05-full.webp', width: 1086, height: 1448, note: '照以前给客人装的小菜' },
        { id: 'p6', kind: 'prop', title: '备料', thumb: '/works/ai-film/film-004-prop-06-thumb.webp', full: '/works/ai-film/film-004-prop-06-full.webp', width: 1086, height: 1448, note: '切回原来厚度的牛肉' },
        { id: 'p7', kind: 'prop', title: '雨棚机构', thumb: '/works/ai-film/film-004-prop-07-thumb.webp', full: '/works/ai-film/film-004-prop-07-full.webp', width: 1086, height: 1448, note: '生锈螺钉松脱的支架与铁绳' },
        { id: 'p8', kind: 'prop', title: '自行车', thumb: '/works/ai-film/film-004-prop-08-thumb.webp', full: '/works/ai-film/film-004-prop-08-full.webp', width: 1086, height: 1448, note: '陈守良弃车冲来的那辆车' },
      ],
      storyboards: [],
    },
  },
  {
    id: 'film-005',
    title: 'C&L Creative Studio',
    englishTitle: 'AI LIVE DRAMA SHORT',
    category: 'live',
    description:
      '西方都市情感题材 AI 真人短剧（英文对白），上、下两集共约 1 分 58 秒。重逢后 Claire 坦白自己意外怀孕、婚约取消，试图推开旧爱 Logan；Logan 毫不犹豫说出「我娶你」，并留下以两人名字共同命名的工作室名片。Claire 最终走进 C&L Creative Studio，在「明天开业见」的约定里重新面对这段关系。',
    episodes: [
      {
        id: 'ep1',
        label: '上集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1pBp46rEy9/',
        duration: '0:50',
        coverUrl: '/works/ai-film/film-005-ep1-cover-full.webp',
      },
      {
        id: 'ep2',
        label: '下集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1gHp46pEXo/',
        duration: '1:08',
        coverUrl: '/works/ai-film/film-005-ep2-cover-full.webp',
      },
    ],
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 影视项目策划、角色设计、场景设计、AI 生成及后期剪辑。',
    detailSlug: 'film-005',
    assets: [
      { id: 'a1', kind: 'character', title: '人物资产', thumb: '/works/ai-film/film-005-char-01-thumb.webp', full: '/works/ai-film/film-005-char-01-full.webp', width: 1536, height: 1024, note: 'CHARACTER' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/film-005-scene-02-thumb.webp', full: '/works/ai-film/film-005-scene-02-full.webp', width: 941, height: 1672, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'prop', title: '道具资产', thumb: '/works/ai-film/film-005-prop-01-thumb.webp', full: '/works/ai-film/film-005-prop-01-full.webp', width: 1536, height: 1024, note: 'PROP' },
    ],
    detail: {
      synopsis:
        '第1集「庭院重逢」：金色夕阳落在私家庭院的石板路上，Claire 与旧爱 Logan 面对面站立。她克制地说「我已经不是从前的 Claire 了」，坦白自己怀孕、婚约也已取消，让他去过自己的生活；Logan 拼起真相后没有后退——「我娶你。只要你愿意嫁给我，其他都不重要。」他从裤袋取出奶油白名片递给她：C&L Creative Studio，他的电话和工作室地址。第2集「C&L Creative Studio」：次日傍晚，Claire 手持名片来到工作室门前，抬头看见门楣上两人名字共同命名的招牌——「这么多年过去了，没想到他还用我们两个人的名字给工作室命名」。Logan 快步迎出：「那就嫁给我。一切都按你的方式来。」他带她穿过圆拱走廊参观次日即将开业的空间，旧日默契重新出现——「既然我未来的妻子都认可了，我今晚大概会兴奋得睡不着」。Claire 笑他一点没变；Logan 认真邀请她明天一定到场。两人在「明天见」的约定中暂时分别，Logan 独自留在暖光里，垂眼收住笑意。',
      characters: [
        { id: 'c1', kind: 'character', title: 'Claire · 三视图', thumb: '/works/ai-film/film-005-char-01-thumb.webp', full: '/works/ai-film/film-005-char-01-full.webp', width: 1536, height: 1024, note: '长而微卷的深棕发，黑色挂脖连体短裤、宽腰带与棕色踝靴' },
        { id: 'c2', kind: 'character', title: 'Logan · 三视图', thumb: '/works/ai-film/film-005-char-02-thumb.webp', full: '/works/ai-film/film-005-char-02-full.webp', width: 1536, height: 1024, note: '浅棕卷发灰蓝眼睛，酒红开领衬衫与黑色阔腿裤' },
      ],
      scenes: [
        { id: 's1', kind: 'scene', title: '私家庭院 · 傍晚', thumb: '/works/ai-film/film-005-scene-01-thumb.webp', full: '/works/ai-film/film-005-scene-01-full.webp', width: 941, height: 1672, note: '金色夕阳下的石板路、黑木亭屋与暖光地灯' },
        { id: 's2', kind: 'scene', title: '工作室 · 外观', thumb: '/works/ai-film/film-005-scene-02-thumb.webp', full: '/works/ai-film/film-005-scene-02-full.webp', width: 941, height: 1672, note: '奶油色灰泥立面、黑框拱门、白石台阶与 C&L 门楣' },
        { id: 's3', kind: 'scene', title: '工作室 · 内景', thumb: '/works/ai-film/film-005-scene-03-thumb.webp', full: '/works/ai-film/film-005-scene-03-full.webp', width: 938, height: 1676, note: '暖奶油微水泥墙、连续圆拱与隐藏灯带' },
      ],
      props: [
        { id: 'p1', kind: 'prop', title: 'C&L 名片道具板', thumb: '/works/ai-film/film-005-prop-01-thumb.webp', full: '/works/ai-film/film-005-prop-01-full.webp', width: 1536, height: 1024, note: '奶油白厚卡纸、黑色几何块设计，Logan 留给 Claire 的联系方式' },
      ],
      storyboards: [],
    },
  },
  {
    id: 'film-006',
    title: 'Daisy 找妈妈',
    englishTitle: 'AI LIVE DRAMA SHORT',
    category: 'live',
    description:
      '西方家庭伦理题材 AI 真人短剧（英文对白），上、下两集共约 3 分 11 秒。外婆病逝后，7 岁的 Daisy 抱着一只灰色瓷罐、带着地址纸条千里寻母，却被继父 Mark 当街驱赶；被勉强收留的一晚，她只能蹲在鞋柜旁吃饭，玄关里放下的瓷罐引出全片悬念。',
    episodes: [
      {
        id: 'ep1',
        label: '上集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1hHp46pE1w/',
        duration: '1:25',
        coverUrl: '/works/ai-film/film-006-ep1-cover-full.webp',
      },
      {
        id: 'ep2',
        label: '下集',
        bilibiliUrl: 'https://www.bilibili.com/video/BV1hHp46pEGb/',
        duration: '1:46',
        coverUrl: '/works/ai-film/film-006-ep2-cover-full.webp',
      },
    ],
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 影视项目策划、角色设计、场景设计、AI 生成及后期剪辑。',
    detailSlug: 'film-006',
    assets: [
      { id: 'a1', kind: 'character', title: '人物资产', thumb: '/works/ai-film/film-006-char-01-thumb.webp', full: '/works/ai-film/film-006-char-01-full.webp', width: 1672, height: 941, note: 'CHARACTER' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/film-006-scene-03-thumb.webp', full: '/works/ai-film/film-006-scene-03-full.webp', width: 1916, height: 821, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'prop', title: '道具资产', thumb: '/works/ai-film/film-006-prop-01-thumb.webp', full: '/works/ai-film/film-006-prop-01-full.webp', width: 1672, height: 941, note: 'PROP' },
    ],
    detail: {
      synopsis:
        '第1集「找妈妈」：昏暗木屋里，外婆虚弱地把藏地址的抽屉指给 Daisy——「Daisy, do you want to go find your mom?」女孩抱紧她承诺「We\'ll never be apart again」，随后背包挎罐，独自走上深秋的乡间泥路。傍晚，她拿着皱折的纸条向公寓门卫问路：「I\'m looking for my mom.」楼前，Linda 正拥抱儿子 Ben，丈夫 Mark 拎着购物袋走来——一家三口其乐融融。Linda 看见 Daisy，震惊又心虚；Mark 冷冷开口：「Is this the brat you had with your ex-husband?」Daisy 直视他：「Don\'t call me brat. My name is Daisy.」换来的却是当街驱赶。她说外婆已经走了、父亲不知所踪，Mark 断然拒绝她进家门，画面停在 Linda 痛苦的脸上。第2集「只准住一晚」：Linda 求情「天快黑了，一个小女孩能去哪」，Mark 勉强松口——「Fine, just one night.」屋里 Ben 举着玩具飞机满地跑，Daisy 却被禁止上桌，只能蹲在鞋柜旁吃那碗白饭。餐桌上 Mark 兴奋盘算着与 Whitmore Group 的合作，Daisy 小声说「Mom, I want meat too」，没有人回应她。饭后她默默收拢布袋，从里面抱出那只灰色带盖瓷罐，轻轻放到地板上——Mark 猛然起身：「Wait a second. What is that thing?」切黑。',
      characters: [
        { id: 'c1', kind: 'character', title: 'Daisy · 三视图', thumb: '/works/ai-film/film-006-char-01-thumb.webp', full: '/works/ai-film/film-006-char-01-full.webp', width: 1672, height: 941, note: '7 岁女孩，深金棕长发配左侧暗红蝴蝶结，米色碎花旧裙与棕紫连帽夹克，脸上带雀斑和尘土' },
        { id: 'c2', kind: 'character', title: 'Linda Blake · 三视图', thumb: '/works/ai-film/film-006-char-02-thumb.webp', full: '/works/ai-film/film-006-char-02-full.webp', width: 1672, height: 941, note: 'Daisy 生母，栗棕长卷发焦糖挑染，驼色双排扣风衣、白上衣与深色牛仔裤' },
        { id: 'c3', kind: 'character', title: 'Mark Riley · 三视图', thumb: '/works/ai-film/film-006-char-03-thumb.webp', full: '/works/ai-film/film-006-char-03-full.webp', width: 1672, height: 941, note: 'Linda 现任丈夫，强烈排斥 Daisy；后梳黑发，藏蓝夹克配浅灰 Polo' },
        { id: 'c4', kind: 'character', title: 'Ben · 三视图', thumb: '/works/ai-film/film-006-char-04-thumb.webp', full: '/works/ai-film/film-006-char-04-full.webp', width: 1672, height: 941, note: 'Linda 与 Mark 的幼子，约 5 岁，浅蓝绗缝马甲与海军蓝条纹长袖' },
        { id: 'c5', kind: 'character', title: '公寓门卫 · 三视图', thumb: '/works/ai-film/film-006-char-05-thumb.webp', full: '/works/ai-film/film-006-char-05-full.webp', width: 1672, height: 941, note: '约 55 岁，浅蓝制服衬衣与深蓝夹克，腰间对讲机袋，为 Daisy 核对地址' },
        { id: 'c6', kind: 'character', title: '外婆 · 三视图', thumb: '/works/ai-film/film-006-char-06-thumb.webp', full: '/works/ai-film/film-006-char-06-full.webp', width: 1672, height: 941, note: 'Daisy 的主要照料者，开场病逝；深褐针织开衫与旧灰褐长裙，衰弱驼背' },
      ],
      scenes: [
        { id: 's1', kind: 'scene', title: '乡间泥路', thumb: '/works/ai-film/film-006-scene-01-thumb.webp', full: '/works/ai-film/film-006-scene-01-full.webp', width: 1916, height: 821, note: '深秋雨后的泥泞弯路，落叶、野草与矮石墙，Daisy 独自上路的起点' },
        { id: 's2', kind: 'scene', title: '外婆木屋 · 卧室', thumb: '/works/ai-film/film-006-scene-02-thumb.webp', full: '/works/ai-film/film-006-scene-02-full.webp', width: 1672, height: 941, note: '老旧竖向松木板墙的极小卧室，暖壁灯混冷窗光，外婆病逝的房间' },
        { id: 's3', kind: 'scene', title: '公寓社区 · 入口', thumb: '/works/ai-film/film-006-scene-03-thumb.webp', full: '/works/ai-film/film-006-scene-03-full.webp', width: 1916, height: 821, note: '米色灰泥与红砖公寓，傍晚金色侧光，Daisy 问路与母女重逢的地方' },
        { id: 's4', kind: 'scene', title: 'Linda 家 · 客餐厅与玄关', thumb: '/works/ai-film/film-006-scene-04-thumb.webp', full: '/works/ai-film/film-006-scene-04-full.webp', width: 1672, height: 941, note: '3000K 暖灯下的客餐厅玄关一体空间，餐桌与鞋凳的距离构成空间排斥' },
      ],
      props: [
        { id: 'p1', kind: 'prop', title: '故事道具总板', thumb: '/works/ai-film/film-006-prop-01-thumb.webp', full: '/works/ai-film/film-006-prop-01-full.webp', width: 1672, height: 941, note: '灰色带盖瓷罐、抽绳布袋、超大旧背包、地址纸条与 Ben 的玩具飞机——贯穿全片的关键物件' },
      ],
      storyboards: [],
    },
  },
  {
    id: 'tvc-001',
    title: 'PEACH 桃味气泡水',
    englishTitle: 'AI TVC ADVERTISEMENT',
    category: 'commercial',
    description:
      'AI 商业广告（无对白，电子流行配乐），时长约 26 秒。冰镇桃味气泡水从冰、水与桃果中「诞生」，穿粉色运动装的少女把产品递向镜头，滑板、街舞与碰罐串起青春释放，最终回到冰晶上的英雄产品与 PEACH — SPARKLING WATER 落版。',
    bilibiliUrl: 'https://www.bilibili.com/video/BV17Mp46wETE/',
    duration: '0:26',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 广告创意策划、视觉设计、AI 画面生成、视频剪辑与后期制作。',
    coverUrl: '/works/ai-film/tvc-001-cover-full.webp',
    detailSlug: 'tvc-001',
    assets: [
      { id: 'a1', kind: 'prop', title: '产品资产', thumb: '/works/ai-film/tvc-001-product-01-thumb.webp', full: '/works/ai-film/tvc-001-product-01-full.webp', width: 1086, height: 1448, note: 'PRODUCT' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/tvc-001-env-01-thumb.webp', full: '/works/ai-film/tvc-001-env-01-full.webp', width: 1672, height: 941, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'character', title: '视觉素材', thumb: '/works/ai-film/tvc-001-visual-01-thumb.webp', full: '/works/ai-film/tvc-001-visual-01-full.webp', width: 1672, height: 941, note: 'VISUAL' },
    ],
    detail: {
      synopsis:
        '一只覆满冷凝水的粉色细长罐从冰与水的粉色世界中醒来：水滴砸出透明水冠，鲜桃被水环包裹，桃片、冰块与罐体在轻盈的失重感中旋转。拉环开启，气泡和桃香在视觉上爆发。夕阳下，穿粉色运动夹克的少女把产品递向镜头；滑板轮掠过广场，青年们在玻璃建筑前跳舞、碰罐；粉色霓虹连廊里她仰头畅饮，清爽感在水花、冰块与桃果的高速蒙太奇中释放。最后，产品悬浮于冰晶与白雾之上，桃果和水珠环绕，落定在「PEACH — SPARKLING WATER」的英雄画面。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'product',
          title: '产品资产',
          en: 'PRODUCT ASSETS',
          assets: [
            { id: 'pd1', kind: 'prop', title: '桃味气泡水罐', thumb: '/works/ai-film/tvc-001-product-01-thumb.webp', full: '/works/ai-film/tvc-001-product-01-full.webp', width: 1086, height: 1448, note: '330ml 粉色细长铝罐，正面 PEACH / SPARKLING WATER 包装，冷凝水珠覆盖' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '粉色产品棚', thumb: '/works/ai-film/tvc-001-env-01-thumb.webp', full: '/works/ai-film/tvc-001-env-01-full.webp', width: 1672, height: 941, note: '桃粉渐变背光、透明冰台与冷雾——产品觉醒与尾版的空间' },
            { id: 'e2', kind: 'scene', title: '城市滑板广场', thumb: '/works/ai-film/tvc-001-env-02-thumb.webp', full: '/works/ai-film/tvc-001-env-02-full.webp', width: 1916, height: 821, note: '夕阳步道、玻璃建筑与开阔广场——青春生活段的外景' },
            { id: 'e3', kind: 'scene', title: '粉色霓虹连廊', thumb: '/works/ai-film/tvc-001-env-03-thumb.webp', full: '/works/ai-film/tvc-001-env-03-full.webp', width: 1672, height: 941, note: '顶部粉色线性灯带向背景汇聚——夜间饮用爽点段' },
          ],
        },
        {
          id: 'visual',
          title: '视觉素材',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: '女主角 · 三视图', thumb: '/works/ai-film/tvc-001-visual-01-thumb.webp', full: '/works/ai-film/tvc-001-visual-01-full.webp', width: 1672, height: 941, note: '粉色短夹克、浅粉上衣与浅灰宽松长裤——产品与观众之间的情绪接口' },
            { id: 'v2', kind: 'character', title: '滑板青年 · 三视图', thumb: '/works/ai-film/tvc-001-visual-02-thumb.webp', full: '/works/ai-film/tvc-001-visual-02-full.webp', width: 1672, height: 941, note: '深青短夹克、白 T 与宽松牛仔裤——承担速度与街头感' },
          ],
        },
      ],
    },
  },
  {
    id: 'tvc-002',
    title: 'Coco-lala：夏日冰爽一口',
    englishTitle: 'AI TVC ADVERTISEMENT',
    category: 'commercial',
    description:
      'AI 商业广告（无对白，热带电子配乐），时长约 19 秒。蓝绿配色的 Coco-lala 青柠气泡饮料在热带绿植与冰水水花中登场，青柠、红果与冰块环绕罐体旋转；男性畅饮后满足微笑，越南语动效文案与品牌字「CoCo-Lala」收束。',
    bilibiliUrl: 'https://www.bilibili.com/video/BV17Mp46wELy/',
    duration: '0:19',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 广告创意策划、视觉设计、AI 画面生成、视频剪辑与后期制作。',
    coverUrl: '/works/ai-film/tvc-002-cover-full.webp',
    detailSlug: 'tvc-002',
    assets: [
      { id: 'a1', kind: 'prop', title: '产品资产', thumb: '/works/ai-film/tvc-002-product-01-thumb.webp', full: '/works/ai-film/tvc-002-product-01-full.webp', width: 1672, height: 941, note: 'PRODUCT' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/tvc-002-env-01-thumb.webp', full: '/works/ai-film/tvc-002-env-01-full.webp', width: 941, height: 1672, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'character', title: '视觉素材', thumb: '/works/ai-film/tvc-002-visual-01-thumb.webp', full: '/works/ai-film/tvc-002-visual-01-full.webp', width: 1672, height: 941, note: 'VISUAL' },
    ],
    detail: {
      synopsis:
        '热带绿植被阳光打亮，灰色石台上，一罐蓝绿配色的 Coco-lala 青柠饮料凝满水珠。罐后冷水炸开，青柠、红色果肉与冰块从画面两侧飞入，围绕罐体旋转、碰撞、飞溅；果肉与水流形成旋涡式转场，进入更冷更蓝的冰水空间。一只手伸入水中稳稳抓住罐身，年轻男性仰头大口饮下，水流与冰块像夏日降温的冲击从画面周围掠过。他放下罐子闭眼微笑，青柠、水滴和冰块悬浮在前后景，品牌字「CoCo-Lala」居中收束。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'product',
          title: '产品资产',
          en: 'PRODUCT ASSETS',
          assets: [
            { id: 'pd1', kind: 'prop', title: 'Coco-lala 罐体转面板', thumb: '/works/ai-film/tvc-002-product-01-thumb.webp', full: '/works/ai-film/tvc-002-product-01-full.webp', width: 1672, height: 941, note: '正面、3/4、侧面、背面与顶部五视图——蓝绿包装、青柠主图与冷凝水' },
            { id: 'pd2', kind: 'prop', title: '果肉冰块道具板', thumb: '/works/ai-film/tvc-002-product-02-thumb.webp', full: '/works/ai-film/tvc-002-product-02-full.webp', width: 1672, height: 941, note: '青柠、红色果肉、透明冰块与水花形态——红绿互补的清爽感来源' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '热带绿植石台', thumb: '/works/ai-film/tvc-002-env-01-thumb.webp', full: '/works/ai-film/tvc-002-env-01-full.webp', width: 941, height: 1672, note: '湿润灰色石台与深绿热带阔叶背景——产品英雄位的空场景' },
          ],
        },
        {
          id: 'visual',
          title: '视觉素材',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: '男性饮用者 · 三视图', thumb: '/works/ai-film/tvc-002-visual-01-thumb.webp', full: '/works/ai-film/tvc-002-visual-01-full.webp', width: 1672, height: 941, note: '炭灰色圆领 T 恤、短深棕发与轻胡茬——产品体验的可信反馈者' },
          ],
        },
      ],
    },
  },
  {
    id: 'tvc-003',
    title: 'TYOOO coffee：从产地到杯中',
    englishTitle: 'AI TVC ADVERTISEMENT',
    category: 'commercial',
    description:
      'AI 商业广告（无对白），时长约 39 秒。一颗咖啡果从晨光中的高山种植园被摘下，经水洗、烘焙、研磨与萃取，最终成为咖啡师闻香品味的一杯；绿色包装与 TYOOO coffee 品牌落版收束「自然来源—专业工艺—感官愉悦」。',
    bilibiliUrl: 'https://www.bilibili.com/video/BV17Mp46wEjL/',
    duration: '0:39',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 广告创意策划、视觉设计、AI 画面生成、视频剪辑与后期制作。',
    coverUrl: '/works/ai-film/tvc-003-cover-full.webp',
    detailSlug: 'tvc-003',
    assets: [
      { id: 'a1', kind: 'prop', title: '产品资产', thumb: '/works/ai-film/tvc-003-product-01-thumb.webp', full: '/works/ai-film/tvc-003-product-01-full.webp', width: 1086, height: 1448, note: 'PRODUCT' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/tvc-003-env-01-thumb.webp', full: '/works/ai-film/tvc-003-env-01-full.webp', width: 1916, height: 821, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'character', title: '视觉素材', thumb: '/works/ai-film/tvc-003-visual-01-thumb.webp', full: '/works/ai-film/tvc-003-visual-01-full.webp', width: 1672, height: 941, note: 'VISUAL' },
    ],
    detail: {
      synopsis:
        '晨光中的高山咖啡园，云隙光扫过起伏的种植园，一颗挂满露珠的成熟咖啡果被指尖轻轻摘下。咖啡果落入流动清水，青绿生豆倾入金属烘焙机，在暖色侧光中翻滚转深，个别豆粒跃离豆堆、悬浮于暗色背景。磨豆机刀盘高速旋转，热水细流注入滤纸，粉床膨胀冒出细密气泡，浓缩咖啡凝聚成一颗琥珀色液滴落下。咖啡馆的暖光里，咖啡师闭眼闻香，果香与坚果香气化作杯口环绕的手绘图标；两袋绿色咖啡包装立于咖啡机前，「TYOOO coffee」品牌字样落定。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'product',
          title: '产品资产',
          en: 'PRODUCT ASSETS',
          assets: [
            { id: 'pd1', kind: 'prop', title: '成熟咖啡果枝', thumb: '/works/ai-film/tvc-003-product-01-thumb.webp', full: '/works/ai-film/tvc-003-product-01-full.webp', width: 1086, height: 1448, note: '红绿相间的成熟咖啡果挂枝，露珠高光——「自然来源」的起点' },
            { id: 'pd2', kind: 'prop', title: '绿色咖啡包装', thumb: '/works/ai-film/tvc-003-product-02-thumb.webp', full: '/works/ai-film/tvc-003-product-02-full.webp', width: 1086, height: 1448, note: '品牌落版段立于咖啡机前的绿色包装袋' },
            { id: 'pd3', kind: 'prop', title: '透明品鉴杯', thumb: '/works/ai-film/tvc-003-product-03-thumb.webp', full: '/works/ai-film/tvc-003-product-03-full.webp', width: 1086, height: 1448, note: '萃取终点——暖色光在液面与杯壁上流动' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '高山咖啡园 · 清晨', thumb: '/works/ai-film/tvc-003-env-01-thumb.webp', full: '/works/ai-film/tvc-003-env-01-full.webp', width: 1916, height: 821, note: '雨后湿润、逆光云隙——采摘段的航拍空间' },
            { id: 'e2', kind: 'scene', title: '烘焙工坊 · 暖光', thumb: '/works/ai-film/tvc-003-env-02-thumb.webp', full: '/works/ai-film/tvc-003-env-02-full.webp', width: 1672, height: 941, note: '暖色低照度——生豆转深、豆粒跃起的地方' },
            { id: 'e3', kind: 'scene', title: '咖啡馆吧台 · 日间', thumb: '/works/ai-film/tvc-003-env-03-thumb.webp', full: '/works/ai-film/tvc-003-env-03-full.webp', width: 1672, height: 941, note: '日间暖光——闻香品鉴与品牌收束的空间' },
          ],
        },
        {
          id: 'visual',
          title: '视觉素材',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: '咖啡师 · 三视图', thumb: '/works/ai-film/tvc-003-visual-01-thumb.webp', full: '/works/ai-film/tvc-003-visual-01-full.webp', width: 1672, height: 941, note: '年轻东亚男性，闭眼闻香时的轻微满足笑意——感官愉悦的落点' },
            { id: 'v2', kind: 'character', title: '高地采摘者 · 三视图', thumb: '/works/ai-film/tvc-003-visual-02-thumb.webp', full: '/works/ai-film/tvc-003-visual-02-full.webp', width: 1672, height: 941, note: '正片仅露手部，完整造型为导演提案' },
          ],
        },
      ],
    },
  },
  {
    id: 'tvc-004',
    title: '一滴水的奇幻旅程',
    englishTitle: 'AI TVC ADVERTISEMENT',
    category: 'commercial',
    description:
      '3D 概念瓶装水广告（无对白），时长约 32 秒。镜头像一颗水珠，乘着粉红色过山车穿越水的微观世界——水隧道、冰晶峡谷、瓶装水工厂城市与粉晶洞穴，最终一颗完美水滴落回瓶口，回到暖金逆光的产品英雄镜头。',
    bilibiliUrl: 'https://www.bilibili.com/video/BV1BKp46YE1u/',
    duration: '0:32',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 广告创意策划、视觉设计、AI 画面生成、视频剪辑与后期制作。',
    coverUrl: '/works/ai-film/tvc-004-cover-full.webp',
    detailSlug: 'tvc-004',
    assets: [
      { id: 'a1', kind: 'prop', title: '产品资产', thumb: '/works/ai-film/tvc-004-product-01-thumb.webp', full: '/works/ai-film/tvc-004-product-01-full.webp', width: 1672, height: 941, note: 'PRODUCT' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/tvc-004-env-01-thumb.webp', full: '/works/ai-film/tvc-004-env-01-full.webp', width: 1672, height: 941, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'character', title: '视觉素材', thumb: '/works/ai-film/tvc-004-visual-01-thumb.webp', full: '/works/ai-film/tvc-004-visual-01-full.webp', width: 1672, height: 941, note: 'VISUAL' },
    ],
    detail: {
      synopsis:
        '透明水珠在粉红色双轨之间弹跳，轨道通向晴空；暖金逆光里，一瓶透明瓶装水直立在木质台面。浅蓝瓶盖旋开，镜头坠入瓶口，在透明水旋涡隧道中加速——冷蓝水壁旋转，尽头露出粉红轨道。水珠随轨道弹跳、爬坡、俯冲，穿过一群黄色球形粒子，驶入冰晶峡谷与瓶装水工厂城市：巨大的透明水瓶像建筑群分列两侧，银白管道与多层粉红轨道交错。工厂渐渐软化为粉色矿物晶洞，pH 8.0 的符号一闪而过；洞穴收束成透明水旋涡，一颗完美水滴悬停在亮口中央，缓缓落回瓶口——切回暖金散景，瓶身周围爆开清澈水花，定格收尾。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'product',
          title: '产品资产',
          en: 'PRODUCT ASSETS',
          assets: [
            { id: 'pd1', kind: 'prop', title: '瓶装水道具设定板', thumb: '/works/ai-film/tvc-004-product-01-thumb.webp', full: '/works/ai-film/tvc-004-product-01-full.webp', width: 1672, height: 941, note: '透明 PET 瓶身、波浪筋条、浅蓝瓶盖与粉白标签的多视图设定' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '水世界四联场景板', thumb: '/works/ai-film/tvc-004-env-01-thumb.webp', full: '/works/ai-film/tvc-004-env-01-full.webp', width: 1672, height: 941, note: '透明水隧道、冰晶峡谷、瓶装水工厂城市与粉晶洞穴——由同一条粉红双轨串起的四个空间' },
          ],
        },
        {
          id: 'visual',
          title: '视觉素材',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: '黄色球形粒子 · 三视图', thumb: '/works/ai-film/tvc-004-visual-01-thumb.webp', full: '/works/ai-film/tvc-004-visual-01-full.webp', width: 1672, height: 941, note: '无四肢的果冻质感球体，四种表情——轨道途中的轻松反差' },
          ],
        },
      ],
    },
  },
  {
    id: 'short-001',
    title: '炸鸡女王穿越中世纪',
    englishTitle: 'AI SHORT FILM',
    category: 'short',
    description:
      '美食穿越喜剧短片，9:16 竖屏、英文配音，时长约 4 分 21 秒。现代餐厅学徒女厨师妮娅被主厨当众羞辱开除，一张「炸鸡无限潜力」宣传纸把她卷进中世纪市集——快餐大亨系统绑定、炸鸡车落下，香味先让富商倒戈、市民抢购，再让前来取缔的骑士队长当场改口：「这个女人受王国骑士团保护。」',
    bilibiliUrl: 'https://www.bilibili.com/video/BV1qMp46wE28/',
    duration: '4:21',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 视觉创意、画面设计、AI 生成、视频剪辑与后期处理。',
    coverUrl: '/works/ai-film/short-001-cover-full.webp',
    detailSlug: 'short-001',
    assets: [
      { id: 'a1', kind: 'character', title: '视觉资产', thumb: '/works/ai-film/short-001-visual-01-thumb.webp', full: '/works/ai-film/short-001-visual-01-full.webp', width: 941, height: 1672, note: 'VISUAL' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/short-001-env-01-thumb.webp', full: '/works/ai-film/short-001-env-01-full.webp', width: 1916, height: 821, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'storyboard', title: '关键画面', thumb: '/works/ai-film/short-001-frame-01-full.webp', full: '/works/ai-film/short-001-frame-01-full.webp', width: 332, height: 544, note: 'KEY FRAMES' },
    ],
    detail: {
      synopsis:
        '现代高级餐厅后厨，学徒女厨师妮娅被雷诺阿主厨泼菜羞辱、当众开除。她蹲在垃圾桶旁捡起一张「CHICPE / 炸鸡无限潜力」的宣传纸，低声念出「垃圾食品拥有无限潜力」，蓝白色时空裂隙将她吞进中世纪泥泞市集。快餐大亨系统绑定，初始奖励一辆现代炸鸡车：双层裹粉、180℃ 热油，香味先征服落魄村民，再让嫌贵的富商闻香倒戈——市集妇人抢购、壮汉的巫术指控被富商掀翻在地。银甲骑士队长到场取缔，却被一只鸡腿当场收服：「没收什么？这个女人受王国骑士团保护。」被现代厨房驱逐的「垃圾食品女王」，在陌生时代拿到了比营业执照更硬的立足点。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'visual',
          title: '视觉资产',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: '妮娅 · 现代厨师主视觉', thumb: '/works/ai-film/short-001-visual-01-thumb.webp', full: '/works/ai-film/short-001-visual-01-full.webp', width: 941, height: 1672, note: '金发雀斑学徒厨师，黑色双排扣厨师服与黑围裙' },
            { id: 'v2', kind: 'character', title: '妮娅 · 角色设定板', thumb: '/works/ai-film/short-001-visual-02-thumb.webp', full: '/works/ai-film/short-001-visual-02-full.webp', width: 1672, height: 941, note: '三视图设定' },
            { id: 'v3', kind: 'character', title: '富商 · 主视觉', thumb: '/works/ai-film/short-001-visual-03-thumb.webp', full: '/works/ai-film/short-001-visual-03-full.webp', width: 941, height: 1672, note: '酒红刺绣背心的中世纪精明商人，第一位付费顾客' },
            { id: 'v4', kind: 'character', title: '富商 · 角色设定板', thumb: '/works/ai-film/short-001-visual-04-thumb.webp', full: '/works/ai-film/short-001-visual-04-full.webp', width: 1672, height: 941, note: '三视图设定' },
            { id: 'v5', kind: 'character', title: '雷诺阿主厨 · 主视觉', thumb: '/works/ai-film/short-001-visual-05-thumb.webp', full: '/works/ai-film/short-001-visual-05-full.webp', width: 941, height: 1672, note: '现代餐厅主厨，强势刻薄' },
            { id: 'v6', kind: 'character', title: '雷诺阿主厨 · 角色设定板', thumb: '/works/ai-film/short-001-visual-06-thumb.webp', full: '/works/ai-film/short-001-visual-06-full.webp', width: 1672, height: 941, note: '三视图设定' },
            { id: 'v7', kind: 'character', title: '骑士队长 · 主视觉', thumb: '/works/ai-film/short-001-visual-07-thumb.webp', full: '/works/ai-film/short-001-visual-07-full.webp', width: 941, height: 1672, note: '银色板甲、蓝披风、金狮纹章，先执法后被炸鸡征服' },
            { id: 'v8', kind: 'character', title: '骑士队长 · 角色设定板', thumb: '/works/ai-film/short-001-visual-08-thumb.webp', full: '/works/ai-film/short-001-visual-08-full.webp', width: 1672, height: 941, note: '三视图设定' },
            { id: 'v9', kind: 'prop', title: '炸鸡宣传纸', thumb: '/works/ai-film/short-001-visual-09-thumb.webp', full: '/works/ai-film/short-001-visual-09-full.webp', width: 1086, height: 1448, note: 'CHICPE「炸鸡无限潜力」——触发时空裂隙的引子' },
            { id: 'v10', kind: 'prop', title: '炸鸡腿', thumb: '/works/ai-film/short-001-visual-10-thumb.webp', full: '/works/ai-film/short-001-visual-10-full.webp', width: 1086, height: 1448, note: '双层裹粉、180℃ 热油的金黄酥壳' },
            { id: 'v11', kind: 'prop', title: '现代炸鸡车', thumb: '/works/ai-film/short-001-visual-11-thumb.webp', full: '/works/ai-film/short-001-visual-11-full.webp', width: 1086, height: 1448, note: '系统初始奖励，落在中世纪泥路中央' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '中世纪市集主视图', thumb: '/works/ai-film/short-001-env-01-thumb.webp', full: '/works/ai-film/short-001-env-01-full.webp', width: 1916, height: 821, note: '石堡下的泥泞市集，炸鸡车营业主场景' },
            { id: 'e2', kind: 'scene', title: '现代餐厅外观', thumb: '/works/ai-film/short-001-env-02-thumb.webp', full: '/works/ai-film/short-001-env-02-full.webp', width: 1916, height: 821, note: '故事起点' },
          ],
        },
        {
          id: 'keyframes',
          title: '关键画面',
          en: 'KEY FRAMES',
          assets: [
            { id: 'k1', kind: 'storyboard', title: '后厨羞辱', thumb: '/works/ai-film/short-001-frame-01-full.webp', full: '/works/ai-film/short-001-frame-01-full.webp', width: 332, height: 544, note: '00:25 · 场1' },
            { id: 'k2', kind: 'storyboard', title: '市集炸鸡出锅', thumb: '/works/ai-film/short-001-frame-02-full.webp', full: '/works/ai-film/short-001-frame-02-full.webp', width: 332, height: 544, note: '01:35 · 场4' },
            { id: 'k3', kind: 'storyboard', title: '富商闻香倒戈', thumb: '/works/ai-film/short-001-frame-03-full.webp', full: '/works/ai-film/short-001-frame-03-full.webp', width: 332, height: 544, note: '02:10 · 场5' },
            { id: 'k4', kind: 'storyboard', title: '骑士队长改口', thumb: '/works/ai-film/short-001-frame-04-full.webp', full: '/works/ai-film/short-001-frame-04-full.webp', width: 332, height: 544, note: '03:55 · 场9' },
          ],
        },
      ],
    },
  },
  {
    id: 'short-002',
    title: '演化身体',
    englishTitle: 'AI SHORT FILM',
    category: 'short',
    description:
      '末世科幻短片，16:9 横屏，时长约 3 分 28 秒。地球气候突破不可逆临界点，普通人体在地表存活不超过一小时，科研最终转向「演化身体」——78 岁的老苏把 6 岁的小禾送入演化舱，给她一副能适配新地球的身体；小禾独自走出气闸，用指尖唤醒土层中的根系网络，清水涌出、苔藓苏醒。',
    bilibiliUrl: 'https://www.bilibili.com/video/BV15Vp46ZECw/',
    duration: '3:28',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 视觉创意、画面设计、AI 生成、视频剪辑与后期处理。',
    coverUrl: '/works/ai-film/short-002-cover-full.webp',
    detailSlug: 'short-002',
    assets: [
      { id: 'a1', kind: 'character', title: '视觉资产', thumb: '/works/ai-film/short-002-visual-03-thumb.webp', full: '/works/ai-film/short-002-visual-03-full.webp', width: 1536, height: 1024, note: 'VISUAL' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/short-002-env-01-thumb.webp', full: '/works/ai-film/short-002-env-01-full.webp', width: 1672, height: 941, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'storyboard', title: '关键画面', thumb: '/works/ai-film/short-002-frame-02-thumb.webp', full: '/works/ai-film/short-002-frame-02-full.webp', width: 1692, height: 942, note: 'KEY FRAMES' },
    ],
    detail: {
      synopsis:
        '黑暗的地下庇护所废墟里，字幕写下世界观：地表生态全面崩溃，人类改造环境的尝试悉数失败，科研最终转向「演化身体」——让人类自身去适配已经改变的地球。控制室里，78 岁的老苏与 25 岁的小周对峙：「她才六岁。」「我等不到她十六岁了。」演化舱前，老苏俯身与 6 岁的小禾平视：「外面的世界，我们修不好了。但我们给了你一副能改变那个世界的身体。」白色弧形神经耳机亮起蓝环，小禾独自走过气闸踏上龟裂荒原——「别用眼睛。去听。」她听见风里的水、土里沉睡的东西，指尖触地，蓝光沿根系网络扩散：裂缝张开而不崩坏，清水涌出，苔藓、嫩草与一只背负苔藓的半透明幼小生物在光里苏醒。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'visual',
          title: '视觉资产',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: '老苏 · 三视图', thumb: '/works/ai-film/short-002-visual-01-thumb.webp', full: '/works/ai-film/short-002-visual-01-full.webp', width: 1536, height: 1024, note: '78 岁研究员，灰白低髻、灰白旧研究外套，温和坚定' },
            { id: 'v2', kind: 'character', title: '小周 · 三视图', thumb: '/works/ai-film/short-002-visual-02-thumb.webp', full: '/works/ai-film/short-002-visual-02-full.webp', width: 1536, height: 1024, note: '25 岁研究员，炭灰短立领机能夹克、深灰工装裤，焦虑克制' },
            { id: 'v3', kind: 'character', title: '小禾 · 三视图', thumb: '/works/ai-film/short-002-visual-03-thumb.webp', full: '/works/ai-film/short-002-visual-03-full.webp', width: 1536, height: 1024, note: '6 岁女孩，黑色单辫，左耳佩戴白银弧形神经耳机' },
            { id: 'v4', kind: 'prop', title: '演化舱 · 道具设定', thumb: '/works/ai-film/short-002-visual-04-thumb.webp', full: '/works/ai-film/short-002-visual-04-full.webp', width: 1672, height: 941, note: '透明圆柱舱，四视角概念图' },
            { id: 'v5', kind: 'prop', title: '神经耳机 · 道具设定', thumb: '/works/ai-film/short-002-visual-05-thumb.webp', full: '/works/ai-film/short-002-visual-05-full.webp', width: 1672, height: 941, note: '白色弧形耳机，蓝色圆环亮起即连线' },
            { id: 'v6', kind: 'prop', title: '地形监测仪 · 道具设定', thumb: '/works/ai-film/short-002-visual-06-thumb.webp', full: '/works/ai-film/short-002-visual-06-full.webp', width: 1672, height: 941, note: '控制室地形屏，追踪云系与地下水脉' },
            { id: 'v7', kind: 'prop', title: '苔藓幼体生物 · 道具设定', thumb: '/works/ai-film/short-002-visual-07-thumb.webp', full: '/works/ai-film/short-002-visual-07-full.webp', width: 1672, height: 941, note: '半透明、背负苔藓的小生物，荒原复苏的第一个朋友' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '庇护所控制室 · 概念设计', thumb: '/works/ai-film/short-002-env-01-thumb.webp', full: '/works/ai-film/short-002-env-01-full.webp', width: 1672, height: 941, note: '观察窗外是死寂荒原与残城' },
            { id: 'e2', kind: 'scene', title: '演化舱大厅 · 概念设计', thumb: '/works/ai-film/short-002-env-02-thumb.webp', full: '/works/ai-film/short-002-env-02-full.webp', width: 1672, height: 941, note: '蓝光圆柱舱列阵的大厅' },
            { id: 'e3', kind: 'scene', title: '地表荒原 · 概念设计', thumb: '/works/ai-film/short-002-env-03-thumb.webp', full: '/works/ai-film/short-002-env-03-full.webp', width: 1672, height: 941, note: '龟裂大地、废弃高架与远处残城' },
            { id: 'e4', kind: 'scene', title: '生命网络苏醒 · 概念设计', thumb: '/works/ai-film/short-002-env-04-thumb.webp', full: '/works/ai-film/short-002-env-04-full.webp', width: 1672, height: 941, note: '清水涌出后苔藓与植被复苏的荒原' },
          ],
        },
        {
          id: 'keyframes',
          title: '关键画面',
          en: 'KEY FRAMES',
          assets: [
            { id: 'k1', kind: 'storyboard', title: '控制室 · 监测屏前', thumb: '/works/ai-film/short-002-frame-01-thumb.webp', full: '/works/ai-film/short-002-frame-01-full.webp', width: 1692, height: 942, note: '小周盯着地形图：「云系还有四十公里，不可能。」' },
            { id: 'k2', kind: 'storyboard', title: '演化舱 · 礼物', thumb: '/works/ai-film/short-002-frame-02-thumb.webp', full: '/works/ai-film/short-002-frame-02-full.webp', width: 1692, height: 942, note: '老苏把神经耳机戴到小禾左耳' },
            { id: 'k3', kind: 'storyboard', title: '演化激活', thumb: '/works/ai-film/short-002-frame-03-thumb.webp', full: '/works/ai-film/short-002-frame-03-full.webp', width: 1692, height: 942, note: '颈侧蓝色纹路微微发亮' },
            { id: 'k4', kind: 'storyboard', title: '目送', thumb: '/works/ai-film/short-002-frame-04-thumb.webp', full: '/works/ai-film/short-002-frame-04-full.webp', width: 1692, height: 942, note: '「她不是在改变它们。」' },
          ],
        },
      ],
    },
  },
  {
    id: 'short-003',
    title: '电梯换装：从起床到气场全开',
    englishTitle: 'AI SHORT FILM',
    category: 'short',
    description:
      '都市时尚换装短片，9:16 竖屏、固定机位、无对白，时长 31 秒。电梯门开合之间五度换装——从粉色卷发筒与条纹睡衣的居家慵懒，到通勤西装、夜间风衣，最终以细条纹不对称裙装与斑马丝巾包气场全开，朝镜头走来。',
    bilibiliUrl: 'https://www.bilibili.com/video/BV1LGp46bEVZ/',
    duration: '0:31',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 视觉创意、画面设计、AI 生成、视频剪辑与后期处理。',
    coverUrl: '/works/ai-film/short-003-cover-full.webp',
    detailSlug: 'short-003',
    assets: [
      { id: 'a1', kind: 'character', title: '视觉资产', thumb: '/works/ai-film/short-003-visual-05-thumb.webp', full: '/works/ai-film/short-003-visual-05-full.webp', width: 1672, height: 941, note: 'VISUAL' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/short-003-env-01-thumb.webp', full: '/works/ai-film/short-003-env-01-full.webp', width: 1672, height: 941, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'storyboard', title: '关键画面', thumb: '/works/ai-film/short-003-frame-04-thumb.webp', full: '/works/ai-film/short-003-frame-04-full.webp', width: 1200, height: 2670, note: 'KEY FRAMES' },
    ],
    detail: {
      synopsis:
        '现代写字楼电梯口，冷银灰不锈钢轿厢与中性暖白顶灯。电梯门紧闭、红色楼层数字亮着，女主角头戴粉色卷发筒、穿淡紫条纹睡衣低头刷手机走入轿厢。门开合之间五度换装：白衬衫配酒红领带与深灰阔腿西裤的通勤利落、黑色细条纹收腰西装加报童帽的干练、长款黑皮风衣配丝袜玛丽珍的夜间凌厉，最终以黑色细条纹不对称裙装、象牙白高领、叠层金色项链与斑马丝巾包气场全开——她扶腰直视镜头，随即朝镜头走来，长发、裙摆和丝巾随步伐摆动，空轿厢顶灯轻暗收尾。无对白，以极简时尚电子节拍与门滑轨声、鞋跟声构成节奏。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'visual',
          title: '视觉资产',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: 'C01 居家造型 · 三视图', thumb: '/works/ai-film/short-003-visual-01-thumb.webp', full: '/works/ai-film/short-003-visual-01-full.webp', width: 1672, height: 941, note: '粉色卷发筒、淡紫条纹睡衣与拖鞋' },
            { id: 'v2', kind: 'character', title: 'C02 通勤造型一 · 三视图', thumb: '/works/ai-film/short-003-visual-02-thumb.webp', full: '/works/ai-film/short-003-visual-02-full.webp', width: 1672, height: 941, note: '白衬衫、酒红领带、深灰阔腿西裤与酒红包' },
            { id: 'v3', kind: 'character', title: 'C03 通勤造型二 · 三视图', thumb: '/works/ai-film/short-003-visual-03-thumb.webp', full: '/works/ai-film/short-003-visual-03-full.webp', width: 1672, height: 941, note: '细条纹收腰西装、报童帽与证件挂绳' },
            { id: 'v4', kind: 'character', title: 'C04 夜间造型 · 三视图', thumb: '/works/ai-film/short-003-visual-04-thumb.webp', full: '/works/ai-film/short-003-visual-04-full.webp', width: 1672, height: 941, note: '长款黑皮风衣、白背心、短裙丝袜与玛丽珍鞋' },
            { id: 'v5', kind: 'character', title: '最终造型 · 三视图', thumb: '/works/ai-film/short-003-visual-05-thumb.webp', full: '/works/ai-film/short-003-visual-05-full.webp', width: 1672, height: 941, note: '细条纹不对称裙装、象牙白高领与叠层金链' },
            { id: 'v6', kind: 'prop', title: '斑马丝巾包', thumb: '/works/ai-film/short-003-visual-06-thumb.webp', full: '/works/ai-film/short-003-visual-06-full.webp', width: 1086, height: 1448, note: '最终造型的点睛配饰' },
            { id: 'v7', kind: 'prop', title: '酒红肩包', thumb: '/works/ai-film/short-003-visual-07-thumb.webp', full: '/works/ai-film/short-003-visual-07-full.webp', width: 1086, height: 1448, note: '通勤造型一配包' },
            { id: 'v8', kind: 'prop', title: '银灰三摄手机', thumb: '/works/ai-film/short-003-visual-08-thumb.webp', full: '/works/ai-film/short-003-visual-08-full.webp', width: 1086, height: 1448, note: '居家造型的手中物' },
            { id: 'v9', kind: 'prop', title: '黑色手提包', thumb: '/works/ai-film/short-003-visual-09-thumb.webp', full: '/works/ai-film/short-003-visual-09-full.webp', width: 1086, height: 1448, note: '夜间造型配包' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '不锈钢电梯母板', thumb: '/works/ai-film/short-003-env-01-thumb.webp', full: '/works/ai-film/short-003-env-01-full.webp', width: 1672, height: 941, note: '冷银灰轿厢、后壁扶手与暖白顶灯，全程固定机位的唯一舞台' },
          ],
        },
        {
          id: 'keyframes',
          title: '关键画面',
          en: 'KEY FRAMES',
          assets: [
            { id: 'k1', kind: 'storyboard', title: '居家状态', thumb: '/works/ai-film/short-003-frame-01-thumb.webp', full: '/works/ai-film/short-003-frame-01-full.webp', width: 1200, height: 2670, note: '00:07 · 卷发筒与睡衣' },
            { id: 'k2', kind: 'storyboard', title: '通勤造型', thumb: '/works/ai-film/short-003-frame-02-thumb.webp', full: '/works/ai-film/short-003-frame-02-full.webp', width: 1200, height: 2670, note: '00:11 · 门开即换装' },
            { id: 'k3', kind: 'storyboard', title: '夜间造型', thumb: '/works/ai-film/short-003-frame-03-thumb.webp', full: '/works/ai-film/short-003-frame-03-full.webp', width: 1200, height: 2670, note: '00:19 · 黑色皮风衣' },
            { id: 'k4', kind: 'storyboard', title: '气场全开', thumb: '/works/ai-film/short-003-frame-04-thumb.webp', full: '/works/ai-film/short-003-frame-04-full.webp', width: 1200, height: 2670, note: '00:27 · 朝镜头走来' },
          ],
        },
      ],
    },
  },
  {
    id: 'short-004',
    title: '从始至终',
    englishTitle: 'AI SHORT FILM',
    category: 'short',
    description:
      '恋爱游戏 CG 风第一人称情感短片，9:16 竖屏、中文对白，时长约 46 秒。深夜公寓，谢珩俯身逼问沈知微承认喜欢自己；她以触碰与反问回应——「那你呢？你敢不敢承认？」他以一个吻和一句「我喜欢你，从始至终」完成双向告白。',
    bilibiliUrl: 'https://www.bilibili.com/video/BV1VLp464Eod/',
    duration: '0:46',
    tools: '即梦 / Seedance / 剪映',
    myRole: '负责 AI 视觉创意、画面设计、AI 生成、视频剪辑与后期处理。',
    coverUrl: '/works/ai-film/short-004-cover-full.webp',
    detailSlug: 'short-004',
    assets: [
      { id: 'a1', kind: 'character', title: '视觉资产', thumb: '/works/ai-film/short-004-visual-01-thumb.webp', full: '/works/ai-film/short-004-visual-01-full.webp', width: 1672, height: 941, note: 'VISUAL' },
      { id: 'a2', kind: 'scene', title: '场景资产', thumb: '/works/ai-film/short-004-env-01-thumb.webp', full: '/works/ai-film/short-004-env-01-full.webp', width: 1672, height: 941, note: 'ENVIRONMENT' },
      { id: 'a3', kind: 'storyboard', title: '关键画面', thumb: '/works/ai-film/short-004-frame-01-thumb.webp', full: '/works/ai-film/short-004-frame-01-full.webp', width: 941, height: 1672, note: 'KEY FRAMES' },
    ],
    detail: {
      synopsis:
        '深夜的现代复式公寓客厅，暖灯低照。第一人称视角里，谢珩双臂撑在沈知微身体两侧俯身逼近，眼尾泛红压着委屈：「沈知微，承认喜欢我，就这么难吗？」她不答，只抬手托住他的下巴，又被他握住手腕、把掌心按在自己左胸——急促的心跳成了回答。「你听。」她反客为主：「那你呢？你敢不敢承认？」他迟疑只维持一瞬：「敢。」俯身吻住她。片刻后他退开，额前碎发垂落、呼吸未平，直视她的眼睛：「我喜欢你，从始至终。」暖光落在他湿润的眼尾，画面停在两人仍未拉开的距离上。',
      characters: [],
      scenes: [],
      props: [],
      storyboards: [],
      assetSections: [
        {
          id: 'visual',
          title: '视觉资产',
          en: 'VISUAL ASSETS',
          assets: [
            { id: 'v1', kind: 'character', title: '谢珩 · 三视图', thumb: '/works/ai-film/short-004-visual-01-thumb.webp', full: '/works/ai-film/short-004-visual-01-full.webp', width: 1672, height: 941, note: '黑色短发、灰绿色眼睛、冷白肤色，赤裸上身与黑色长裤' },
            { id: 'v2', kind: 'character', title: '沈知微 · 三视图（导演提案）', thumb: '/works/ai-film/short-004-visual-02-thumb.webp', full: '/works/ai-film/short-004-visual-02-full.webp', width: 1672, height: 941, note: '原片未完整露脸，完整外形属导演提案' },
            { id: 'v3', kind: 'character', title: '沈知微 · 手部参考', thumb: '/works/ai-film/short-004-visual-03-thumb.webp', full: '/works/ai-film/short-004-visual-03-full.webp', width: 1672, height: 941, note: '第一人称视角的手部连续性锁定' },
          ],
        },
        {
          id: 'environment',
          title: '场景资产',
          en: 'ENVIRONMENT ASSETS',
          assets: [
            { id: 'e1', kind: 'scene', title: '现代复式公寓客厅 · 夜景母板', thumb: '/works/ai-film/short-004-env-01-thumb.webp', full: '/works/ai-film/short-004-env-01-full.webp', width: 1672, height: 941, note: '米色沙发、暖色落地灯、绿植与通往上层的楼梯' },
            { id: 'e2', kind: 'scene', title: '第一人称低机位参考', thumb: '/works/ai-film/short-004-env-02-thumb.webp', full: '/works/ai-film/short-004-env-02-full.webp', width: 940, height: 1672, note: '女主视点高度与男主俯身位置的机位锁定' },
          ],
        },
        {
          id: 'keyframes',
          title: '关键画面',
          en: 'KEY FRAMES',
          assets: [
            { id: 'k1', kind: 'storyboard', title: '首帧 · 俯身逼问', thumb: '/works/ai-film/short-004-frame-01-thumb.webp', full: '/works/ai-film/short-004-frame-01-full.webp', width: 941, height: 1672, note: '第一人称压近构图' },
            { id: 'k2', kind: 'storyboard', title: '掌心贴上心口', thumb: '/works/ai-film/short-004-frame-02-full.webp', full: '/works/ai-film/short-004-frame-02-full.webp', width: 332, height: 544, note: '00:20 · 心跳成为回答' },
            { id: 'k3', kind: 'storyboard', title: '吻', thumb: '/works/ai-film/short-004-frame-03-full.webp', full: '/works/ai-film/short-004-frame-03-full.webp', width: 332, height: 544, note: '00:36' },
            { id: 'k4', kind: 'storyboard', title: '「我喜欢你，从始至终」', thumb: '/works/ai-film/short-004-frame-04-full.webp', full: '/works/ai-film/short-004-frame-04-full.webp', width: 332, height: 544, note: '00:44 · 最终告白' },
          ],
        },
      ],
    },
  },
];

/** 某个分类下的作品（保持配置文件里的顺序） */
export function projectsByCategory(category: AiFilmCategory): AiFilmProject[] {
  return AI_FILM_PROJECTS.filter((project) => project.category === category);
}

/** 播放集列表：多集作品直接用 episodes；单集作品把顶层单视频字段包装成一集 */
export function episodesOf(project: AiFilmProject): FilmEpisode[] {
  if (project.episodes && project.episodes.length > 0) return project.episodes;
  if (!project.bilibiliUrl) return [];
  return [
    {
      id: 'main',
      label: project.title,
      bilibiliUrl: project.bilibiliUrl,
      duration: project.duration,
      coverUrl: project.coverUrl,
    },
  ];
}

/** 按详情页 slug 找项目（非 /film/* 路径返回 null） */
export function findAiFilmProject(pathname: string): AiFilmProject | null {
  if (!pathname.startsWith(FILM_DETAIL_PREFIX)) return null;
  const slug = pathname.slice(FILM_DETAIL_PREFIX.length).replace(/\/+$/, '');
  if (!slug) return null;
  return AI_FILM_PROJECTS.find((project) => project.detailSlug === slug) ?? null;
}

/** 分类中文名 */
export function categoryLabel(category: AiFilmCategory): AiFilmCategoryMeta {
  return AI_FILM_CATEGORIES.find((item) => item.id === category) ?? AI_FILM_CATEGORIES[0];
}
