import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clapperboard, ImageOff } from 'lucide-react';
import Lightbox, { type LightboxItem } from '../visual/Lightbox';
import FilmPlayer from './FilmPlayer';
import { categoryLabel, episodesOf, type AiFilmProject, type FilmAsset, type FilmEpisode } from '../../data/ai-film';
import { extractBvid, extractPage, isBvid, watchUrl } from '../../utils/bilibili';
import { FILM, FILM_ON_ACCENT } from './theme';

/** 纸面颗粒：与列表页保持同一套极轻质感 */
const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

type FilmDetailPageProps = {
  project: AiFilmProject;
  /** 返回首页 AI FILM 区域 */
  onBack: () => void;
  /** 返回首页 */
  onHome: () => void;
};

/**
 * AI 影片项目详情页（/film/<detailSlug>）—— 暖奶油电影展厅的延伸。
 *
 * 只展示 src/data/ai-film.ts 里真实存在的资料：剧本概述、人物、场景、道具、关键分镜。
 * 任何一项没有资料时显示空状态，不编造内容。
 */
export default function FilmDetailPage({ project, onBack, onHome }: FilmDetailPageProps) {
  const [preview, setPreview] = useState<number | null>(null);
  const meta = categoryLabel(project.category);

  useEffect(() => {
    document.title = `${project.title} — AI FILM | 于文雅 VISUAL/AIGC`;
  }, [project.title]);

  const episodes = useMemo(() => episodesOf(project), [project]);
  const firstEpisode = episodes[0] ?? null;
  const bvid = firstEpisode ? extractBvid(firstEpisode.bilibiliUrl) : null;
  const watch = bvid && isBvid(bvid) ? watchUrl(bvid, extractPage(firstEpisode?.bilibiliUrl ?? '')) : '';
  /** 时长展示：单集直接显示，多集逐集标明（如「上集 2:13 · 下集 2:10」）；无播放链接时回落顶层 duration */
  const durationText = useMemo(() => {
    if (episodes.length === 0) return project.duration ?? '';
    if (episodes.length === 1) return episodes[0].duration ?? '';
    return episodes
      .map((episode: FilmEpisode) => (episode.duration ? `${episode.label} ${episode.duration}` : episode.label))
      .join(' · ');
  }, [episodes]);

  /** 03 起的资产区块：自定义 assetSections（TVC 的产品/场景/视觉）优先，否则用默认人物/场景/道具三槽 */
  const sections = useMemo<Array<{ key: string; index: number; title: string; en: string; assets: FilmAsset[] }>>(() => {
    if (project.detail.assetSections && project.detail.assetSections.length > 0) {
      return project.detail.assetSections.map((section, i) => ({
        key: section.id,
        index: 3 + i,
        title: section.title,
        en: section.en,
        assets: section.assets,
      }));
    }
    return [
      { key: 'characters', index: 3, title: '人物资产', en: 'CHARACTER ASSETS', assets: project.detail.characters },
      { key: 'scenes', index: 4, title: '场景资产', en: 'ENVIRONMENT ASSETS', assets: project.detail.scenes },
      { key: 'props', index: 5, title: '道具资产', en: 'PROP ASSETS', assets: project.detail.props },
    ];
  }, [project.detail]);

  /** 详情页所有可预览图片（按区块顺序） */
  const allAssets = useMemo<FilmAsset[]>(() => sections.flatMap((section) => section.assets), [sections]);
  const lightboxItems = useMemo<LightboxItem[]>(
    () => allAssets.map((asset) => ({ src: asset.full, thumb: asset.thumb, title: asset.title, meta: asset.note })),
    [allAssets],
  );
  const openPreview = (asset: FilmAsset) => {
    const index = allAssets.findIndex((item) => item.id === asset.id);
    if (index >= 0) setPreview(index);
  };

  return (
    <div
      className="relative min-h-screen w-full"
      style={{
        color: FILM.text,
        backgroundColor: FILM.bg,
        backgroundImage: `linear-gradient(180deg, ${FILM.bgTop} 0%, ${FILM.bg} 32%, ${FILM.bgBottom} 100%)`,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[.03]" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />

      {/* 顶栏：品牌 + 返回 */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'rgba(244,240,234,.86)', borderBottom: `1px solid ${FILM.divider}`, backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8 lg:px-16">
          <button
            type="button"
            onClick={onHome}
            translate="no"
            className="flex items-baseline gap-2 text-sm font-black tracking-[.06em] transition-opacity duration-300 hover:opacity-70 focus-visible:outline focus-visible:outline-2"
            style={{ color: FILM.text, outlineColor: FILM.accentBright }}
          >
            于文雅
            <span className="text-[10px] font-bold tracking-[.18em]" style={{ color: FILM.muted }}>VISUAL/AIGC</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            translate="no"
            className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[.16em] transition-[background-color,border-color,color] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: '#FFFFFF', border: `1px solid ${FILM.border}`, color: FILM.body, outlineColor: FILM.accentBright }}
            onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = FILM.accent; event.currentTarget.style.borderColor = FILM.accent; event.currentTarget.style.color = FILM_ON_ACCENT; }}
            onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = '#FFFFFF'; event.currentTarget.style.borderColor = FILM.border; event.currentTarget.style.color = FILM.body; }}
          >
            <ArrowLeft size={13} strokeWidth={2.8} className="transition-transform duration-300 group-hover:-translate-x-1" aria-hidden="true" />
            BACK
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-16">
        {/* 项目头部 */}
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.accentBright }}>
          <Clapperboard size={14} strokeWidth={2.6} aria-hidden="true" />
          AI FILM · {meta.en}
          <span className="text-[10px] font-semibold tracking-[.16em]" style={{ color: FILM.muted }}>{meta.cn}</span>
        </p>

        <h1
          className="mt-4 font-black leading-[1.06] tracking-[.01em]"
          style={{
            fontFamily: "'PingFang SC','HarmonyOS Sans SC','Source Han Sans SC','Noto Sans SC','Microsoft YaHei',sans-serif",
            fontSize: 'clamp(32px,6.2vw,76px)',
            color: FILM.text,
          }}
        >
          {project.title}
        </h1>
        {project.englishTitle ? (
          <p className="mt-3 text-xs font-bold uppercase tracking-[.26em] sm:text-sm" translate="no" style={{ color: FILM.muted }}>
            {project.englishTitle}
          </p>
        ) : null}

        <p className="mt-6 max-w-[70ch] text-sm leading-[1.9]" style={{ color: FILM.body }}>{project.description}</p>

        {/* ── 01 FILM PLAYER：封面 + B 站官方嵌入（点击才挂 iframe） ── */}
        <div
          className="mt-8 overflow-hidden"
          style={{ borderRadius: 24, border: `1px solid ${FILM.divider}`, backgroundColor: '#FFFFFF', boxShadow: FILM.shadow }}
        >
          <FilmPlayer project={project} />
          <p className="px-5 py-4 text-[11px] leading-[1.8]" style={{ color: FILM.muted }}>
            {watch
              ? '完整播放请前往B站观看（本站使用平台官方嵌入方式，不上传视频文件）。'
              : 'B 站播放链接待补充：补入 BV 号后这里会自动挂载 16:9 官方播放器。'}
          </p>
        </div>

        {/* ── 02 PROJECT INTRODUCTION ─────────────────────────────── */}
        <section className="mt-14 border-t pt-8" style={{ borderColor: FILM.divider }}>
          <SectionHeading index={2} title="项目介绍" en="PROJECT INTRODUCTION" />
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <p className="max-w-[80ch] whitespace-pre-line text-sm leading-[1.95]" style={{ color: FILM.body }}>
              {project.detail.synopsis.trim()}
            </p>
            <dl className="flex flex-col gap-3 self-start rounded-[16px] px-5 py-4" style={{ backgroundColor: FILM.tile, border: `1px solid ${FILM.divider}` }}>
              <InfoRow label="影片类型" value={`${meta.cn} · ${meta.en}`} />
              {durationText ? <InfoRow label="影片时长" value={durationText} /> : null}
              {project.tools ? <InfoRow label="制作工具" value={project.tools} /> : null}
              {project.myRole ? <InfoRow label="个人负责" value={project.myRole} /> : null}
            </dl>
          </div>
        </section>

        {/* ── 03 / 04 / 05 制作资产 ─────────────────────────────────── */}
        {sections.map((section) => (
          <DetailGallery key={section.key} index={section.index} title={section.title} en={section.en} assets={section.assets} onOpen={openPreview} />
        ))}
      </main>

      {preview !== null && lightboxItems.length ? (
        <Lightbox
          items={lightboxItems}
          index={Math.min(preview, lightboxItems.length - 1)}
          onIndex={setPreview}
          onClose={() => setPreview(null)}
          accent={FILM.accent}
        />
      ) : null}
    </div>
  );
}

/* ── 详情区块 ───────────────────────────────────────────────────────── */

/** 模块标题：暖橙编号 + 中文黑标题 + 英文灰副题 */
function SectionHeading({ index, title, en }: { index: number; title: string; en: string }) {
  return (
    <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className="text-[11px] font-black tracking-[.2em]" translate="no" style={{ color: FILM.accentBright }}>
        {String(index).padStart(2, '0')} /
      </span>
      <h2 className="text-xl font-black tracking-[.02em] sm:text-2xl" style={{ color: FILM.text }}>{title}</h2>
      <span className="text-[10px] font-bold uppercase tracking-[.24em]" translate="no" style={{ color: FILM.muted }}>{en}</span>
    </header>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-xs leading-[1.7]">
      <dt className="w-16 shrink-0 font-bold" style={{ color: FILM.muted }}>{label}</dt>
      <dd className="min-w-0 flex-1" style={{ color: FILM.body }}>{value}</dd>
    </div>
  );
}

function DetailGallery({
  index,
  title,
  en,
  assets,
  onOpen,
}: {
  index: number;
  title: string;
  en: string;
  assets: FilmAsset[];
  onOpen: (asset: FilmAsset) => void;
}) {
  return (
    <section className="mt-14 border-t pt-8" style={{ borderColor: FILM.divider }}>
      <SectionHeading index={index} title={title} en={en} />
      <div className="mt-5">
        {assets.length === 0 ? (
          <EmptyHint text={`${title}资料待补充`} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onOpen(asset)}
                className="group overflow-hidden rounded-[16px] text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ border: `1px solid ${FILM.divider}`, outlineColor: FILM.accentBright, backgroundColor: '#FFFFFF', boxShadow: '0 6px 20px rgba(0,0,0,.05)' }}
                aria-label={`预览：${asset.title}`}
              >
                <span className="block overflow-hidden">
                  <img
                    src={asset.thumb}
                    alt={asset.title}
                    width={asset.width}
                    height={asset.height}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full transition-transform duration-[600ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.05]"
                  />
                </span>
                <span className="block px-3 py-2.5">
                  <span className="block truncate text-xs font-bold" style={{ color: FILM.text }}>{asset.title}</span>
                  {asset.note ? (
                    <span className="mt-0.5 block truncate text-[10px]" style={{ color: FILM.muted }}>{asset.note}</span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p
      className="inline-flex items-center gap-3 rounded-[12px] px-4 py-3 text-xs"
      style={{ backgroundColor: FILM.tile, border: `1px dashed ${FILM.border}`, color: FILM.muted }}
    >
      <ImageOff size={14} strokeWidth={2} aria-hidden="true" />
      {text}
    </p>
  );
}
