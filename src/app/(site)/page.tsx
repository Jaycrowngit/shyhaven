import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Comparison } from '@/components/landing/comparison';
import { Coverage } from '@/components/landing/coverage';
import { Faq } from '@/components/landing/faq';
import { GetStarted } from '@/components/landing/get-started';
import { Hero } from '@/components/landing/hero';
import { Overview } from '@/components/landing/overview';
import { Partners } from '@/components/landing/partners';
import { Pricing } from '@/components/landing/pricing';

export const metadata: Metadata = {
  title: { absolute: 'SkyHaven · Find a verified home. Pay safely.' },
  description:
    'SkyHaven checks every rental listing in Nigeria and holds your rent until you move in. Verified homes for renters, and tenants who have already paid for landlords.',
  alternates: { canonical: '/' },
};

/** The landing page: an overview that links to the full How It Works, Trust & Safety, For Landlords and About Us pages. */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Overview />
      <Pricing />
      <Comparison />
      <Faq />
      <Suspense>
        <Coverage />
      </Suspense>
      <Partners />
      <GetStarted />
    </>
  );
}
