import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, RotateCw, X } from 'lucide-react';

export type LightboxItem = {
  /** 高清大图（详情档，点击缩略图时才按需加载） */
  src: string;
  /** 可选的低清预览（大图加载完成前先显示，减少等待感） */
  thumb?: string;
  title: string;
  meta?: string;
};

type LightboxProps = {
  items: LightboxItem[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  /** 强调色（默认 VISUAL 的荧光黄；AI FILM 传暖金） */
  accent?: string;
};

/** 点击放大时的缩放倍率（配合拖动平移查看细节） */
const ZOOM_SCALE = 2.4;

/**
 * 作品图片放大预览。
 * 遮罩 / 关闭按钮 / Esc 关闭，← → 切换，打开时锁定页面滚动，
 * 关闭后把焦点还给触发元素。
 * 大图按需加载：先显示低清预览，加载完成后无缝替换；失败可重试。
 * 点击图片进入 2.4× 细节模式，拖动平移查看局部，再点一次恢复完整画面。
 */
export default function Lightbox({ items, index, onIndex, onClose, accent = '#DDF344' }: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [attempt, setAttempt] = useState(0);
  /** 细节模式：点击图片放大，拖动平移 */
  const [zoomed, setZoomed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  /** 本次按下后是否发生过明显拖动（拖动松手不触发「点击缩放」） */
  const pannedRef = useRef(false);
  const current = items[index];

  const go = useCallback((step: number) => {
    if (items.length < 2) return;
    onIndex((index + step + items.length) % items.length);
  }, [index, items.length, onIndex]);

  // 切换作品时重置加载状态与细节模式
  useEffect(() => {
    setStatus('loading');
    setAttempt(0);
    setZoomed(false);
    setOffset({ x: 0, y: 0 });
  }, [index, current?.src]);

  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
      returnFocusRef.current = null;
    };
  }, [onClose, go]);

  if (!current) return null;
  const bust = attempt > 0 ? `${current.src}${current.src.includes('?') ? '&' : '?'}r=${attempt}` : current.src;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`作品预览：${current.title}`}
      className="vw-fade-in fixed inset-0 z-[200] flex flex-col"
      style={{ backgroundColor: 'rgba(17,17,17,.94)' }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <p className="min-w-0 text-[11px] font-bold uppercase tracking-[.22em] text-white/60">
          {index + 1} / {items.length}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={(event) => { event.stopPropagation(); onClose(); }}
          className="flex h-10 items-center gap-2 rounded-full px-4 text-[11px] font-bold uppercase tracking-[.16em] outline-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ backgroundColor: accent, color: '#171717' }}
        >
          CLOSE
          <X size={14} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-6">
        {items.length > 1 ? (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); go(-1); }}
            aria-label="上一张"
            className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white outline-none transition-colors duration-300 hover:brightness-125 focus-visible:outline focus-visible:outline-2 sm:mr-6"
            style={{ border: '1px solid rgba(255,255,255,.28)' }}
          >
            <ChevronLeft size={20} strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : null}

        <div
          className={`relative flex min-h-0 flex-1 items-center justify-center${zoomed ? ' overflow-hidden' : ''}`}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            const dx = event.clientX - drag.startX;
            const dy = event.clientY - drag.startY;
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) pannedRef.current = true;
            setOffset({ x: drag.baseX + dx, y: drag.baseY + dy });
          }}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerLeave={() => { dragRef.current = null; }}
        >
          {/* 低清预览：大图到位前先垫着，避免空白等待 */}
          {status !== 'loaded' && current.thumb && status !== 'failed' ? (
            <img
              src={current.thumb}
              alt=""
              aria-hidden="true"
              className="vw-zoom-in absolute max-h-full max-w-full object-contain opacity-60 blur-[1px]"
              onClick={(event) => event.stopPropagation()}
            />
          ) : null}

          {status === 'failed' ? (
            <div
              className="flex flex-col items-center gap-4 rounded-[4px] px-10 py-9"
              style={{ backgroundColor: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.2)' }}
              onClick={(event) => event.stopPropagation()}
            >
              <ImageOff size={26} strokeWidth={2} aria-hidden="true" className="text-white/50" />
              <p className="text-sm font-bold text-white/80">大图加载失败</p>
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[.16em] outline-none transition-colors duration-300 focus-visible:outline focus-visible:outline-2"
                style={{ backgroundColor: accent, color: '#171717' }}
              >
                <RotateCw size={13} strokeWidth={3} aria-hidden="true" />
                重新加载
              </button>
            </div>
          ) : (
            <img
              key={bust}
              src={bust}
              alt={current.title}
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('failed')}
              className={`min-h-0 max-h-full max-w-full object-contain transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}${zoomed ? '' : ' vw-zoom-in'}`}
              style={{
                cursor: zoomed ? 'zoom-out' : 'zoom-in',
                transform: zoomed ? `translate(${offset.x}px, ${offset.y}px) scale(${ZOOM_SCALE})` : undefined,
                touchAction: zoomed ? 'none' : undefined,
                userSelect: 'none',
              }}
              draggable={false}
              onClick={(event) => {
                event.stopPropagation();
                if (pannedRef.current) { pannedRef.current = false; return; }
                if (zoomed) setOffset({ x: 0, y: 0 });
                setZoomed((value) => !value);
              }}
              onPointerDown={(event) => {
                if (!zoomed) return;
                pannedRef.current = false;
                dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: offset.x, baseY: offset.y };
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
            />
          )}

          {/* 加载指示 */}
          {status === 'loading' ? (
            <span
              aria-label="大图加载中"
              role="status"
              className="absolute h-9 w-9 animate-spin rounded-full border-2 border-white/25"
              style={{ borderTopColor: accent }}
            />
          ) : null}
        </div>

        {items.length > 1 ? (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); go(1); }}
            aria-label="下一张"
            className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white outline-none transition-colors duration-300 hover:brightness-125 focus-visible:outline focus-visible:outline-2 sm:ml-6"
            style={{ border: '1px solid rgba(255,255,255,.28)' }}
          >
            <ChevronRight size={20} strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="px-4 pb-6 text-center sm:px-6">
        <p className="text-sm font-bold text-white">{current.title}</p>
        {current.meta ? <p className="mt-1 text-xs text-white/55">{current.meta}</p> : null}
      </div>
    </div>
  );
}
