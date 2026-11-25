import type { Metadata } from 'next';
import { GetStarted } from '@/components/landing/get-started';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Landlords } from '@/components/landing/landlords';
import { PageHero } from '@/components/landing/page-hero';
import { Policy } from '@/components/landing/policy';
import { Pricing } from '@/components/landing/pricing';

export const metadata: Metadata = {
  title: 'For Landlords',
  description: 'List your home in Nigeria for free. SkyHaven verifies it, sends you renters with verified numbers, and pays the rent into your bank account after move-in.',
  alternates: { canonical: '/landlords' },
};

export default function LandlordsPage() {
  return (
    <>
      <PageHero eyebrow="For Landlords" title="Let your home with confidence">
        List for free. We verify your home so renters trust it, collect the full rent before move-in, and pay it into your verified Nigerian bank account.
      </PageHero>
      <Landlords />
      <Pricing />
      <HowItWorks initialTrack="landlords" tone="white" />
      <Policy initialGroup="landlords" />
      <GetStarted />
    </>
  );
}
