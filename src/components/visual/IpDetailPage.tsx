import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, FileText, Quote } from 'lucide-react';
import Lightbox, { type LightboxItem } from './Lightbox';
import WorkImage from '../media/WorkImage';
import type { VisualProject } from '../../data/visual';

/** 页面主题：与 VISUAL 作品页同一套 Minimal Black & White × Neon Yellow */
const C = {
  bg: '#F4F3EF',
  ink: '#171717',
  sub: '#626262',
  accent: '#DDF344',
  line: '#D6D5CF',
  soft: '#EFEEE8',
} as const;

type IpDetailPageProps = {
  project: VisualProject;
  /** 回到首页顶部 */
  onHome: () => void;
  /** 返回 IP DESIGN & VI 项目列表（恢复浏览位置由上层处理） */
  onBack: () => void;
};

/** 从分组中筛出指定模块的素材 */
const bySection = (project: VisualProject, section: 'character' | 'vi' | 'application') =>
  project.groups.filter((group) => (group.section ?? 'character') === section && group.items.length > 0);

/**
 * IP 项目详情页（/ip/<slug>）。
 *
 * 结构：01 IP COVER（主视觉设定卡）→ 02 CHARACTER DESIGN（三视图 / 服装 /
 * 动作 / 表情）→ 03 BRAND STORY（背景故事 + 角色档案）→ 04 VISUAL IDENTITY
 * （有 VI 素材才显示）→ 05 APPLICATION（有应用素材才显示）。
 * 所有图片点击进入高清灯箱，支持左右浏览 / Esc 关闭 / 点击缩放。
 */
export default function IpDetailPage({ project, onHome, onBack }: IpDetailPageProps) {
  const [preview, setPreview] = useState<number | null>(null);

  useEffect(() => {
    document.title = `${project.name} ${project.en} — IP DESIGN & VI — 于文雅 VISUAL/AIGC`;
  }, [project]);

  const characterGroups = useMemo(() => bySection(project, 'character'), [project]);
  const viGroups = useMemo(() => bySection(project, 'vi'), [project]);
  const applicationGroups = useMemo(() => bySection(project, 'application'), [project]);

  /** 模块编号按实际显示顺序自动顺延（被隐藏的模块不占号） */
  const moduleNumbers = useMemo(() => {
    const keys = ['cover', 'character'];
    if (project.story?.length || project.profile?.length) keys.push('story');
    if (viGroups.length) keys.push('vi');
    if (applicationGroups.length) keys.push('application');
    return new Map(keys.map((key, index) => [key, String(index + 1).padStart(2, '0')]));
  }, [project, viGroups, applicationGroups]);

  /** 灯箱条目：封面在最前，其后按模块顺序展开所有图片（左右浏览按此顺序循环） */
  const previewItems = useMemo<LightboxItem[]>(() => {
    const items: LightboxItem[] = [];
    if (project.cover) {
      items.push({ src: project.cover.src, thumb: project.cover.thumb, title: `${project.name} ${project.en} 主视觉`, meta: 'IP COVER' });
    }
    [...characterGroups, ...viGroups, ...applicationGroups].forEach((group) => {
      group.items.forEach((item) => {
        items.push({ src: item.full || item.src || '', thumb: item.thumb || item.cover || item.src, title: item.title, meta: `${project.name} · ${group.title}` });
      });
    });
    return items;
  }, [project, characterGroups, viGroups, applicationGroups]);

  /** 可点击放大的图片（统一卡片外观与灯箱索引定位） */
  const renderZoomImage = (args: { src: string; thumb?: string; width: number; height: number; title: string; alt: string; lightboxIndex: number; sizes?: string }) => (
    <button
      type="button"
      onClick={() => setPreview(args.lightboxIndex)}
      className="group block w-full cursor-zoom-in overflow-hidden rounded-[3px] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF', outlineColor: C.ink }}
      aria-label={`放大查看${args.title}`}
    >
      <span className="relative block overflow-hidden">
        <WorkImage
          sources={[
            args.thumb && { src: args.thumb, width: 600 },
            { src: args.src, width: 1672 },
          ].filter(Boolean) as { src: string; width?: number }[]}
          alt={args.alt}
          width={args.width}
          height={args.height}
          sizes={args.sizes ?? '(min-width: 1120px) 1088px, 92vw'}
          fallbackLabel={`${args.title} 加载失败`}
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
  );

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
            href="/visual/ip-vi"
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
          VISUAL DESIGN / 04 — IP DESIGN &amp; VI
        </p>
        <h1 className="mt-4 font-black leading-[1.08] tracking-[-.01em]" style={{ fontSize: 'clamp(30px, 5.4vw, 64px)' }}>
          {project.name}
          <span className="ml-4 uppercase" style={{ color: C.sub, fontSize: '.55em', letterSpacing: '.08em' }}>{project.en}</span>
        </h1>
        {project.tagline ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold sm:text-base">
            <Quote size={15} strokeWidth={2.6} aria-hidden="true" style={{ color: C.sub }} />
            {project.tagline}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px]" style={{ color: C.sub }}>
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={15} strokeWidth={2.4} aria-hidden="true" />
            2026
          </span>
          <span className="inline-flex items-center gap-2">
            <FileText size={15} strokeWidth={2.4} aria-hidden="true" />
            IP Design &amp; Visual Identity
          </span>
          <span className="inline-flex items-center gap-2">
            <ArrowUpRight size={15} strokeWidth={2.4} aria-hidden="true" />
            {project.note}
          </span>
        </div>

        <div className="mt-8 h-px w-full" style={{ backgroundColor: C.line }} />

        {/* ── 01 IP COVER：主视觉（角色形象 + 品牌视觉，保持原比例） ── */}
        {project.cover ? (
          <section className="mt-10 sm:mt-14" aria-label="IP 主视觉">
            <h2 className="text-sm font-black uppercase tracking-[.18em]">
              {moduleNumbers.get('cover')} / IP COVER
              <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>IP 主视觉</span>            </h2>
            <div className="mt-6">
              {renderZoomImage({
                src: project.cover.src,
                thumb: project.cover.thumb,
                width: project.cover.width,
                height: project.cover.height,
                title: `${project.name} ${project.en} 主视觉`,
                alt: `${project.name} ${project.en} 角色设定卡主视觉`,
                lightboxIndex: 0,
              })}
            </div>
          </section>
        ) : null}

        {/* ── 02 CHARACTER DESIGN：三视图 / 服装 / 动作 / 表情 ──────── */}
        {characterGroups.length ? (
          <section className="mt-14 sm:mt-20" aria-label="角色设计">
            <h2 className="text-sm font-black uppercase tracking-[.18em]">
              {moduleNumbers.get('character')} / CHARACTER DESIGN
              <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>角色设计</span>
            </h2>

            <div className="mt-6 flex flex-col gap-10">
              {characterGroups.map((group) => {
                const groupBase = previewItems.findIndex((item) => item.meta === `${project.name} · ${group.title}`);
                return (
                  <div key={group.en}>
                    <h3 className="flex items-center gap-3 text-[13px] font-black uppercase tracking-[.14em]">
                      {group.en}
                      <span className="text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>{group.title}</span>
                    </h3>
                    <div className={`mt-4 grid gap-5 ${group.items.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                      {group.items.map((item) => renderZoomImage({
                        src: item.full || item.src || '',
                        thumb: item.thumb || item.cover || item.src,
                        width: item.width ?? 1672,
                        height: item.height ?? 941,
                        title: item.title,
                        alt: item.title,
                        lightboxIndex: groupBase < 0 ? 0 : groupBase + group.items.indexOf(item),
                      }))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ── 03 BRAND STORY：背景故事 + 角色档案 ───────────────────── */}
        {project.story?.length || project.profile?.length ? (
          <section className="mt-14 sm:mt-20" aria-label="品牌故事">
            <h2 className="text-sm font-black uppercase tracking-[.18em]">
              {moduleNumbers.get('story')} / BRAND STORY
              <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>品牌故事</span>
            </h2>

            <div
              className="mt-6 grid gap-px overflow-hidden rounded-[3px] sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
              style={{ backgroundColor: C.line, border: `1px solid ${C.line}` }}
            >
              <div className="px-5 py-4 sm:px-7 sm:py-6" style={{ backgroundColor: '#FFFFFF' }}>
                <p className="text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: C.sub }}>故事 / 世界观</p>
                <div className="mt-3 flex flex-col gap-3">
                  {project.story?.map((paragraph) => (
                    <p key={paragraph.slice(0, 12)} className="text-[14px] leading-[1.95]" style={{ color: '#333333' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <dl className="flex flex-col gap-px" style={{ backgroundColor: C.line }}>
                {project.profile?.map((row) => (
                  <div key={row.label} className="px-5 py-4" style={{ backgroundColor: '#FFFFFF' }}>
                    <dt className="text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: C.sub }}>{row.label}</dt>
                    <dd className="mt-1.5 text-[13.5px] font-bold leading-[1.7]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ) : null}

        {/* ── 04 VISUAL IDENTITY：VI 延展（有素材才显示） ───────────── */}
        {viGroups.length ? (
          <section className="mt-14 sm:mt-20" aria-label="视觉识别">
            <h2 className="text-sm font-black uppercase tracking-[.18em]">
              {moduleNumbers.get('vi')} / VISUAL IDENTITY
              <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>视觉识别</span>
            </h2>

            <div className="mt-6 flex flex-col gap-10">
              {viGroups.map((group) => {
                const groupBase = previewItems.findIndex((item) => item.meta === `${project.name} · ${group.title}`);
                return (
                  <div key={group.en}>
                    <h3 className="flex items-center gap-3 text-[13px] font-black uppercase tracking-[.14em]">
                      {group.en}
                      <span className="text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>{group.title}</span>
                    </h3>
                    <div className="mt-4">
                      {group.items.map((item) => renderZoomImage({
                        src: item.full || item.src || '',
                        thumb: item.thumb || item.cover || item.src,
                        width: item.width ?? 1672,
                        height: item.height ?? 941,
                        title: item.title,
                        alt: item.title,
                        lightboxIndex: groupBase < 0 ? 0 : groupBase + group.items.indexOf(item),
                      }))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ── 05 APPLICATION：IP 应用（有素材才显示，避免空模块） ────── */}
        {applicationGroups.length ? (
          <section className="mt-14 sm:mt-20" aria-label="IP 应用">
            <h2 className="text-sm font-black uppercase tracking-[.18em]">
              {moduleNumbers.get('application')} / APPLICATION
              <span className="ml-3 text-[11px] font-bold tracking-[.1em]" style={{ color: C.sub }}>IP 应用</span>
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {applicationGroups.flatMap((group) => {
                const groupBase = previewItems.findIndex((item) => item.meta === `${project.name} · ${group.title}`);
                return group.items.map((item) => (
                  <figure key={item.src} className="overflow-hidden rounded-[3px]" style={{ border: `1px solid ${C.line}`, backgroundColor: '#FFFFFF' }}>
                    {renderZoomImage({
                      src: item.full || item.src || '',
                      thumb: item.thumb || item.cover || item.src,
                      width: item.width ?? 1672,
                      height: item.height ?? 941,
                      title: item.title,
                      alt: item.title,
                      lightboxIndex: groupBase < 0 ? 0 : groupBase + group.items.indexOf(item),
                    })}
                    <figcaption className="px-4 py-3 text-[12px] font-bold">{item.title}</figcaption>
                  </figure>
                ));
              })}
            </div>
          </section>
        ) : null}

        {/* ── 底部：返回 + 上 / 下一个 IP 项目 ─────────────────────── */}
        <div className="mt-16 flex flex-col gap-6 border-t pt-8 sm:mt-20 sm:pt-10" style={{ borderColor: C.line }}>
          <a
            href="/visual/ip-vi"
            onClick={(event) => { event.preventDefault(); onBack(); }}
            className="group inline-flex w-fit items-center gap-3 rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-[.16em] no-underline outline-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm"
            style={{ backgroundColor: C.ink, color: '#FFFFFF', outlineColor: C.ink }}
          >
            <ArrowLeft size={16} strokeWidth={2.8} aria-hidden="true" />
            BACK
          </a>

          <a
            href="/#visual-design"
            onClick={(event) => { event.preventDefault(); onHome(); }}
            className="inline-flex w-fit items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.18em] no-underline outline-none transition-colors duration-300 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: C.sub, outlineColor: C.ink }}
          >
            <ArrowUpRight size={13} strokeWidth={2.6} aria-hidden="true" />
            BACK
          </a>
        </div>
      </main>

      {preview !== null ? (
        <Lightbox items={previewItems} index={preview} onIndex={setPreview} onClose={() => setPreview(null)} />
      ) : null}
    </div>
  );
}
