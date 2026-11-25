import Link from 'next/link';
import { Accordion, type QA } from './accordion';
import { Reveal, SectionHeading } from './motion';

/** Answers follow the Developer Blueprint; anything not decided yet says "not yet" rather than promising. */
export const FAQ: QA[] = [
  {
    q: 'Do I pay an inspection fee or an agent fee?',
    a: 'No. Booking an inspection through SkyHaven is free, and SkyHaven never adds an agency fee. The listing shows everything the landlord charges: rent, service charge, caution deposit and legal fee.',
  },
  {
    q: 'What happens to my caution deposit?',
    a: 'It’s shown on the listing and paid with your rent through SkyHaven. Like the rent, it’s held until you move in, then passed to the landlord, who refunds it at the end of your tenancy as agreed.',
  },
  {
    q: 'What if the landlord doesn’t hand over the keys?',
    a: 'Don’t confirm move-in. Report the problem from your booking and we pause the payment to the landlord while our team reviews it. If the home isn’t made available to you, you’re refunded.',
  },
  {
    q: 'When does the landlord get paid?',
    a: 'After you confirm you’ve moved in, or 72 hours after your move-in date if you don’t report a problem. The money goes to the landlord’s verified bank account in the next daily payout.',
  },
  {
    q: 'Can agents list a property?',
    a: 'Yes, with a signed mandate letter from the owner. The owner’s documents are checked just like any other listing, and the agent verifies their own identity too.',
  },
  {
    q: 'How long does it take for a listing to go live?',
    a: 'Our team usually reviews a new listing within 24 hours. If something needs fixing, we tell you exactly what, and you can resubmit straight away.',
  },
  {
    q: 'Can I pay rent in instalments?',
    a: 'Not yet. For now the rent shown on the listing is paid in full through SkyHaven before you move in.',
  },
  {
    q: 'Which cities do you cover?',
    a: 'Every city on Find a Home has verified homes ready to rent. New cities open as landlords join and their homes pass our checks.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-y border-border bg-[#F5F8FC] py-[clamp(72px,9vw,120px)]">
      <div className="shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading eyebrow="FAQ" title="Questions Nigerians ask us">
            The things renters and landlords most want to know before they start.
          </SectionHeading>
          <Reveal delay={0.1}>
            <p className="text-[15px] text-muted">
              More about our rules on the{' '}
              <Link href="/trust-and-safety#policy" className="font-semibold text-primary hover:underline">
                Trust &amp; Safety
              </Link>{' '}
              page.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <Accordion items={FAQ} />
        </Reveal>
      </div>
    </section>
  );
}
