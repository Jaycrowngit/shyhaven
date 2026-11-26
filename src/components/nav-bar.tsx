'use client';

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useId, useState, type ReactNode } from 'react';
import { Logo } from './logo';

export const NAV_LINKS = [
  { href: '/homes', label: 'Find a Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/trust-and-safety', label: 'Trust & Safety' },
  { href: '/landlords', label: 'For Landlords' },
  { href: '/about', label: 'About Us' },
];

const ease = [0.22, 1, 0.36, 1] as const;

type NavLink = (typeof NAV_LINKS)[number];

/**
 * Desktop links with the current page highlighted. Reads the URL, so it renders inside <Suspense>;
 * the fallback is the same links without highlighting, so nothing shifts.
 */
function DesktopLinks() {
  const pathname = usePathname();
  return <LinkRow isActive={(l) => pathname === l.href || pathname.startsWith(`${l.href}/`)} />;
}

function LinkRow({ isActive }: { isActive: (l: NavLink) => boolean }) {
  return (
    <>
      {NAV_LINKS.map((l) => {
        const active = isActive(l);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? 'page' : undefined}
            className={`group relative rounded-full px-3 py-2 text-[14px] leading-none xl:px-4 xl:text-[15px] font-semibold tracking-[-0.005em] whitespace-nowrap transition-colors ${
              active ? 'text-primary' : 'text-navy hover:text-primary'
            }`}
          >
            {l.label}
            <span
              className={`absolute inset-x-3 -bottom-1 xl:inset-x-4 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 ${
                active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </Link>
        );
      })}
    </>
  );
}

export function NavBar({ desktopAuth, mobileAuth }: { desktopAuth: ReactNode; mobileAuth: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const menuId = useId();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12));

  // Close on Escape (links close it on click); lock page scroll while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled || open ? 'border-b border-border bg-white/90 shadow-[0_8px_30px_-12px_rgba(14,42,71,0.18)] backdrop-blur-md' : 'border-b border-transparent bg-white'
        }`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          Skip to content
        </a>
        <div className="shell flex h-[68px] items-center justify-between gap-6 xl:grid xl:grid-cols-[1fr_auto_1fr]">
          <Link href="/" aria-label="SkyHaven home" className="shrink-0 justify-self-start">
            <Logo className="h-7 w-auto sm:h-8" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-0.5 nav:flex xl:gap-1">
            <Suspense fallback={<LinkRow isActive={() => false} />}>
              <DesktopLinks />
            </Suspense>
          </nav>

          <div className="hidden items-center justify-self-end gap-2 nav:flex xl:gap-3">{desktopAuth}</div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-white nav:hidden"
          >
            {[-6, 0, 6].map((y, i) => (
              <motion.span
                key={i}
                className="absolute h-0.5 w-5 rounded-full bg-navy"
                initial={false}
                animate={open ? (i === 1 ? { opacity: 0, scaleX: 0 } : { y: 0, rotate: i === 0 ? 45 : -45 }) : { y, rotate: 0, opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.3, ease }}
              />
            ))}
          </button>
        </div>
      </header>

      {/* Outside <header>: its backdrop-filter would make it the containing block for these fixed elements. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 top-[68px] z-40 bg-navy/30 backdrop-blur-[2px] nav:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              key="panel"
              id={menuId}
              aria-label="Mobile"
              className="fixed top-[68px] right-0 bottom-0 z-50 flex w-full max-w-sm flex-col gap-1 overflow-y-auto border-l border-border bg-white px-5 pt-4 pb-8 nav:hidden"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.45, ease }}
            >
              {NAV_LINKS.map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease }}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3.5 font-display text-lg font-bold text-navy hover:bg-primary-soft"
                  >
                    {l.label}
                    <span aria-hidden className="text-primary">
                      →
                    </span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                className="mt-4 flex flex-col gap-2 border-t border-border pt-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease }}
                onClick={() => setOpen(false)}
              >
                {mobileAuth}
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
