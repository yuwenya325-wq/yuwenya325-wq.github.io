import { useState, type CSSProperties } from 'react';
import { ImageOff } from 'lucide-react';

/** 单个可选档位：src + 真实像素宽（用于 srcset 描述符） */
export type MediaSource = {
  src: string;
  width?: number;
};

type WorkImageProps = {
  /** 多档响应式资源（按宽度从小到大排列即可，组件自动生成 srcset） */
  sources: MediaSource[];
  alt: string;
  /** 原始宽高（用于占位防跳动；只影响布局，不改图片比例） */
  width?: number;
  height?: number;
  /** sizes 提示，帮浏览器挑档位 */
  sizes?: string;
  /** 首屏关键图：eager + 高优先级；默认 lazy */
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** 加载失败时的兜底文案 */
  fallbackLabel?: string;
  /** 占位底色 */
  placeholderColor?: string;
  draggable?: boolean;
};

/**
 * 统一的作品图渲染组件（对应《素材发布规范》第三条）：
 * - 多档 WebP 走 srcset/sizes，浏览器按设备与视口选档；
 * - 非首屏 lazy + 异步解码，首屏 priority 时 eager 并提升抓取优先级；
 * - 传入原始宽高时写进 width/height 属性，图片未加载前就占好位，页面不跳动；
 * - 加载失败显示替代状态，不出现破图。
 */
export default function WorkImage({
  sources,
  alt,
  width,
  height,
  sizes,
  priority = false,
  className,
  style,
  fallbackLabel = '图片加载失败',
  placeholderColor = '#E8E7E1',
  draggable = false,
}: WorkImageProps) {
  const [failed, setFailed] = useState(false);
  const usable = sources.filter((source) => Boolean(source.src));

  if (!usable.length || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt}（${fallbackLabel}）`}
        className={`flex min-h-[120px] w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center ${className ?? ''}`}
        style={{ backgroundColor: placeholderColor, ...style }}
      >
        <ImageOff size={20} strokeWidth={2} aria-hidden="true" style={{ color: '#8A8A82' }} />
        <span className="text-[11px] font-bold" style={{ color: '#8A8A82' }}>
          {fallbackLabel}
        </span>
      </div>
    );
  }

  // 单档：直接 src；多档：srcset（缺宽度时按常规档位描述符兜底）
  const defaults = [600, 1200, 1920];
  const srcSet = usable
    .map((source, index) => `${source.src} ${source.width ?? defaults[index] ?? 1920}w`)
    .join(', ');
  const smallest = usable.reduce((a, b) => ((a.width ?? Infinity) <= (b.width ?? Infinity) ? a : b));
  const src = smallest.src;

  return (
    <img
      src={src}
      srcSet={usable.length > 1 ? srcSet : undefined}
      sizes={usable.length > 1 ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={priority ? 'sync' : 'async'}
      draggable={draggable}
      onError={() => setFailed(true)}
      className={className}
      style={style}
    />
  );
}
