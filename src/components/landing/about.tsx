'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import Image from 'next/image';
import { useRef } from 'react';
import { KeyIcon, LockIcon, ShieldIcon } from '../ui';
import { Reveal, SectionHeading, Stagger, StaggerItem } from './motion';

const VALUES = [
  {
    icon: <ShieldIcon className="h-6 w-6" />,
    title: 'Verified',
    body: 'Every landlord proves who they are, and every home is checked by a person before anyone can rent it.',
  },
  {
    icon: <LockIcon className="h-6 w-6" />,
    title: 'Protected',
    body: 'Rent is paid to SkyHaven and held until the tenant has moved in. Nobody pays a stranger and hopes.',
  },
  {
    icon: <KeyIcon className="h-6 w-6" />,
    title: 'Transparent',
    body: 'Rent, service charge, caution deposit and legal fee are all on the listing. What you see is what you pay.',
  },
];

export function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const yA = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const yB = useTransform(scrollYProgress, [0, 1], [-30, 50]);
  const yC = useTransform(scrollYProgress, [0, 1], [90, -30]);

  return (
    <section id="about" className="scroll-mt-20 bg-white py-[clamp(56px,7vw,96px)]">
      <div className="shell grid items-center gap-16 lg:grid-cols-2">
        <div ref={ref} className="relative order-2 h-[400px] sm:h-[460px] lg:order-1">
          <motion.div style={{ y: yA }} className="absolute top-0 left-0 h-[62%] w-[62%] overflow-hidden rounded-[999px_999px_20px_20px] shadow-xl">
            <Image
              src="/images/sample/living-room-01.jpg"
              alt="Bright living room with a large window"
              fill
              sizes="(min-width: 1024px) 340px, 60vw"
              className="object-cover"
            />
          </motion.div>
          <motion.div style={{ y: yB }} className="absolute top-[8%] right-0 h-[44%] w-[42%] overflow-hidden rounded-[20px] shadow-xl">
            <Image src="/images/sample/kitchen-02.jpg" alt="White and wood kitchen" fill sizes="(min-width: 1024px) 240px, 40vw" className="object-cover" />
          </motion.div>
          <motion.div style={{ y: yC }} className="absolute right-[6%] bottom-0 h-[46%] w-[54%] overflow-hidden rounded-[20px] shadow-xl">
            <Image
              src="/images/sample/bedroom-02.jpg"
              alt="Bright bedroom with a balcony"
              fill
              sizes="(min-width: 1024px) 300px, 54vw"
              className="object-cover"
            />
          </motion.div>
          <Reveal delay={0.3} className="absolute bottom-[10%] left-[2%] z-10">
            <div className="rounded-2xl bg-navy px-5 py-4 text-white shadow-2xl">
              <p className="font-display text-3xl font-extrabold">100%</p>
              <p className="text-sm text-white/75">of listings checked by a person</p>
            </div>
          </Reveal>
        </div>

        <div className="order-1 flex flex-col gap-8 lg:order-2">
          <SectionHeading eyebrow="About us" title="Renting should feel safe. For too many people, it doesn’t.">
            <p>
              Fake listings. Agents who collect inspection fees for homes that don’t exist. A full year’s rent paid to a stranger, and a deposit that never
              comes back. Landlords have their own worries: tenants who disappear, and payments that never land.
            </p>
            <p className="mt-4">
              SkyHaven is a Nigerian rental platform built to fix that, for renters and landlords from Lagos to Abuja to Port Harcourt. We verify the people and the homes, and we hold the money until the move-in is done. Sky above,
              haven below: a home under an open sky, where everything is out in the open.
            </p>
          </SectionHeading>
          <Stagger className="grid gap-4 sm:grid-cols-3">
            {VALUES.map((v) => (
              <StaggerItem
                key={v.title}
                className="group rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(14,42,71,0.3)]"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-4deg]">
                  {v.icon}
                </span>
                <h3 className="font-display text-lg font-bold text-navy">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
