import { useEffect, useRef, useState } from 'react';
import VisualIcon from './VisualIcon';
import { VISUAL_CATEGORIES } from '../../data/visual';

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

/** 中文展示字体栈：重型黑体，保证笔画饱满，无需加载中文字库 */
const CN_DISPLAY = "'PingFang SC', 'HarmonyOS Sans SC', 'Source Han Sans SC', 'Noto Sans SC', 'Microsoft YaHei', 'Heiti SC', sans-serif";

/** 四个分类的强调色：句号流光与分隔线都从这里取色，呼应下方四个图标 */
const ACCENTS = VISUAL_CATEGORIES.map((category) => category.accent);
const ACCENT_GRADIENT = `linear-gradient(90deg, ${ACCENTS.map((accent, index) => {
  const from = ((index / ACCENTS.length) * 100).toFixed(1);
  const to = (((index + 1) / ACCENTS.length) * 100).toFixed(1);
  return `${accent} ${from}% ${to}%`;
}).join(', ')})`;

type VisualDesignSectionProps = {
  /** 点击某个分类图标（300ms 放大过渡结束后调用），由上层做真实路由跳转 */
  onOpenCategory: (path: string) => void;
};

/**
 * 首页的 VISUAL DESIGN 入口区。
 *
 * 奶油白底 + 四个分类图标（正式静态 3D 渲染素材）：图标保持原始比例、
 * 原地轻微悬浮摆转（不做公转、不做整图翻转）；点击直接进入该分类的独立作品页
 * （/visual/poster、/visual/banner、/visual/typography、/visual/ip-vi）。
 */
export default function VisualDesignSection({ onOpenCategory }: VisualDesignSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

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
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const reveal = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(26px)',
    transition: `opacity .62s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .62s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
  });

  return (
    <section
      ref={sectionRef}
      id="visual-design"
      aria-label="VISUAL DESIGN — 视觉设计"
      className="vd-section relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />

      {/* 巨大编号水印，与其他栏目保持同一套节奏 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 bottom-6 select-none sm:-right-6 sm:bottom-10"
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(120px, 26vw, 420px)',
          lineHeight: 0.8,
          color: 'rgba(23,23,23,.05)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(1.12) translateY(24px)',
          transition: 'transform 1s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        03
      </span>

      <div className="relative z-10 mx-auto w-full max-w-[1320px]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.22em] opacity-70 sm:mb-4 sm:text-xs" style={reveal(0)}>
          于文雅 VISUAL/AIGC / 03
          <span className="ml-3 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: '#171717' }} />
        </p>

        <h2
          className="vd-title vd-title-cn flex flex-wrap items-baseline gap-x-[0.06em]"
          translate="no"
          aria-label="视觉设计"
          style={{
            ...reveal(70),
            fontFamily: CN_DISPLAY,
            fontWeight: 900,
            fontSize: 'clamp(40px, 9.4vw, 138px)',
            lineHeight: 1.04,
            letterSpacing: '.01em',
          }}
        >
          {(() => {
            let index = 0;
            const letter = (ch: string) => (
              <span key={`${index}-${ch}`} className="vd-l" aria-hidden="true" style={{ ['--i' as string]: index++ }}>
                {ch}
              </span>
            );
            return (
              <>
                <span className="vd-word">{[...'视觉'].map(letter)}</span>
                <span className="vd-word is-outline">{[...'设计'].map(letter)}</span>
                <span className="vd-dot" aria-hidden="true" style={{ backgroundImage: ACCENT_GRADIENT }}>。</span>
              </>
            );
          })()}
        </h2>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 sm:mt-7" style={reveal(140)}>
          <span
            className="block h-[3px] rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(.22,.61,.36,1)]"
            style={{ width: visible ? '5rem' : '0rem', backgroundImage: ACCENT_GRADIENT, transitionDelay: '200ms' }}
          />
          <p
            className="text-xs font-semibold tracking-[.18em] sm:text-sm"
            translate="no"
            style={{ color: 'rgba(23,23,23,.8)' }}
          >
            选择一个类别进行探索
          </p>
        </div>

        {/* 四个独立图标：桌面横向等距排列，移动端 2×2 */}
        <div className="vd-grid mt-10 sm:mt-14">
          {VISUAL_CATEGORIES.map((category, index) => (
            <div
              key={category.id}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(22px)',
                transition: `opacity .6s cubic-bezier(.22,.61,.36,1) ${240 + index * 90}ms, transform .6s cubic-bezier(.22,.61,.36,1) ${240 + index * 90}ms`,
              }}
            >
              <VisualIcon category={category} onActivate={onOpenCategory} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
