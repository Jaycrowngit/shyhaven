'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { CalendarIcon, KeyIcon, LockIcon, ShieldIcon } from '../ui';
import { ease, SectionHeading } from './motion';

const icons = {
  search: <ShieldIcon className="h-6 w-6" />,
  view: <CalendarIcon className="h-6 w-6" />,
  pay: <LockIcon className="h-6 w-6" />,
  keys: <KeyIcon className="h-6 w-6" />,
};

const TRACKS = {
  renters: {
    label: 'For renters',
    steps: [
      {
        icon: icons.search,
        title: 'Find a verified home',
        body: 'Search homes that our team has already checked: real photos, real address, real owner, every fee shown.',
      },
      {
        icon: icons.view,
        title: 'Book an inspection',
        body: 'Pick a time on the listing. We confirm it with the landlord, so you know exactly who you are meeting.',
      },
      {
        icon: icons.pay,
        title: 'Pay through SkyHaven',
        body: 'Pay by card, transfer or USSD on a secure checkout. Your rent is held by SkyHaven, not sent to the landlord yet.',
      },
      {
        icon: icons.keys,
        title: 'Move in, then confirm',
        body: 'Get your keys. When the home matches the listing, confirm, and we release the rent to the landlord.',
      },
    ],
  },
  landlords: {
    label: 'For landlords',
    steps: [
      {
        icon: icons.search,
        title: 'Verify your account',
        body: 'A quick NIN or ID check with a selfie, your Nigerian bank account in your own name, and our landlord policy. You do this once.',
      },
      {
        icon: icons.view,
        title: 'List your home',
        body: 'Add photos, the address, rent and every fee, and proof you own the home or may let it. Listing is free.',
      },
      {
        icon: icons.pay,
        title: 'We review it',
        body: 'Our team checks the documents, photos, location and price, usually within 24 hours, then your listing goes live with a verified badge.',
      },
      { icon: icons.keys, title: 'Get paid', body: 'The tenant pays SkyHaven before move-in. Once they move in, the rent goes to your verified bank account.' },
    ],
  },
} as const;

type Track = keyof typeof TRACKS;

export function HowItWorks({ initialTrack = 'renters', tone = 'mist' }: { initialTrack?: Track; tone?: 'mist' | 'white' }) {
  const [track, setTrack] = useState<Track>(initialTrack);
  const steps = TRACKS[track].steps;

  return (
    <section
      id="how-it-works"
      className={`scroll-mt-20 py-[clamp(56px,7vw,96px)] ${tone === 'mist' ? 'border-y border-border bg-[#F5F8FC]' : 'bg-white'}`}
    >
      <div className="shell flex flex-col gap-12 ">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="What we do" title="How SkyHaven works">
            Four steps for each side. Each one is built so neither the renter nor the landlord has to take a stranger’s word for anything.
          </SectionHeading>
          <div role="tablist" aria-label="Who is it for" className="relative flex rounded-full border border-border bg-white p-1.5">
            {(Object.keys(TRACKS) as Track[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={track === t}
                aria-controls="hiw-panel"
                onClick={() => setTrack(t)}
                className={`relative z-10 rounded-full px-5 py-2.5 text-[15px] font-semibold transition-colors ${track === t ? 'text-white' : 'text-navy hover:text-primary'}`}
              >
                {track === t && (
                  <motion.span
                    layoutId="hiw-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {TRACKS[t].label}
              </button>
            ))}
          </div>
        </div>

        <div id="hiw-panel" role="tabpanel" className="relative">
          {/* Connector line that fills as the section scrolls into view */}
          <div className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-0.5 bg-border lg:block" aria-hidden>
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-primary to-accent"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '0px 0px -20% 0px' }}
              transition={{ duration: 1.6, ease }}
            />
          </div>
          <AnimatePresence mode="wait">
            <motion.ol
              key={track}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.15 } } }}
            >
              {steps.map((s, i) => (
                <motion.li
                  key={s.title}
                  className="relative flex flex-col items-start gap-4 lg:items-center lg:text-center"
                  variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
                >
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white text-primary shadow-[0_10px_24px_-12px_rgba(29,95,214,0.5)]">
                    {s.icon}
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent font-display text-xs font-extrabold text-navy">
                      {i + 1}
                    </span>
                  </span>
                  <div className="rounded-2xl border border-border bg-white p-5 lg:min-h-[176px]">
                    <h3 className="font-display text-lg font-bold text-navy">{s.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
