import { useState } from 'react';
import { Plus } from 'lucide-react';
import { RESUME } from '../../data/resume';
import { C, useReveal } from './theme';

/**
 * EXPERIENCE：纵向时间轴 + 交互式手风琴。
 * - 左侧固定显示时间与公司（始终可见）
 * - 右侧 01—05 职责：默认显示概要，点击 / 回车展开完整描述
 * - 支持同时展开多项；展开使用 grid-template-rows 过渡，不产生页面跳动
 */
export default function ExperienceTimeline() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.12);
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggle = (index: number) => {
    setOpenItems((previous) => (
      previous.includes(index) ? previous.filter((item) => item !== index) : [...previous, index]
    ));
  };

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-14">
      {/* 左：时间轴信息（始终可见） */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p className="text-[10px] font-bold uppercase tracking-[.24em]" style={{ color: C.sub }}>
          01 / EXPERIENCE
        </p>
        <p
          className="mt-3 text-sm font-bold leading-[1.6]"
          style={{ color: C.ink, fontFamily: 'Inter, sans-serif' }}
        >
          {RESUME.experience.period}
        </p>
        <p className="mt-1.5 text-sm font-bold leading-[1.6]" style={{ color: C.ink }}>
          {RESUME.experience.company}
        </p>
        <p className="mt-2 text-xs leading-[1.7]" style={{ color: C.sub }}>
          AIGC 内容创作者 · 新媒体内容与 AI 视觉资产制作
        </p>
        {/* 荧光黄标签 */}
        <span
          className="mt-5 inline-flex items-center gap-2 rounded-[2px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em]"
          style={{ backgroundColor: C.accent, color: C.ink }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: C.ink }} />
          5 RESPONSIBILITIES
        </span>
      </div>

      {/* 右：职责手风琴 */}
      <div style={{ borderTop: `1px solid ${C.line}` }}>
        {RESUME.experience.duties.map((duty, index) => {
          const isOpen = openItems.includes(index);
          const summary = duty.split('，')[0];
          return (
            <div
              key={duty}
              style={{
                borderBottom: `1px solid ${C.line}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity .55s cubic-bezier(.22,.61,.36,1) ${index * 90}ms, transform .55s cubic-bezier(.22,.61,.36,1) ${index * 90}ms`,
              }}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                aria-controls={`duty-panel-${index}`}
                className="group flex w-full items-start gap-4 px-2 py-4 text-left outline-none transition-colors duration-300 hover:bg-[#E8E7E1] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                style={{
                  outlineColor: C.ink,
                  backgroundColor: isOpen ? C.accent : 'transparent',
                }}
              >
                <span
                  className="shrink-0 text-[11px] font-black tracking-[.06em] transition-transform duration-300 group-hover:scale-125"
                  style={{ color: isOpen ? C.ink : C.sub, fontFamily: 'Inter, sans-serif' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold leading-[1.6]" style={{ color: C.ink }}>
                  {summary}
                </span>
                <Plus
                  size={16}
                  strokeWidth={2.6}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 transition-transform duration-300"
                  style={{ transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)', color: C.ink }}
                />
              </button>

              {/* 展开区：高度由内容决定，过渡不产生跳动 */}
              <div
                id={`duty-panel-${index}`}
                role="region"
                aria-label={`职责 ${index + 1} 完整描述`}
                className="grid transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(.22,.61,.36,1)]"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <p
                    className="border-l-2 px-2 pb-5 pl-9 text-sm leading-[1.9] sm:pl-10"
                    style={{ borderColor: C.accent, color: '#3A3A3A' }}
                  >
                    {duty}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
