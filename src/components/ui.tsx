import type { ReactNode } from 'react';
import type { Tone } from '@/lib/format';

/**
 * Shared class strings and small presentational pieces.
 * Brand rules (Blueprint 18): amber is for the ONE primary action per screen, with dark text on it.
 * Verified teal only appears on things that were actually checked.
 */
const base =
  'inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-3 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export const btn = {
  /** The single main action on a screen: "Search homes", "Pay rent", "Book a viewing". */
  accent: `${base} bg-accent text-[var(--sh-amber-ink)] hover:bg-[var(--sh-accent-hover)]`,
  primary: `${base} bg-primary text-on-primary hover:bg-[var(--sh-primary-hover)]`,
  secondary: `${base} border border-border bg-surface text-text hover:border-primary hover:text-primary`,
  ghost: `${base} text-primary hover:bg-primary-soft`,
  danger: `${base} border border-danger/40 bg-surface text-danger hover:bg-danger/10`,
  small: 'px-3.5 py-2 text-sm',
};

export const input =
  'w-full rounded-[10px] border border-border bg-surface px-3.5 py-3 text-[15px] text-text placeholder:text-muted/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 aria-invalid:border-danger';

export const card = 'rounded-[14px] border border-border bg-surface';

export const container = 'shell';

const TONES: Record<Tone, string> = {
  neutral: 'bg-bg text-muted border-border',
  info: 'bg-primary-soft text-primary border-primary/20',
  verified: 'bg-verified/10 text-verified border-verified/25',
  warning: 'bg-accent/15 text-[color-mix(in_srgb,var(--sh-accent)_55%,var(--sh-text))] border-accent/30',
  danger: 'bg-danger/10 text-danger border-danger/25',
};

export function Badge({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <Badge tone="verified" className={className}>
      <CheckIcon className="h-3.5 w-3.5" />
      Verified
    </Badge>
  );
}

/** Required on every listing built from stock photos (skyhaven-photos/README). */
export function SampleBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-navy/85 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase ${className}`}
      title="Sample listing with stock photos, for demonstration only"
    >
      Sample
    </span>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Alert({ tone, children }: { tone: 'danger' | 'verified' | 'info' | 'warning'; children: ReactNode }) {
  const cls = {
    danger: 'border-danger/30 bg-danger/10 text-danger',
    verified: 'border-verified/30 bg-verified/10 text-verified',
    info: 'border-primary/25 bg-primary-soft text-primary',
    warning: 'border-accent/40 bg-accent/10 text-text',
  }[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-[10px] border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow && <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">{title}</h1>
      {children && <div className="max-w-2xl text-base text-muted">{children}</div>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={`${card} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
      <h2 className="font-display text-lg font-bold text-heading">{title}</h2>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-[10px] bg-border/60 ${className}`} />;
}

// ---------- Icons (inline, decorative unless labelled) ----------
type IconProps = { className?: string };
const svg = (className: string | undefined, children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'h-5 w-5'} aria-hidden>
    {children}
  </svg>
);
export const CheckIcon = ({ className }: IconProps) => svg(className, <path d="M20 6 9 17l-5-5" />);
export const ShieldIcon = ({ className }: IconProps) =>
  svg(className, <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>);
export const LockIcon = ({ className }: IconProps) =>
  svg(className, <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>);
export const KeyIcon = ({ className }: IconProps) =>
  svg(className, <><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" /></>);
export const BedIcon = ({ className }: IconProps) =>
  svg(className, <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /></>);
export const BathIcon = ({ className }: IconProps) =>
  svg(className, <><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.7 3 4 3.7 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><path d="M2 12h20M7 19v2M17 19v2" /></>);
export const PinIcon = ({ className }: IconProps) =>
  svg(className, <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>);
export const HeartIcon = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'h-5 w-5'} aria-hidden>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
export const CalendarIcon = ({ className }: IconProps) =>
  svg(className, <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>);
export const ArrowRightIcon = ({ className }: IconProps) => svg(className, <path d="M5 12h14M12 5l7 7-7 7" />);
export const MenuIcon = ({ className }: IconProps) => svg(className, <path d="M4 6h16M4 12h16M4 18h16" />);
