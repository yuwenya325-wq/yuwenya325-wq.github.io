/**
 * 全屏导航菜单。
 *
 * 设计要点：
 * - 背景色直接取当前轮播状态的主色（useCarousel().bg），不另建颜色数据；
 * - 与首页一致的胶片颗粒纹理、Anton 超大英文排版；
 * - 打开：背景淡入 + 六条导航文字依次错峰进入；关闭：文字淡出 → 覆盖层消失；
 * - 打开期间锁定页面滚动、阻断底层交互，支持 Escape 关闭并做焦点管理；
 * - 尊重系统「减少动态效果」偏好；
 * - 组件常驻挂载（通过状态控制显隐）以便播放关闭动画，但不使用任何复杂粒子 / 视频 / 3D。
 */
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '../router';
import { useMenu } from '../context/MenuContext';
import { useCarousel } from '../context/CarouselContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { GRAIN, NAV_ITEMS } from '../data/site';

export default function FullscreenMenu() {
  const { isOpen, close } = useMenu();
  const { bg } = useCarousel();
  const reducedMotion = usePrefersReducedMotion();

  /** 覆盖层是否存在于 DOM 中（关闭动画播放完后移除） */
  const [rendered, setRendered] = useState(isOpen);
  /** 是否处于"已展开"状态，用于驱动淡入 / 淡出 */
  const [active, setActive] = useState(isOpen);

  const dialogRef = useRef<HTMLDivElement>(null);

  // 面板淡入淡出时长（300–500ms 区间），减少动态效果时归零
  const duration = reducedMotion ? 0 : 420;
  const stagger = reducedMotion ? 0 : 55;

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      const frame = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(frame);
    }
    setActive(false);
    const timer = window.setTimeout(() => setRendered(false), duration);
    return () => window.clearTimeout(timer);
  }, [isOpen, duration]);

  // 锁定页面滚动（带滚动条宽度补偿，避免背景内容跳动），关闭时严格还原
  useEffect(() => {
    if (!isOpen) return;
    const { body } = document;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  // Escape 关闭 + Tab 焦点循环（范围含右上角 CLOSE 按钮与所有导航项）
  useEffect(() => {
    if (!isOpen) return;

    const getFocusables = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-menu-focusable]')).filter(
        (element) => !element.hasAttribute('disabled'),
      );

    // 打开后把焦点移到第一个导航项
    const firstLink = dialogRef.current?.querySelector<HTMLElement>('a[data-menu-focusable]');
    firstLink?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = getFocusables();
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = current ? focusables.includes(current) : false;

      if (event.shiftKey && (!inside || current === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || current === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 关闭后把焦点还给右上角菜单按钮
      document.querySelector<HTMLElement>('[data-menu-toggle]')?.focus();
    };
  }, [isOpen, close]);

  if (!rendered) return null;

  return (
    <div
      id="site-menu"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="站点导航"
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain"
      style={{ backgroundColor: bg, opacity: active ? 1 : 0, transition: `opacity ${duration}ms ease` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: GRAIN, backgroundSize: '200px 200px', backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />

      <nav
        aria-label="主导航"
        className="relative mx-auto flex min-h-full w-full max-w-[1440px] flex-col justify-center px-4 pb-14 pt-28 sm:px-8 sm:pt-32 lg:px-16"
      >
        <ul className="divide-y divide-white/20">
          {NAV_ITEMS.map((item, index) => (
            <li key={item.id}>
              <Link
                to={item.path}
                onClick={() => close()}
                data-menu-focusable
                className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:grid-cols-[4.5rem_1fr_auto] sm:gap-8 sm:py-5"
                style={{
                  opacity: active ? 1 : 0,
                  transform: active ? 'translateY(0)' : 'translateY(18px)',
                  transition: `opacity ${duration}ms ease ${active ? index * stagger : 0}ms, transform ${duration}ms ease ${active ? index * stagger : 0}ms`,
                }}
              >
                <span
                  className="text-[11px] font-semibold tabular-nums text-white/70 sm:text-sm"
                  style={{ letterSpacing: '.14em' }}
                >
                  {item.number}
                </span>

                <span className="flex items-center gap-3 sm:gap-5">
                  <span
                    className="transition-transform duration-300 ease-out group-hover:translate-x-3 group-focus-visible:translate-x-3"
                    style={{
                      fontFamily: 'Anton, sans-serif',
                      fontSize: 'clamp(28px, 6.5vw, 56px)',
                      lineHeight: 1,
                      letterSpacing: '-.01em',
                      fontWeight: 400,
                    }}
                  >
                    {item.en}
                  </span>
                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:h-7 sm:w-7"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                </span>

                <span className="text-right text-xs text-white/85 sm:text-[15px]">{item.zh}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
