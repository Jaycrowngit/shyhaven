'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { CheckIcon, LockIcon } from '../ui';
import { ease, Reveal, SectionHeading, Stagger, StaggerItem } from './motion';

const POINTS = [
  {
    title: 'Real people, verified numbers',
    body: 'Every renter signs in with a phone number or email they’ve proven is theirs before they can book an inspection or pay.',
  },
  { title: 'Inspections you know about', body: 'Inspections are booked through SkyHaven, so you know who is coming and when. No strangers turning up unannounced.' },
  {
    title: 'Paid before the keys',
    body: 'The renter pays the full amount to SkyHaven before move-in. You hand over the keys knowing the rent is already secured.',
  },
  { title: 'Your details stay yours', body: 'Your phone number and the exact address go only to the renter who has paid, not to everyone who browses.' },
  {
    title: 'Safe payouts',
    body: 'Rent goes only to a bank account in your verified name. Change it, and payouts pause for 48 hours so nobody can redirect your money.',
  },
];

export function Landlords() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section id="landlords" className="scroll-mt-20 bg-white py-[clamp(56px,7vw,96px)]">
      <div className="shell grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-8">
          <SectionHeading eyebrow="For landlords" title="Your home goes to the right tenant">
            Letting to a stranger is a risk. SkyHaven makes sure the person who gets your keys is real, has paid in full, and agreed to the same rules you did.
          </SectionHeading>
          <Stagger as="ul" className="flex flex-col gap-4">
            {POINTS.map((p) => (
              <StaggerItem as="li" key={p.title} className="flex gap-4">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <span>
                  <strong className="block font-display text-[1.05rem] text-navy">{p.title}</strong>
                  <span className="text-[15px] leading-relaxed text-muted">{p.body}</span>
                </span>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="flex flex-wrap gap-3">
            <Link
              href="/sign-up?intent=list&next=/landlord/onboarding"
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[var(--sh-primary-hover)]"
            >
              List your property
            </Link>
            <Link
              href="/landlords#policy"
              className="inline-flex items-center rounded-[10px] border border-border px-6 py-3.5 font-semibold text-navy hover:border-primary hover:text-primary"
            >
              Read the landlord policy
            </Link>
          </Reveal>
        </div>

        <div ref={ref} className="relative mx-auto w-[min(100%,460px)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_30px_60px_-24px_rgba(14,42,71,0.45)]">
            <motion.div style={{ y: imgY }} className="absolute -inset-y-[10%] inset-x-0">
              <Image
                src="/images/sample/house-08.jpg"
                alt="Single-storey family home with a wood front"
                fill
                sizes="(min-width: 1024px) 460px, 90vw"
                className="object-cover"
              />
            </motion.div>
          </div>
          <motion.div
            className="absolute -bottom-6 -left-4 w-[78%] rounded-2xl border border-border bg-white p-4 shadow-[0_24px_50px_-20px_rgba(14,42,71,0.45)] sm:-left-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-verified/10 text-verified">
                <LockIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">Rent received and held</p>
                <p className="text-xs text-muted">Paid out to you after move-in</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E7EFFC]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-verified"
                initial={{ width: '0%' }}
                whileInView={{ width: '66%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.6, ease }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-muted uppercase">
              <span>Booked</span>
              <span className="text-verified">Paid · held</span>
              <span>Moved in</span>
            </div>
          </motion.div>
          <motion.div
            className="absolute -top-5 -right-3 rounded-2xl bg-accent px-4 py-3 font-display font-extrabold text-navy shadow-lg sm:-right-6"
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 4 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.4 }}
          >
            Free to list
          </motion.div>
        </div>
      </div>
    </section>
  );
}
