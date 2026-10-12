import { RESUME } from '../../data/resume';
import { C, useReveal } from './theme';

/**
 * EXPERIENCE：静态履历展示（无任何展开交互）。
 * - 左侧：01 / EXPERIENCE + 时间 / 公司 / 职位，始终完整可见
 * - 右侧：01—05 职责固定列表，编号 + 完整职责原文，无补充说明
 * - 悬停只做两件事：行背景轻微变灰、编号块变荧光黄
 *
 * 类名里的颜色写成字面量是刻意的：Tailwind 的 hover / group-hover 变体读不到内联 style，
 * 数值对应 theme.ts —— soft #E8E7E1 / accent #DDF344 / ink #171717 / sub #626262。
 */
export default function ExperienceTimeline() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.12);
  const { period, company, duties } = RESUME.experience;

  return (
    <div ref={ref} className="grid gap-8 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:gap-14">
      {/* 左：履历基本信息（静态，无交互） */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <p translate="no" className="text-[12px] font-bold uppercase tracking-[.24em]" style={{ color: C.sub }}>
          01 / EXPERIENCE
        </p>
        <p
          className="mt-3 text-base font-bold leading-[1.6]"
          style={{ color: C.ink, fontVariantNumeric: 'tabular-nums' }}
        >
          {period}
        </p>
        <p className="mt-1.5 text-base font-bold leading-[1.6]" style={{ color: C.ink }}>
          {company}
        </p>
        <p className="mt-3.5 text-base font-bold leading-[1.6]" style={{ color: C.ink }}>
          AIGC内容创作者
        </p>
        <p className="mt-1.5 text-sm leading-[1.7]" style={{ color: C.sub }}>
          新媒体内容与AI视觉资产制作
        </p>
      </div>

      {/* 右：职责列表（白底 + 细边框，横线分割，无卡片阴影） */}
      <div role="list" style={{ backgroundColor: C.white, border: `1px solid ${C.line}` }}>
        {duties.map((duty, index) => {
          const isLast = index === duties.length - 1;

          return (
            <div
              key={duty}
              role="listitem"
              style={{
                borderBottom: isLast ? 'none' : `1px solid ${C.line}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity .55s cubic-bezier(.22,.61,.36,1) ${index * 70}ms, transform .55s cubic-bezier(.22,.61,.36,1) ${index * 70}ms`,
              }}
            >
              {/* 悬停层单独放内层：外层的内联 transform 会压掉同元素上的 hover 位移 */}
              <div className="group flex items-start gap-4 px-4 py-5 transition-colors duration-300 hover:bg-[#E8E7E1] sm:gap-5 sm:px-6 sm:py-6">
                <span
                  translate="no"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[2px] text-[10.5px] font-black tracking-[.04em] text-[#626262] transition-colors duration-300 group-hover:bg-[#DDF344] group-hover:text-[#171717]"
                  style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <p className="min-w-0 flex-1 text-[14px] font-bold leading-[1.65] sm:text-[15px]" style={{ color: C.ink }}>
                  {duty}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
