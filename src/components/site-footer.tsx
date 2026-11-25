import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { Logo } from './logo';

const COLUMNS = [
  {
    title: 'Renters',
    links: [
      { href: '/homes', label: 'Find a home' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/trust-and-safety', label: 'Trust & safety' },
      { href: '/account', label: 'My rentals' },
    ],
  },
  {
    title: 'Landlords',
    links: [
      { href: '/sign-up?intent=list&next=/landlord/onboarding', label: 'List your property' },
      { href: '/landlords', label: 'Why SkyHaven' },
      { href: '/landlords#policy', label: 'Landlord policy' },
      { href: '/landlord', label: 'Landlord dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/about#partners', label: 'Partners' },
      { href: '/trust-and-safety#policy', label: 'Our policy' },
      { href: '/sign-up', label: 'Get started' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#0E2A47] text-white">
      <div className="shell grid gap-10 pt-16 pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Link href="/" aria-label="SkyHaven home" className="logo-reversed w-fit">
            <Logo className="h-8 w-auto" />
          </Link>
          <p className="max-w-xs text-[15px] leading-relaxed text-white/70">
            Verified homes and protected rent. Every listing is checked by our team, and rent is held until you move in.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3 text-[15px]">
            <p className="font-display font-bold">{c.title}</p>
            {c.links.map((l) => (
              <Link key={l.label} href={l.href} className="w-fit text-white/70 transition-colors hover:text-white">
                {l.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="shell flex flex-col gap-2 border-t border-white/10 py-6 text-sm text-white/55 sm:flex-row sm:justify-between">
        <p>
          © <Year /> SkyHaven. All rights reserved.
        </p>
        <p>Made for renters and landlords in Nigeria.</p>
      </div>
    </footer>
  );
}

async function Year() {
  'use cache';
  cacheLife('days');
  return <>{new Date().getFullYear()}</>;
}
