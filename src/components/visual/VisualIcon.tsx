import { useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { accentAlpha, type VisualCategory } from '../../data/visual';

type VisualIconProps = {
  category: VisualCategory;
  /** true：首页入口（悬浮 / 悬停 / 点击）；false：只作静态展示（作品页装饰） */
  interactive?: boolean;
  /** 点击后（约 300ms 放大过渡结束）触发跳转 */
  onActivate?: (path: string) => void;
};

/**
 * 分类图标（正式素材版）。
 *
 * 图标是已制作完成的静态 3D 渲染图（/icons/icon-<id>.webp，原图归档在
 * assets/originals/icons/），组件负责「展示与交互」而不是伪造 3D：
 * - 保持素材原始比例（1:1），不做整图 360° 翻转、不做环形公转；
 * - 上下轻微悬浮 + 小角度摆转（CSS 动画，四个分类周期略有差异，避免机械同步）；
 * - 悬停时轻微放大、浮现中英文名与进入提示、底部透出分类柔和强调色；
 * - 点击约 300ms 放大过渡后进入该分类的独立作品页。
 * 尊重 prefers-reduced-motion：不做悬浮摆转，只保留静态展示。
 */
export default function VisualIcon({ category, interactive = true, onActivate }: VisualIconProps) {
  const pressedRef = useRef(false);
  const [armed, setArmed] = useState(false);

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!interactive || !onActivate) return;
    // 新窗口 / 新标签等原生行为照常
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (pressedRef.current) return;
    event.preventDefault();
    pressedRef.current = true;
    setArmed(true);
    window.setTimeout(() => onActivate(category.path), 300);
  };

  /** 分类强调色注入 CSS 变量（柔和高光 / 描边用带透明度版本） */
  const accentVars = {
    ['--cat-accent' as string]: category.accent,
    ['--cat-accent-soft' as string]: accentAlpha(category.accent, 0.16),
    ['--cat-accent-line' as string]: accentAlpha(category.accent, 0.45),
  } as CSSProperties;

  const body = (
    <>
      {/* 图标舞台：柔和强调色在底层透出，图片悬浮其上；不裁切主体 */}
      <span className="vd-stage" aria-hidden="true">
        <span className="vd-halo" />
        <span className="vd-float" style={{ ['--float-duration' as string]: `${6 + (Number(category.number) % 3) * 1.4}s` }}>
          <img
            src={category.icon}
            alt=""
            width={512}
            height={512}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="vd-img"
          />
        </span>
      </span>

      <span className="vd-meta" translate="no">
        <span className="vd-num">{category.number}</span>
        <span className="vd-names">
          <span className="vd-en">{category.en}</span>
          <span className="vd-cn">{category.cn}</span>
        </span>
        <span className="vd-go" aria-hidden="true">
          <span className="vd-go-label">ENTER</span>
          <span className="vd-arrow">
            <ArrowRight size={11} strokeWidth={3} />
          </span>
        </span>
      </span>
    </>
  );

  // 作品页里只作静态展示：不可点击、不做悬浮动画，避免出现自我链接
  if (!interactive || !onActivate) {
    return (
      <span className="vd-item is-static" aria-hidden="true" style={accentVars}>
        {body}
      </span>
    );
  }

  return (
    <a
      href={category.path}
      onClick={handleClick}
      className={`vd-item${armed ? ' is-armed' : ''}`}
      style={accentVars}
      aria-label={`${category.number} ${category.en} ${category.cn} — 进入该分类作品页`}
    >
      {body}
    </a>
  );
}
