import Link from 'next/link';
import { CheckIcon } from '../ui';
import { Reveal, SectionHeading, Stagger, StaggerItem } from './motion';

/**
 * What SkyHaven costs. The commission rate is still a client decision (Blueprint 17), so no percentage is shown;
 * landlords see their exact payout before they publish.
 */
const PLANS = [
  {
    who: 'For renters',
    price: 'Free to search',
    sub: 'No inspection fee. No sign-up fee.',
    points: [
      'Search verified homes and book inspections at no cost',
      'Pay the rent and refundable caution deposit shown on the listing, nothing hidden',
      'Pay by card, bank transfer or USSD',
      'Rent held by SkyHaven until you move in',
      'Help from our team if the home isn’t what was listed',
    ],
    cta: { href: '/homes', label: 'Find a home' },
    accent: true,
  },
  {
    who: 'For landlords',
    price: 'Free to list',
    sub: 'A fee only when a tenant moves in.',
    points: [
      'List as many homes as you own or manage, free',
      'Verified badge after our team checks your home',
      'Our fee comes out of the rent only after move-in',
      'You see exactly what you’ll receive before you publish',
      'Rent paid into your verified Nigerian bank account',
    ],
    cta: { href: '/sign-up?intent=list&next=/landlord/onboarding', label: 'List your property' },
    accent: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y border-border bg-[#F5F8FC] py-[clamp(56px,7vw,96px)]">
      <div className="shell flex flex-col gap-12">
        <SectionHeading eyebrow="What it costs" title="Simple pricing. No hidden fees." center>
          Renters never pay to search or inspect. Landlords never pay to list. SkyHaven earns only when a tenant actually moves in.
        </SectionHeading>
        <Stagger className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2">
          {PLANS.map((p) => (
            <StaggerItem
              key={p.who}
              className={`flex flex-col gap-6 rounded-3xl border p-7 sm:p-9 ${p.accent ? 'border-primary bg-white shadow-[0_30px_60px_-30px_rgba(29,95,214,0.45)]' : 'border-border bg-white'}`}
            >
              <div>
                <p className="text-sm font-semibold tracking-wide text-primary uppercase">{p.who}</p>
                <p className="mt-2 font-display text-4xl font-extrabold text-navy">{p.price}</p>
                <p className="mt-1 text-muted">{p.sub}</p>
              </div>
              <ul className="flex flex-col gap-3">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-3 text-[15px] text-navy">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link
                href={p.cta.href}
                className={`mt-auto inline-flex w-fit items-center rounded-[10px] px-6 py-3.5 font-semibold transition-colors ${
                  p.accent ? 'bg-accent text-navy hover:bg-[var(--sh-accent-hover)]' : 'bg-primary text-white hover:bg-[var(--sh-primary-hover)]'
                }`}
              >
                {p.cta.label}
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal>
          <p className="text-center text-sm text-muted">
            The caution deposit is set by the landlord, refundable, and shown on every listing. SkyHaven never adds an agency fee on top.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
