'use client';

import { animate, motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';

export const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const group: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const item: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } };

/** A list whose items reveal one after another. Use `StaggerItem` for each child. */
export function Stagger({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'ul' | 'ol' }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={group} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -10% 0px' }}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={item}>
      {children}
    </Tag>
  );
}

/** Counts up to `to` when scrolled into view. Server-rendered with the final value, so it reads right without JS. */
export function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || reduce || !ref.current) return;
    const el = ref.current;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (v) => (el.textContent = `${prefix}${Math.round(v)}${suffix}`),
    });
    return () => controls.stop();
  }, [inView, reduce, to, prefix, suffix]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {to}
      {suffix}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, children, center = false }: { eyebrow: string; title: ReactNode; children?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={`flex flex-col gap-4 ${center ? 'mx-auto items-center text-center' : ''} max-w-2xl`}>
      <p className="inline-flex w-fit items-center rounded-full bg-primary-soft px-3.5 py-1.5 text-[13px] font-semibold tracking-wide text-primary uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display text-[clamp(1.85rem,3.4vw,2.7rem)] leading-[1.12] font-extrabold tracking-[-0.02em] text-balance text-navy">{title}</h2>
      {children && <div className="text-[1.075rem] leading-relaxed text-muted">{children}</div>}
    </Reveal>
  );
}
