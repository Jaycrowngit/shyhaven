import type { Metadata } from 'next';
import { GetStarted } from '@/components/landing/get-started';
import { PageHero } from '@/components/landing/page-hero';
import { Policy } from '@/components/landing/policy';
import { Trust } from '@/components/landing/trust';

export const metadata: Metadata = {
  title: 'Trust & Safety',
  description: 'How SkyHaven keeps renting safe in Nigeria: five checks on every home, verified landlords, rent held until move-in, and clear rules for everyone.',
  alternates: { canonical: '/trust-and-safety' },
};

export default function TrustAndSafetyPage() {
  return (
    <>
      <PageHero eyebrow="Trust & Safety" title="How we keep every rental safe">
        Every home is checked by a person, every landlord proves who they are, and your rent stays with SkyHaven until you have the keys.
      </PageHero>
      <Trust />
      <Policy />
      <GetStarted />
    </>
  );
}
