import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Layers, Plus } from 'lucide-react';
import Lightbox, { type LightboxItem } from './Lightbox';
import VisualIcon from './VisualIcon';
import WorkImage from '../media/WorkImage';
import { siblingCategories, workFullSrc, workSources, type VisualCategory, type VisualWork } from '../../data/visual';

/** 页面主题：与 ABOUT 区同一套 Minimal Black & White × Neon Yellow */
const C = {
  bg: '#F4F3EF',
  ink: '#171717',
  sub: '#626262',
  faint: '#8A8A82',
  accent: '#DDF344',
  line: '#D6D5CF',
  soft: '#EFEEE8',
} as const;

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E")`;

type VisualWorkPageProps = {
  category: VisualCategory;
  /** 回到首页顶部 */
  onHome: () => void;
  /** 返回首页的 VISUAL DESIGN 入口区 */
  onBack: () => void;
  /** 打开另一个分类的作品页 */
  onOpenCategory: (path: string) => void;
  /** 打开作品详情页（提供后：有 slug 的作品点击进详情而非灯箱） */
  onOpenWork?: (slug: string) => void;
  /** 打开 IP 项目详情页（IP & VI 分类的项目入口卡片用） */
  onOpenProject?: (projectId: string) => void;
};

/** 带分组信息的预览条目（IP 分类会把项目名带进来） */
type WorkEntry = VisualWork & { key: string; group?: string };

/** 不同布局下图片的实际渲染宽度提示（帮助浏览器选对档位，避免浪费流量） */
const SIZES_BY_LAYOUT: Record<string, string> = {
  masonry: '(min-width: 1280px) 30vw, (min-width: 640px) 46vw, 92vw',
  wide: '(min-width: 1320px) 1188px, 92vw',
  display: '(min-width: 640px) 46vw, 92vw',
  project: '(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw',
};

/** 拥有独立详情页的分类（其余分类点击进入高清预览灯箱） */
const DETAIL_CATEGORY_IDS = new Set<string>(['poster', 'banner']);

/**
 * 单个分类的独立作品页。
 *
 * 路由由上层（App）真实处理：/visual/poster、/visual/banner、
 * /visual/typography、/visual/ip-vi 可以直接打开、刷新、前进后退。
 * 作品数据来自 src/data/visual.ts；没有作品时显示简洁空状态，不使用虚假图片。
 */
export default function VisualWorkPage({ category, onHome, onBack, onOpenCategory, onOpenWork, onOpenProject }: VisualWorkPageProps) {
  const [preview, setPreview] = useState<number | null>(null);
  const siblings = siblingCategories(category.id);

  /** 展平所有作品（供图片放大预览使用） */
  const entries = useMemo<WorkEntry[]>(() => {
    if (category.layout === 'project') {
      return category.projects.flatMap((project) => project.groups.flatMap((group) => group.items.map((work) => ({
        ...work,
        key: `${project.id}-${group.en}-${work.slug || work.src || work.thumb}`,
        group: `${project.name} · ${group.title}`,
      }))));
    }
    return category.works.map((work) => ({ ...work, key: work.slug || work.src || work.thumb || work.title }));
  }, [category]);

  const previewItems = useMemo<LightboxItem[]>(
    () => entries.map((entry) => ({
      src: workFullSrc(entry),
      thumb: entry.thumb || entry.cover,
      title: entry.title,
      meta: entry.group ?? entry.meta,
    })),
    [entries],
  );

  useEffect(() => {
    document.title = `${category.en} ${category.cn} — VISUAL DESIGN — 于文雅 VISUAL/AIGC`;
  }, [category]);

  /** 作品卡片进入视口时轻微淡入上移（动画挂在外层 div，避免与卡片 hover 位移的 transform 冲突） */
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-vw-reveal]:not(.is-inview)'));
    if (!elements.length) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-inview'));
      return undefined;
    }
    const observer = new IntersectionObserver((observed) => {
      observed.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [category, entries]);

  /** 每个作品卡片：详情类分类（有 slug）点击进详情页，其余点击进入高清预览；
   *  卡片 hover 时图片轻微放大并浮现 VIEW PROJECT / VIEW WORK 提示；
   *  外层 div 负责入场淡入（与卡片自身 hover 位移分层，避免 transform 互相覆盖） */
  const renderWork = (entry: WorkEntry, index: number, extraClass = '') => {
    const openDetail = DETAIL_CATEGORY_IDS.has(category.id) && Boolean(onOpenWork && entry.slug);
    return (
      <div key={entry.key} data-vw-reveal className="vw-reveal">
        <button
          type="button"
          onClick={() => {
            if (openDetail && entry.slug) onOpenWork?.(entry.slug);
            else setPreview(index);
          }}
          className={`group block w-full overflow-hidden rounded-[3px] text-left outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${extraClass}`}
          style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF', outlineColor: C.ink }}
        >
          <span className="relative block overflow-hidden">
            {openDetail && index === 0 ? (
              <span
                className="absolute left-3 top-3 z-10 rounded-[2px] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[.2em]"
                style={{ backgroundColor: C.accent, color: C.ink }}
              >
                Featured 精选
              </span>
            ) : null}
            <WorkImage
              sources={workSources(entry)}
              alt={entry.title}
              width={entry.width}
              height={entry.height}
              sizes={SIZES_BY_LAYOUT[category.layout]}
              fallbackLabel={`${entry.title} 加载失败`}
              className="h-auto w-full transition-transform duration-[650ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.035]"
              style={{ backgroundColor: C.soft }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-end justify-between gap-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: 'linear-gradient(180deg, rgba(23,23,23,0) 58%, rgba(23,23,23,.58) 100%)' }}
            >
              <span className="truncate px-3 pb-3 text-xs font-bold text-white">{entry.title}</span>
              <span className="flex shrink-0 items-center gap-1.5 pb-3 pr-3 text-[10px] font-black uppercase tracking-[.18em] text-white">
                {openDetail ? 'VIEW PROJECT' : 'VIEW WORK'}
                <ArrowUpRight size={13} strokeWidth={2.8} />
              </span>
            </span>
          </span>
          <span className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold" style={{ color: C.ink }}>{entry.title}</span>
              {entry.meta || entry.group ? (
                <span className="mt-0.5 block truncate text-[11px]" style={{ color: C.sub }}>
                  {entry.group ?? entry.meta}
                </span>
              ) : null}
            </span>
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 group-hover:bg-[var(--page-accent)]"
              style={{ border: `1px solid ${C.line}`, color: C.ink }}
            >
              <Plus size={12} strokeWidth={3} />
            </span>
          </span>
        </button>
      </div>
    );
  };

  const renderWorks = () => {
    if (!entries.length) return <EmptyState category={category} />;

    if (category.layout === 'masonry') {
      // 海报作品为统一 3:4 竖版，用行序网格保证「按上传顺序排列」，第一张占据左上最佳位置
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {entries.map((entry, index) => renderWork(entry, index))}
        </div>
      );
    }

    if (category.layout === 'wide') {
      return (
        <div className="flex flex-col gap-6">
          {entries.map((entry, index) => renderWork(entry, index))}
        </div>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {entries.map((entry, index) => renderWork(entry, index))}
      </div>
    );
  };

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ backgroundColor: C.bg, color: C.ink, ['--page-accent' as string]: category.accent }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />

      {/* ── 顶部：品牌标识 + 返回入口 ─────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-[120] px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3">
          <a
            href="/"
            onClick={(event) => { event.preventDefault(); onHome(); }}
            aria-label="于文雅 VISUAL/AIGC — 回到首页"
            className="flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 no-underline outline-none transition-transform duration-300 hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: C.ink, color: '#FFFFFF', outlineColor: C.ink }}
          >
            <span className="text-[11px] font-bold leading-none tracking-[.12em] lg:text-xs">于文雅</span>
            <span className="h-3 w-px shrink-0 bg-white/25" aria-hidden="true" />
            <span className="text-[11px] font-bold leading-none tracking-[.12em] text-white/70 lg:text-xs">VISUAL/AIGC</span>
          </a>

          <a
            href="/#visual-design"
            onClick={(event) => { event.preventDefault(); onBack(); }}
            className="flex h-12 items-center gap-2 rounded-2xl px-3.5 text-[10px] font-bold uppercase tracking-[.14em] no-underline outline-none transition-colors duration-300 hover:bg-[#DDF344] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 sm:text-xs"
            style={{ border: `1px solid ${C.ink}`, color: C.ink, outlineColor: C.ink }}
          >
            <ArrowLeft size={14} strokeWidth={2.8} aria-hidden="true" />
            BACK
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-24 pt-28 sm:px-8 sm:pt-32 lg:px-16">
        {/* ── 分类标题区 ─────────────────────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-14">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[.24em]" style={{ color: C.sub }}>
              VISUAL DESIGN / {category.number}
            </p>

            <h1
              className="mt-4 uppercase"
              style={{
                fontFamily: 'Anton, sans-serif',
                fontSize: 'clamp(40px, 9vw, 148px)',
                lineHeight: 0.9,
                letterSpacing: '-.03em',
                fontWeight: 900,
              }}
            >
              {category.en}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-4 sm:mt-7">
              <span
                className="inline-flex items-center rounded-[2px] px-3 py-1.5 text-sm font-black tracking-[.02em] sm:text-base"
                style={{ backgroundColor: category.accent, color: C.ink }}
              >
                {category.cn}
              </span>
              <span className="h-px w-10 sm:w-16" style={{ backgroundColor: C.ink }} />
              <p className="text-sm font-semibold sm:text-base">{category.summary}</p>
            </div>

            <p className="mt-4 max-w-[620px] text-xs leading-[1.8] sm:text-sm" style={{ color: C.sub }}>
              {category.concept}
            </p>
          </div>

          {/* 该分类的正式图标（静态展示；白色柔光托盘 + 分类强调色光晕，不用深色大卡片） */}
          <div className="hidden lg:block">
            <div
              className="rounded-[20px] p-5 pb-4"
              style={{ backgroundColor: '#FFFFFF', border: `1px solid ${C.line}`, boxShadow: '0 20px 44px rgba(23,23,23,.08)' }}
            >
              <VisualIcon category={category} interactive={false} />
            </div>
          </div>
        </div>

        <div className="mt-10 h-px w-full sm:mt-14" style={{ backgroundColor: C.line }} />

        {/* ── 作品展示区 ─────────────────────────────────────────── */}
        <div className="mt-10 sm:mt-14">
          {category.layout === 'project' && category.projects.length ? (
            /* IP & VI：每个 IP 一个独立入口（主视觉封面 + 名称 + 一句话介绍 + VIEW PROJECT），点击进入 /ip/<id> 详情 */
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              {category.projects.map((project, index) => (
                <div key={project.id} data-vw-reveal className="vw-reveal">
                  <button
                    type="button"
                    onClick={() => onOpenProject?.(project.id)}
                    className="group block w-full overflow-hidden rounded-[3px] text-left outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF', outlineColor: C.ink }}
                    aria-label={`进入 IP 项目「${project.name} ${project.en}」详情`}
                  >
                    <span className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <span className="text-[10px] font-black uppercase tracking-[.24em]" style={{ color: C.sub }}>
                        {String(index + 1).padStart(2, '0')} / IP PROJECT
                      </span>
                      <span
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[.18em] transition-colors duration-300 group-hover:text-[var(--page-accent)]"
                        style={{ color: C.ink }}
                      >
                        VIEW PROJECT
                        <ArrowUpRight size={13} strokeWidth={2.8} aria-hidden="true" />
                      </span>
                    </span>
                    <span className="relative block overflow-hidden">
                      {project.cover ? (
                        <WorkImage
                          sources={[
                            project.cover.thumb && { src: project.cover.thumb, width: 600 },
                            { src: project.cover.src, width: 1672 },
                          ].filter(Boolean) as { src: string; width?: number }[]}
                          alt={`${project.name} ${project.en} 主视觉`}
                          width={project.cover.width}
                          height={project.cover.height}
                          sizes="(min-width: 1024px) 44vw, 92vw"
                          fallbackLabel="IP 主视觉加载失败"
                          className="h-auto w-full transition-transform duration-[650ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.035]"
                          style={{ backgroundColor: C.soft }}
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-end opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: 'linear-gradient(180deg, rgba(23,23,23,0) 55%, rgba(23,23,23,.55) 100%)' }}
                      >
                        <span className="flex items-center gap-2 pb-4 pl-4 text-[11px] font-black uppercase tracking-[.2em] text-white">
                          VIEW PROJECT
                          <ArrowUpRight size={14} strokeWidth={2.8} />
                        </span>
                      </span>
                    </span>
                    <span className="block px-4 py-4">
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-xl font-black tracking-[-.01em]" translate="no">{project.name}</span>
                      </span>
                      <span className="mt-1.5 block text-xs leading-[1.8]" style={{ color: C.sub }}>
                        {project.note}
                      </span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : renderWorks()}
        </div>

        {/* ── 底部：返回 + 相邻分类 ──────────────────────────────── */}
        <div className="mt-16 flex flex-col gap-6 border-t pt-8 sm:mt-20 sm:pt-10" style={{ borderColor: C.line }}>
          <a
            href="/#visual-design"
            onClick={(event) => { event.preventDefault(); onBack(); }}
            className="group inline-flex w-fit items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-[.16em] no-underline outline-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm"
            style={{ backgroundColor: C.ink, color: '#FFFFFF', outlineColor: C.ink }}
          >
            <ArrowLeft size={16} strokeWidth={2.8} aria-hidden="true" />
            BACK
          </a>

          <div className="grid gap-px sm:grid-cols-2" style={{ backgroundColor: C.line, border: `1px solid ${C.line}` }}>
            {[siblings.previous, siblings.next].map((item, index) => (
              <a
                key={item.id}
                href={item.path}
                onClick={(event) => { event.preventDefault(); onOpenCategory(item.path); }}
                className="group flex items-center justify-between gap-4 px-4 py-5 no-underline outline-none transition-colors duration-300 hover:bg-[#EFEEE8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                style={{ backgroundColor: C.bg, color: C.ink, outlineColor: C.ink }}
              >
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: C.sub }}>
                    {index === 0 ? 'PREVIOUS' : 'NEXT'} / {item.number}
                  </span>
                  <span className="mt-1 block truncate text-sm font-black uppercase tracking-[.04em]">{item.en}</span>
                </span>
                <ArrowUpRight
                  size={18}
                  strokeWidth={2.6}
                  aria-hidden="true"
                  className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            ))}
          </div>
        </div>
      </main>

      {preview !== null ? (
        <Lightbox
          items={previewItems}
          index={preview}
          onIndex={setPreview}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}

/** 尚未上传作品时的简洁空状态（不使用虚假图片） */
function EmptyState({ category }: { category: VisualCategory }) {
  return (
    <div
      className="rounded-[3px] px-6 py-12 text-center sm:px-14 sm:py-16"
      style={{ border: `1px dashed ${C.line}`, backgroundColor: C.soft }}
    >
      <span
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: C.ink, color: C.accent }}
        aria-hidden="true"
      >
        <Layers size={24} strokeWidth={2} />
      </span>
      <p className="mt-5 text-lg font-black sm:text-xl">作品正在整理中</p>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-[.26em]" style={{ color: C.sub }}>WORKS COMING SOON</p>

      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {category.assetTypes.map((type) => (
          <li
            key={type}
            className="rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{ border: `1px solid ${C.line}`, color: C.sub }}
          >
            {type}
          </li>
        ))}
      </ul>
    </div>
  );
}
