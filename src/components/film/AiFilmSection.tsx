import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clapperboard, ImagePlus } from 'lucide-react';
import FilmPlayer from './FilmPlayer';
import Lightbox, { type LightboxItem } from '../visual/Lightbox';
import {
  AI_FILM_CATEGORIES,
  categoryLabel,
  projectsByCategory,
  type AiFilmCategory,
  type AiFilmProject,
} from '../../data/ai-film';
import { FILM, FILM_ON_ACCENT } from './theme';

/** 纸面颗粒：极低不透明度，只给奶油底一点呼吸感，不形成明显纹理 */
const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

/** 三个制作资产位：顺序固定为人物 → 场景 → 道具，缺图时保留同样结构，不编造内容 */
const ASSET_SLOTS = [
  { kind: 'character', cn: '人物资产', en: 'CHARACTER' },
  { kind: 'scene', cn: '场景资产', en: 'ENVIRONMENT' },
  { kind: 'prop', cn: '道具资产', en: 'PROP' },
] as const;

const KIND_EN: Record<string, string> = {
  character: 'CHARACTER',
  scene: 'ENVIRONMENT',
  prop: 'PROP',
  storyboard: 'STORYBOARD',
};

type AiFilmSectionProps = {
  /** 进入项目详情页（/film/<slug>），由上层做真实路由跳转 */
  onOpenProject: (path: string) => void;
};

/**
 * 首页 AI FILM 区域（id="ai-film"）—— TOONHUB CINEMA 暖奶油电影展厅。
 *
 * 结构：居中章节标题 + 三分类胶囊 + 白色 32px 圆角作品展板（左 60% 视频、右 40% 信息与资产）。
 * - 分类与当前影片都在组件内管理，切换不刷新页面；
 * - 播放器只在点击后挂载；切换影片时用 key 重建模块，旧 iframe 随之卸载（音频不会继续播）；
 * - 所有内容来自 src/data/ai-film.ts，没有真实资料时显示结构化空状态，绝不编造影片内容。
 */
export default function AiFilmSection({ onOpenProject }: AiFilmSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState<AiFilmCategory>('anime');
  const [index, setIndex] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);

  // 进入视口后触发一次性揭示动画
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

  const projects = useMemo(() => projectsByCategory(category), [category]);
  const project = projects[index] ?? null;
  const total = projects.length;

  const selectCategory = (next: AiFilmCategory) => {
    if (next === category) return;
    setCategory(next);
    setIndex(0);
    setPreview(null);
  };

  const step = (direction: 1 | -1) => {
    if (total < 2) return;
    setIndex((current) => (current + direction + total) % total);
    setPreview(null);
  };

  const assets = project ? project.assets.slice(0, 3) : [];
  const lightboxItems = useMemo<LightboxItem[]>(
    () => assets.map((asset) => ({
      src: asset.full,
      thumb: asset.thumb,
      title: asset.title,
      meta: project ? `${project.title} · ${asset.note ?? asset.kind}` : undefined,
    })),
    [assets, project],
  );

  /** 滚动揭示：元素从下方淡入（distance 控制上浮幅度） */
  const reveal = (delay: number, distance = 24) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
    transition: `opacity .62s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .62s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
  });

  return (
    <section
      ref={sectionRef}
      id="ai-film"
      aria-label="AI FILM — AI影视作品"
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-16"
      style={{
        color: FILM.text,
        backgroundColor: FILM.bg,
        backgroundImage: `linear-gradient(180deg, ${FILM.bgTop} 0%, ${FILM.bg} 46%, ${FILM.bgBottom} 100%)`,
      }}
    >
      {/* 极轻纸面颗粒，不形成明显纹理 */}
      <div className="pointer-events-none absolute inset-0 opacity-[.03]" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />

      {/* 巨大编号水印，与 VISUAL DESIGN 的「03」保持同一套节奏 */}
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
        04
      </span>

      <div className="relative z-10 mx-auto w-full max-w-[1320px]">
        {/* ── 标题区：中文黑 / 英文灰，分层级 ─────────────────────────── */}
        <header className="text-center">
          <p
            translate="no"
            className="text-[11px] font-bold uppercase tracking-[.34em] sm:text-xs"
            style={{ ...reveal(0, 14), color: FILM.label }}
          >
            04 / CINEMATIC WORKS
          </p>

          <h2
            translate="no"
            className="mt-4"
            style={{
              ...reveal(70, 26),
              fontFamily: "'PingFang SC','HarmonyOS Sans SC','Source Han Sans SC','Noto Sans SC','Microsoft YaHei',sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(38px, 8vw, 112px)',
              lineHeight: 1.04,
              letterSpacing: '.01em',
              color: FILM.text,
            }}
          >
            AI影视作品
          </h2>

          <p
            translate="no"
            className="mt-3 text-[11px] font-bold uppercase tracking-[.36em] sm:mt-4 sm:text-sm"
            style={{ ...reveal(120, 16), color: FILM.muted, fontFamily: 'Inter, sans-serif' }}
          >
            AI FILM &amp; CINEMA
          </p>

          {/* ── 分类胶囊：移动端横向滚动，桌面居中排列 ─────────────────── */}
          <div
            role="tablist"
            aria-label="影视分类"
            className="-mx-4 mt-8 flex items-center gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:mt-10 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
            style={reveal(170, 18)}
          >
            {AI_FILM_CATEGORIES.map((item) => {
              const selected = item.id === category;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`af-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls="af-panel"
                  onClick={() => selectCategory(item.id)}
                  className="group inline-flex h-12 shrink-0 items-center gap-2.5 rounded-[24px] px-6 text-sm font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: selected ? FILM.accent : 'transparent',
                    border: `1px solid ${selected ? FILM.accent : FILM.border}`,
                    color: selected ? FILM_ON_ACCENT : FILM.body,
                    boxShadow: selected ? `0 8px 20px ${FILM.accentSoft}` : 'none',
                    outlineColor: FILM.accentBright,
                  }}
                  onMouseEnter={(event) => {
                    if (selected) return;
                    event.currentTarget.style.borderColor = FILM.accent;
                    event.currentTarget.style.color = FILM.accentBright;
                  }}
                  onMouseLeave={(event) => {
                    if (selected) return;
                    event.currentTarget.style.borderColor = FILM.border;
                    event.currentTarget.style.color = FILM.body;
                  }}
                >
                  <span>{item.cn}</span>
                  <span
                    translate="no"
                    className="text-[9px] font-bold uppercase tracking-[.18em]"
                    style={{ fontFamily: 'Inter, sans-serif', opacity: selected ? 0.85 : 0.5 }}
                  >
                    {item.en}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ── 作品展板：白色 32px 圆角 + 悬浮阴影 ─────────────────────── */}
        <div
          id="af-panel"
          role="tabpanel"
          aria-labelledby={`af-tab-${category}`}
          className="mt-8 sm:mt-10"
          style={{ ...reveal(220, 18), backgroundColor: FILM.panel, borderRadius: 32, boxShadow: FILM.shadow, border: `1px solid ${FILM.divider}` }}
        >
          <div
            key={project ? project.id : `empty-${category}`}
            className="af-swap grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-7 lg:p-6"
          >
            {/* 左 60%：视频位（白色 24px 圆角） */}
            <div
              className="relative flex items-center overflow-hidden rounded-[24px]"
              style={{ backgroundColor: FILM.tile, border: `1px solid ${FILM.divider}` }}
            >
              {project ? <FilmPlayer project={project} /> : <EmptyStage category={category} />}
            </div>

            {/* 右 40%：影片信息与制作资产 */}
            <div className="flex min-w-0 flex-col p-1 sm:p-2 lg:py-2 lg:pr-2">
              {project ? (
                <ProjectInfo project={project} assets={assets} onPreview={setPreview} onOpenProject={onOpenProject} />
              ) : (
                <EmptyInfo category={category} />
              )}
            </div>
          </div>
        </div>

        {/* ── 作品导航：多部作品时出现 ─────────────────────────────────── */}
        {total > 1 ? (
          <div className="mt-5 flex items-center justify-between gap-4 sm:mt-6">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="上一部作品"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2"
              style={{ border: `1px solid ${FILM.border}`, color: FILM.body, outlineColor: FILM.accentBright, backgroundColor: '#FFFFFF' }}
              onMouseEnter={(event) => { event.currentTarget.style.borderColor = FILM.accent; event.currentTarget.style.color = FILM.accentBright; }}
              onMouseLeave={(event) => { event.currentTarget.style.borderColor = FILM.border; event.currentTarget.style.color = FILM.body; }}
            >
              <ArrowLeft size={16} strokeWidth={2.4} aria-hidden="true" />
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
              {projects.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setIndex(itemIndex); setPreview(null); }}
                  aria-label={`切换到《${item.title}》`}
                  aria-current={itemIndex === index}
                  className="h-1.5 rounded-full transition-[width,background-color] duration-300"
                  style={{
                    width: itemIndex === index ? '2rem' : '0.5rem',
                    backgroundColor: itemIndex === index ? FILM.accent : FILM.border,
                  }}
                />
              ))}
              <p className="ml-2 truncate text-[11px] font-bold uppercase tracking-[.16em]" style={{ color: FILM.muted }}>
                <span translate="no">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
                <span className="ml-3 hidden sm:inline">{project?.title}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label="下一部作品"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2"
              style={{ border: `1px solid ${FILM.border}`, color: FILM.body, outlineColor: FILM.accentBright, backgroundColor: '#FFFFFF' }}
              onMouseEnter={(event) => { event.currentTarget.style.borderColor = FILM.accent; event.currentTarget.style.color = FILM.accentBright; }}
              onMouseLeave={(event) => { event.currentTarget.style.borderColor = FILM.border; event.currentTarget.style.color = FILM.body; }}
            >
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {preview !== null && lightboxItems.length ? (
        <Lightbox
          items={lightboxItems}
          index={Math.min(preview, lightboxItems.length - 1)}
          onIndex={setPreview}
          onClose={() => setPreview(null)}
          accent={FILM.accent}
        />
      ) : null}
    </section>
  );
}

/* ── 右侧信息（有作品时） ───────────────────────────────────────────── */

function ProjectInfo({
  project,
  assets,
  onPreview,
  onOpenProject,
}: {
  project: AiFilmProject;
  assets: AiFilmProject['assets'];
  onPreview: (index: number) => void;
  onOpenProject: (path: string) => void;
}) {
  const meta = categoryLabel(project.category);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.accentBright }}>
        <Clapperboard size={14} strokeWidth={2.6} aria-hidden="true" />
        {meta.en}
        <span className="text-[10px] font-semibold tracking-[.16em]" style={{ color: FILM.muted }}>{meta.cn}</span>
      </p>

      <h3
        className="mt-3 font-black leading-[1.12]"
        style={{
          fontFamily: "'PingFang SC','HarmonyOS Sans SC','Source Han Sans SC','Noto Sans SC','Microsoft YaHei',sans-serif",
          fontSize: 'clamp(24px, 2.6vw, 36px)',
          color: FILM.text,
        }}
      >
        {project.title}
      </h3>
      {project.englishTitle ? (
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.muted }}>
          {project.englishTitle}
        </p>
      ) : null}

      <p className="mt-4 text-[13px] leading-[1.8]" style={{ color: FILM.body }}>{project.description}</p>

      {/* 三张制作资产卡（白色图片卡） */}
      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.muted }}>
          MAKING-OF ASSETS
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {ASSET_SLOTS.map((slot, slotIndex) => {
            const asset = assets[slotIndex];
            const label = asset ? (KIND_EN[asset.kind] ?? slot.en) : slot.en;
            if (!asset) {
              return (
                <div
                  key={slot.kind}
                  className="af-rise flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-[16px] text-center"
                  style={{
                    animationDelay: `${slotIndex * 100}ms`,
                    backgroundColor: FILM.tile,
                    border: `1px dashed ${FILM.border}`,
                    color: FILM.muted,
                  }}
                >
                  <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
                  <span className="text-[10px] font-bold" translate="no">{label}</span>
                </div>
              );
            }
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => onPreview(slotIndex)}
                className="af-rise group relative aspect-[4/3] overflow-hidden rounded-[16px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ animationDelay: `${slotIndex * 100}ms`, backgroundColor: FILM.tile, border: `1px solid ${FILM.divider}`, outlineColor: FILM.accentBright }}
                aria-label={`预览资产：${asset.title}`}
              >
                <img
                  src={asset.thumb}
                  alt={asset.title}
                  width={asset.width}
                  height={asset.height}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.06]"
                />
                <span
                  className="absolute inset-x-0 bottom-0 truncate px-2 py-1.5 text-[10px] font-bold tracking-[.12em]"
                  translate="no"
                  style={{ backgroundColor: 'rgba(255,255,255,.9)', color: FILM.body, fontFamily: 'Inter, sans-serif' }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 查看故事设定 */}
      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={() => onOpenProject(`/film/${project.detailSlug}`)}
          className="group inline-flex items-center gap-3 rounded-full px-5 py-3 text-[12px] font-bold transition-[background-color,border-color,color] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ backgroundColor: '#FFFFFF', border: `1px solid ${FILM.border}`, color: FILM.body, outlineColor: FILM.accentBright }}
          onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = FILM.accent; event.currentTarget.style.borderColor = FILM.accent; event.currentTarget.style.color = FILM_ON_ACCENT; }}
          onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = '#FFFFFF'; event.currentTarget.style.borderColor = FILM.border; event.currentTarget.style.color = FILM.body; }}
        >
          VIEW PROJECT
          <ArrowRight size={14} strokeWidth={2.8} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ── 空状态：没有影片时保留完整结构，不编造内容 ───────────────────────── */

function EmptyStage({ category }: { category: AiFilmCategory }) {
  const meta = categoryLabel(category);
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ border: `1px dashed ${FILM.accent}`, color: FILM.accent }}
        aria-hidden="true"
      >
        <Clapperboard size={22} strokeWidth={2.2} />
      </span>
      <p className="text-sm font-bold" style={{ color: FILM.text }}>{meta.cn}影片待上传</p>
      <p className="max-w-[30ch] text-xs leading-[1.8]" style={{ color: FILM.muted }}>
        提供 B 站链接与封面图后，这里会显示 16:9 封面与播放按钮，点击才加载播放器。
      </p>
    </div>
  );
}

function EmptyInfo({ category }: { category: AiFilmCategory }) {
  const meta = categoryLabel(category);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.accentBright }}>
        <Clapperboard size={14} strokeWidth={2.6} aria-hidden="true" />
        {meta.en}
        <span className="text-[10px] font-semibold tracking-[.16em]" style={{ color: FILM.muted }}>{meta.cn}</span>
      </p>

      <h3 className="mt-3 text-xl font-black" style={{ color: FILM.text }}>影片名称待补充</h3>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.muted }}>
        ENGLISH TITLE
      </p>

      <p className="mt-4 text-[13px] leading-[1.8]" style={{ color: FILM.body }}>
        影片简介待补充：讲什么、用什么工具做的、亮点是什么。
      </p>

      <div className="mt-6">
        <p className="text-[10px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.muted }}>
          MAKING-OF ASSETS
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {ASSET_SLOTS.map((slot) => (
            <div
              key={slot.kind}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-[16px] text-center"
              style={{ backgroundColor: FILM.tile, border: `1px dashed ${FILM.border}`, color: FILM.muted }}
            >
              <ImagePlus size={16} strokeWidth={2} aria-hidden="true" />
              <span className="text-[10px] font-bold" translate="no">{slot.en}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <span
          className="inline-flex items-center gap-3 rounded-full px-5 py-3 text-[12px] font-bold"
          style={{ backgroundColor: FILM.tile, border: `1px dashed ${FILM.border}`, color: FILM.muted }}
          aria-disabled="true"
        >
          VIEW PROJECT
          <ArrowRight size={14} strokeWidth={2.8} aria-hidden="true" />
        </span>
        <p className="mt-3 text-[11px]" style={{ color: FILM.muted }}>
          剧本概述、人物、场景与道具资料将在项目上传后开放。
        </p>
      </div>
    </div>
  );
}
