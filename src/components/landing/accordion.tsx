'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { ease } from './motion';

export interface QA {
  q: string;
  a: string;
}

/** Question-and-answer list; one answer open at a time. Used by the policy summary and the FAQ. */
export function Accordion({ items, defaultOpen = 0 }: { items: QA[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-${i}`;
        return (
          <li key={item.q} className={`overflow-hidden rounded-2xl border bg-white transition-colors ${isOpen ? 'border-primary/40' : 'border-border'}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-[1.05rem] font-bold text-navy"
            >
              {item.q}
              <motion.span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg text-primary"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3, ease }}
                aria-hidden
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease }}
                >
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
