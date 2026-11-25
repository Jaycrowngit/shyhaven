import Link from 'next/link';
import { getCities, searchListings } from '@/lib/dal';
import { ArrowRightIcon, PinIcon } from '../ui';
import { Reveal, SectionHeading, Stagger, StaggerItem } from './motion';

const STEPS = [
  { title: 'Sign up with your phone number', body: 'Enter your Nigerian mobile number and the code we send. No password to remember.' },
  { title: 'Find a home, or list yours', body: 'Renters search verified homes and book inspections. Landlords verify once and list for free.' },
  { title: 'Pay safely, get paid safely', body: 'Rent goes through SkyHaven and is held until move-in, then paid to the landlord’s bank account.' },
];

/** Cities come from the live listings, so the page only ever names places that actually have verified homes. */
export async function Coverage() {
  const cities = await getCities();
  const counts = await Promise.all(cities.map(async (city) => ({ city, total: (await searchListings({ city })).total })));

  return (
    <section id="cities" className="scroll-mt-20 bg-white py-[clamp(72px,9vw,120px)]">
      <div className="shell grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="flex flex-col gap-8">
          <SectionHeading eyebrow="Across Nigeria" title="Verified homes in more Nigerian cities">
            From Lagos to Abuja and beyond. New cities open as landlords join and their homes pass our checks.
          </SectionHeading>
          <Stagger as="ul" className="grid gap-3 sm:grid-cols-2">
            {counts.map(({ city, total }) => (
              <StaggerItem as="li" key={city}>
                <Link
                  href={`/homes?city=${encodeURIComponent(city)}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_32px_-20px_rgba(14,42,71,0.35)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <PinIcon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-display text-lg font-bold text-navy">{city}</span>
                      <span className="text-sm text-muted">
                        {total} verified home{total === 1 ? '' : 's'}
                      </span>
                    </span>
                  </span>
                  <ArrowRightIcon className="h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-3xl bg-[#0E2A47] p-7 text-white sm:p-10">
            <p className="text-sm font-semibold tracking-[0.14em] text-[#8DB4FA] uppercase">Get going in 3 steps</p>
            <ol className="mt-8 flex flex-col gap-8">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent font-display text-lg font-extrabold text-[#0E2A47]">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-display text-xl font-bold">{s.title}</span>
                    <span className="mt-1 block leading-relaxed text-white/70">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <Link
              href="/sign-up"
              className="mt-10 inline-flex items-center gap-2 rounded-[10px] bg-white px-6 py-3.5 font-semibold text-[#0E2A47] transition-colors hover:bg-white/90"
            >
              Create your free account <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
