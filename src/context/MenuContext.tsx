/**
 * 全屏菜单的开关状态。
 * 与路由逻辑分离：菜单只管"开/关"，路由只管"去哪"，互不耦合。
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type MenuValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const MenuContext = createContext<MenuValue | null>(null);

export function MenuProvider({ children, defaultOpen = false }: { children: ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((previous) => !previous), []);

  const value = useMemo<MenuValue>(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuValue {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu 必须在 MenuProvider 内部使用');
  return context;
}
