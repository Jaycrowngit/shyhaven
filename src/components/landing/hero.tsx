'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Form from 'next/form';
import Image from 'next/image';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { CheckIcon, LockIcon, ShieldIcon } from '../ui';

/** Delay for a CSS entrance animation (see `.anim-*` in globals.css). */
const d = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

/**
 * Entrance animations are CSS, so the hero paints fully before JavaScript loads.
 * Motion only drives the scroll parallax, which is an enhancement.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const sunY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-white">
      <SkyBackdrop />
      <div className="shell grid items-center gap-14 pt-12 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-[6vw] lg:pt-20 lg:pb-28">
        <div className="max-w-[640px] 2xl:max-w-[780px]">
          <p className="anim-rise mb-6 inline-flex items-center rounded-full border border-border bg-white/80 px-4 py-1.5 text-sm font-semibold text-muted backdrop-blur">
            Built for Nigeria · Verified homes · Protected rent
          </p>

          <h1 className="font-display text-[clamp(2.6rem,5.2vw,5.4rem)] leading-[1.04] font-extrabold tracking-[-0.03em] text-navy">
            <span className="block">
              {['Find', 'a', 'verified', 'home.'].map((w, i) => (
                <span key={i} className="anim-rise mr-[0.22em] inline-block" style={d(0.05 + i * 0.07)}>
                  {w}
                </span>
              ))}
            </span>
            <span className="block">
              <span className="anim-rise mr-[0.22em] inline-block" style={d(0.35)}>
                Pay
              </span>
              <span className="anim-rise relative inline-block text-primary" style={d(0.42)}>
                safely.
                <svg viewBox="0 0 220 18" className="absolute -bottom-2 left-0 h-[0.32em] w-full overflow-visible" aria-hidden preserveAspectRatio="none">
                  <path d="M3 13 C 60 3, 150 3, 217 11" pathLength={1} className="anim-draw" style={d(0.9)} fill="none" stroke="#E8962B" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h1>

          <p className="anim-rise mt-6 max-w-[34em] text-[clamp(1.05rem,1.6vw,1.2rem)] leading-relaxed text-muted" style={d(0.55)}>
            Every listing is checked by our team, and your rent is held until you move in. No fake listings, no inspection fees to agents for houses that don’t exist, no caution fee that never comes back.
          </p>

          <div className="anim-rise" style={d(0.65)}>
            <Form action="/homes" role="search" className="mt-8 flex max-w-[560px] flex-col gap-3 rounded-2xl border border-border bg-white p-2 shadow-[0_20px_50px_-24px_rgba(14,42,71,0.35)] sm:flex-row">
              <label htmlFor="hero-q" className="sr-only">
                Area or city
              </label>
              <input
                id="hero-q"
                name="q"
                placeholder="Try Yaba, Lekki or Wuse 2"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl px-4 py-3.5 text-base text-navy placeholder:text-[#7D8A9C] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-navy transition-[background-color,transform] duration-200 hover:scale-[1.03] hover:bg-[var(--sh-accent-hover)] active:scale-[0.97]"
              >
                Search homes
              </button>
            </Form>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[15px] font-medium text-navy">
            {['Every listing checked', 'Rent held until move-in', 'Pay by card, transfer or USSD'].map((t, i) => (
              <li key={t} className="anim-rise flex items-center gap-2" style={d(0.8 + i * 0.1)}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <CheckIcon className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-[min(100%,420px)] lg:mr-4 lg:ml-auto xl:w-[480px] 2xl:w-[580px]">
          {/* The sun rising behind the arch: the brand's move-in moment */}
          <motion.div style={{ y: sunY }} className="absolute -right-[18%] -bottom-[6%] -z-10 w-[58%]">
            <div
              className="anim-sun aspect-square rounded-full bg-accent"
              style={{
                ...d(0.4),
                boxShadow:
                  '0 0 0 clamp(10px,1.5vw,16px) #fff, 0 0 0 clamp(12px,1.8vw,19px) rgba(232,150,43,.5), 0 0 0 clamp(24px,3.6vw,40px) #fff, 0 0 0 clamp(26px,3.9vw,43px) rgba(232,150,43,.25)',
              }}
            />
          </motion.div>

          <motion.div style={{ y: photoY }}>
            <div className="anim-arch relative aspect-[4/5] overflow-hidden rounded-[999px_999px_22px_22px] shadow-[0_30px_60px_-20px_rgba(14,42,71,0.45)]" style={d(0.1)}>
              <div className="anim-settle absolute inset-0" style={d(0.1)}>
                <Image
                  src="/images/sample/apartment-02.jpg"
                  alt="Apartment building with plants on its balconies under a clear blue sky"
                  fill
                  priority
                  sizes="(min-width: 1536px) 580px, (min-width: 1024px) 480px, 90vw"
                  className="object-cover object-[58%_50%]"
                />
              </div>
            </div>
          </motion.div>

          <FloatingCard className="top-[14%] -left-[6%] sm:-left-[18%]" delay={0.9} bob={0}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-verified/10 text-verified">
              <ShieldIcon className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-sm text-navy">Ownership verified</strong>
              <span className="text-xs text-muted">Checked by our team</span>
            </span>
          </FloatingCard>

          <FloatingCard className="bottom-[16%] -left-[4%] sm:-left-[14%]" delay={1.05} bob={1.2}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <LockIcon className="h-5 w-5" />
            </span>
            <span>
              <strong className="block text-sm text-navy">Rent held safely</strong>
              <span className="text-xs text-muted">Released after you move in</span>
            </span>
          </FloatingCard>

          <FloatingCard className="-top-[3%] right-[2%]" delay={1.2} bob={2.2} compact>
            <DrawnMark />
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}

function FloatingCard({ children, className, delay, bob, compact = false }: { children: ReactNode; className: string; delay: number; bob: number; compact?: boolean }) {
  return (
    <div className={`anim-pop absolute z-10 ${className}`} style={d(delay)}>
      <div
        className={`anim-bob flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 shadow-[0_18px_40px_-16px_rgba(14,42,71,0.4)] backdrop-blur ${compact ? 'p-3' : 'py-3 pr-5 pl-3'}`}
        style={d(bob)}
      >
        {children}
      </div>
    </div>
  );
}

/** The SkyHaven symbol drawing itself: sky line, roof, walls, then the sun rising in the doorway. */
function DrawnMark() {
  return (
    <svg viewBox="0 0 100 100" className="h-11 w-11" aria-hidden>
      <path d="M30 21.5 50 4.5 70 21.5" pathLength={1} className="anim-draw" style={d(1.4)} fill="none" stroke="#8DB4FA" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 52 50 17 91 52" pathLength={1} className="anim-draw" style={d(1.6)} fill="none" stroke="#1D5FD6" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 61V90M76 61V90" pathLength={1} className="anim-draw" style={d(1.8)} stroke="#1D5FD6" strokeWidth="11" />
      <clipPath id="hero-door">
        <rect x="30" y="60" width="40" height="30" />
      </clipPath>
      <g clipPath="url(#hero-door)">
        <path d="M32 90a18 18 0 0 1 36 0z" className="anim-sun" style={d(2)} fill="#E8962B" />
      </g>
    </svg>
  );
}

/** Soft, slowly drifting sky colours behind the hero. */
function SkyBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden>
      <div className="anim-drift absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#E7EFFC] blur-3xl" />
      <div className="anim-drift absolute top-1/3 -right-40 h-[440px] w-[440px] rounded-full bg-[#FDF0DF] blur-3xl [animation-direction:reverse] [animation-duration:24s]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />
    </div>
  );
}
