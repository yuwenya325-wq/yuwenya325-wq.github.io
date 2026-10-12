/**
 * 依据已确认的简历内容整理的技能模块（模块与关键词均按用户指令给出，不含熟练度数据）。
 */

export type SkillModule = {
  /** 模块英文名 */
  en: string;
  /** 模块中文名 */
  cn: string;
  /** 模块关键词 */
  items: string[];
};

export const SKILL_MODULES: SkillModule[] = [
  {
    en: 'AIGC CONTENT',
    cn: 'AIGC内容',
    items: ['Prompt编写', 'AI生图', 'AI视频生成', 'AIGC内容制作'],
  },
  {
    en: 'VISUAL DESIGN',
    cn: '视觉设计',
    items: ['海报设计', 'Banner设计', '字体设计', 'IP设计与VI延展'],
  },
  {
    en: 'AI FILM',
    cn: 'AI影视',
    items: ['剧本拆解', '分镜设计', '角色与场景资产制作', '剧集视频生成', '视频剪辑与后期'],
  },
  {
    en: 'PRODUCT DESIGN',
    cn: '产品设计',
    items: ['APP功能规划', 'UI界面设计', '交互流程设计'],
  },
];

/** HERO 能力标签（按用户指令给出，白底黑字、荧光黄 hover） */
export const CAPABILITY_TAGS = ['AI IMAGE', 'AI VIDEO', 'PROMPT', 'VISUAL DESIGN', 'UI DESIGN'] as const;

/** 个人简介中需要加粗强调的关键词（原文不变，仅做视觉强化） */
export const PROFILE_KEYWORDS = [
  'AIGC内容创作',
  'AI短视频制作',
  '创意策划',
  '分镜设计',
  'Prompt编写',
  'AI视觉生成',
  '后期剪辑流程',
  '角色、场景与道具设计',
  '人物一致性和画面连贯性',
  '视觉审美与AI工具应用能力',
];
