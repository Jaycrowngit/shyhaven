import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

const d = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

/** Header for the pages linked from the navbar. CSS entrance only, so it paints before JavaScript loads. */
export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[#F5F8FC]">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[#E7EFFC] blur-3xl" />
        <svg viewBox="0 0 100 60" className="absolute right-[6%] bottom-0 hidden h-56 w-auto text-primary/10 lg:block">
          <path d="M30 21.5 50 4.5 70 21.5" fill="none" stroke="#8DB4FA" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
          <path d="M9 52 50 17 91 52" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="shell flex flex-col gap-5 py-[clamp(48px,6vw,80px)]">
        <nav aria-label="Breadcrumb" className="anim-rise text-sm text-muted">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>{' '}
          <span aria-hidden>/</span> <span className="text-navy">{eyebrow}</span>
        </nav>
        <h1
          className="anim-rise max-w-4xl font-display text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.06] font-extrabold tracking-[-0.025em] text-balance text-navy"
          style={d(0.08)}
        >
          {title}
        </h1>
        <div className="anim-rise max-w-2xl text-[clamp(1.05rem,1.5vw,1.2rem)] leading-relaxed text-muted" style={d(0.18)}>
          {children}
        </div>
      </div>
    </section>
  );
}
