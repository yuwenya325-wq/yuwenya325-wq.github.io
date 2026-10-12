import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Play, TriangleAlert } from 'lucide-react';
import { embedUrl, extractBvid, extractPage, isBvid, watchUrl } from '../../utils/bilibili';
import { episodesOf, type AiFilmProject } from '../../data/ai-film';
import { FILM, FILM_ON_ACCENT } from './theme';

type FilmPlayerProps = {
  project: AiFilmProject;
};

/**
 * 影片播放位（16:9，响应式）—— 白色圆角视频展示区。
 *
 * 门面式加载：默认只渲染封面 + 圆形播放按钮，点击后才挂 B 站官方 iframe，
 * 因此整页不背 iframe 开销，也绝不自动播放。
 * - 多集作品（project.episodes）在视频区上方显示集数切换胶囊，
 *   切换时只替换 iframe src（旧播放随重载停止）并换封面；
 * - 单集作品回落到顶层 bilibiliUrl / coverUrl（episodesOf 包装）；
 * - BV 号 / 分 P 自动从链接提取（utils/bilibili.ts）；
 * - 嵌入受限或链接非法时回落为「封面 + 前往B站观看」，不静默失效；
 * - 不下载视频文件、不使用第三方解析服务。
 * 切换作品时父级用 key 重建本组件，旧 iframe 会被卸载，音频不会继续播放。
 */
export default function FilmPlayer({ project }: FilmPlayerProps) {
  const episodes = useMemo(() => episodesOf(project), [project]);
  const multi = episodes.length > 1;
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const current = episodes[Math.min(episodeIndex, episodes.length - 1)] ?? null;

  const [activated, setActivated] = useState(false);
  const [frameError, setFrameError] = useState(false);

  // 切集：清掉上一集的嵌入失败状态
  useEffect(() => {
    setFrameError(false);
  }, [episodeIndex]);

  const bvid = useMemo(() => (current ? extractBvid(current.bilibiliUrl) : null), [current]);
  const page = useMemo(() => (current ? extractPage(current.bilibiliUrl) : 1), [current]);
  const valid = Boolean(bvid && isBvid(bvid));
  const embed = valid && bvid ? embedUrl(bvid, page) : '';
  const link = valid && bvid ? watchUrl(bvid, page) : (current?.bilibiliUrl ?? '');
  const cover = current?.coverUrl ?? project.coverUrl;
  const blocked = !valid || frameError;
  const hasEpisode = episodes.length > 0;

  return (
    <div className="flex w-full flex-col gap-3">
      {/* ── 集数切换：多集作品才出现 ─────────────────────────────────── */}
      {multi ? (
        <div
          role="tablist"
          aria-label={`${project.title}集数切换`}
          className="flex flex-wrap items-center gap-2"
        >
          {episodes.map((episode, index) => {
            const selected = index === episodeIndex;
            return (
              <button
                key={episode.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setEpisodeIndex(index)}
                className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-[12px] font-bold transition-[background-color,border-color,color,box-shadow] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: selected ? FILM.accent : '#FFFFFF',
                  border: `1px solid ${selected ? FILM.accent : FILM.border}`,
                  color: selected ? FILM_ON_ACCENT : FILM.body,
                  boxShadow: selected ? `0 6px 16px ${FILM.accentSoft}` : 'none',
                  outlineColor: FILM.accentBright,
                  cursor: 'pointer',
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
                <span translate="no">{episode.label}</span>
                {episode.duration ? (
                  <span
                    className="text-[10px] font-semibold tabular-nums"
                    style={{ fontFamily: 'Inter, sans-serif', opacity: selected ? 0.85 : 0.55 }}
                  >
                    {episode.duration}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* ── 16:9 视频区 ─────────────────────────────────────────────── */}
      <div className="relative aspect-video w-full overflow-hidden rounded-[24px]" style={{ backgroundColor: FILM.tile }}>
        {activated && embed && !frameError ? (
          <iframe
            key={current?.id}
            src={embed}
            title={`${project.title}${multi && current ? ` · ${current.label}` : ''} — B站播放器`}
            loading="lazy"
            allowFullScreen
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0"
            onError={() => setFrameError(true)}
          />
        ) : (
          <button
            type="button"
            onClick={() => { if (valid) setActivated(true); }}
            disabled={!valid}
            aria-label={valid ? `播放《${project.title}》${multi && current ? current.label : ''}` : `《${project.title}》的B站链接无效，请用右下角按钮前往观看`}
            className="group absolute inset-0 flex h-full w-full items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px]"
            style={{ outlineColor: FILM.accent, cursor: valid ? 'pointer' : 'default' }}
          >
            {cover ? (
              <img
                src={cover}
                alt={`《${project.title}》${multi && current ? current.label : ''}封面`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.035]"
              />
            ) : (
              <span
                aria-hidden="true"
                className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: `linear-gradient(160deg, #FBF8F4, #EFE9E1)` }}
              >
                <span className="text-[10px] font-bold uppercase tracking-[.34em]" translate="no" style={{ color: FILM.muted }}>
                  COVER PENDING
                </span>
                <span className="text-[11px]" style={{ color: FILM.muted }}>封面待上传</span>
              </span>
            )}

            {/* 极轻遮罩：保证白色播放按钮在浅色封面上依然清晰 */}
            <span
              aria-hidden="true"
              className="absolute inset-0 transition-opacity duration-500"
              style={{ background: 'linear-gradient(180deg, rgba(24,24,24,.02), rgba(24,24,24,.16))' }}
            />

            {/* 播放按钮：白色圆底 + 深灰图标，悬停放大 */}
            <span
              aria-hidden="true"
              className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full backdrop-blur-[2px] transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-110"
              style={{
                backgroundColor: 'rgba(255,255,255,.9)',
                boxShadow: '0 10px 30px rgba(24,24,24,.18)',
              }}
            >
              <Play size={26} strokeWidth={2.2} fill="#3A3A3A" color="#3A3A3A" className="ml-1" />
            </span>
          </button>
        )}

        {/* 嵌入受限 / 链接待补充提示 */}
        {blocked ? (
          <span
            className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[.06em] backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255,255,255,.92)', color: FILM.accentBright, border: `1px solid ${FILM.border}` }}
          >
            <TriangleAlert size={11} strokeWidth={2.6} aria-hidden="true" />
            {hasEpisode ? '平台限制嵌入，请前往B站观看' : 'B站播放链接待补充'}
          </span>
        ) : null}

        {/* 前往 B 站观看入口（常驻右下角，跟随当前集） */}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.14em] no-underline backdrop-blur-sm transition-colors duration-300 focus-visible:outline focus-visible:outline-2"
            style={{ backgroundColor: 'rgba(255,255,255,.92)', color: FILM.body, border: `1px solid ${FILM.border}` }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = FILM.accent;
              event.currentTarget.style.color = FILM_ON_ACCENT;
              event.currentTarget.style.borderColor = FILM.accent;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'rgba(255,255,255,.92)';
              event.currentTarget.style.color = FILM.body;
              event.currentTarget.style.borderColor = FILM.border;
            }}
          >
            前往B站观看
            <ExternalLink size={12} strokeWidth={2.6} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
