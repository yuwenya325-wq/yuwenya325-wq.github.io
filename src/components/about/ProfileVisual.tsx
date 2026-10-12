import { useState } from 'react';
import { C, writePointerVars, resetPointerVars } from './theme';

/**
 * 照片资源（按《素材发布规范》处理）：
 * 1) WebP 两档（约 100/190 KB，替代原 3 MB PNG）
 * 2) 原抠图 PNG（WebP 缺失时回退）
 * 3) 原图 JPG（最终兜底，保持原始人物与构图，未做换脸 / 美颜 / 拉伸）
 */
const CUTOUT_WEBP = ['/images/about/profile-cut-thumb.webp', '/images/about/profile-cut-cover.webp'];
const CUTOUT_PNG = '/images/about/profile-cut.png';
const ORIGINAL = '/images/about/profile-src.jpg';

/** 人物投影：沿透明抠图轮廓落影，柔和且轻微 */
const PERSON_SHADOW = 'drop-shadow(0 30px 44px rgba(23,23,23,.20)) drop-shadow(0 6px 14px rgba(23,23,23,.10))';

/**
 * 人物展示区（创作者身份版）。
 * - 真实人物抠图自然放大，无证件照边框，沿轮廓轻微投影；
 * - 背景只保留简单几何：荧光黄大圆（右上）+ 半透明方块（左下）+ 细描边方块；
 * - 鼠标移动时几何图形轻微视差，人物整体缓慢浮动，保持稳定高级；
 * - 图片三级回退，保证始终有图。
 */
export default function ProfileVisual() {
  /** 0–1 = WebP 两档；2 = 原抠图 PNG；3 = 原图 JPG */
  const [fallbackLevel, setFallbackLevel] = useState(0);

  const handleError = () => setFallbackLevel((level) => level + 1);
  const useOriginal = fallbackLevel >= 2;
  const cutoutSrc = fallbackLevel === 0 ? CUTOUT_WEBP[0] : fallbackLevel === 1 ? CUTOUT_WEBP[1] : CUTOUT_PNG;

  return (
    <div
      onPointerMove={writePointerVars}
      onPointerLeave={resetPointerVars}
      className="about-visual relative mx-auto w-full max-w-[240px] sm:mx-0 sm:max-w-[290px] lg:max-w-[350px]"
    >
      {/* 几何 01：荧光黄大圆（右上，随鼠标轻微视差） */}
      <div
        aria-hidden="true"
        className="about-visual-circle absolute right-[-3%] top-[4%] aspect-square w-[78%] rounded-full"
        style={{ backgroundColor: C.accent }}
      />

      {/* 几何 02：半透明方块（左下，微旋转） */}
      <div
        aria-hidden="true"
        className="about-visual-square absolute bottom-[3%] left-[-7%] aspect-square w-[44%]"
        style={{ backgroundColor: 'rgba(23,23,23,.07)' }}
      />

      {/* 几何 03：细描边方块（左上，反向视差） */}
      <div
        aria-hidden="true"
        className="about-visual-frame absolute left-[4%] top-[15%] aspect-square w-[20%]"
        style={{ border: `1.5px solid rgba(23,23,23,.20)` }}
      />

      {/* 装饰文字：与几何反向轻微视差 */}
      <span
        aria-hidden="true"
        className="about-visual-deco absolute bottom-[1%] left-0 hidden select-none whitespace-nowrap text-[9px] font-bold uppercase tracking-[.3em] sm:block"
        style={{ color: C.sub, fontFamily: 'Inter, sans-serif' }}
      >
        AIGC / VISUAL / FILM
      </span>

      {/* 人物主体：整体缓慢浮动，抠图沿轮廓落影 */}
      <div className="about-float relative z-10">
        {useOriginal ? (
          <div className="relative z-10 overflow-hidden rounded-[3px]" style={{ filter: PERSON_SHADOW }}>
            <img
              src={ORIGINAL}
              alt="于文雅 真人照片"
              width={941}
              height={1672}
              className="h-auto w-full object-cover"
              style={{ objectPosition: '50% 24%', aspectRatio: '3 / 4' }}
            />
          </div>
        ) : (
          <img
            src={cutoutSrc}
            alt="于文雅 真人照片（手持摄影机）"
            width={941}
            height={1672}
            loading="eager"
            decoding="async"
            className="relative z-10 mx-auto h-auto w-full select-none"
            style={{ objectFit: 'contain', objectPosition: 'bottom center', filter: PERSON_SHADOW }}
            draggable={false}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
