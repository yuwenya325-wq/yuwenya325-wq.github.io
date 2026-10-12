import { ArrowRight } from 'lucide-react';
import { C, scrollToId } from './theme';

/**
 * HERO 交互按钮。
 * EXPLORE WORKS →：平滑滚动到作品集首屏（复用现有 section id，不产生不存在的锚点）。
 * 黑底白字，hover 背景变荧光黄、文字转近黑。
 * 注：按用户要求已移除 DOWNLOAD CV 下载简历按钮。
 */

/** 作品集首个栏目（现有 section id） */
const WORK_SECTION = 'visual-design';

export default function AboutActions() {
  const buttonBase =
    'group inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-3.5 text-[12px] font-bold uppercase tracking-[.16em] outline-none transition-[background-color,color,border-color,transform] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={`#${WORK_SECTION}`}
        onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          scrollToId(WORK_SECTION);
        }}
        className={`${buttonBase} no-underline hover:-translate-y-px`}
        style={{ backgroundColor: C.ink, color: C.white }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = C.accent;
          event.currentTarget.style.color = C.ink;
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = C.ink;
          event.currentTarget.style.color = C.white;
        }}
      >
        EXPLORE WORKS
        <ArrowRight size={15} strokeWidth={2.6} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
      </a>
    </div>
  );
}
