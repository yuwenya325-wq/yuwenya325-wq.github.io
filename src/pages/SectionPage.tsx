/**
 * 栏目页统一骨架（基础结构，暂不填充最终作品）。
 * 每个栏目页都包含：TOONHUB 品牌标识（固定头部）、英文大标题、中文标题，
 * 以及与全站统一的动态背景色与字体风格，MENU 导航可正常使用。
 * 页面数据统一来自 NAV_ITEMS，避免多处重复维护。
 */
import { ArrowUpRight } from 'lucide-react';
import { GRAIN, type NavItem } from '../data/site';

export default function SectionPage({ item }: { item: NavItem }) {
  return (
    <main
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-4 pb-20 pt-32 sm:px-8 sm:pt-40 lg:px-16"
      aria-labelledby="page-title"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ backgroundImage: GRAIN, backgroundSize: '200px 200px', backgroundRepeat: 'repeat' }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1440px]">
        <p
          className="mb-4 text-xs font-semibold uppercase text-white/80 sm:text-sm"
          style={{ letterSpacing: '.22em' }}
        >
          {item.number} — TOONHUB
        </p>

        <h1
          id="page-title"
          className="text-white"
          style={{
            fontFamily: 'Anton, sans-serif',
            fontSize: 'clamp(52px, 13vw, 184px)',
            lineHeight: 0.92,
            letterSpacing: '-.02em',
            fontWeight: 400,
          }}
        >
          {item.en}
        </h1>

        <p className="mt-6 text-lg text-white/90 sm:text-2xl">{item.zh}</p>

        <p className="mt-8 max-w-xl text-sm leading-[1.7] text-white/80 sm:text-base">
          页面基础结构已就绪，作品内容将在后续阶段补充。
        </p>

        <div
          className="mt-10 inline-flex items-center gap-2 text-xs font-semibold uppercase text-white/85 sm:text-sm"
          style={{ letterSpacing: '.18em' }}
        >
          COMING SOON
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

/** 未匹配到路由时的兜底页面，样式与栏目页保持一致。 */
export function NotFound() {
  return (
    <SectionPage
      item={{ id: 'not-found', number: '404', en: 'NOT FOUND', zh: '页面不存在', path: '/' }}
    />
  );
}
