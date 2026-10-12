/**
 * 站点固定头部：左上角 TOONHUB LOGO + 右上角 MENU / CLOSE 按钮。
 * 层级高于全屏菜单（z-110 > z-100），因此菜单打开时按钮始终可点击。
 * 位置与原首页 LOGO 完全一致：left-4 top-6 / sm:left-8；右侧约 30px。
 */
import { Menu, X } from 'lucide-react';
import { Link } from '../router';
import { useMenu } from '../context/MenuContext';

export default function SiteHeader() {
  const { isOpen, toggle, close } = useMenu();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[110]">
      <Link
        to="/"
        onClick={() => close()}
        aria-label="TOONHUB 返回首页"
        className="pointer-events-auto absolute left-4 top-6 text-xs font-semibold uppercase text-white opacity-90 transition-opacity duration-200 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:left-8"
        style={{ letterSpacing: '.18em' }}
      >
        TOONHUB
      </Link>

      <button
        type="button"
        onClick={toggle}
        data-menu-toggle
        data-menu-focusable
        aria-expanded={isOpen}
        aria-controls="site-menu"
        aria-label={isOpen ? '关闭导航菜单' : '打开导航菜单'}
        className="pointer-events-auto absolute right-[30px] top-6 flex items-center gap-2 text-xs font-semibold uppercase text-white opacity-95 transition-opacity duration-200 hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        style={{ letterSpacing: '.18em' }}
      >
        {isOpen ? 'CLOSE' : 'MENU'}
        {isOpen ? (
          <X size={16} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Menu size={16} strokeWidth={2.5} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
