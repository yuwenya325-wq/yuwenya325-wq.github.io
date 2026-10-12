import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, FileText, Wrench } from 'lucide-react';
import Lightbox, { type LightboxItem } from './Lightbox';
import WorkImage from '../media/WorkImage';
import { siblingBannerWorks, workSources, type VisualWork } from '../../data/visual';

/** 页面主题：与 VISUAL 作品页同一套 Minimal Black & White × Neon Yellow */
const C = {
  bg: '#F4F3EF',
  ink: '#171717',
  sub: '#626262',
  accent: '#DDF344',
  line: '#D6D5CF',
  soft: '#EFEEE8',
} as const;

type BannerWorkDetailPageProps = {
  work: VisualWork;
  /** 回到首页顶部 */
  onHome: () => void;
  /** 返回 BANNER DESIGN 作品列表（恢复浏览位置由上层处理） */
  onBack: () => void;
  /** 切换到上一篇 / 下一篇 Banner */
  onOpenWork: (slug: string) => void;
};

/**
 * Banner 作品详情页（/banner/<slug>）。
 *
 * 结构：COVER 完整 Banner（保持原始比例，不裁切不变形）→ PROJECT INFO
 * → FINAL DESIGN 高清版（点击放大）→ APPLICATION MOCKUP（有效果图才显示）
 * → PROCESS（有过程图才显示，不留空模块）。
 */
export default function BannerWorkDetailPage({ work, onHome, onBack, onOpenWork }: BannerWorkDetailPageProps) {
  const [preview, setPreview] = useState<number | null>(null);
  const { previous, next } = siblingBannerWorks(work.slug ?? '');

  useEffect(() => {
    document.title = `${work.title} — BANNER DESIGN — 于文雅 VISUAL/AIGC`;
  }, [work.title]);

  /** 灯箱条目：应用效果图在前，最终高清版收尾 */
  const previewItems: LightboxItem[] = [
    ...(work.mockups ?? []).map((item) => ({ src: item.src, thumb: item.src, title: item.title, meta: `${work.year ?? ''} · Banner Design` })),
    { src: work.full || work.cover || work.thumb || work.src || '', thumb: work.thumb || work.cover, title: work.title, meta: `${work.year ?? ''} · Banner Design` },
  ];
  const finalPreviewIndex = previewItems.length - 1;

  return (
    <div className="relative min-h-screen w-full" style={{ backgroundColor: C.bg, color: C.ink }}>
      {/* ── 顶部：品牌标识 + 返回列表 ─────────────────────────────── */}
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
            href="/visual/banner"
            onClick={(event) => { event.preventDefault(); onBack(); }}
            className="flex h-12 items-center gap-2 rounded-2xl px-3.5 text-[10px] font-bold uppercase tracking-[.14em] no-underline outline-none transition-colors duration-300 hover:bg-[#DDF344] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 sm:text-xs"
            style={{ border: `1px solid ${C.ink}`, color: C.ink, outlineColor: C.ink }}
          >
            <ArrowLeft size={14} strokeWidth={2.8} aria-hidden="true" />
            BACK
          </a>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pb-24 pt-28 sm:px-8 sm:pt-32 lg:px-16">
        {/* ── 标题区 ─────────────────────────────────────────────── */}
        <p className="text-[11px] font-bold uppercase tracking-[.24em]" style={{ color: C.sub }}>
          VISUAL DESIGN / 02 — BANNER DESIGN
        </p>
        <h1
          className="mt-4 font-black leading-[1.08] tracking-[-.01em]"
          style={{ fontSize: 'clamp(30px, 5.4vw, 64px)' }}
        >
          {work.title}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px]" style={{ color: C.sub }}>
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={15} strokeWidth={2.4} aria-hidden="true" />
            {work.year ?? '2026'}
          </span>
          <span className="inline-flex items-center gap-2">
            <FileText size={15} strokeWidth={2.4} aria-hidden="true" />
            Banner Design
          </span>
          {work.tools ? (
            <span className="inline-flex items-center gap-2">
              <Wrench size={15} strokeWidth={2.4} aria-hidden="true" />
              {work.tools}
            </span>
          ) : null}
        </div>

        <div className="mt-8 h-px w-full" style={{ backgroundColor: C.line }} />

        {/* ── COVER：完整 Banner（保持原比例，点击放大） ─────────────── */}
        <section className="mt-10 sm:mt-14" aria-label="Banner 封面">
          <button
            type="button"
            onClick={() => setPreview(finalPreviewIndex)}
            className="group block w-full cursor-zoom-in overflow-hidden rounded-[3px] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF', outlineColor: C.ink }}
            aria-label={`放大查看「${work.title}」Banner`}
          >
            <span className="relative block overflow-hidden">
              <WorkImage
                sources={workSources(work)}
                alt={work.title}
                width={work.width}
                height={work.height}
                sizes="(min-width: 1120px) 1088px, 92vw"
                fallbackLabel="Banner 加载失败"
                className="h-auto w-full transition-transform duration-[650ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.015]"
                style={{ backgroundColor: C.soft }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ backgroundColor: C.ink, color: '#FFFFFF' }}
              >
                点击放大
              </span>
            </span>
          </button>
          <p className="mt-3 text-center text-[11px] uppercase tracking-[.2em]" style={{ color: C.sub }}>
            COVER
          </p>
        </section>

        {/* ── PROJECT INFO：项目信息 ────────────────────────────────── */}
        <section className="mt-14 sm:mt-20" aria-label="项目信息">
          <h2 className="text-sm font-black uppercase tracking-[.18em]">
            PROJECT INFO
            <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>项目信息</span>
          </h2>

          <div
            className="mt-6 grid gap-px overflow-hidden rounded-[3px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
            style={{ backgroundColor: C.line, border: `1px solid ${C.line}` }}
          >
            <dl className="flex flex-col gap-px" style={{ backgroundColor: C.line }}>
              {[
                { label: '作品名称', value: work.title },
                { label: '作品类型', value: 'Banner Design' },
                { label: '年份', value: work.year ?? '2026' },
                ...(work.tools ? [{ label: '工具', value: work.tools }] : []),
              ].map((item) => (
                <div key={item.label} className="px-5 py-4" style={{ backgroundColor: '#FFFFFF' }}>
                  <dt className="text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: C.sub }}>{item.label}</dt>
                  <dd className="mt-1.5 text-[13.5px] font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="px-5 py-4 sm:px-7 sm:py-6" style={{ backgroundColor: '#FFFFFF' }}>
              <p className="text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: C.sub }}>设计说明</p>
              <p className="mt-3 text-[14px] leading-[1.95]" style={{ color: '#333333' }}>
                {work.description}
              </p>
            </div>
          </div>
        </section>

        {/* ── FINAL DESIGN：最终 Banner 高清版 ──────────────────────── */}
        <section className="mt-14 sm:mt-20" aria-label="最终设计">
          <h2 className="text-sm font-black uppercase tracking-[.18em]">
            FINAL DESIGN
            <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>最终设计</span>
          </h2>

          <button
            type="button"
            onClick={() => setPreview(finalPreviewIndex)}
            className="group mt-6 block w-full cursor-zoom-in overflow-hidden rounded-[3px] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF', outlineColor: C.ink }}
            aria-label={`放大查看「${work.title}」高清版本`}
          >
            <span className="relative block overflow-hidden">
              <WorkImage
                sources={[{ src: work.full || work.cover || work.thumb || '', width: 1920 }]}
                alt={`${work.title} 高清版`}
                width={work.width}
                height={work.height}
                sizes="(min-width: 1120px) 1088px, 92vw"
                fallbackLabel="高清 Banner 加载失败"
                className="h-auto w-full transition-transform duration-[650ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.015]"
                style={{ backgroundColor: C.soft }}
              />
            </span>
          </button>
        </section>

        {/* ── APPLICATION MOCKUP：应用效果图（有效果图才显示，避免空模块） ── */}
        {work.mockups?.length ? (
          <section className="mt-14 sm:mt-20" aria-label="应用效果">
            <h2 className="text-sm font-black uppercase tracking-[.18em]">
              APPLICATION MOCKUP
              <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>应用效果</span>
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {work.mockups.map((item, index) => (
                <figure key={item.src} className="overflow-hidden rounded-[3px]" style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF' }}>
                  <button
                    type="button"
                    onClick={() => setPreview(index)}
                    className="block w-full cursor-zoom-in outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ outlineColor: C.ink }}
                    aria-label={`放大查看${item.title}`}
                  >
                    <WorkImage
                      sources={[{ src: item.src }]}
                      alt={item.title}
                      width={item.width}
                      height={item.height}
                      fallbackLabel="效果图加载失败"
                      className="h-auto w-full"
                      style={{ backgroundColor: C.soft }}
                    />
                  </button>
                  <figcaption className="px-4 py-3 text-[12px] font-bold">{item.title}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── PROCESS：创作过程（有过程图才显示，避免空模块） ─────────── */}
        {work.process?.length ? (
          <section className="mt-14 sm:mt-20" aria-label="创作过程">
            <h2 className="text-sm font-black uppercase tracking-[.18em]">
              PROCESS
              <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>创作过程</span>
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {work.process.map((step) => (
                <figure key={step.src} className="overflow-hidden rounded-[3px]" style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF' }}>
                  <WorkImage
                    sources={[{ src: step.src }]}
                    alt={step.title}
                    width={step.width}
                    height={step.height}
                    fallbackLabel="过程图加载失败"
                    className="h-auto w-full"
                    style={{ backgroundColor: C.soft }}
                  />
                  <figcaption className="px-4 py-3 text-[12px] font-bold">{step.title}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {/* ── 底部：上 / 下一个作品（返回统一放右上角） ────────────────── */}
        <div className="mt-16 flex flex-col gap-6 border-t pt-8 sm:mt-20 sm:pt-10" style={{ borderColor: C.line }}>
          <div className="grid gap-px sm:grid-cols-2" style={{ backgroundColor: C.line, border: `1px solid ${C.line}` }}>
            {[
              { item: previous, label: 'PREVIOUS', icon: ArrowLeft },
              { item: next, label: 'NEXT', icon: ArrowRight },
            ].map(({ item, label, icon: Icon }) => (
              <a
                key={label}
                href={`/banner/${item.slug}`}
                onClick={(event) => { event.preventDefault(); if (item.slug) onOpenWork(item.slug); }}
                className="group flex items-center justify-between gap-4 px-4 py-5 no-underline outline-none transition-colors duration-300 hover:bg-[#EFEEE8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                style={{ backgroundColor: C.bg, color: C.ink, outlineColor: C.ink }}
              >
                <span className={`min-w-0 ${label === 'NEXT' ? 'order-2 text-right' : ''}`}>
                  <span className="block text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: C.sub }}>
                    {label} BANNER
                  </span>
                  <span className="mt-1 block truncate text-sm font-black tracking-[.02em]">{item.title}</span>
                </span>
                <Icon
                  size={18}
                  strokeWidth={2.6}
                  aria-hidden="true"
                  className={`shrink-0 transition-transform duration-300 ${label === 'NEXT' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}
                />
              </a>
            ))}
          </div>
        </div>
      </main>

      {preview !== null ? (
        <Lightbox items={previewItems} index={preview} onIndex={setPreview} onClose={() => setPreview(null)} />
      ) : null}
    </div>
  );
}
