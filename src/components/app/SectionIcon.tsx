import type { CSSProperties } from 'react';

export type SectionIconKind = 'feature' | 'screen' | 'concept';

type SectionIconProps = {
  kind: SectionIconKind;
  /** 尺寸（CSS 长度，如 '84px' 或 'clamp(64px,17vw,92px)'） */
  size?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * APP 板块图标（3D 质感小方块）。
 *
 * 与 VISUAL DESIGN 的四分类图标同一套「可点击图标」语言，但走本栏目气质：
 * 奶油白方板 + 品牌绿描边字形 + 轻微挤出厚度（同一字形先偏移画一层暗色再画主色），
 * 方板用 30% 圆角做出 squircle 弧面，配顶部高光与底部内阴影形成厚度感。
 * 图形本身是内联 SVG（零依赖），随 size 等比缩放。
 */
export default function SectionIcon({ kind, size = '84px', className, style }: SectionIconProps) {
  return (
    <span className={`relative block shrink-0 ${className ?? ''}`} style={{ width: size, height: size, ...style }} aria-hidden="true">
      {/* 方板 */}
      <span
        className="absolute inset-0"
        style={{
          borderRadius: '30%',
          background: 'linear-gradient(155deg,#FFFFFF 0%,#F3F6F1 45%,#E3E9DF 100%)',
          border: '1px solid #E1E6DC',
          boxShadow: '0 18px 34px -16px rgba(75,98,70,.55), inset 0 1px 1px rgba(255,255,255,.95), inset 0 -2px 4px rgba(75,98,70,.10)',
        }}
      />
      {/* 顶部柔光弧 */}
      <span
        className="absolute inset-0 opacity-70"
        style={{
          borderRadius: '30%',
          background: 'radial-gradient(70% 55% at 28% 14%, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 60%)',
        }}
      />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 44 44" fill="none" role="presentation">
        {/* 厚度：同字形先偏移画一层暗色 */}
        <g transform="translate(1.3,2.1)" opacity=".22">
          <Glyph kind={kind} color="#2C3D2C" />
        </g>
        <Glyph kind={kind} color="#4B6246" />
      </svg>
    </span>
  );
}

/** 字形本身：以 44×44 画布为基准 */
function Glyph({ kind, color }: { kind: SectionIconKind; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (kind === 'feature') {
    // 四宫格：对角两块实心，另两块镂空（核心功能）
    return (
      <g transform="translate(9,9)">
        <rect x="0" y="0" width="11" height="11" rx="3.4" fill={color} />
        <rect x="15" y="0" width="11" height="11" rx="3.4" {...stroke} />
        <rect x="0" y="15" width="11" height="11" rx="3.4" {...stroke} />
        <rect x="15" y="15" width="11" height="11" rx="3.4" fill={color} />
      </g>
    );
  }

  if (kind === 'screen') {
    // 手机界面：机身圆角框 + 标题条 + 内容块 + 底部指示点（界面展示）
    return (
      <g transform="translate(12,7)">
        <rect x="0" y="0" width="20" height="30" rx="6" {...stroke} />
        <line x1="6.6" y1="6" x2="13.4" y2="6" {...stroke} strokeWidth={2.2} />
        <rect x="4.6" y="11" width="10.8" height="4.4" rx="1.8" fill={color} />
        <rect x="4.6" y="18.4" width="10.8" height="4.4" rx="1.8" stroke={color} strokeWidth={2} />
        <circle cx="10" cy="26.4" r="1.3" fill={color} />
      </g>
    );
  }

  // 灯泡：设计理念
  return (
    <g transform="translate(11,6)">
      <path d="M11 0.6a8.6 8.6 0 0 1 5.2 15.5c-.7.5-1.1 1.3-1.1 2.1v1.6H6.9v-1.6c0-.8-.4-1.6-1.1-2.1A8.6 8.6 0 0 1 11 0.6Z" {...stroke} />
      <line x1="7.4" y1="24" x2="14.6" y2="24" {...stroke} strokeWidth={2.3} />
      <line x1="8.8" y1="28" x2="13.2" y2="28" {...stroke} strokeWidth={2.3} />
      <path d="M11 12.6v4.6" {...stroke} strokeWidth={2.1} />
    </g>
  );
}
