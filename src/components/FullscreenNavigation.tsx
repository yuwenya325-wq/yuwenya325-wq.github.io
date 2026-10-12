import { useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PORTFOLIO_ROUTES } from '../routes';

type FullscreenNavigationProps = {
  isOpen: boolean;
  backgroundColor: string;
  currentPath: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, path: string) => void;
};

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

export default function FullscreenNavigation({ isOpen, backgroundColor, currentPath, triggerRef, onClose, onNavigate }: FullscreenNavigationProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => firstLinkRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }

      if (event.key !== 'Tab') return;
      const links = Array.from(overlayRef.current?.querySelectorAll<HTMLAnchorElement>('a[href]') ?? []);
      const focusable = [triggerRef.current, ...links].filter(
        (item): item is HTMLAnchorElement | HTMLButtonElement => item !== null,
      );
      if (!focusable.length) return;
      const currentIndex = focusable.indexOf(document.activeElement as HTMLAnchorElement | HTMLButtonElement);
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
        : (currentIndex === focusable.length - 1 ? 0 : currentIndex + 1);
      event.preventDefault();
      focusable[nextIndex]?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (overlayRef.current?.contains(document.activeElement)) {
        (triggerRef.current ?? previousFocus)?.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  return (
    <div
      ref={overlayRef}
      id="fullscreen-navigation"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[80] overflow-x-hidden overflow-y-auto text-white transition-[opacity,transform,visibility] duration-500 ease-[cubic-bezier(.4,0,.2,1)] ${isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-4 opacity-0 pointer-events-none'}`}
      style={{ backgroundColor }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-40" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />
      <nav aria-label="Portfolio navigation" className="relative z-10 flex min-h-screen items-center px-4 pb-10 pt-24 sm:px-8 sm:pb-12 sm:pt-28 lg:px-16">
        <ol className="mx-auto w-full max-w-[1180px] border-t border-white/35">
          {PORTFOLIO_ROUTES.map((item, index) => (
            <li
              key={item.path}
              className={`border-b border-white/35 transition-[opacity,transform] duration-300 ease-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}
              style={{ transitionDelay: isOpen ? `${90 + index * 55}ms` : '0ms' }}
            >
              <a
                ref={index === 0 ? firstLinkRef : undefined}
                href={item.path}
                tabIndex={isOpen ? 0 : -1}
                aria-current={currentPath === item.path ? 'page' : undefined}
                onClick={(event) => onNavigate(event, item.path)}
                className="group grid min-h-[76px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-white no-underline outline-none sm:min-h-[92px] sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:gap-5 lg:min-h-[104px]"
              >
                <span className="self-start pt-2 text-[11px] font-semibold tracking-[.16em] opacity-70 sm:self-center sm:pt-0 sm:text-xs">{item.number}</span>
                <span className="flex min-w-0 items-center gap-3 overflow-hidden">
                  <span
                    className="truncate uppercase transition-transform duration-300 ease-out group-hover:translate-x-2 group-focus-visible:translate-x-2"
                    style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(30px, 4.5vw, 56px)', lineHeight: .95, letterSpacing: '-.02em' }}
                  >
                    {item.title}
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 -translate-x-2 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:h-7 sm:w-7" strokeWidth={2.1} />
                </span>
                <span className="whitespace-nowrap text-xs font-medium tracking-[.08em] opacity-85 sm:text-[15px]">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
