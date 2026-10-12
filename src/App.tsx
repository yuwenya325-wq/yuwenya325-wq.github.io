import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import AboutSection from './components/AboutSection';
import SectionPanel from './components/SectionPanel';
import TopNav from './components/TopNav';
import VisualDesignSection from './components/visual/VisualDesignSection';
import VisualWorkPage from './components/visual/VisualWorkPage';
import PosterWorkDetailPage from './components/visual/PosterWorkDetailPage';
import BannerWorkDetailPage from './components/visual/BannerWorkDetailPage';
import IpDetailPage from './components/visual/IpDetailPage';
import WorkImage from './components/media/WorkImage';
import ContactSection from './components/contact/ContactSection';
import AiFilmSection from './components/film/AiFilmSection';
import FilmDetailPage from './components/film/FilmDetailPage';
import AppProductSection from './components/app/AppProductSection';
import { findAiFilmProject } from './data/ai-film';
import { findBannerWork, findIpProject, findPosterWork, findVisualCategory, ipViCategory, isBannerPath, VISUAL_CATEGORIES } from './data/visual';

/** 海报分类对象（详情路径与未知详情 id 兜底渲染列表页时使用） */
const VISUAL_POSTER_CATEGORY = VISUAL_CATEGORIES.find((category) => category.id === 'poster')!;
/** Banner 分类对象（详情路径与未知详情 id 兜底渲染列表页时使用） */
const VISUAL_BANNER_CATEGORY = VISUAL_CATEGORIES.find((category) => category.id === 'banner')!;
/** IP & VI 分类对象（未知详情 id 兜底渲染列表页时使用） */
const VISUAL_IP_CATEGORY = ipViCategory()!;
import { normalizePath, PORTFOLIO_ROUTES, resolveSectionId } from './routes';

/**
 * 四屏轮播角色 + 首页主视觉配色。
 * 图片已按《素材发布规范》转成 WebP 两档（thumb 600w / cover 1024w），
 * 原始 PNG 归档在 assets/originals/characters/。
 *
 * 配色说明：每屏以原基准色 bg 为锚点，派生三档同色系明度——
 *   light 顶部主光区 / deep 边缘压暗区，用于合成「柔和渐变 + 环境光」影棚背景；
 *   glow 角色轮廓光，floor 该屏专属地面光池色（均为低透明度白/同色系）。
 * 角色身份、构图与轮播顺序完全不变，仅升级背景与光影语言。
 */
const IMAGES = [
  { bg: '#F48472', panel: '#F79B8C', light: '#FFC4B6', deep: '#E26C5E', glow: 'rgba(255,228,218,.60)', floor: 'rgba(255,238,232,.24)', thumb: '/characters/bomi-wave-thumb.webp', cover: '/characters/bomi-wave-cover.webp', width: 1024, height: 1536, alt: '于文雅原创角色 BOMI（挥手）' },
  { bg: '#58A8E8', panel: '#7ABAF0', light: '#B9DCF8', deep: '#4389C8', glow: 'rgba(226,243,255,.60)', floor: 'rgba(234,246,255,.24)', thumb: '/characters/bomi-walk-thumb.webp', cover: '/characters/bomi-walk-cover.webp', width: 1024, height: 1536, alt: '于文雅原创角色 BOMI（行走）' },
  { bg: '#DDA068', panel: '#E6A56E', light: '#F7D6AE', deep: '#C98A52', glow: 'rgba(255,240,220,.55)', floor: 'rgba(255,246,232,.26)', thumb: '/characters/forest-wave-thumb.webp', cover: '/characters/forest-wave-cover.webp', width: 1024, height: 1536, alt: '于文雅原创角色 FOREST（挥手）' },
  { bg: '#74AC8F', panel: '#7CAF8B', light: '#BEE1CE', deep: '#54876C', glow: 'rgba(232,248,238,.55)', floor: 'rgba(240,250,244,.26)', thumb: '/characters/forest-walk-thumb.webp', cover: '/characters/forest-walk-cover.webp', width: 1024, height: 1536, alt: '于文雅原创角色 FOREST（行走）' },
] as const;

/**
 * 单屏背景 = 摄影棚「空间」本身。
 * 纵向三段同色系明度：上方 light（主墙受光，稍亮）→ 中段 bg（基准色）→ 下方 deep（地面背光，稍深）。
 * 只做同色系的明暗过渡，不引入第二种颜色，因此四屏只是换配色，空间结构与灯光逻辑完全一致。
 */
const slideBackdrop = (image: (typeof IMAGES)[number]) =>
  `linear-gradient(to bottom, ${image.light} 0%, ${image.bg} 44%, ${image.deep} 100%)`;

/** 主光：来自正前上方，在顶部中央形成一层柔和光晕（摄影棚顶部柔光箱） */
const STUDIO_KEY_LIGHT =
  'radial-gradient(58% 42% at 50% -6%, rgba(255,255,255,.30) 0%, rgba(255,255,255,.09) 46%, rgba(255,255,255,0) 78%)';
/** 辅光：来自左前方偏侧面的柔和补光，给角色左侧提亮、避免单灯死黑 */
const STUDIO_FILL_LIGHT =
  'radial-gradient(46% 62% at 13% 42%, rgba(255,255,255,.14) 0%, rgba(255,255,255,.045) 50%, rgba(255,255,255,0) 78%)';
/** 地面光池：底部中央被灯光打亮的柔和亮区，暗示角色站在摄影棚地面上 */
const STUDIO_FLOOR_POOL =
  'radial-gradient(74% 34% at 50% 106%, rgba(255,255,255,.34) 0%, rgba(255,255,255,.12) 44%, rgba(255,255,255,0) 76%)';
/** 极轻暗角，收拢视线并让四周像空间墙面一样退开（只压四角，不在底部形成暗带） */
const STUDIO_VIGNETTE =
  'radial-gradient(122% 94% at 50% 28%, rgba(0,0,0,0) 56%, rgba(0,0,0,.10) 100%)';
/** 地面近处的柔和过渡带：从画面底边向上自然消隐，替代硬地平线 */
const STUDIO_FLOOR_BAND =
  'linear-gradient(to top, rgba(255,255,255,.26) 0%, rgba(255,255,255,.12) 8%, rgba(255,255,255,.03) 17%, rgba(255,255,255,0) 27%)';

type Direction = 'next' | 'prev';
type Role = 'center' | 'left' | 'right' | 'back';

const ease = '650ms cubic-bezier(0.4,0,0.2,1)';

/** 3D 舞台的透视距离，需与 src/index.css 中 .figurine-stage 的 perspective 保持一致 */
const PERSPECTIVE = 1800;

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const [activeSection, setActiveSection] = useState('home');
  /** 当前真实路由路径（'/' = 单页首页；'/visual/xxx' = 独立作品页） */
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  /** 回到首页后需要定位的栏目（等首页渲染完成再滚动） */
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  /** 返回海报列表时需要恢复的滚动位置（保持浏览位置） */
  const [pendingRestoreY, setPendingRestoreY] = useState<number | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  /** 供舞台交互 effect 内部调用最新的 navigate（避免把 navigate 加进依赖导致频繁重绑监听） */
  const navigateRef = useRef<(direction: Direction) => void>(() => {});
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const navigate = useCallback((direction: Direction) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((previous) => direction === 'next' ? (previous + 1) % 4 : (previous + 3) % 4);
    window.setTimeout(() => setIsAnimating(false), 650);
  }, [isAnimating]);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft') navigate('prev');
      if (event.key === 'ArrowRight') navigate('next');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  /* ── 单页滚动：导航跳转、滚动高亮、URL 锚点与浏览器后退 ───────────────── */

  const scrollToSection = useCallback((sectionId: string, pushHistory: boolean) => {
    const element = document.getElementById(sectionId);
    if (!element) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActiveSection(sectionId);
    if (pushHistory) {
      window.history.pushState(
        { section: sectionId },
        '',
        `#${sectionId}`,
      );
    }
  }, []);

  const handleNavSelect = useCallback((event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    scrollToSection(sectionId, true);
  }, [scrollToSection]);

  /* ── 真实路由：VISUAL 分类独立作品页（/visual/poster 等）────────────────
     与站内滚动锚点共用同一套 History API：pushState 换路径，popstate 回填状态。
     直接打开 / 刷新 / 前进后退都由这里兜住。 */

  const openPath = useCallback((nextPath: string) => {
    const normalized = normalizePath(nextPath);
    if (normalized !== normalizePath(window.location.pathname)) {
      window.history.pushState({ visual: normalized }, '', normalized);
    }
    setPath(normalized);
    setPendingSection(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  /** 回到首页并定位到某个栏目（作品页的「BACK」按钮走这里） */
  const goToSection = useCallback((sectionId: string) => {
    if (normalizePath(window.location.pathname) !== '/') {
      window.history.pushState({ section: sectionId }, '', `/#${sectionId}`);
      setPath('/');
      setPendingSection(sectionId);
      return;
    }
    scrollToSection(sectionId, true);
  }, [scrollToSection]);

  /* ── 海报详情页（/visual/poster/<slug>）：进入前记录浏览位置，返回时恢复 ── */

  const openPosterWork = useCallback((slug: string) => {
    try { sessionStorage.setItem('poster:return-y', String(window.scrollY)); } catch { /* 隐私模式下忽略 */ }
    openPath(`/visual/poster/${slug}`);
  }, [openPath]);

  const backToPosterList = useCallback(() => {
    let restoreY: number | null = null;
    try {
      const stored = sessionStorage.getItem('poster:return-y');
      if (stored) restoreY = Number(stored);
      sessionStorage.removeItem('poster:return-y');
    } catch { /* 隐私模式下忽略 */ }
    openPath('/visual/poster');
    if (restoreY != null && Number.isFinite(restoreY)) setPendingRestoreY(restoreY);
  }, [openPath]);

  /* ── Banner 详情页（/banner/<slug>）：进入前记录浏览位置，返回时恢复 ──── */

  const openBannerWork = useCallback((slug: string) => {
    try { sessionStorage.setItem('banner:return-y', String(window.scrollY)); } catch { /* 隐私模式下忽略 */ }
    openPath(`/banner/${slug}`);
  }, [openPath]);

  const backToBannerList = useCallback(() => {
    let restoreY: number | null = null;
    try {
      const stored = sessionStorage.getItem('banner:return-y');
      if (stored) restoreY = Number(stored);
      sessionStorage.removeItem('banner:return-y');
    } catch { /* 隐私模式下忽略 */ }
    openPath('/visual/banner');
    if (restoreY != null && Number.isFinite(restoreY)) setPendingRestoreY(restoreY);
  }, [openPath]);

  /* ── IP 项目详情页（/ip/<slug>）：进入前记录浏览位置，返回时恢复 ──── */

  const openIpProject = useCallback((projectId: string) => {
    try { sessionStorage.setItem('ip:return-y', String(window.scrollY)); } catch { /* 隐私模式下忽略 */ }
    openPath(`/ip/${projectId}`);
  }, [openPath]);

  const backToIpList = useCallback(() => {
    let restoreY: number | null = null;
    try {
      const stored = sessionStorage.getItem('ip:return-y');
      if (stored) restoreY = Number(stored);
      sessionStorage.removeItem('ip:return-y');
    } catch { /* 隐私模式下忽略 */ }
    openPath('/visual/ip-vi');
    if (restoreY != null && Number.isFinite(restoreY)) setPendingRestoreY(restoreY);
  }, [openPath]);

  // 海报 / Banner / IP 列表渲染完成后恢复浏览位置（列表卡片有宽高占位，挂载时高度已稳定）
  useEffect(() => {
    if ((path !== '/visual/poster' && path !== '/visual/banner' && path !== '/visual/ip-vi') || pendingRestoreY == null) return;
    const y = pendingRestoreY;
    setPendingRestoreY(null);
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'auto' }));
    return () => window.cancelAnimationFrame(frame);
  }, [path, pendingRestoreY]);

  // 首页重新渲染完成后再生效滚动（避免在作品页时找不到目标元素）
  useEffect(() => {
    if (path !== '/' || !pendingSection) return;
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(pendingSection);
      if (element) {
        element.scrollIntoView({ behavior: 'auto', block: 'start' });
        setActiveSection(pendingSection);
      }
      setPendingSection(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [path, pendingSection]);

  // 滚动位置驱动导航高亮：以视口中线所在的栏目为准
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const elements = PORTFOLIO_ROUTES
      .map((route) => document.getElementById(route.sectionId))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      let bestId = '';
      let bestRatio = 0;
      ratios.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });
      if (bestId) setActiveSection(bestId);
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 0.5, 1] });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  // 浏览器后退 / 前进、手动改 hash
  useEffect(() => {
    const handleHistory = () => {
      const nextPath = normalizePath(window.location.pathname);
      setPath(nextPath);
      if (nextPath === '/') {
        // 先记录目标栏目，等首页渲染完成后再滚动（见上面的 pendingSection effect）
        setPendingSection(resolveSectionId(window.location.pathname, window.location.hash));
      } else if (nextPath === '/visual/poster' || nextPath === '/visual/banner' || nextPath === '/visual/ip-vi') {
        // 浏览器后退回到海报 / Banner / IP 列表：同样恢复浏览位置
        const key = nextPath === '/visual/banner' ? 'banner:return-y' : nextPath === '/visual/ip-vi' ? 'ip:return-y' : 'poster:return-y';
        try {
          const stored = sessionStorage.getItem(key);
          if (stored) setPendingRestoreY(Number(stored));
          sessionStorage.removeItem(key);
        } catch { /* 隐私模式下忽略 */ }
      } else {
        setPendingSection(null);
      }
    };
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('hashchange', handleHistory);
    return () => {
      window.removeEventListener('popstate', handleHistory);
      window.removeEventListener('hashchange', handleHistory);
    };
  }, []);

  // 首次进入：兼容旧地址（如 /about）与带 hash 的链接（VISUAL 作品页 / 海报详情页 / Banner 详情页 / 影视详情页直接打开时不做重定向）
  useEffect(() => {
    if (findVisualCategory(window.location.pathname) || findPosterWork(window.location.pathname) || findBannerWork(window.location.pathname) || findIpProject(window.location.pathname) || findAiFilmProject(window.location.pathname)) return undefined;
    if (window.location.pathname.startsWith('/visual/') || isBannerPath(window.location.pathname) || window.location.pathname.startsWith('/ip/')) return undefined;
    const target = resolveSectionId(window.location.pathname, window.location.hash);
    const path = normalizePath(window.location.pathname.split('#')[0] || '/');
    if (path !== '/' || window.location.hash) {
      window.history.replaceState({ section: target }, '', `/#${target}`);
    }
    if (target !== 'home') {
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'auto', block: 'start' });
        setActiveSection(target);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, []);

  /**
   * 3D 玩偶舞台的鼠标 / 拖拽交互。
   *
   * 角色是二维 PNG（做不到真正旋转），所以把整组角色放进真 3D 透视场景里：
   * - 鼠标移动：整个舞台轻微 rotateX / rotateY（--rx / --ry），并用 --mx / --my 驱动背景层反向位移；
   * - 按住拖拽：在鼠标倾角之上叠加更大的旋转量，松手后缓动回正，像用手转动一个立体舞台；
   * - 点击（位移 < 8px）：切换到下一个角色，与拖拽互不干扰；
   * - 悬停单个角色：沿 Z 轴朝观众推出（见 CSS .figurine-item:hover .figurine-lift）。
   * 所有数值每帧只写一次 CSS 变量，不触发 React 重渲染；缓动插值让运动带阻尼感。
   * 「减少动态效果」偏好下整体停用；触摸设备只保留拖拽与点击、不做鼠标跟随。
   */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const stage = stageRef.current;
    if (!stage) return;

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const TILT_X = 7; // 鼠标：上下倾斜上限（度）
    const TILT_Y = 10; // 鼠标：左右旋转上限（度）
    const DRAG_X = 12; // 拖拽：上下旋转上限（度）
    const DRAG_Y = 22; // 拖拽：左右旋转上限（度）

    const target = { mx: 0, my: 0, dragX: 0, dragY: 0 };
    const current = { mx: 0, my: 0, dragX: 0, dragY: 0 };
    let frame = 0;
    let running = false;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    /** 本次按下后指针是否发生过明显位移（用于区分「点击切换」与「拖拽旋转」） */
    let moved = false;
    const CLICK_SLOP = 8; // 像素：位移小于该值视为点击

    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

    const write = () => {
      stage.style.setProperty('--mx', current.mx.toFixed(4));
      stage.style.setProperty('--my', current.my.toFixed(4));
      stage.style.setProperty('--rx', (-current.my * TILT_X + current.dragX).toFixed(3));
      stage.style.setProperty('--ry', (current.mx * TILT_Y + current.dragY).toFixed(3));
    };

    const tick = () => {
      current.mx += (target.mx - current.mx) * 0.12;
      current.my += (target.my - current.my) * 0.12;
      current.dragX += (target.dragX - current.dragX) * 0.16;
      current.dragY += (target.dragY - current.dragY) * 0.16;
      write();
      const settled =
        Math.abs(target.mx - current.mx) < 0.0015 &&
        Math.abs(target.my - current.my) < 0.0015 &&
        Math.abs(target.dragX - current.dragX) < 0.05 &&
        Math.abs(target.dragY - current.dragY) < 0.05;
      if (settled) {
        Object.assign(current, target);
        write();
        running = false;
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame = window.requestAnimationFrame(tick);
    };

    const handlePointerDown = (event: PointerEvent) => {
      // 让导航等交互元素保持原有行为
      if ((event.target as HTMLElement | null)?.closest('button, a')) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      stage.setPointerCapture?.(event.pointerId);
      setIsDragging(true);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (dragging) {
        if (Math.abs(event.clientX - startX) > CLICK_SLOP || Math.abs(event.clientY - startY) > CLICK_SLOP) {
          moved = true;
        }
        target.dragY = clamp((event.clientX - startX) * 0.12, DRAG_Y);
        target.dragX = clamp(-(event.clientY - startY) * 0.08, DRAG_X);
        start();
        return;
      }
      if (!canHover) return;
      const rect = stage.getBoundingClientRect();
      target.mx = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, 1);
      target.my = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, 1);
      start();
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      target.dragX = 0;
      target.dragY = 0;
      setIsDragging(false);
      start();
      // 未发生位移的主键点击 → 切换到下一个角色
      if (!moved && event.button === 0) navigateRef.current('next');
    };

    const handlePointerLeave = () => {
      if (dragging) return;
      target.mx = 0;
      target.my = 0;
      start();
    };

    setIsDragging(false);
    stage.addEventListener('pointerdown', handlePointerDown);
    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerup', handlePointerUp);
    stage.addEventListener('pointercancel', handlePointerUp);
    stage.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      window.cancelAnimationFrame(frame);
      stage.removeEventListener('pointerdown', handlePointerDown);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerup', handlePointerUp);
      stage.removeEventListener('pointercancel', handlePointerUp);
      stage.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  const activeRoute = PORTFOLIO_ROUTES.find((route) => route.sectionId === activeSection) ?? PORTFOLIO_ROUTES[0];
  /** 当前路径对应的 VISUAL 分类（非空即为独立作品页） */
  const visualCategory = findVisualCategory(path);
  /** 当前路径对应的海报详情作品（非空即为海报详情页） */
  const posterWork = findPosterWork(path);
  /** 当前路径对应的 Banner 详情作品（非空即为 Banner 详情页） */
  const bannerWork = findBannerWork(path);
  /** 当前路径对应的 IP 项目（非空即为 IP 详情页） */
  const ipProject = findIpProject(path);
  /** 当前路径对应的 AI 影片项目（非空即为影视详情页） */
  const filmProject = findAiFilmProject(path);

  useEffect(() => {
    // 独立作品页 / 海报详情页 / Banner 详情页 / IP 详情页 / 影视详情页的标题由各自页面设置
    if (visualCategory || posterWork || bannerWork || ipProject || filmProject) return;
    document.title = `${activeRoute.title} — 于文雅 VISUAL/AIGC`;
  }, [activeRoute.title, visualCategory, posterWork, bannerWork, ipProject, filmProject]);

  const roleByIndex = useMemo<Record<number, Role>>(() => ({
    [activeIndex]: 'center',
    [(activeIndex + 3) % 4]: 'left',
    [(activeIndex + 1) % 4]: 'right',
    [(activeIndex + 2) % 4]: 'back',
  }), [activeIndex]);

  /**
   * 角色在 3D 舞台中的位置与外观。
   * 长度、位置、虚化、透明度沿用手感不变的原值，只新增纵深 z：
   * 中心朝观众推出、左右略靠后、后排最远，旋转时便产生真实的前后错位。
   */
  const roleLook = (role: Role) => ({
    // 主角色：占视口约 62%（可见角色高），居中、完整展示，成为视觉中心
    center: { left: '50%', height: isMobile ? 'min(56%, 68vh)' : 'min(74%, 84vh)', bottom: isMobile ? '16%' : '9%', scale: 1, blur: 0, opacity: 1, zIndex: 20, z: 90 },
    // 左右远景小角色：约为原尺寸一半，明显虚化 + 降透明度 + 沿 Z 轴推远
    left: { left: isMobile ? '17%' : '25%', height: 'min(7.5%, 11vh)', bottom: isMobile ? '19%' : '11%', scale: .923, blur: 4, opacity: .64, zIndex: 10, z: -150 },
    right: { left: isMobile ? '83%' : '75%', height: 'min(7.5%, 11vh)', bottom: isMobile ? '19%' : '11%', scale: .923, blur: 4, opacity: .64, zIndex: 10, z: -150 },
    // 后排最小角色：更远、更虚，只作空间装饰
    back: { left: '50%', height: 'min(6%, 10vh)', bottom: isMobile ? '19%' : '11%', scale: .811, blur: 5, opacity: .56, zIndex: 5, z: -420 },
  })[role];

  const itemStyle = (role: Role, image: (typeof IMAGES)[number]) => {
    const look = roleLook(role);
    // 透视会放大靠近镜头的角色，这里按纵深反向补偿，让投影尺寸与原来的平面版一致
    const compensation = (PERSPECTIVE - look.z) / PERSPECTIVE;

    return {
      position: 'absolute' as const,
      left: look.left,
      height: look.height,
      bottom: look.bottom,
      zIndex: look.zIndex,
      aspectRatio: '0.6 / 1',
      // 该屏专属的轮廓色：角色材质由 CSS 用 drop-shadow 沿剪影打出柔和高光
      '--rim': image.glow,
      transform: `translateX(-50%) translateZ(${look.z}px) scale(${look.scale * compensation})`,
      transition: `transform ${ease}, left ${ease}`,
      willChange: 'transform',
    };
  };

  /** 虚化与透明度下移到内层，让外层定位元素保持 preserve-3d（filter/opacity 会强制压平三维层级） */
  const liftStyle = (role: Role) => {
    const look = roleLook(role);
    // 远景小角色叠一层「空气透视」：降饱和 + 提亮，模拟远处雾气，强化后景层（避免糊成暗斑）
    const haze = role === 'center' ? '' : role === 'back' ? ' saturate(.72) brightness(1.16)' : ' saturate(.82) brightness(1.1)';
    return {
      filter: `blur(${look.blur}px)${haze}`,
      opacity: look.opacity,
      transition: `transform 320ms cubic-bezier(0.4,0,0.2,1), filter ${ease}, opacity ${ease}`,
    };
  };

  /* ── 独立页面：VISUAL 分类作品页 / 海报详情页 / AI 影片项目详情页 ────── */
  if (filmProject) {
    return (
      <FilmDetailPage
        project={filmProject}
        onBack={() => goToSection('ai-film')}
        onHome={() => goToSection('home')}
      />
    );
  }

  if (posterWork) {
    return (
      <PosterWorkDetailPage
        work={posterWork}
        onHome={() => goToSection('home')}
        onBack={backToPosterList}
        onOpenWork={openPosterWork}
      />
    );
  }

  if (bannerWork) {
    return (
      <BannerWorkDetailPage
        work={bannerWork}
        onHome={() => goToSection('home')}
        onBack={backToBannerList}
        onOpenWork={openBannerWork}
      />
    );
  }

  if (ipProject) {
    return (
      <IpDetailPage
        project={ipProject}
        onHome={() => goToSection('home')}
        onBack={backToIpList}
      />
    );
  }

  // /visual/poster/<未知 id>：安全回落到海报列表页，不显示空页或报错
  // /banner/<未知 id>、/banner：回落到 Banner 列表页
  // /ip/<未知 id>：回落到 IP & VI 列表页
  if (visualCategory || path.startsWith('/visual/poster') || isBannerPath(path) || path.startsWith('/ip/')) {
    const fallbackCategory = path.startsWith('/visual/poster') || posterWork
      ? VISUAL_POSTER_CATEGORY
      : path.startsWith('/ip/')
        ? VISUAL_IP_CATEGORY
        : VISUAL_BANNER_CATEGORY;
    const category = visualCategory ?? fallbackCategory;
    return (
      <VisualWorkPage
        category={category}
        onHome={() => goToSection('home')}
        onBack={() => goToSection('visual-design')}
        onOpenCategory={openPath}
        onOpenWork={(slug) => (category.id === 'banner' ? openBannerWork(slug) : openPosterWork(slug))}
        onOpenProject={openIpProject}
      />
    );
  }

  return (
    <div className="relative w-full" style={{ fontFamily: 'Inter, sans-serif' }}>
      <TopNav activeId={activeSection} onSelect={handleNavSelect} />

      {/* HOME：四屏 3D 角色轮播（结构与轮播逻辑不变，仅升级主视觉光影） */}
      <section
        id="home"
        ref={stageRef}
        aria-label="于文雅 character figurine carousel"
        className={`figurine-stage relative h-screen w-full overflow-hidden${isDragging ? ' is-dragging' : ''}`}
      >
        {/* 背景：四屏各自的柔和渐变叠在一起，按当前屏交叉淡入淡出 */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {IMAGES.map((image, index) => (
            <div
              key={image.cover}
              className="figurine-bg absolute inset-0"
              style={{
                backgroundImage: slideBackdrop(image),
                opacity: index === activeIndex ? 1 : 0,
                transition: 'opacity 800ms cubic-bezier(.4,0,.2,1)',
              }}
            />
          ))}
        </div>

        {/* 影棚灯光：主光（顶部柔光箱）+ 侧向辅光 + 地面光池 + 极轻暗角（不产生硬地平线） */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          aria-hidden="true"
          style={{ backgroundImage: `${STUDIO_KEY_LIGHT}, ${STUDIO_FILL_LIGHT}, ${STUDIO_FLOOR_POOL}, ${STUDIO_VIGNETTE}` }}
        />
        {/* 地面近处过渡带：从底边向上自然消隐 */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[28%]"
          aria-hidden="true"
          style={{ backgroundImage: STUDIO_FLOOR_BAND }}
        />

        <div className="figurine-backdrop pointer-events-none absolute inset-x-0 top-[18%] z-[2] flex select-none items-center justify-center" aria-hidden="true">
          {/* key 随当前屏变化：切换时重播一次极轻的「落定」动画，让大字平滑移动而非瞬切 */}
          <span
            key={activeIndex}
            className="figurine-backdrop-text"
            style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(120px, 36vw, 520px)', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-.02em', whiteSpace: 'nowrap', textShadow: '0 26px 54px rgba(0,0,0,.13), 0 2px 0 rgba(255,255,255,.16)' }}
          >
            AIGC
          </span>
        </div>

        <div className="figurine-3d absolute inset-0 z-[3]" aria-live="polite">
          {IMAGES.map((image, index) => {
            const role = roleByIndex[index];
            const isCenter = role === 'center';
            return (
              <div key={image.cover} style={itemStyle(role, image)} data-role={role} aria-hidden={role !== 'center'} className="figurine-item">
                {/* 地面接触阴影：让角色与地面有自然接触感 */}
                <span className="figurine-contact" data-role={role} aria-hidden="true" />
                {/* 地面倒影：仅主角色保留一层克制的镜面反射（减少动态效果偏好下由 CSS 隐藏） */}
                {isCenter && (
                  <img
                    src={image.cover}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="figurine-reflect"
                    style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
                  />
                )}
                <div className="figurine-lift" style={liftStyle(role)}>
                  <WorkImage
                    sources={isCenter
                      ? [
                          { src: image.thumb, width: 600 },
                          { src: image.cover, width: image.width },
                        ]
                      : [{ src: image.thumb, width: 600 }]}
                    alt={isCenter ? image.alt : ''}
                    width={image.width}
                    height={image.height}
                    sizes={isMobile ? '62vw' : '32vw'}
                    priority={isCenter}
                    fallbackLabel="角色图加载失败"
                    placeholderColor="transparent"
                    className="figurine-image h-full w-full select-none"
                    style={{ objectFit: 'contain', objectPosition: 'bottom center' }}
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 z-50 opacity-40" style={{ backgroundImage: grain, backgroundSize: '200px 200px', backgroundRepeat: 'repeat' }} />
      </section>

      {/* 其余栏目：单页滚动区块（ABOUT / VISUAL DESIGN / AI FILM 各有专用区块） */}
      {PORTFOLIO_ROUTES.filter((route) => route.sectionId !== 'home').map((route) => {
        if (route.sectionId === 'about') return <AboutSection key={route.sectionId} />;
        if (route.sectionId === 'visual-design') {
          return <VisualDesignSection key={route.sectionId} onOpenCategory={openPath} />;
        }
        if (route.sectionId === 'ai-film') {
          return <AiFilmSection key={route.sectionId} onOpenProject={openPath} />;
        }
        if (route.sectionId === 'app-projects') {
          return <AppProductSection key={route.sectionId} />;
        }
        if (route.sectionId === 'contact') {
          return <ContactSection key={route.sectionId} />;
        }
        return (
          <SectionPanel key={route.sectionId} route={route} isActive={route.sectionId === activeSection} />
        );
      })}
    </div>
  );
}
