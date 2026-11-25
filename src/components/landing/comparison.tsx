'use client';

import { motion } from 'motion/react';
import { CheckIcon } from '../ui';
import { ease, SectionHeading } from './motion';

const ROWS = [
  {
    topic: 'Finding a home',
    usual: 'You pay agents inspection fees, sometimes for houses that don’t exist or aren’t theirs to let.',
    skyhaven: 'Every home is checked before it goes live. Booking an inspection costs nothing.',
  },
  {
    topic: 'Fees',
    usual: 'Agency and legal fees appear on top of the rent, and the total keeps changing.',
    skyhaven: 'Rent, service charge, caution deposit and legal fee are all on the listing before you book.',
  },
  {
    topic: 'Paying',
    usual: 'A full year’s rent in cash or transfer to someone you met last week, before you see any papers.',
    skyhaven: 'You pay SkyHaven by card, transfer or USSD. We hold the rent until you move in.',
  },
  {
    topic: 'When it goes wrong',
    usual: 'Nobody to call. The agent stops picking up, and the money is gone.',
    skyhaven: 'Report it before you confirm move-in. We pause the payment and our team reviews it.',
  },
  {
    topic: 'For landlords',
    usual: 'Strangers at the gate, tenants who disappear, rent that never lands.',
    skyhaven: 'Renters with verified numbers, inspections booked through SkyHaven, rent paid before the keys.',
  },
];

export function Comparison() {
  return (
    <section id="compare" className="scroll-mt-20 bg-white py-[clamp(72px,9vw,120px)]">
      <div className="shell flex flex-col gap-12">
        <SectionHeading eyebrow="Why SkyHaven" title="Renting the usual way vs renting with SkyHaven" center>
          Most Nigerians have a story about a fake agent, a lost caution fee or a house that wasn’t what was shown. Here’s what changes.
        </SectionHeading>

        <div className="overflow-hidden rounded-3xl border border-border">
          <div className="hidden grid-cols-[0.7fr_1fr_1fr] bg-[#F5F8FC] text-sm font-semibold tracking-wide uppercase md:grid">
            <span className="px-6 py-4 text-muted" />
            <span className="px-6 py-4 text-muted">The usual way</span>
            <span className="bg-primary px-6 py-4 text-white">With SkyHaven</span>
          </div>
          <ul>
            {ROWS.map((r, i) => (
              <motion.li
                key={r.topic}
                className="grid border-t border-border first:border-t-0 md:grid-cols-[0.7fr_1fr_1fr] md:first:border-t"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ duration: 0.6, delay: i * 0.06, ease }}
              >
                <span className="px-6 pt-5 font-display text-lg font-bold text-navy md:py-6">{r.topic}</span>
                <span className="flex gap-3 px-6 py-3 text-[15px] leading-relaxed text-muted md:py-6">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/10 font-bold text-danger" aria-hidden>
                    ×
                  </span>
                  <span>
                    <span className="sr-only">The usual way: </span>
                    {r.usual}
                  </span>
                </span>
                <span className="flex gap-3 bg-primary-soft/60 px-6 pt-3 pb-5 text-[15px] leading-relaxed text-navy md:py-6">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white" aria-hidden>
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="sr-only">With SkyHaven: </span>
                    {r.skyhaven}
                  </span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
