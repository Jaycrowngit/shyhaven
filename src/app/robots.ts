import type { MetadataRoute } from 'next';
import { SHOWS_SAMPLE_LISTINGS, SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  // Sample homes use stock photos; keep the site out of search engines while they are shown.
  if (SHOWS_SAMPLE_LISTINGS) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/account', '/bookings', '/landlord', '/sign-in', '/sign-up', '/forgot-password'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
