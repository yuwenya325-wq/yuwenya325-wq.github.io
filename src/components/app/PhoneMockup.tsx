import { useState } from 'react';
import { primaryScreens, type AppProduct } from '../../data/app-product';
import WorkImage from '../media/WorkImage';
import { APPC } from './theme';

type PhoneMockupProps = {
  product: AppProduct;
};

/**
 * 高质量 3D 手机模型。
 *
 * - 机身：CSS 绘制的深空黑金属边框（外层高光 + 内层听筒暗线 + 侧键），
 *   屏幕圆角比机身小一档，还原真实手机的「边框包屏幕」结构；
 * - 屏幕：显示产品的真实 UI 截图（WebP），多屏叠放交叉淡入，绝不平铺截图；
 * - 姿态：默认微微倾斜（rotateY/rotateX），悬浮上下漂浮 + 地面椭圆柔影同步缩放，
 *   悬停时缓缓转正一点，像被拿起端详；
 * - 屏幕切换：机身下方一排胶囊 tab（今天/日历/待办/我的），与今页底部导航一致；
 * - 「减少动态效果」偏好下停用漂浮与倾斜（见 index.css 的 ap-* 降级规则）。
 */
export default function PhoneMockup({ product }: PhoneMockupProps) {
  const screens = primaryScreens(product);
  const [active, setActive] = useState(0);
  const current = screens[active];

  if (!current) return null;

  return (
    <div className="flex flex-col items-center">
      {/* 3D 舞台：透视由 .ap-stage 提供，倾斜与漂浮分层避免 transform 冲突 */}
      <div className="ap-stage relative select-none py-6">
        <div className="ap-float relative">
          <div className="ap-tilt relative">
            {/* 机身 */}
            <div
              className="relative"
              style={{
                width: 'clamp(184px, 17.5vw, 236px)',
                borderRadius: 38,
                padding: 9,
                background: 'linear-gradient(145deg, #3A3A3E 0%, #17171A 38%, #0C0C0E 100%)',
                boxShadow: `${APPC.phoneShadow}, inset 0 1px 1px rgba(255,255,255,.22), inset 0 -1px 1px rgba(0,0,0,.6)`,
              }}
            >
              {/* 侧键 */}
              <span aria-hidden="true" className="absolute -right-[3px] top-[19%] h-11 w-[3px] rounded-r-[2px]" style={{ background: '#2A2A2E' }} />
              <span aria-hidden="true" className="absolute -right-[3px] top-[32%] h-7 w-[3px] rounded-r-[2px]" style={{ background: '#2A2A2E' }} />
              <span aria-hidden="true" className="absolute -left-[3px] top-[24%] h-8 w-[3px] rounded-l-[2px]" style={{ background: '#2A2A2E' }} />

              {/* 屏幕：真实 UI 截图叠放交叉淡入 */}
              <div
                className="relative overflow-hidden bg-white"
                style={{ borderRadius: 30, aspectRatio: '375 / 811' }}
                role="tabpanel"
                id="ap-phone-screen"
                aria-label={`今页「${current.label}」界面预览`}
              >
                {screens.map((screen, index) => (
                  <WorkImage
                    key={screen.id}
                    sources={[{ src: screen.image, width: screen.width }]}
                    alt={index === active ? `今页「${screen.label}」真实界面` : ''}
                    width={screen.width}
                    height={screen.height}
                    placeholderColor="#FFFFFF"
                    fallbackLabel="界面截图加载失败"
                    className="ap-screen absolute inset-0 h-full w-full object-cover object-top"
                    style={{ opacity: index === active ? 1 : 0 }}
                    draggable={false}
                  />
                ))}
              </div>
            </div>

            {/* 地面椭圆柔影（随漂浮同步缩放，制造离地高度感） */}
            <span aria-hidden="true" className="ap-ground pointer-events-none absolute -bottom-7 left-1/2 h-8 w-[78%] -translate-x-1/2" />
          </div>
        </div>
      </div>

      {/* 屏幕切换：与今页底部导航一致的四个页签 */}
      <div
        role="tablist"
        aria-label="今页界面预览切换"
        className="-mx-4 mt-7 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
      >
        {screens.map((screen, index) => {
          const selected = index === active;
          return (
            <button
              key={screen.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="ap-phone-screen"
              onClick={() => setActive(index)}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[12px] font-bold transition-[background-color,border-color,color,box-shadow] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: selected ? APPC.accent : APPC.card,
                border: `1px solid ${selected ? APPC.accent : APPC.border}`,
                color: selected ? '#FFFFFF' : APPC.body,
                boxShadow: selected ? '0 6px 16px rgba(75,98,70,.22)' : 'none',
                outlineColor: APPC.accent,
              }}
            >
              <span>{screen.label}</span>
              <span
                translate="no"
                className="text-[9px] font-bold uppercase tracking-[.16em]"
                style={{ fontFamily: 'Inter, sans-serif', opacity: selected ? 0.8 : 0.45 }}
              >
                {screen.en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
