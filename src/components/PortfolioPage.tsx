import type { PortfolioRoute } from '../routes';

type PortfolioPageProps = {
  page: PortfolioRoute;
};

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.08'/%3E%3C/svg%3E")`;

export default function PortfolioPage({ page }: PortfolioPageProps) {
  return (
    <main className="relative flex min-h-screen w-full items-center overflow-hidden px-4 pb-12 pt-24 text-white sm:px-8 lg:px-16" style={{ backgroundColor: page.color }}>
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: grain, backgroundSize: '200px 200px' }} />
      <div className="relative z-10 mx-auto w-full max-w-[1180px]">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] opacity-75">YWY PORTFOLIO / {page.number}</p>
        <h1 className="max-w-[1100px] uppercase" style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(68px, 13vw, 190px)', lineHeight: .86, letterSpacing: '-.035em' }}>
          {page.title}
        </h1>
        <div className="mt-8 flex items-center gap-4 sm:mt-10">
          <span className="h-px w-12 bg-white/70 sm:w-20" />
          <p className="text-base font-semibold tracking-[.12em] sm:text-xl">{page.label}</p>
        </div>
      </div>
    </main>
  );
}
