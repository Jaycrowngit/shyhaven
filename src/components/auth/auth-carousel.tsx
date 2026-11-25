'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const SLIDES = [
  {
    image: '/images/sample/apartment-02.jpg',
    title: 'Only verified homes',
    body: 'Every listing is checked by our team before anyone can rent it.',
  },
  {
    image: '/images/sample/living-room-01.jpg',
    title: 'Rent held until you move in',
    body: 'Your money stays with SkyHaven until you have the keys.',
  },
  {
    image: '/images/sample/house-08.jpg',
    title: 'Landlords list for free',
    body: 'Get renters with verified numbers who pay before move-in.',
  },
  {
    image: '/images/sample/bedroom-02.jpg',
    title: 'Made for Nigeria',
    body: 'Prices in naira. Pay by card, bank transfer or USSD.',
  },
];

const INTERVAL_MS = 5000;
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Photo carousel for the sign-up and sign-in screens. Advances every 5 seconds; pauses on hover, on keyboard
 * focus, or with the pause button (WCAG 2.2.2), and never moves on its own for reduced-motion users.
 */
export function AuthCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reduce = useReducedMotion();
  const running = !paused && !hovered && !reduce;

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, running]);

  const slide = SLIDES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Why SkyHaven"
      className="relative isolate flex h-full min-h-[560px] flex-col justify-end overflow-hidden rounded-[28px] bg-[#0E2A47] p-10 text-white xl:p-12"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.image}
          className="absolute inset-0 -z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: INTERVAL_MS / 1000 + 1, ease: 'linear' }}
          >
            <Image src={slide.image} alt="" fill sizes="50vw" className="object-cover" priority={index === 0} />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0E2A47] via-[#0E2A47]/55 to-[#0E2A47]/5" aria-hidden />

      <div className="relative min-h-[132px]" aria-live={running ? 'off' : 'polite'}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${SLIDES.length}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease }}
          >
            <h2 className="font-display text-[clamp(1.8rem,2.6vw,2.6rem)] leading-[1.1] font-extrabold tracking-[-0.02em]">{slide.title}</h2>
            <p className="mt-3 max-w-md text-lg text-white/80">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="flex gap-2" role="group" aria-label="Choose slide">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              aria-current={i === index}
              className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/25"
            >
              {i === index && (
                <motion.span
                  key={`${index}-${running}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
                  initial={{ width: running ? '0%' : '100%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: running ? INTERVAL_MS / 1000 : 0, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
        {!reduce && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            {paused ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
