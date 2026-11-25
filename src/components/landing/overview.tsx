import Link from 'next/link';
import { ArrowRightIcon, CalendarIcon, KeyIcon, LockIcon, ShieldIcon } from '../ui';
import { SectionHeading, Stagger, StaggerItem } from './motion';

const PAGES = [
  {
    href: '/how-it-works',
    icon: <CalendarIcon className="h-6 w-6" />,
    title: 'How It Works',
    body: 'Four simple steps for renters and for landlords, from search to keys.',
  },
  {
    href: '/trust-and-safety',
    icon: <ShieldIcon className="h-6 w-6" />,
    title: 'Trust & Safety',
    body: 'The five checks every home passes, how your rent is held, and our rules.',
  },
  {
    href: '/landlords',
    icon: <KeyIcon className="h-6 w-6" />,
    title: 'For Landlords',
    body: 'How we make sure your home goes to a real tenant who has already paid.',
  },
  {
    href: '/about',
    icon: <LockIcon className="h-6 w-6" />,
    title: 'About Us',
    body: 'Why we built SkyHaven, and what we stand for: verified, protected, transparent.',
  },
];

export function Overview() {
  return (
    <section className="bg-white py-[clamp(64px,8vw,104px)]">
      <div className="shell flex flex-col gap-12">
        <SectionHeading eyebrow="What we do" title="Renting in Nigeria, without the risk">
          SkyHaven checks every home, holds the rent until move-in, and stays in the middle until the keys change hands.
        </SectionHeading>
        <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PAGES.map((p) => (
            <StaggerItem key={p.href}>
              <Link
                href={p.href}
                className="group flex h-full flex-col gap-4 rounded-3xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_50px_-24px_rgba(14,42,71,0.35)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                  {p.icon}
                </span>
                <span className="font-display text-xl font-bold text-navy">{p.title}</span>
                <span className="text-[15px] leading-relaxed text-muted">{p.body}</span>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-[15px] font-semibold text-primary">
                  Learn more <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
