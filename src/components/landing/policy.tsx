'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Accordion } from './accordion';
import { ease, Reveal, SectionHeading } from './motion';

const GROUPS = [
  {
    key: 'renters',
    label: 'Renters',
    items: [
      {
        q: 'When does the landlord get my money?',
        a: 'Only after you move in. You pay SkyHaven, we hold the rent, and we release it when you confirm the home matches the listing, or 72 hours after your move-in date if you don’t report a problem.',
      },
      {
        q: 'What if the home isn’t what was listed?',
        a: 'Report it before you confirm move-in. We pause the payment to the landlord and our team reviews it. If the home was cancelled before you moved in, or is materially different from the listing, you’re refunded.',
      },
      {
        q: 'Do I pay any hidden fees?',
        a: 'No. Rent, service charge, caution deposit and legal fee are all shown on the listing before you book. The amount at checkout is worked out by SkyHaven from the listing, never typed in by anyone.',
      },
      {
        q: 'Can I pay the landlord directly?',
        a: 'Please don’t. Our protection covers payments made through SkyHaven only. If anyone asks you to pay outside SkyHaven for a home you found here, tell us.',
      },
    ],
  },
  {
    key: 'landlords',
    label: 'Landlords',
    items: [
      {
        q: 'Who can list a home?',
        a: 'Owners, and agents with a signed mandate letter from the owner. Every landlord verifies their identity first, and the ownership documents must match.',
      },
      {
        q: 'What must a listing include?',
        a: 'At least five recent photos, the real address, and every fee: rent, service charge, caution deposit and legal fee. Listings with phone numbers, emails, links or social handles are sent back. Renters get your contact details after they pay.',
      },
      {
        q: 'Can I take payment outside SkyHaven?',
        a: 'No. All payments for a home found on SkyHaven go through SkyHaven. Taking payment off the platform for a listed home leads to delisting and account suspension.',
      },
      {
        q: 'When do I get paid?',
        a: 'After the renter moves in. The rent goes to your verified bank account in the next daily payout. If you change your bank account, payouts pause for 48 hours to protect you from fraud.',
      },
    ],
  },
  {
    key: 'privacy',
    label: 'Privacy',
    items: [
      { q: 'Who sees my ID documents?', a: 'Only our verification team. Identity and ownership documents are stored privately and never shown on a listing.' },
      {
        q: 'Who sees my address and phone number?',
        a: 'A home’s exact address and the landlord’s phone number are shared only with the renter who has paid. Renters’ details are shared only with the landlord of the home they booked.',
      },
      { q: 'Do you see my card details?', a: 'No. Payments go through our payment partner’s secure checkout. Card details never reach SkyHaven.' },
    ],
  },
];

export function Policy({ initialGroup = 'renters' }: { initialGroup?: 'renters' | 'landlords' | 'privacy' }) {
  const [group, setGroup] = useState<string>(initialGroup);
  const items = GROUPS.find((g) => g.key === group)!.items;

  return (
    <section id="policy" className="scroll-mt-20 border-y border-border bg-[#F5F8FC] py-[clamp(72px,9vw,120px)]">
      <div className="shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-8">
          <SectionHeading eyebrow="Our policy" title="Our rules, in plain words">
            The same rules apply to everyone on SkyHaven. Landlords agree to them before they list, and every renter is protected by them when they pay.
          </SectionHeading>
          <Reveal delay={0.1}>
            <div role="tablist" aria-label="Policy for" className="flex flex-wrap gap-2">
              {GROUPS.map((g) => (
                <button
                  key={g.key}
                  role="tab"
                  aria-selected={group === g.key}
                  onClick={() => setGroup(g.key)}
                  className={`rounded-full border px-5 py-2.5 text-[15px] font-semibold transition-colors ${
                    group === g.key ? 'border-navy bg-navy text-white' : 'border-border bg-white text-navy hover:border-primary hover:text-primary'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <AnimatePresence mode="wait">
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease }}
            >
              <Accordion items={items} />
            </motion.div>
          </AnimatePresence>
          <p className="mt-4 text-sm text-muted">
            This is a summary. The full tenant terms and landlord policy apply, and landlords accept the latest version before they list.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
