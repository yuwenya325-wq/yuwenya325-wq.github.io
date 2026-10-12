import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CalendarDays, Download, ListChecks, Lock, Palette, PenLine } from 'lucide-react';
import PhoneMockup from './PhoneMockup';
import SectionIcon, { type SectionIconKind } from './SectionIcon';
import WorkImage from '../media/WorkImage';
import Lightbox, { type LightboxItem } from '../visual/Lightbox';
import { PRIMARY_APP, type AppFeature } from '../../data/app-product';
import { APPC } from './theme';

/** 纸面颗粒：透明度极低，只给浅底一点呼吸感，不形成明显纹理 */
const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

/** 功能图标映射（数据层只存语义名，图标在这里绑定） */
const FEATURE_ICONS = {
  plan: ListChecks,
  record: PenLine,
  revisit: CalendarDays,
  private: Lock,
} as const;

const displayFont = "'PingFang SC','HarmonyOS Sans SC','Source Han Sans SC','Noto Sans SC','Microsoft YaHei',sans-serif";

/** 三个板块：图标索引用它渲染，点击滚动到对应板块 */
const SECTIONS: readonly { id: string; kind: SectionIconKind; en: string; cn: string }[] = [
  { id: 'app-features', kind: 'feature', en: 'PRODUCT FEATURE', cn: '核心功能' },
  { id: 'app-ui', kind: 'screen', en: 'UI SCREEN', cn: '界面展示' },
  { id: 'app-concept', kind: 'concept', en: 'DESIGN CONCEPT', cn: '设计理念' },
];

/**
 * 首页 APP PRODUCT 区域（id="app-projects"）—— 单产品下载展示页（Landing Page）。
 *
 * 布局：05 / PRODUCT DESIGN 章节标题 → 45% 产品介绍 + 55% 3D 手机展示 →
 * 三板块图标索引（默认全部收起，点击图标展开对应板块，手风琴式只开一个）
 * → PRODUCT FEATURE 功能卡 → UI SCREEN 界面展示（点击灯箱放大）→ DESIGN CONCEPT 设计理念；
 * 三个板块标题均以「图标 + 英文 + 中文」的图标形式呈现。
 * 内容全部来自 src/data/app-product.ts（经产品资料核对，不编造）。
 * 当前只展示一个 APP；数据结构预留为数组，未来增加产品无需改版式。
 */
export default function AppProductSection() {
  const product = PRIMARY_APP;
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  /** 当前展开的板块（默认全部收起，点击图标展开；同时只展开一个） */
  const [openPanel, setOpenPanel] = useState<string | null>(null);

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
    }, { threshold: 0.08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /** 滚动揭示：从下方淡入（distance 控制上浮幅度） */
  const reveal = (delay: number, distance = 24) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
    transition: `opacity .66s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .66s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
  });

  const lightboxItems = useMemo<LightboxItem[]>(
    () => product.screens.map((screen) => ({
      src: screen.image,
      thumb: screen.image,
      title: `${product.name}「${screen.label}」`,
      meta: `${screen.en} · ${screen.description}`,
    })),
    [product],
  );

  /** 滚动到某个板块（顶部留出固定导航高度） */
  const scrollToId = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  /** 展开某个板块并滚动过去（「查看设计」与图标索引共用） */
  const openSection = (id: string) => {
    setOpenPanel(id);
    window.requestAnimationFrame(() => scrollToId(id));
  };

  const scrollToUi = () => openSection('app-ui');

  return (
    <section
      ref={sectionRef}
      id="app-projects"
      aria-label="APP PRODUCT — 今页 JINYE"
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36 lg:px-16"
      style={{
        color: APPC.text,
        backgroundColor: APPC.bg,
        backgroundImage: `linear-gradient(180deg, ${APPC.bg} 0%, ${APPC.bg} 55%, ${APPC.bgBottom} 100%)`,
      }}
    >
      {/* 极轻纸面颗粒 */}
      <div className="pointer-events-none absolute inset-0 opacity-[.025]" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />

      {/* 巨大编号水印，与 VISUAL「03」/ AI FILM「04」同一套节奏 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 bottom-6 select-none sm:-right-6 sm:bottom-10"
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(120px, 26vw, 420px)',
          lineHeight: 0.8,
          color: 'rgba(17,17,17,.05)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(1.12) translateY(24px)',
          transition: 'transform 1s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        05
      </span>

      <div className="relative z-10 mx-auto w-full max-w-[1320px]">
        {/* ── 标题区 ─────────────────────────────────────────────────── */}
        <header className="text-center">
          <p
            translate="no"
            className="text-[11px] font-bold uppercase tracking-[.34em] sm:text-xs"
            style={{ ...reveal(0, 14), color: APPC.label }}
          >
            05 / PRODUCT DESIGN
          </p>

          <h2
            translate="no"
            className="mt-4 uppercase"
            style={{
              ...reveal(70, 26),
              fontFamily: 'Anton, sans-serif',
              fontWeight: 400,
              fontSize: 'clamp(48px, 10vw, 138px)',
              lineHeight: 0.94,
              letterSpacing: '-.03em',
              color: APPC.text,
            }}
          >
            APP PRODUCT
          </h2>

          <p
            translate="no"
            className="mt-4 text-[11px] font-bold uppercase tracking-[.36em] sm:text-sm"
            style={{ ...reveal(120, 16), color: APPC.muted, fontFamily: 'Inter, sans-serif' }}
          >
            DIGITAL EXPERIENCE
          </p>
        </header>

        {/* ── 英雄区：左 45% 产品介绍 / 右 55% 手机展示 ─────────────────── */}
        <div className="mt-12 grid grid-cols-1 items-center gap-14 sm:mt-16 lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:gap-10">
          {/* 左：产品介绍 */}
          <div className="mx-auto w-full max-w-[560px] lg:mx-0">
            <div className="flex items-center gap-4" style={reveal(140, 22)}>
              <img
                src={product.icon}
                alt={`${product.name} 应用图标`}
                width={64}
                height={64}
                className="h-16 w-16 rounded-[18px]"
                style={{ boxShadow: APPC.shadowSmall, border: `1px solid ${APPC.divider}` }}
              />
              <div>
                <p className="text-[26px] font-black leading-none" style={{ fontFamily: displayFont }}>{product.name}</p>
                <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[.28em]" translate="no" style={{ color: APPC.muted }}>
                  {product.englishName}
                </p>
              </div>
            </div>

            <h3
              className="mt-7 font-black leading-[1.2]"
              style={{ ...reveal(190, 26), fontFamily: displayFont, fontSize: 'clamp(30px, 3.6vw, 46px)', color: APPC.text }}
            >
              {product.tagline}
            </h3>
            <p
              translate="no"
              className="mt-3 text-[12px] font-bold uppercase tracking-[.3em]"
              style={{ ...reveal(220, 16), color: APPC.muted, fontFamily: 'Inter, sans-serif' }}
            >
              {product.taglineEn}
            </p>

            <p className="mt-6 text-[14px] leading-[1.9] sm:text-[15px]" style={{ ...reveal(250, 20), color: APPC.body }}>
              {product.description}
            </p>

            {/* 下载 / 查看按钮 */}
            <div className="mt-9 flex flex-wrap items-center gap-3.5" style={reveal(290, 20)}>
              <a
                href={product.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ap-press inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-[14px] font-bold text-white transition-[transform,background-color,box-shadow] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: APPC.accent, boxShadow: '0 14px 30px -10px rgba(75,98,70,.55)', outlineColor: APPC.accent }}
                onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = APPC.accentBright; }}
                onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = APPC.accent; }}
              >
                <Download size={16} strokeWidth={2.6} aria-hidden="true" />
                立即体验
              </a>
              <button
                type="button"
                onClick={scrollToUi}
                className="ap-press inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-[14px] font-bold transition-[transform,background-color,border-color,color] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: APPC.card, border: `1px solid ${APPC.border}`, color: APPC.text, outlineColor: APPC.accent }}
                onMouseEnter={(event) => { event.currentTarget.style.borderColor = APPC.accent; event.currentTarget.style.color = APPC.accent; }}
                onMouseLeave={(event) => { event.currentTarget.style.borderColor = APPC.border; event.currentTarget.style.color = APPC.text; }}
              >
                <Palette size={16} strokeWidth={2.6} aria-hidden="true" />
                查看设计
              </button>
            </div>

            {/* 下载入口：官网下载页（手机安装 APK 的线上地址）+ 安装包直链 */}
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px]" style={reveal(315, 18)}>
              <span style={{ color: APPC.muted }}>官网下载页</span>
              <a
                href={product.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                translate="no"
                className="break-all font-bold underline decoration-1 underline-offset-4 transition-opacity duration-300 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: APPC.accent, textDecorationColor: APPC.accentLine, fontFamily: 'Inter, sans-serif', outlineColor: APPC.accent }}
              >
                yuwenya325-wq.github.io/jinye-website ↗
              </a>
              <span aria-hidden="true" style={{ color: APPC.border }}>|</span>
              <a
                href={product.downloadUrl}
                download={product.downloadName}
                className="font-bold transition-opacity duration-300 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: APPC.text, outlineColor: APPC.accent }}
              >
                直接下载安装包（<span translate="no" style={{ fontFamily: 'Inter, sans-serif' }}>{product.sizeLabel}</span>）
              </a>
            </div>

            <p className="mt-4 text-[12px] leading-[1.9]" style={{ ...reveal(335, 16), color: APPC.muted }}>
              <span translate="no" style={{ fontFamily: 'Inter, sans-serif' }}>{product.platform}</span>
              <span className="mx-2 opacity-40">·</span>
              <span translate="no" style={{ fontFamily: 'Inter, sans-serif' }}>{product.version}</span>
              <span className="mx-2 opacity-40">·</span>
              <span translate="no" style={{ fontFamily: 'Inter, sans-serif' }}>{product.sizeLabel}</span>
              <span className="mx-2 opacity-40">·</span>
              本机存储，无云同步
            </p>
          </div>

          {/* 右：3D 手机展示（从下方升起） */}
          <div className="flex justify-center lg:justify-end" style={reveal(200, 90)}>
            <PhoneMockup product={product} />
          </div>
        </div>

        {/* ── 板块图标索引：默认收起，点击图标展开对应板块 ─────────────── */}
        <div className="mx-auto mt-16 grid max-w-[880px] grid-cols-3 gap-3 sm:mt-24 sm:gap-8">
          {SECTIONS.map((section, index) => {
            const open = openPanel === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => (open ? setOpenPanel(null) : openSection(section.id))}
                aria-expanded={open}
                aria-controls={section.id}
                aria-label={`展开${section.cn}`}
                className="group flex flex-col items-center gap-3 rounded-[28px] px-2 py-5 text-center transition-colors duration-300 hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:gap-5 sm:py-7"
                style={{ ...reveal(80 + index * 90, 30), outlineColor: APPC.accent }}
              >
                <span className="ap-float block" style={{ animationDelay: `${index * 0.85}s`, animationDuration: '6s' }}>
                  <span
                    className="block transition-transform duration-[450ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:-translate-y-1.5 group-hover:-rotate-3"
                    style={{ transform: open ? 'translateY(-4px) rotate(-3deg)' : undefined }}
                  >
                    <SectionIcon kind={section.kind} size="clamp(62px, 16vw, 92px)" />
                  </span>
                </span>
                <span className="flex flex-col items-center gap-1.5">
                  <span className="text-[13.5px] font-black transition-colors duration-300 sm:text-[15px]" style={{ color: open ? APPC.accent : APPC.text, fontFamily: displayFont }}>
                    {section.cn}
                  </span>
                  <span translate="no" className="text-[9px] font-bold uppercase tracking-[.2em] sm:text-[10px]" style={{ color: APPC.muted, fontFamily: 'Inter, sans-serif' }}>
                    {section.en}
                  </span>
                </span>
                {/* 展开状态指示条 */}
                <span
                  aria-hidden="true"
                  className="h-1 rounded-full transition-[width,background-color] duration-300"
                  style={{ width: open ? '1.75rem' : '0.5rem', backgroundColor: open ? APPC.accent : APPC.border }}
                />
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-center text-[12px]" style={{ ...reveal(260, 14), color: APPC.muted }}>
          点击图标，展开对应内容
        </p>

        {/* ── 三个板块：默认收起，点击图标展开（手风琴，同时只开一个） ───── */}
        <Collapse id="app-features" open={openPanel === 'app-features'}>
          <div className="pt-12 sm:pt-16">
            <BlockHeader kind="feature" en="PRODUCT FEATURE" cn="核心功能" delay={0} reveal={reveal} />
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.features.map((feature, index) => (
                <div key={feature.id} style={reveal(80 + index * 70, 26)} className="h-full">
                  <FeatureCard feature={feature} />
                </div>
              ))}
            </div>
          </div>
        </Collapse>

        <Collapse id="app-ui" open={openPanel === 'app-ui'}>
          <div className="pt-12 sm:pt-16">
            <BlockHeader kind="screen" en="UI SCREEN" cn="界面展示" delay={0} reveal={reveal} note="点击任意界面可放大查看" />
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {product.screens.map((screen, index) => (
                <div key={screen.id} style={reveal(80 + index * 60, 26)}>
                  <button
                    type="button"
                    onClick={() => setPreview(index)}
                    className="ap-press group flex w-full flex-col overflow-hidden rounded-[22px] p-2.5 text-left transition-[box-shadow] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ backgroundColor: APPC.card, border: `1px solid ${APPC.divider}`, boxShadow: APPC.shadowSmall, outlineColor: APPC.accent }}
                    aria-label={`放大查看今页「${screen.label}」界面`}
                  >
                    <span className="relative block overflow-hidden rounded-[15px]" style={{ backgroundColor: '#FFFFFF', border: `1px solid ${APPC.divider}` }}>
                      <WorkImage
                        sources={[{ src: screen.image, width: screen.width }]}
                        alt={`今页「${screen.label}」界面截图`}
                        width={screen.width}
                        height={screen.height}
                        placeholderColor="#FFFFFF"
                        fallbackLabel="界面截图加载失败"
                        className="h-auto w-full object-cover object-top transition-transform duration-[600ms] ease-[cubic-bezier(.22,.61,.36,1)] group-hover:scale-[1.04]"
                        style={{ aspectRatio: '375 / 811' }}
                      />
                    </span>
                    <span className="flex items-baseline justify-between gap-2 px-1.5 pb-1 pt-3">
                      <span className="text-[13px] font-bold">{screen.label}</span>
                      <span translate="no" className="text-[9px] font-bold uppercase tracking-[.16em]" style={{ color: APPC.muted, fontFamily: 'Inter, sans-serif' }}>
                        {screen.en}
                      </span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Collapse>

        <Collapse id="app-concept" open={openPanel === 'app-concept'}>
          <div className="pt-12 sm:pt-16">
            <BlockHeader kind="concept" en="DESIGN CONCEPT" cn="设计理念" delay={0} reveal={reveal} />
            <div
              className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[28px] sm:grid-cols-3"
              style={{ ...reveal(80, 26), backgroundColor: APPC.divider, border: `1px solid ${APPC.divider}`, boxShadow: APPC.shadow }}
            >
              {product.concepts.map((concept) => (
                <article key={concept.id} className="flex flex-col gap-3 p-7 sm:p-8" style={{ backgroundColor: APPC.card }}>
                  <p translate="no" className="text-[10px] font-bold uppercase tracking-[.24em]" style={{ color: APPC.accent, fontFamily: 'Inter, sans-serif' }}>
                    {concept.en}
                  </p>
                  <h4 className="text-[19px] font-black" style={{ fontFamily: displayFont }}>{concept.title}</h4>
                  <p className="text-[13.5px] leading-[1.9]" style={{ color: APPC.body }}>{concept.description}</p>
                </article>
              ))}
            </div>
          </div>
        </Collapse>
      </div>

      {preview !== null ? (
        <Lightbox
          items={lightboxItems}
          index={Math.min(preview, lightboxItems.length - 1)}
          onIndex={setPreview}
          onClose={() => setPreview(null)}
          accent={APPC.accent}
        />
      ) : null}
    </section>
  );
}

/* ── 板块标题：图标 + 英文 + 中文（+ 可选提示） ───────────────────────── */
function BlockHeader({
  kind,
  en,
  cn,
  note,
  delay,
  reveal,
}: {
  kind: SectionIconKind;
  en: string;
  cn: string;
  note?: string;
  delay: number;
  reveal: (delay: number, distance?: number) => { opacity: number; transform: string; transition: string };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ ...reveal(delay, 18), borderColor: APPC.border }}>
      <div className="flex items-center gap-4">
        <span className="transition-transform duration-[450ms] ease-[cubic-bezier(.22,.61,.36,1)] hover:-translate-y-1 hover:rotate-[-3deg]">
          <SectionIcon kind={kind} size="clamp(48px, 12vw, 58px)" />
        </span>
        <div className="flex flex-col gap-1.5">
          <span
            translate="no"
            className="text-[10px] font-bold uppercase tracking-[.3em] sm:text-[11px]"
            style={{ color: APPC.accent, fontFamily: 'Inter, sans-serif' }}
          >
            {en}
          </span>
          <h3 className="text-[18px] font-black sm:text-[21px]" style={{ fontFamily: displayFont, color: APPC.text }}>{cn}</h3>
        </div>
      </div>
      {note ? <p className="text-[12px]" style={{ color: APPC.muted }}>{note}</p> : null}
    </div>
  );
}

/* ── 折叠面板：grid-template-rows 0fr→1fr 平滑展开 / 收起 ────────────── */
function Collapse({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return (
    <div
      id={id}
      className="grid scroll-mt-28 transition-[grid-template-rows] duration-[550ms] ease-[cubic-bezier(.22,.61,.36,1)]"
      style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
    >
      {/* 收起时 inert：内容不进无障碍树、不可聚焦，懒加载图也不会预加载 */}
      <div className="min-h-0 overflow-hidden" inert={!open}>
        {children}
      </div>
    </div>
  );
}

/* ── 功能卡 ─────────────────────────────────────────────────────────── */
function FeatureCard({ feature }: { feature: AppFeature }) {
  const Icon = FEATURE_ICONS[feature.icon];
  return (
    <article
      className="flex h-full flex-col gap-3.5 rounded-[24px] p-6 transition-transform duration-300 hover:-translate-y-1"
      style={{ backgroundColor: APPC.card, border: `1px solid ${APPC.divider}`, boxShadow: APPC.shadowSmall }}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ backgroundColor: APPC.accentSoft, color: APPC.accent }} aria-hidden="true">
          <Icon size={19} strokeWidth={2.3} />
        </span>
        <span translate="no" className="text-[11px] font-bold tracking-[.16em]" style={{ color: APPC.label, fontFamily: 'Inter, sans-serif' }}>
          {feature.number}
        </span>
      </div>
      <p translate="no" className="text-[10px] font-bold uppercase tracking-[.22em]" style={{ color: APPC.accent, fontFamily: 'Inter, sans-serif' }}>
        {feature.en}
      </p>
      <h4 className="text-[18px] font-black leading-tight" style={{ fontFamily: displayFont }}>{feature.title}</h4>
      <p className="text-[13px] leading-[1.85]" style={{ color: APPC.body }}>{feature.description}</p>
    </article>
  );
}
