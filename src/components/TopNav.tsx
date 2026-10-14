import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Menu, X } from 'lucide-react';
import { PORTFOLIO_ROUTES } from '../routes';

type TopNavProps = {
  /** 当前激活栏目的 sectionId */
  activeId: string;
  /** 点击导航项（已 preventDefault，由上层负责平滑滚动与 URL 同步） */
  onSelect: (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => void;
};

/** 参考截图中的青绿色强调色 */
const ACCENT = '#2FE3C6';
/** 半透明深色玻璃底：更透、边框更收敛，配一层极轻投影，观感更「薄」更精致 */
const GLASS = 'rgba(14, 16, 20, 0.52)';
const BORDER = 'rgba(255, 255, 255, 0.10)';
const GLASS_STYLE = {
  backgroundColor: GLASS,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  backdropFilter: 'blur(16px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
  boxShadow: '0 8px 26px rgba(8, 10, 14, .16), inset 0 1px 0 rgba(255, 255, 255, .08)',
} as const;

export default function TopNav({ activeId, onSelect }: TopNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  /** 滑块（当前栏目的高亮指示块）位置与宽度 */
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const [progress, setProgress] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // 滚动进度条（页面顶部细线，rAF 节流）
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const handle = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', handle, { passive: true });
    window.addEventListener('resize', handle);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handle);
      window.removeEventListener('resize', handle);
    };
  }, []);

  // 高亮滑块跟随当前栏目（含窗口尺寸变化）
  useEffect(() => {
    const update = () => {
      const element = itemRefs.current[activeId];
      if (!element) {
        setPill((previous) => ({ ...previous, ready: false }));
        return;
      }
      setPill({ left: element.offsetLeft, width: element.offsetWidth, ready: true });
    };
    update();
    const observer = new ResizeObserver(update);
    if (listRef.current) observer.observe(listRef.current);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [activeId]);

  // 移动端面板：Esc 关闭、点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const handleSelect = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    setIsOpen(false);
    onSelect(event, sectionId);
  };

  return (
    <header className="site-top-nav fixed inset-x-0 top-0 z-[120] px-3 pt-3 sm:px-5 sm:pt-4">
      {/* 阅读进度条 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] overflow-hidden" aria-hidden="true">
        <div
          className="h-full origin-left transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})`, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}66)` }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] items-start justify-between gap-3">
        {/* 左侧品牌 */}
        <a
          href="/#home"
          onClick={(event) => handleSelect(event, 'home')}
          aria-label="于文雅 VISUAL/AIGC — 回到首页顶部"
          className="group flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 no-underline outline-none transition-[border-color,transform] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-5 lg:px-3.5"
          style={GLASS_STYLE}
          onMouseEnter={(event) => { event.currentTarget.style.borderColor = `${ACCENT}66`; }}
          onMouseLeave={(event) => { event.currentTarget.style.borderColor = BORDER; }}
        >
          <span className="text-[11px] font-bold leading-none tracking-[.12em] text-white lg:text-xs">于文雅</span>
          <span className="site-brand-divider h-3 w-px shrink-0 bg-white/25" aria-hidden="true" />
          <span className="site-brand-secondary text-[11px] font-bold leading-none tracking-[.12em] text-white/70 transition-colors duration-300 group-hover:text-white lg:text-xs">
            VISUAL/AIGC
          </span>
        </a>

        {/* 右侧导航：桌面 / 平板 */}
        <nav
          aria-label="栏目导航"
          className="hidden md:block"
        >
          <div
            ref={listRef}
            className="relative flex h-12 items-center gap-1 rounded-2xl px-2"
            style={GLASS_STYLE}
          >
            {/* 滑动高亮滑块 */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 rounded-xl transition-[left,width,opacity] duration-300 ease-[cubic-bezier(.22,.61,.36,1)]"
              style={{
                left: pill.left,
                width: pill.width,
                height: 'calc(100% - 16px)',
                transform: 'translateY(-50%)',
                opacity: pill.ready ? 1 : 0,
                backgroundColor: `${ACCENT}16`,
                border: `1px solid ${ACCENT}59`,
                boxShadow: `0 0 12px ${ACCENT}1f`,
              }}
            />
            {PORTFOLIO_ROUTES.map((item) => {
              const isActive = item.sectionId === activeId;
              return (
                <a
                  key={item.sectionId}
                  ref={(element) => { itemRefs.current[item.sectionId] = element; }}
                  href={`#${item.sectionId}`}
                  onClick={(event) => handleSelect(event, item.sectionId)}
                  aria-current={isActive ? 'true' : undefined}
                  className="relative z-10 rounded-xl px-2.5 py-2 text-[11px] font-bold uppercase tracking-[.12em] no-underline outline-none transition-[color,transform] duration-200 hover:-translate-y-px lg:px-3.5 lg:text-xs"
                  style={{ color: isActive ? ACCENT : 'rgba(255,255,255,.86)' }}
                  onMouseEnter={(event) => { if (!isActive) event.currentTarget.style.color = ACCENT; }}
                  onMouseLeave={(event) => { if (!isActive) event.currentTarget.style.color = 'rgba(255,255,255,.86)'; }}
                  onFocus={(event) => {
                    event.currentTarget.style.outline = `2px solid ${ACCENT}`;
                    event.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={(event) => { event.currentTarget.style.outline = 'none'; }}
                >
                  {item.navLabel}
                </a>
              );
            })}
            <span
              className="ml-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full"
              aria-hidden="true"
              style={{ backgroundColor: ACCENT, boxShadow: `0 0 0 3px ${ACCENT}18` }}
            />
          </div>
        </nav>

        {/* 移动端折叠按钮 */}
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-nav-panel"
          aria-label={isOpen ? '关闭导航' : '打开导航'}
          onClick={() => setIsOpen((open) => !open)}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-[.14em] outline-none transition-[border-color,transform] duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
          style={{ ...GLASS_STYLE, borderColor: isOpen ? ACCENT : BORDER, color: isOpen ? ACCENT : '#fff' }}
        >
          <span className="site-menu-label">{isOpen ? 'CLOSE' : 'MENU'}</span>
          {isOpen ? <X className="h-4 w-4" strokeWidth={2.4} /> : <Menu className="h-4 w-4" strokeWidth={2.4} />}
        </button>
      </div>

      {/* 移动端展开面板 */}
      <div
        ref={panelRef}
        id="mobile-nav-panel"
        hidden={!isOpen}
        className="mobile-nav-panel mx-auto mt-2 w-full max-w-[1320px] rounded-2xl p-1.5 md:hidden"
        style={GLASS_STYLE}
      >
        {PORTFOLIO_ROUTES.map((item, index) => {
          const isActive = item.sectionId === activeId;
          return (
            <a
              key={item.sectionId}
              href={`#${item.sectionId}`}
              onClick={(event) => handleSelect(event, item.sectionId)}
              aria-current={isActive ? 'true' : undefined}
              className="nav-panel-item flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold uppercase tracking-[.12em] no-underline outline-none transition-colors"
              style={{
                color: isActive ? ACCENT : 'rgba(255,255,255,.88)',
                backgroundColor: isActive ? `${ACCENT}14` : 'transparent',
                animationDelay: `${index * 40}ms`,
              }}
            >
              <span>{item.navLabel}</span>
              <span className="text-[11px] font-medium tracking-[.08em] opacity-70">{item.label}</span>
            </a>
          );
        })}
      </div>
    </header>
  );
}
