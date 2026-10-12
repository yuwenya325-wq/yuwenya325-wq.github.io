import { SKILL_MODULES } from '../../data/skills';
import { C, useReveal } from './theme';

/**
 * SKILLS：2×2 技能矩阵。
 * 模块之间用细黑分割线划分；鼠标进入模块时背景渐变为荧光黄、
 * 标题轻微右移、编号放大、关键词加深。不使用百分比或掌握程度数值。
 */
export default function SkillsGrid() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.1);

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-2"
      style={{ borderTop: `1px solid ${C.ink}`, borderLeft: `1px solid ${C.ink}` }}
    >
      {SKILL_MODULES.map((module, index) => (
        <section
          key={module.en}
          aria-label={`${module.en} — ${module.cn}`}
          className="skill-cell group relative overflow-hidden p-6 sm:p-8"
          style={{
            borderBottom: `1px solid ${C.ink}`,
            borderRight: `1px solid ${C.ink}`,
            backgroundColor: C.bg,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: `background-color .4s ease, opacity .55s cubic-bezier(.22,.61,.36,1) ${index * 80}ms, transform .55s cubic-bezier(.22,.61,.36,1) ${index * 80}ms`,
          }}
          onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = C.accent; }}
          onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = C.bg; }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className="text-[10px] font-bold uppercase tracking-[.24em] transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: C.sub, fontFamily: 'Inter, sans-serif' }}
              >
                {module.cn}
              </p>
              <h3
                className="mt-2 text-[clamp(20px,2.4vw,30px)] font-black leading-[1.05] tracking-[-.01em] transition-transform duration-300 group-hover:translate-x-1.5"
                style={{ color: C.ink, fontFamily: 'Inter, sans-serif' }}
              >
                {module.en}
              </h3>
            </div>
            <span
              className="shrink-0 text-[clamp(24px,3vw,40px)] font-black leading-none transition-transform duration-300 group-hover:scale-125"
              style={{ color: C.ink, fontFamily: 'Inter, sans-serif', opacity: 0.22 }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2">
            {module.items.map((item) => (
              <li
                key={item}
                className="rounded-[2px] px-2.5 py-1.5 text-[11px] font-bold tracking-[.04em] transition-colors duration-300 sm:text-xs"
                style={{ border: `1px solid ${C.line}`, color: C.sub, backgroundColor: C.white }}
              >
                <span className="skill-tag-inner transition-colors duration-300 group-hover:text-[#171717]">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
