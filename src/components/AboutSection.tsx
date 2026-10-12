import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowRight, Briefcase, Mail, Phone, Sparkles } from 'lucide-react';
import AboutActions from './about/AboutActions';
import ExperienceTimeline from './about/ExperienceTimeline';
import ProfileVisual from './about/ProfileVisual';
import SkillsGrid from './about/SkillsGrid';
import { C, DISPLAY_FONT, useReveal } from './about/theme';
import { RESUME } from '../data/resume';
import { CAPABILITY_TAGS } from '../data/skills';

/** 中文展示字体栈：重型黑体，保证笔画饱满（Anton 不含中文字形） */
const CN_DISPLAY = "'PingFang SC','HarmonyOS Sans SC','Source Han Sans SC','Noto Sans SC','Microsoft YaHei',sans-serif";

/** 档案模块的两个页签（一句话核心介绍已前置到 HERO，不再单独占一页） */
const ARCHIVE_TABS = [
  { id: 'experience', number: '01', en: 'EXPERIENCE', label: '工作经历', icon: Briefcase },
  { id: 'skills', number: '02', en: 'SKILLS', label: '专业技能', icon: Sparkles },
] as const;

type TabId = (typeof ARCHIVE_TABS)[number]['id'];

/**
 * ABOUT ME —— AIGC 创作者个人身份展示页（首页内的一个 Section）。
 *
 * 设计方向：极简设计 × 创作者档案 × 视觉作品集（黑白 × 荧光黄）
 * - 标题区：02 / ABOUT ME → 「关于我」超大标题（末字压荧光黄块）→ ABOUT ME
 * - HERO：左侧人物抠图（几何背景 + 浮动 + 沿轮廓投影）/ 右侧身份信息
 *   （姓名 + YUWENYA、三枚职业标签、一句话核心介绍、能力标签、联系模块、EXPLORE WORKS →）
 * - 创作者档案：工作经历 / 专业技能两页签（保留真实履历内容）
 * 不是传统简历表；所有动画尊重 prefers-reduced-motion。
 */
export default function AboutSection() {
  const hero = useReveal<HTMLDivElement>(0.08);
  const archive = useReveal<HTMLDivElement>(0.2);

  const [tab, setTab] = useState<TabId>('experience');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectTab = (id: TabId, focus = false) => {
    setTab(id);
    if (focus) {
      const index = ARCHIVE_TABS.findIndex((item) => item.id === id);
      // 等面板渲染后再把焦点交给卡片，避免切换时丢失焦点
      window.requestAnimationFrame(() => tabRefs.current[index]?.focus());
    }
  };

  /** 键盘操作：← → 切换，Home / End 跳首尾 */
  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = ARCHIVE_TABS.length - 1;
    let next = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next < 0) return;
    event.preventDefault();
    selectTab(ARCHIVE_TABS[next].id, true);
  };

  /** 滚动揭示：从下方淡入（distance 控制上浮幅度） */
  const reveal = (delay: number, distance = 24) => ({
    opacity: hero.visible ? 1 : 0,
    transform: hero.visible ? 'translateY(0)' : `translateY(${distance}px)`,
    transition: `opacity .66s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .66s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
  });

  return (
    <section
      id="about"
      aria-label="ABOUT ME — 关于我"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: C.bg, color: C.ink }}
    >
      {/* 巨大编号水印，与 VISUAL「03」/ AI FILM「04」/ APP「05」/ CONTACT「06」同一套节奏 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 bottom-6 select-none sm:-right-6 sm:bottom-10"
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(120px, 26vw, 420px)',
          lineHeight: 0.8,
          color: 'rgba(23,23,23,.05)',
          transform: archive.visible ? 'scale(1) translateY(0)' : 'scale(1.12) translateY(24px)',
          transition: 'transform 1s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        02
      </span>

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-4 pb-0 pt-24 sm:px-8 sm:pt-28 lg:px-16">
        {/* ── 标题区 ─────────────────────────────────────────────────── */}
        <div ref={hero.ref}>
          <div className="flex flex-wrap items-baseline justify-between gap-3" style={reveal(0, 14)}>
            <p className="text-[11px] font-bold uppercase tracking-[.24em]" style={{ color: C.ink }}>
              02 / ABOUT ME — 2026
            </p>
            <p className="text-[11px] font-bold tracking-[.2em]" style={{ color: C.sub }}>
              关于我 / 创作者档案
            </p>
          </div>

          {/* 超大标题：「关于我」，末字压在荧光黄块上；块从左向右展开 */}
          <h2
            className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-2 sm:mt-6"
            style={{
              fontFamily: CN_DISPLAY,
              fontWeight: 900,
              fontSize: 'clamp(44px, 7.5vw, 108px)',
              lineHeight: 0.9,
              letterSpacing: '.02em',
            }}
            aria-label="关于我"
          >
            <span
              className="block"
              style={{
                opacity: hero.visible ? 1 : 0,
                transform: hero.visible ? 'translateY(0)' : 'translateY(56px)',
                transition: 'opacity .7s ease, transform .7s cubic-bezier(.22,.61,.36,1)',
              }}
            >
              关于
            </span>
            <span className="relative block">
              <span
                aria-hidden="true"
                className="absolute left-[-6%] right-[-14%] bottom-[8%] top-[10%] origin-left"
                style={{
                  backgroundColor: C.accent,
                  transform: hero.visible ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform .6s cubic-bezier(.22,.61,.36,1) .46s',
                }}
              />
              <span
                className="relative block"
                style={{
                  opacity: hero.visible ? 1 : 0,
                  transform: hero.visible ? 'translateY(0)' : 'translateY(56px)',
                  transition: 'opacity .6s ease .18s, transform .6s cubic-bezier(.22,.61,.36,1) .18s',
                }}
              >
                我
              </span>
            </span>
          </h2>

          <p
            translate="no"
            className="mt-4 uppercase sm:mt-5"
            style={{
              ...reveal(220, 14),
              fontFamily: DISPLAY_FONT,
              fontSize: 'clamp(17px, 2.2vw, 27px)',
              letterSpacing: '.3em',
              color: C.sub,
            }}
          >
            ABOUT ME
          </p>

          <div
            className="mt-8 h-px w-full sm:mt-10"
            style={{ backgroundColor: C.ink, transformOrigin: 'left', transform: hero.visible ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform .9s cubic-bezier(.22,.61,.36,1) .3s' }}
          />

          {/* ── HERO：人物左 / 信息右；移动端 标题 → 人物 → 信息 ──────── */}
          <div className="mt-12 grid items-center gap-12 sm:mt-16 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] lg:gap-16">
            {/* 人物从下方升起 */}
            <div style={reveal(160, 64)} className="mx-auto w-full max-w-[350px] lg:mx-0">
              <ProfileVisual />
            </div>

            <div className="min-w-0">
              {/* 姓名 + 英文名 */}
              <div style={reveal(260, 22)}>
                <p className="text-[11px] font-bold uppercase tracking-[.24em]" style={{ color: C.sub }}>NAME</p>
                <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="font-black leading-none" style={{ fontFamily: CN_DISPLAY, fontSize: 'clamp(38px, 4.6vw, 60px)', letterSpacing: '.02em' }}>
                    {RESUME.name}
                  </h3>
                  <span
                    translate="no"
                    className="text-[13px] font-bold uppercase tracking-[.32em] sm:text-sm"
                    style={{ color: C.sub, fontFamily: 'Inter, sans-serif' }}
                  >
                    {RESUME.nameEn}
                  </span>
                </div>
              </div>

              {/* 职业标签 */}
              <div className="mt-7 flex flex-wrap gap-2.5" style={reveal(330, 20)}>
                {RESUME.rolesEn.map((role, index) => (
                  <span
                    key={role}
                    translate="no"
                    className="rounded-full px-4 py-2 text-[10.5px] font-bold uppercase tracking-[.14em] sm:text-[11.5px]"
                    style={{
                      backgroundColor: index === 0 ? C.accent : C.white,
                      border: `1px solid ${C.ink}`,
                      color: C.ink,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>

              {/* 一句话核心介绍 */}
              <p
                className="mt-7 max-w-[560px] text-[14px] leading-[1.95] sm:text-[15px]"
                style={{ ...reveal(400, 20), color: '#333333' }}
              >
                {RESUME.profileShort}
              </p>

              {/* 能力标签：逐个出现 */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                {CAPABILITY_TAGS.map((tag, index) => (
                  <span
                    key={tag}
                    translate="no"
                    className="about-chip rounded-full px-4 py-1.5 text-[10.5px] font-bold uppercase tracking-[.12em] sm:text-[11.5px]"
                    style={{
                      ...reveal(470 + index * 70, 14),
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 联系方式：小型信息模块（非表格） */}
              <div className="mt-9 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                <a href={`tel:${RESUME.phone}`} className="about-contact group block border-t pt-3.5 no-underline" style={reveal(820, 16)}>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: C.sub, fontFamily: 'Inter, sans-serif' }}>
                    <Phone size={12} strokeWidth={2.4} aria-hidden="true" />
                    PHONE
                  </span>
                  <span className="mt-1.5 block text-[15px] font-bold tracking-[.02em] transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {RESUME.phone}
                  </span>
                </a>
                <a href={`mailto:${RESUME.email}`} className="about-contact group block border-t pt-3.5 no-underline" style={reveal(880, 16)}>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: C.sub, fontFamily: 'Inter, sans-serif' }}>
                    <Mail size={12} strokeWidth={2.4} aria-hidden="true" />
                    EMAIL
                  </span>
                  <span className="mt-1.5 block break-all text-[15px] font-bold tracking-[.02em] transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: C.ink }}>
                    {RESUME.email}
                  </span>
                </a>
              </div>

              {/* 作品入口 */}
              <div className="mt-9" style={reveal(940, 18)}>
                <AboutActions />
              </div>
            </div>
          </div>
        </div>

        {/* ── 创作者档案：工作经历 / 专业技能 ───────────────────────── */}
        <div id="about-archive" ref={archive.ref} className="mt-16 border-t pt-9 sm:mt-24 sm:pt-11">
          <div
            className="flex flex-wrap items-end justify-between gap-3"
            style={{
              opacity: archive.visible ? 1 : 0,
              transform: archive.visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity .6s ease, transform .6s cubic-bezier(.22,.61,.36,1)',
            }}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.24em]" style={{ color: C.sub }}>CREATOR ARCHIVE</p>
              <h3 className="mt-1.5 text-2xl font-black tracking-[-.01em] sm:text-[28px]" style={{ fontFamily: CN_DISPLAY }}>创作者档案</h3>
            </div>
            <p className="max-w-[320px] text-xs leading-[1.8]" style={{ color: C.sub }}>
              工作经历与专业能力，来自真实履历。
            </p>
          </div>

          <div
            role="tablist"
            aria-label="创作者档案内容"
            className="mt-7 grid grid-cols-2 gap-2 sm:gap-3"
          >
            {ARCHIVE_TABS.map((item, index) => {
              const active = item.id === tab;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`about-tab-${item.id}`}
                  aria-selected={active}
                  aria-controls={`about-panel-${item.id}`}
                  tabIndex={active ? 0 : -1}
                  ref={(node) => { tabRefs.current[index] = node; }}
                  onClick={() => selectTab(item.id)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                  className="about-tile group relative flex items-center gap-3 rounded-[3px] px-4 py-4 outline-none transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-4 sm:px-5 sm:py-5"
                  style={{
                    backgroundColor: active ? C.accent : C.bg,
                    border: `1px solid ${active ? C.ink : C.line}`,
                    color: C.ink,
                    opacity: archive.visible ? 1 : 0,
                    transform: archive.visible ? 'translateY(0)' : 'translateY(18px)',
                    transitionDelay: `${index * 80}ms`,
                  }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11"
                    style={{
                      backgroundColor: active ? C.ink : C.soft,
                      color: active ? C.accent : C.ink,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </span>

                  <span className="min-w-0 text-left">
                    <span
                      className="block text-[10px] font-bold uppercase tracking-[.2em]"
                      style={{ color: active ? C.ink : C.sub, fontFamily: 'Inter, sans-serif' }}
                    >
                      {item.number} / {item.en}
                    </span>
                    <span className="mt-0.5 block text-sm font-black tracking-[.02em] sm:text-base">
                      {item.label}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="ml-auto hidden text-lg font-black transition-transform duration-300 sm:block"
                    style={{
                      transform: active ? 'translateX(0)' : 'translateX(-4px)',
                      opacity: active ? 1 : 0.25,
                    }}
                  >
                    {active ? '▾' : '→'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 内容面板：切换时淡入上移 */}
          <div
            key={tab}
            id={`about-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`about-tab-${tab}`}
            tabIndex={0}
            className="about-panel mt-8 outline-none sm:mt-10"
          >
            {tab === 'experience' ? <ExperienceTimeline /> : null}
            {tab === 'skills' ? <SkillsGrid /> : null}
          </div>
        </div>
      </div>

      <div className="h-16 sm:h-24" />
    </section>
  );
}
