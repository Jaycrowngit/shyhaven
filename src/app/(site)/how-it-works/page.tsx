import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Comparison } from '@/components/landing/comparison';
import { Coverage } from '@/components/landing/coverage';
import { GetStarted } from '@/components/landing/get-started';
import { HowItWorks } from '@/components/landing/how-it-works';
import { PageHero } from '@/components/landing/page-hero';
import { Pricing } from '@/components/landing/pricing';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'How renting through SkyHaven works in Nigeria: find a verified home, book an inspection, pay safely, and move in. Landlords list free and get paid after move-in.',
  alternates: { canonical: '/how-it-works' },
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How It Works" title="From search to keys, with nobody to chase">
        Whether you’re looking for a home or letting one, SkyHaven sits in the middle: we check the home, hold the money, and release it when the move-in
        is done.
      </PageHero>
      <Suspense>
        <Coverage />
      </Suspense>
      <HowItWorks />
      <Comparison />
      <Pricing />
      <GetStarted />
    </>
  );
}
