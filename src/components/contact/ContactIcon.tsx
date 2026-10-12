import { Mail, Phone } from 'lucide-react';
import type { ContactKind } from '../../data/contact';
import { CONTACTC } from './theme';

type ContactIconProps = {
  kind: ContactKind;
  /** 圆形直径（px） */
  size?: number;
};

/**
 * 圆形联系方式图标：黑色实心圆 + 白色线性图标（无 emoji）。
 *
 * - 电话 / 邮件：直接用线性图标，笔画宽度与微信图标对齐；
 * - 微信：手绘双气泡线性图标（后气泡被前气泡遮断），保证与品牌识别一致；
 * - 前气泡用底色填充 + 底色描边「挖掉」后气泡的线，再画白色描边，得到正确的遮挡关系。
 */
export default function ContactIcon({ kind, size = 58 }: ContactIconProps) {
  const glyph = Math.round(size * 0.44);

  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: CONTACTC.iconBg,
        boxShadow: '0 10px 24px -10px rgba(17,17,17,.55)',
      }}
    >
      <Glyph kind={kind} size={glyph} />
    </span>
  );
}

function Glyph({ kind, size }: { kind: ContactKind; size: number }) {
  if (kind === 'phone') {
    return <Phone size={size} strokeWidth={1.7} color={CONTACTC.iconStroke} aria-hidden="true" />;
  }
  if (kind === 'email') {
    return <Mail size={size} strokeWidth={1.7} color={CONTACTC.iconStroke} aria-hidden="true" />;
  }
  return <WeChatGlyph size={size} />;
}

/** 微信双气泡线性图标（24 × 24 视图框，笔画与 lucide 图标一致） */
function WeChatGlyph({ size }: { size: number }) {
  const line = CONTACTC.iconStroke;
  const cut = CONTACTC.iconBg;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* 后气泡（左上，较大）：气泡本体 + 尾巴 + 两只眼睛 */}
      <ellipse cx="9" cy="8.2" rx="6.6" ry="5.4" stroke={line} strokeWidth="1.7" />
      <path d="M5.7 12.9 4.2 16.9 8.6 13.6" stroke={line} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="7.6" r="1" fill={line} />
      <circle cx="11.2" cy="7.6" r="1" fill={line} />

      {/* 前气泡（右下，较小）：先按底色描一圈遮断后气泡，再画自己的白色轮廓 */}
      <g>
        <ellipse cx="14" cy="13" rx="5.5" ry="4.4" fill={cut} stroke={cut} strokeWidth="3.4" />
        <path d="M14.6 17.3 16 20.4 17.2 16.6" fill="none" stroke={cut} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <ellipse cx="14" cy="13" rx="5.5" ry="4.4" fill={cut} stroke={line} strokeWidth="1.7" />
      <path d="M14.6 17.3 16 20.4 17.2 16.6" fill="none" stroke={line} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.3" cy="12.4" r="0.85" fill={line} />
      <circle cx="15.7" cy="12.4" r="0.85" fill={line} />
    </svg>
  );
}
