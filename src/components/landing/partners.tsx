import Image from 'next/image';
import { PARTNERS, type Partner } from '@/lib/partners';
import { LogoMark } from '../logo';
import { SectionHeading } from './motion';

/**
 * Infinite logo carousel. CSS-driven so it stays smooth; pauses on hover and stops for reduced-motion users.
 * Screen readers get the plain list; the moving copy is decorative.
 */
export function Partners() {
  const half = Math.ceil(PARTNERS.length / 2);
  const rows = [PARTNERS.slice(0, half), PARTNERS.slice(half)];
  return (
    <section id="partners" className="scroll-mt-20 overflow-hidden bg-white py-[clamp(72px,9vw,112px)]">
      <div className="shell">
        <SectionHeading eyebrow="Partners & sponsors" title="Built with partners who share our standards" center>
          The organisations that help us verify homes, protect payments and pay landlords.
        </SectionHeading>
      </div>

      <ul className="sr-only">
        {PARTNERS.map((p) => (
          <li key={p.name}>{p.href ? <a href={p.href}>{p.name}</a> : p.name}</li>
        ))}
      </ul>

      <div aria-hidden className="marquee-group mt-12 flex flex-col gap-5 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        {rows.map((row, r) => {
          // One "set" is wide enough to fill large screens; the track holds two sets and slides by exactly one.
          const set = [...row, ...row];
          return (
            <div key={r} className="flex overflow-hidden">
              <div className={`marquee-track flex w-max shrink-0 ${r === 1 ? 'marquee-reverse' : ''}`}>
                {[...set, ...set].map((p, i) => (
                  <div key={i} className="pr-5">
                    <PartnerTile partner={p} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PartnerTile({ partner }: { partner: Partner }) {
  const body = partner.logo ? (
    <Image src={partner.logo} alt="" width={160} height={48} className="h-10 w-auto object-contain opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0" />
  ) : (
    <span className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F8FC] grayscale transition duration-300 group-hover:grayscale-0">
        <LogoMark className="h-6 w-6" />
      </span>
      <span className="text-left">
        <span className="block font-display text-[15px] font-bold whitespace-nowrap text-navy">{partner.name}</span>
        {partner.role && <span className="block text-xs whitespace-nowrap text-muted">{partner.role}</span>}
      </span>
    </span>
  );
  const cls =
    'group flex h-20 min-w-[220px] items-center justify-center rounded-2xl border border-border bg-white px-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_32px_-18px_rgba(14,42,71,0.35)]';
  return partner.href ? (
    <a href={partner.href} target="_blank" rel="noopener noreferrer" tabIndex={-1} className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
