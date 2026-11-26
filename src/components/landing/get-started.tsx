'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { ArrowRightIcon, KeyIcon, ShieldIcon } from '../ui';
import { ease } from './motion';

export function GetStarted() {
  return (
    <section id="get-started" className="shell scroll-mt-20 bg-white pb-[clamp(56px,7vw,96px)]">
      <motion.div
        className="relative isolate overflow-hidden rounded-[32px] bg-[#0E2A47] px-6 py-16 text-white sm:px-12 sm:py-20"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 0.9, ease }}
      >
        {/* The brand mark at sky scale: sky line, roof, and the sun rising */}
        <svg viewBox="0 0 100 100" className="absolute -right-16 -bottom-10 -z-10 h-[420px] w-[420px] opacity-[0.16] sm:h-[520px] sm:w-[520px]" aria-hidden>
          <motion.path d="M30 21.5 50 4.5 70 21.5" fill="none" stroke="#8DB4FA" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease }} />
          <motion.path d="M9 52 50 17 91 52" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.5, ease }} />
        </svg>
        <motion.div
          className="absolute -bottom-32 -left-20 -z-10 h-64 w-64 rounded-full bg-accent sm:h-80 sm:w-80"
          style={{ boxShadow: '0 0 0 18px rgba(232,150,43,.18), 0 0 0 40px rgba(232,150,43,.08)' }}
          initial={{ y: 140, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, delay: 0.3, ease }}
          aria-hidden
        />

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <p className="text-sm font-semibold tracking-[0.14em] text-[#8DB4FA] uppercase">Get started</p>
          <h2 className="font-display text-[clamp(1.9rem,3.8vw,2.8rem)] leading-[1.08] font-extrabold tracking-[-0.02em] text-balance">Your next home, without the risk.</h2>
          <p className="text-lg text-white/75">Create your account with your phone number in under a minute. No password, no fees to sign up.</p>
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/75">
            <span className="rounded-full border border-white/20 px-3.5 py-1.5">iPhone app · coming soon</span>
            <span className="rounded-full border border-white/20 px-3.5 py-1.5">Android app · coming soon</span>
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {[
            {
              href: '/sign-up',
              icon: <KeyIcon className="h-6 w-6" />,
              title: 'I’m looking for a home',
              body: 'Browse verified homes and pay safely.',
              cta: 'Get started',
              accent: true,
            },
            {
              href: '/sign-up?intent=list&next=/landlord/onboarding',
              icon: <ShieldIcon className="h-6 w-6" />,
              title: 'I have a home to let',
              body: 'List for free and get verified tenants.',
              cta: 'List your property',
              accent: false,
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease }}
              whileHover={{ y: -6 }}
            >
              <Link href={c.href} className="group flex h-full flex-col gap-4 rounded-2xl border border-white/15 bg-[#163A60] p-6 transition-colors hover:bg-[#1B4470]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-[#8DB4FA]">{c.icon}</span>
                <span>
                  <span className="block font-display text-xl font-bold">{c.title}</span>
                  <span className="text-white/70">{c.body}</span>
                </span>
                <span
                  className={`mt-auto inline-flex w-fit items-center gap-2 rounded-[10px] px-5 py-3 font-semibold transition-colors ${
                    c.accent ? 'bg-accent text-[#0E2A47] group-hover:bg-[var(--sh-accent-hover)]' : 'bg-white text-[#0E2A47] group-hover:bg-white/90'
                  }`}
                >
                  {c.cta}
                  <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
