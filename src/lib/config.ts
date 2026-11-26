import 'server-only';

/**
 * Where the web app gets its data.
 * - Sign-up, sign-in, password reset and everything a signed-in user does: always the real SkyHaven API at `API_URL`.
 * - Public listing reads (search, listing pages, cities, inspection slots): the 16 sample homes until
 *   `SKYHAVEN_LISTINGS_SOURCE=api`, then the real API.
 */
export const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export const LISTINGS_SOURCE: 'sample' | 'api' = process.env.SKYHAVEN_LISTINGS_SOURCE === 'api' ? 'api' : 'sample';

/** Sample homes use stock photos, so the whole site stays out of search engines while they are shown. */
export const SHOWS_SAMPLE_LISTINGS = LISTINGS_SOURCE === 'sample';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
