import { useEffect, useRef, useState } from 'react';

/** Minimal Black & White × Neon Yellow 主题色（ABOUT 区专用） */
export const C = {
  /** 页面背景（暖白） */
  bg: '#F4F3EF',
  /** 主文字（近黑） */
  ink: '#171717',
  /** 辅助文字 */
  sub: '#626262',
  /** 荧光黄 */
  accent: '#DDF344',
  /** 荧光黄悬停 */
  accentHover: '#C9E52D',
  /** 细线边框 */
  line: '#D6D5CF',
  /** 浅灰背景 */
  soft: '#E8E7E1',
  /** 深色强调区 */
  dark: '#191919',
  white: '#FFFFFF',
} as const;

/** 字号与字距统一：英文大标题使用项目已有的 Anton */
export const DISPLAY_FONT = "Anton, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif";

/**
 * 进入视口时触发一次入场动画。
 * 尊重 prefers-reduced-motion；不支持 IntersectionObserver 时直接显示。
 */
export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
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
    }, { threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/** 是否可以播放动效（减少动态效果时返回 false） */
export function motionAllowed() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** 鼠标跟随：只写 CSS 变量，不触发 React 重渲染 */
export function writePointerVars(event: React.PointerEvent<HTMLElement>) {
  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  element.style.setProperty('--px', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
  element.style.setProperty('--py', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
}

export function resetPointerVars(event: React.PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--px', '0');
  event.currentTarget.style.setProperty('--py', '0');
}

/** 平滑滚动到某个 section（尊重减少动态效果） */
export function scrollToId(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (!element) return false;
  element.scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'auto', block: 'start' });
  window.history.pushState({ section: sectionId }, '', `#${sectionId}`);
  return true;
}
