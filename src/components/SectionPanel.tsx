import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { PortfolioRoute } from '../routes';

type SectionPanelProps = {
  route: PortfolioRoute;
  /** 是否为当前激活栏目 */
  isActive: boolean;
  /** 栏目底部的扩展内容（如 AI FILM 的 B站视频墙），数据为空时组件自行返回 null */
  children?: ReactNode;
};

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;
const ACCENT = '#2FE3C6';

/**
 * 单页滚动的栏区块。
 * 每个区块至少占满一屏，顶部留出固定导航栏的空间，标题不会被遮挡。
 * 交互：进入视口时标题 / 卡片依次淡入上移；卡片跟随指针做轻微 3D 倾斜并带青色描边与光斑。
 */
export default function SectionPanel({ route, isActive, children }: SectionPanelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // 进入视口后触发一次性入场动画（减少动态效果时直接显示）
  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      });
    }, { threshold: 0.16 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const reveal = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(30px)',
    transition: `opacity .62s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .62s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
  });

  /** 卡片跟随指针做轻微 3D 倾斜 + 光斑定位（只写 CSS 变量，不触发重渲染） */
  const handleCardMove = (event: ReactPointerEvent<HTMLElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    card.style.setProperty('--tilt-x', `${((0.5 - py) * 9).toFixed(2)}deg`);
    card.style.setProperty('--tilt-y', `${((px - 0.5) * 11).toFixed(2)}deg`);
    card.style.setProperty('--spot-x', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--spot-y', `${(py * 100).toFixed(1)}%`);
  };

  const handleCardLeave = (event: ReactPointerEvent<HTMLElement>) => {
    const card = event.currentTarget;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <section
      ref={sectionRef}
      id={route.sectionId}
      aria-label={`${route.title} — ${route.label}`}
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 pb-16 pt-32 text-white sm:px-8 sm:pb-20 sm:pt-36 lg:px-16"
      style={{ backgroundColor: route.color }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />

      {/* 巨大编号水印，随栏目进入缓慢放大 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 bottom-6 select-none sm:-right-6 sm:bottom-10"
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(120px, 26vw, 420px)',
          lineHeight: 0.8,
          color: 'rgba(255,255,255,.07)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(1.12) translateY(24px)',
          transition: 'transform 1s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        {route.number}
      </span>

      <div className="relative z-10 mx-auto w-full max-w-[1180px]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.22em] opacity-70 sm:mb-4 sm:text-xs" style={reveal(0)}>
          于文雅 VISUAL/AIGC / {route.number}
          <span
            className="ml-3 inline-block h-1.5 w-1.5 rounded-full align-middle transition-opacity duration-500"
            style={{ backgroundColor: ACCENT, opacity: isActive ? 1 : 0 }}
          />
        </p>

        <h2
          className="max-w-[1100px] uppercase"
          style={{
            ...reveal(70),
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(46px, 11vw, 168px)',
            lineHeight: 0.88,
            letterSpacing: '-.035em',
          }}
        >
          {route.title}
        </h2>

        <div className="mt-6 flex items-center gap-4 sm:mt-8" style={reveal(140)}>
          <span
            className="block h-px bg-white/70 transition-[width] duration-[900ms] ease-[cubic-bezier(.22,.61,.36,1)]"
            style={{ width: visible ? '5rem' : '0rem', transitionDelay: '200ms' }}
          />
          <p className="text-base font-semibold tracking-[.12em] sm:text-xl">{route.label}</p>
        </div>

        {route.intro ? (
          <p className="mt-4 max-w-[560px] text-sm leading-[1.7] opacity-85 sm:text-base" style={reveal(210)}>
            {route.intro}
          </p>
        ) : null}

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {route.groups.map((group, index) => (
            <div key={group.title} className="h-full" style={reveal(260 + index * 90)}>
              <article
                onPointerMove={handleCardMove}
                onPointerLeave={handleCardLeave}
                className="tilt-card group/card relative h-full overflow-hidden rounded-2xl p-5"
                style={{
                  backgroundColor: 'rgba(0,0,0,.16)',
                  border: '1px solid rgba(255,255,255,.18)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              >
                <span className="card-spot" aria-hidden="true" />
                <div className="relative">
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] opacity-60">{group.en}</p>
                  <h3 className="mt-2 flex items-center gap-2 text-lg font-bold tracking-[.02em] sm:text-xl">
                    {group.title}
                    <span
                      aria-hidden="true"
                      className="inline-block translate-x-0 opacity-0 transition-[transform,opacity] duration-300 group-hover/card:translate-x-1 group-hover/card:opacity-100"
                      style={{ color: ACCENT }}
                    >
                      →
                    </span>
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-2 text-xs leading-[1.6] opacity-85 sm:text-sm">
                        <span aria-hidden="true" style={{ color: ACCENT }}>—</span>
                        <span className="min-w-0 break-words">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>
          ))}
        </div>

        {/* 栏目扩展内容（数据驱动；无数据时不渲染） */}
        {children}
      </div>
    </section>
  );
}
