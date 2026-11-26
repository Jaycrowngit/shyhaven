'use client';

import { motion } from 'motion/react';
import { CheckIcon, KeyIcon, LockIcon, ShieldIcon } from '../ui';
import { CountUp, ease, Reveal, SectionHeading, Stagger, StaggerItem } from './motion';

const CHECKS = [
  { title: 'Ownership', body: 'Title documents are matched against the landlord’s verified ID. Agents need a signed mandate from the owner.' },
  { title: 'Real photos', body: 'At least five recent photos of the actual home, not pictures taken from somewhere else.' },
  { title: 'Location', body: 'The home is where the listing says it is.' },
  { title: 'Fair price', body: 'The rent is in line with similar homes in the area. Too good to be true gets a closer look.' },
  { title: 'Every fee', body: 'Rent, service charge, caution deposit and legal fee must all be on the listing before it goes live.' },
];

const STATS = [
  { value: 5, suffix: '', label: 'checks on every listing before it goes live' },
  { value: 24, suffix: 'h', label: 'typical review time for a new listing' },
  { value: 72, suffix: 'h', label: 'after move-in day before rent is released' },
  { value: 0, prefix: '₦', suffix: '', label: 'in hidden fees. Every cost is on the listing' },
];

export function Trust() {
  return (
    <section id="trust" className="scroll-mt-20 bg-white py-[clamp(56px,7vw,96px)]">
      <div className="shell flex flex-col gap-12 ">
        <SectionHeading eyebrow="Trust & safety" title="Trust you can check, not just take our word for" center>
          We don’t ask you to trust a stranger. We do the checking, we hold the money, and we stay in the middle until the keys change hands.
        </SectionHeading>

        <div className="grid gap-5 lg:grid-cols-6">
          {/* 1. Listing checks */}
          <Reveal className="lg:col-span-4">
            <div className="h-full rounded-3xl border border-border bg-[#F5F8FC] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-verified text-white">
                  <ShieldIcon className="h-6 w-6" />
                </span>
                <h3 className="font-display text-xl font-bold text-navy">How safe are the houses? Five checks, by a person.</h3>
              </div>
              <motion.ul
                className="mt-6 grid gap-3 sm:grid-cols-2"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.22 } } }}
              >
                {CHECKS.map((c) => (
                  <motion.li key={c.title} className="flex gap-3 rounded-2xl bg-white p-4" variants={{ hidden: { opacity: 0.35 }, show: { opacity: 1 } }}>
                    <motion.span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border"
                      variants={{
                        hidden: { backgroundColor: '#FFFFFF', borderColor: '#DAE2EE', color: '#FFFFFF' },
                        show: { backgroundColor: '#0E8A79', borderColor: '#0E8A79', color: '#FFFFFF', transition: { duration: 0.35 } },
                      }}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </motion.span>
                    <span>
                      <strong className="block text-[15px] text-navy">{c.title}</strong>
                      <span className="text-sm leading-relaxed text-muted">{c.body}</span>
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
              <p className="mt-5 text-sm text-muted">Homes that pass get the verified badge. Homes that don’t are sent back for changes, or rejected.</p>
            </div>
          </Reveal>

          {/* 2. Escrow flow */}
          <Reveal className="lg:col-span-2" delay={0.1}>
            <div className="flex h-full flex-col rounded-3xl bg-navy p-6 text-white sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent">
                <LockIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold">Rent held until you move in</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                The landlord is paid only after you confirm, or 72 hours after move-in day if you report nothing.
              </p>
              <EscrowFlow />
            </div>
          </Reveal>

          {/* 3–5. Smaller cards */}
          <Stagger className="grid gap-5 sm:grid-cols-3 lg:col-span-6">
            {[
              {
                icon: <ShieldIcon className="h-6 w-6" />,
                title: 'Verified landlords',
                body: 'ID and selfie check for every landlord. Rent only goes to a bank account in the same name as the ID.',
              },
              {
                icon: <LockIcon className="h-6 w-6" />,
                title: 'Your details stay private',
                body: 'The exact address and the landlord’s number are shared only after payment. Listings with phone numbers or links are sent back.',
              },
              {
                icon: <KeyIcon className="h-6 w-6" />,
                title: 'Help if something’s wrong',
                body: 'Report a problem before you confirm move-in, and we pause the payment while our team looks into it.',
              },
            ].map((c) => (
              <StaggerItem
                key={c.title}
                className="group rounded-3xl border border-border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(14,42,71,0.35)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">{c.icon}</span>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{c.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Stagger className="grid gap-6 rounded-3xl border border-border bg-white p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <StaggerItem key={s.label} className="flex flex-col gap-1 border-border lg:border-r lg:pr-6 lg:last:border-r-0">
              <span className="font-display text-[2.6rem] leading-none font-extrabold text-primary">
                <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
              </span>
              <span className="text-sm leading-snug text-muted">{s.label}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/** Tenant → SkyHaven (held) → Landlord, with a payment travelling along the line. */
function EscrowFlow() {
  const nodes = ['Renter pays', 'SkyHaven holds', 'Landlord paid'];
  return (
    <div className="mt-auto pt-8">
      <div className="relative flex items-center justify-between">
        <div className="absolute inset-x-5 top-1/2 h-0.5 -translate-y-1/2 bg-white/15" aria-hidden>
          <motion.div
            className="h-full origin-left bg-white/60"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.6, ease }}
          />
        </div>
        {nodes.map((n, i) => (
          <motion.span
            key={n}
            className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${i === 1 ? 'bg-accent text-navy' : 'bg-white text-navy'}`}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.2, ease }}
          >
            {i === 1 ? <LockIcon className="h-5 w-5" /> : <span className="font-display text-sm font-extrabold">{i === 0 ? '₦' : '✓'}</span>}
          </motion.span>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[11px] font-semibold tracking-wide text-white/70 uppercase">
        {nodes.map((n) => (
          <span key={n} className="w-20 text-center first:text-left last:text-right">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
