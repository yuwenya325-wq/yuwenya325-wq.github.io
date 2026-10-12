/**
 * 联系方式数据：CONTACT 栏目唯一数据源。
 *
 * 三个渠道（手机 / 邮箱 / 微信）横向等权展示，条目顺序即页面顺序。
 * 微信用复制而非链接，因为微信没有可直达的公开 URL。
 */

export type ContactKind = 'phone' | 'email' | 'wechat';

export type ContactChannel = {
  id: string;
  kind: ContactKind;
  /** 中文标题 */
  label: string;
  /** 英文辅助标签 */
  en: string;
  /** 展示的联系方式（原样输出，不做格式化） */
  value: string;
  /** 点击直达链接（tel: / mailto:）；微信无链接则为空 */
  href?: string;
  /** 点击复制到剪贴板（微信） */
  copyable?: boolean;
  /** 卡片底部的动作提示 */
  action: string;
};

export const CONTACT_CHANNELS: readonly ContactChannel[] = [
  {
    id: 'phone',
    kind: 'phone',
    label: '手机',
    en: 'PHONE',
    value: '19993666547',
    href: 'tel:19993666547',
    action: '点击拨打',
  },
  {
    id: 'email',
    kind: 'email',
    label: '邮箱',
    en: 'EMAIL',
    value: '19993666547@163.com',
    href: 'mailto:19993666547@163.com',
    action: '点击写邮件',
  },
  {
    id: 'wechat',
    kind: 'wechat',
    label: '微信',
    en: 'WECHAT',
    value: 'Yu19993666547',
    copyable: true,
    action: '点击复制微信号',
  },
];

/** 页面底部结语 */
export const CONTACT_FOOTNOTE = '欢迎随时联系我，期待与你一起创造更多有趣的作品 ✨';
