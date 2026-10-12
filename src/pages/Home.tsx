/**
 * 首页：TOONHUB 四屏 3D 潮玩角色轮播。
 * 视觉、构图、配色、动画、事件逻辑均沿用原实现，仅做了两处结构性迁移：
 * 1. 背景色改为读取 App 层的轮播状态（全站统一颜色来源）；
 * 2. 左上角 LOGO 移到固定的 SiteHeader 中（视觉位置不变，且点击可回首页）。
 */
import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCarousel } from '../context/CarouselContext';
import { useMenu } from '../context/MenuContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { FIGURINES, GRAIN } from '../data/site';

/** 与原实现一致的过渡曲线与时长 */
const ease = '650ms cubic-bezier(0.4,0,0.2,1)';

type Role = 'center' | 'left' | 'right' | 'back';

/**
 * TODO(待配置)：DISCOVER IT 的作品详情链接。
 * - 留空时保持原有占位行为：不跳转，也不会指向其他栏目；
 * - 配置后（例如 '/works/toonhub-figurines'）点击即跳转到作品详情页。
 */
const WORK_DETAIL_HREF = '';

export default function Home() {
  const { activeIndex, navigate, isAnimating, isMobile } = useCarousel();
  const { isOpen: isMenuOpen } = useMenu();
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLElement>(null);

  // 键盘左右切换轮播；菜单打开时禁用，避免误触底层交互
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (isMenuOpen) return;
      if (event.key === 'ArrowLeft') navigate('prev');
      if (event.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, isMenuOpen]);

  /**
   * 鼠标互动：把指针位置归一化后写入 CSS 变量（--mx / --my）。
   * 用 requestAnimationFrame + 缓动插值让跟随更顺滑，指针离开后自动回中。
   * 仅在「有真实指针（鼠标）」且未开启「减少动态效果」时启用。
   */
  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const stage = stageRef.current;
    if (!stage) return;

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let running = false;

    const write = () => {
      stage.style.setProperty('--mx', current.x.toFixed(4));
      stage.style.setProperty('--my', current.y.toFixed(4));
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      write();
      if (Math.abs(target.x - current.x) < 0.0015 && Math.abs(target.y - current.y) < 0.0015) {
        current.x = target.x;
        current.y = target.y;
        write();
        running = false;
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = window.requestAnimationFrame(tick);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      target.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      start();
    };

    const handlePointerLeave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };

    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      window.cancelAnimationFrame(frame);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [reducedMotion]);

  const roleByIndex = useMemo<Record<number, Role>>(
    () => ({
      [activeIndex]: 'center',
      [(activeIndex + 3) % 4]: 'left',
      [(activeIndex + 1) % 4]: 'right',
      [(activeIndex + 2) % 4]: 'back',
    }),
    [activeIndex],
  );

  const itemStyle = (role: Role) => {
    const positions = {
      center: {
        left: '50%',
        height: isMobile ? '60%' : '92%',
        bottom: isMobile ? '22%' : '0',
        transform: `translateX(-50%) scale(${isMobile ? 1.25 : 1.68})`,
        filter: 'blur(0)',
        opacity: 1,
        zIndex: 20,
      },
      left: {
        left: isMobile ? '20%' : '30%',
        height: isMobile ? '16%' : '28%',
        bottom: isMobile ? '32%' : '12%',
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
      },
      right: {
        left: isMobile ? '80%' : '70%',
        height: isMobile ? '16%' : '28%',
        bottom: isMobile ? '32%' : '12%',
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
      },
      back: {
        left: '50%',
        height: isMobile ? '13%' : '22%',
        bottom: isMobile ? '32%' : '12%',
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 1,
        zIndex: 5,
      },
    }[role];

    return {
      ...positions,
      position: 'absolute' as const,
      aspectRatio: '0.6 / 1',
      transition: `transform ${ease}, filter ${ease}, opacity ${ease}, left ${ease}`,
      willChange: 'transform, filter, opacity',
    };
  };

  const discoverLinkProps = WORK_DETAIL_HREF
    ? { href: WORK_DETAIL_HREF }
    : { href: '#figurines', onClick: (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault() };

  return (
    <section
      ref={stageRef}
      className="figurine-stage relative h-screen w-full overflow-hidden"
      aria-label="TOONHUB character figurine carousel"
    >
      <div
        className="pointer-events-none absolute inset-0 z-50 opacity-40"
        style={{ backgroundImage: GRAIN, backgroundSize: '200px 200px', backgroundRepeat: 'repeat' }}
      />

      <div
        className="figurine-backdrop pointer-events-none absolute inset-x-0 top-[18%] z-[2] flex select-none items-center justify-center"
        aria-hidden="true"
      >
        <span
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(120px, 36vw, 520px)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            letterSpacing: '-.02em',
            whiteSpace: 'nowrap',
          }}
        >
          AIGC
        </span>
      </div>

      <div className="absolute inset-0 z-[3]" aria-live="polite">
        {FIGURINES.map((image, index) => {
          const role = roleByIndex[index];
          return (
            <div key={image.src} style={itemStyle(role)} aria-hidden={role !== 'center'} className="figurine-item">
              <div className="figurine-layer" data-role={role}>
                <img
                  src={image.src}
                  alt={role === 'center' ? `TOONHUB featured figurine ${index + 1}` : ''}
                  className="figurine-image h-full w-full select-none"
                  style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
                  draggable={false}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 left-4 z-[60] max-w-[320px] sm:bottom-20 sm:left-24">
        <p
          className="mb-2 text-base font-bold uppercase text-white opacity-95 sm:mb-3 sm:text-[22px]"
          style={{ letterSpacing: '.02em' }}
        >
          TOONHUB FIGURINES
        </p>
        <p className="mb-4 hidden text-xs leading-[1.6] text-white opacity-85 sm:mb-5 sm:block sm:text-sm">
          The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many
          thanks! Wishing you the win. Order now.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('prev')}
            disabled={isAnimating}
            aria-label="Previous figurine"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-[transform,background-color] duration-150 hover:scale-[1.08] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait sm:h-16 sm:w-16"
          >
            <ArrowLeft size={26} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={() => navigate('next')}
            disabled={isAnimating}
            aria-label="Next figurine"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-[transform,background-color] duration-150 hover:scale-[1.08] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait sm:h-16 sm:w-16"
          >
            <ArrowRight size={26} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <a
        {...discoverLinkProps}
        className="absolute bottom-6 right-4 z-[60] flex items-center gap-2 uppercase text-white no-underline opacity-95 transition-opacity duration-200 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:bottom-20 sm:right-10"
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(20px, 4vw, 56px)',
          fontWeight: 400,
          letterSpacing: '-.02em',
          lineHeight: 1,
        }}
      >
        DISCOVER IT
        <ArrowRight className="h-5 w-5 sm:h-8 sm:w-8" strokeWidth={2.25} />
      </a>
    </section>
  );
}
