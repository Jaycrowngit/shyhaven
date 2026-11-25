import type { MetadataRoute } from 'next';
import { IS_SANDBOX, SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  // The sandbox shows sample homes with stock photos; keep it out of search engines entirely.
  if (IS_SANDBOX) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/account', '/bookings', '/landlord', '/sign-in', '/sign-up', '/forgot-password', '/test-checkout'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
