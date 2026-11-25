import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { searchListings } from '@/lib/dal';

/** Static pages plus every live listing, for listing SEO (Blueprint 03: SSR for listing SEO). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ['', '/homes', '/how-it-works', '/trust-and-safety', '/landlords', '/about'].map((p) => ({ url: `${SITE_URL}${p}` }));
  const listings: MetadataRoute.Sitemap = [];
  let cursor: string | undefined;
  do {
    const page = await searchListings({ cursor });
    for (const l of page.items) if (!l.isSample) listings.push({ url: `${SITE_URL}/homes/${l.slug}`, lastModified: l.verifiedAt ?? undefined });
    cursor = page.nextCursor ?? undefined;
  } while (cursor && listings.length < 50_000);
  return [...pages, ...listings];
}
