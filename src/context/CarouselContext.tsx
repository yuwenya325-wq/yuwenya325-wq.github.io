/**
 * 轮播状态提升到 App 层，供首页、子页面与全屏菜单共享。
 * 这样菜单背景色、页面背景色都直接读取"当前轮播状态"，不存在第二套颜色数据，
 * 也不会在打开/关闭菜单或切换路由时被重置。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { FIGURINES } from '../data/site';

export type Direction = 'next' | 'prev';

/** 与原实现完全一致的过渡曲线与时长（650ms）。 */
export const CAROUSEL_TRANSITION = '650ms cubic-bezier(0.4,0,0.2,1)';

type CarouselValue = {
  activeIndex: number;
  /** 当前轮播页的背景主色，全站唯一颜色来源 */
  bg: string;
  navigate: (direction: Direction) => void;
  isAnimating: boolean;
  isMobile: boolean;
};

const CarouselContext = createContext<CarouselValue | null>(null);

export function CarouselProvider({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  // 用 ref 做切换锁，避免把副作用放进 setState 更新函数（StrictMode 下会被重复调用）
  const lockedRef = useRef(false);

  useEffect(() => {
    // 预加载四张角色图，保持原有行为
    FIGURINES.forEach(({ src }) => {
      const image = new Image();
      image.src = src;
    });

    const updateViewport = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const navigate = useCallback((direction: Direction) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setIsAnimating(true);
    setActiveIndex((previous) =>
      direction === 'next' ? (previous + 1) % FIGURINES.length : (previous + FIGURINES.length - 1) % FIGURINES.length,
    );
    window.setTimeout(() => {
      lockedRef.current = false;
      setIsAnimating(false);
    }, 650);
  }, []);

  const value = useMemo<CarouselValue>(
    () => ({ activeIndex, bg: FIGURINES[activeIndex].bg, navigate, isAnimating, isMobile }),
    [activeIndex, navigate, isAnimating, isMobile],
  );

  return <CarouselContext.Provider value={value}>{children}</CarouselContext.Provider>;
}

export function useCarousel(): CarouselValue {
  const context = useContext(CarouselContext);
  if (!context) throw new Error('useCarousel 必须在 CarouselProvider 内部使用');
  return context;
}
