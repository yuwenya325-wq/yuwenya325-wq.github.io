/**
 * 极简路由（零新增依赖）。
 *
 * 项目原本没有路由系统，这里基于浏览器 History API 实现一个最小可用的路由：
 * - 支持 /about 这类真实路径（不是 hash），刷新时由 Vite dev / preview 自带的
 *   SPA fallback 回退到 index.html，不会出现 404；
 * - 提供 Link 组件，保持原生 <a href> 语义（可中键新开、可被 SEO / 屏幕阅读器识别）；
 * - 支持浏览器前进 / 后退。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

type RouterValue = {
  /** 当前路径，例如 '/' 或 '/about' */
  path: string;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterValue | null>(null);

/** 归一化路径：去掉结尾多余斜杠，空值视为首页。 */
function normalize(path: string): string {
  if (!path) return '/';
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalize(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setPath(normalize(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    const next = normalize(to);
    if (next === normalize(window.location.pathname)) {
      // 同一路径也要同步一次状态，避免地址栏与内部状态不一致
      setPath(next);
      return;
    }
    window.history.pushState({}, '', next);
    setPath(next);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const value = useMemo<RouterValue>(() => ({ path, navigate }), [path, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useRouter 必须在 RouterProvider 内部使用');
  return context;
}

export function Link({ to, onClick, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { navigate } = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // 保留浏览器原生行为：新标签页、下载、右键等
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
