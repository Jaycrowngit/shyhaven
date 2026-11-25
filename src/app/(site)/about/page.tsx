import type { Metadata } from 'next';
import { About } from '@/components/landing/about';
import { Faq } from '@/components/landing/faq';
import { GetStarted } from '@/components/landing/get-started';
import { PageHero } from '@/components/landing/page-hero';
import { Partners } from '@/components/landing/partners';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'SkyHaven is a Nigerian rental platform built on verification and protected payments, for renters and landlords.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Us" title="A home under an open sky">
        Sky above, haven below. We started SkyHaven so that renting a home in Nigeria is something you can do in the open, without fear of losing your
        money.
      </PageHero>
      <About />
      <Faq />
      <Partners />
      <GetStarted />
    </>
  );
}
