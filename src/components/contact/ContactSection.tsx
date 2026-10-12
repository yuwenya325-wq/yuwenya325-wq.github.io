import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import ContactIcon from './ContactIcon';
import { CONTACT_CHANNELS, CONTACT_FOOTNOTE, type ContactChannel } from '../../data/contact';
import { CONTACTC } from './theme';

/** 纸面颗粒：透明度极低，只给纯白底一点呼吸感，不形成明显纹理 */
const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

/** 中文展示字体栈：重型黑体，保证笔画饱满，无需加载中文字库 */
const CN_DISPLAY = "'PingFang SC','HarmonyOS Sans SC','Source Han Sans SC','Noto Sans SC','Microsoft YaHei',sans-serif";

/**
 * CONTACT 栏目（id="contact"）—— 极简、高留白的联系方式页。
 *
 * 布局：06 / CONTACT 编号 → 居中「联系方式」大标题 + CONTACT ME → 一张细分隔线
 * → 三张横向等权白卡（手机 / 邮箱 / 微信，圆形黑色线性图标）→ 居中浅灰结语。
 * 交互：手机点击拨打、邮箱点击写邮件、微信点击复制微信号（带已复制反馈）。
 * 动效：标题淡入、卡片依次出现、hover 轻微上浮并增强阴影；全部随系统「减少动态效果」降级。
 * 内容全部来自 src/data/contact.ts，不编造任何联系方式。
 */
export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  /** 刚刚复制成功的渠道 id（1.8s 后复位） */
  const [copied, setCopied] = useState<string | null>(null);
  const copyTimer = useRef<number | null>(null);

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

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  /** 滚动揭示：从下方淡入（distance 控制上浮幅度） */
  const reveal = (delay: number, distance = 22) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
    transition: `opacity .66s cubic-bezier(.22,.61,.36,1) ${delay}ms, transform .66s cubic-bezier(.22,.61,.36,1) ${delay}ms`,
  });

  /** 复制微信号：优先 Clipboard API，不可用时降级到旧接口 */
  const handleCopy = async (channel: ContactChannel) => {
    try {
      await navigator.clipboard.writeText(channel.value);
    } catch {
      const input = document.createElement('textarea');
      input.value = channel.value;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
      } catch {
        /* 两条路径都不可用时保持静默，用户仍可手动选中复制 */
      }
      document.body.removeChild(input);
    }

    setCopied(channel.id);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <section
      ref={sectionRef}
      id="contact"
      aria-label="CONTACT — 联系方式"
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 pb-20 pt-32 sm:px-8 sm:pb-24 sm:pt-36 lg:px-16"
      style={{ color: CONTACTC.text, backgroundColor: CONTACTC.bg }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[.02]" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />

      {/* 巨大编号水印，与其他栏目保持同一套节奏 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 bottom-6 select-none sm:-right-6 sm:bottom-10"
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 'clamp(120px, 26vw, 420px)',
          lineHeight: 0.8,
          color: 'rgba(17,17,17,.045)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(1.12) translateY(24px)',
          transition: 'transform 1s cubic-bezier(.22,.61,.36,1)',
        }}
      >
        06
      </span>

      <div className="relative z-10 mx-auto w-full max-w-[1120px]">
        {/* ── 标题区（居中） ─────────────────────────────────────────── */}
        <header className="text-center">
          <p
            translate="no"
            className="text-[11px] font-bold uppercase tracking-[.34em] sm:text-xs"
            style={{ ...reveal(0, 12), color: CONTACTC.label }}
          >
            06 / CONTACT
          </p>

          <h2
            className="mt-5"
            style={{
              ...reveal(80, 22),
              fontFamily: CN_DISPLAY,
              fontWeight: 900,
              fontSize: 'clamp(46px, 9vw, 126px)',
              lineHeight: 1.02,
              letterSpacing: '.02em',
              color: CONTACTC.text,
            }}
          >
            联系方式
          </h2>

          <p
            translate="no"
            className="mt-5 text-[11px] font-bold uppercase tracking-[.36em] sm:text-sm"
            style={{ ...reveal(140, 14), color: CONTACTC.muted }}
          >
            CONTACT ME
          </p>

          <span
            aria-hidden="true"
            className="mx-auto mt-11 block h-px sm:mt-14"
            style={{
              width: visible ? '76px' : '0px',
              backgroundColor: CONTACTC.border,
              transition: 'width .9s cubic-bezier(.22,.61,.36,1) 220ms',
            }}
          />
        </header>

        {/* ── 三张联系方式卡片：桌面三列 / 手机单列 ──────────────────── */}
        <div className="mt-11 grid grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-3 sm:gap-7">
          {CONTACT_CHANNELS.map((channel, index) => (
            <div key={channel.id} className="h-full" style={reveal(240 + index * 120, 28)}>
              {channel.href ? (
                <a
                  href={channel.href}
                  className="ct-card group flex h-full w-full flex-col items-center rounded-[28px] px-6 py-10 text-center no-underline sm:px-7 sm:py-12"
                  style={cardStyle}
                  aria-label={`${channel.label} ${channel.value}，${channel.action}`}
                >
                  <CardBody channel={channel} copied={false} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCopy(channel)}
                  className="ct-card group flex h-full w-full flex-col items-center rounded-[28px] px-6 py-10 text-center sm:px-7 sm:py-12"
                  style={cardStyle}
                  aria-label={`复制微信号 ${channel.value}`}
                >
                  <CardBody channel={channel} copied={copied === channel.id} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ── 底部结语 ──────────────────────────────────────────────── */}
        <p
          className="mt-16 text-center text-[13px] leading-[1.95] sm:mt-20 sm:text-[14.5px]"
          style={{ ...reveal(640, 18), color: CONTACTC.muted }}
        >
          {CONTACT_FOOTNOTE}
        </p>
      </div>
    </section>
  );
}

const cardStyle = {
  backgroundColor: CONTACTC.card,
  border: `1px solid ${CONTACTC.border}`,
  boxShadow: CONTACTC.shadow,
} as const;

/** 卡片内容：圆形图标 → 中文标题 + 英文标签 → 联系方式 → 动作提示 */
function CardBody({ channel, copied }: { channel: ContactChannel; copied: boolean }) {
  return (
    <>
      <ContactIcon kind={channel.kind} />

      <span className="mt-7 flex items-baseline gap-2.5">
        <span className="text-[19px] font-black" style={{ fontFamily: CN_DISPLAY, color: CONTACTC.text }}>
          {channel.label}
        </span>
        <span
          translate="no"
          className="text-[10px] font-bold uppercase tracking-[.24em]"
          style={{ color: CONTACTC.muted, fontFamily: 'Inter, sans-serif' }}
        >
          {channel.en}
        </span>
      </span>

      <span
        className="mt-3.5 block break-all text-[15px] font-semibold leading-[1.6] sm:text-[16.5px]"
        style={{ color: CONTACTC.text, fontVariantNumeric: 'tabular-nums' }}
      >
        {channel.value}
      </span>

      <span
        className="mt-6 inline-flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[.02em]"
        style={{ color: copied ? '#111111' : CONTACTC.muted }}
        aria-live="polite"
      >
        {copied ? (
          <>
            <Check size={13} strokeWidth={2.4} aria-hidden="true" />
            已复制微信号
          </>
        ) : (
          <>
            {channel.action}
            <ArrowRight
              size={13}
              strokeWidth={2.2}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </>
        )}
      </span>
    </>
  );
}
