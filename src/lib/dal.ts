import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { api, isApiError } from './api';
import { getAccessToken } from './session';
import type { PolicyVersion, SearchParams, User } from './types';

/**
 * Data Access Layer. Every page reads through here, so authorisation lives in one place.
 *
 * - Public reads (listings, search) are cached with `'use cache'` and tagged `listings`; actions that change what
 *   tenants can see call `updateTag('listings')`.
 * - Session reads touch cookies, so callers must sit inside a `<Suspense>` boundary.
 */

// ---------- Session ----------

/** The signed-in user, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await api.me(token);
  } catch (e) {
    if (isApiError(e) && e.code === 'unauthorized') return null;
    throw e;
  }
});

/** Returns the user and token, or sends them to sign in and come back to `returnTo`. */
export async function requireUser(returnTo: string): Promise<{ user: User; token: string }> {
  const [token, user] = await Promise.all([getAccessToken(), getCurrentUser()]);
  if (!token || !user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return { user, token };
}

export async function requireLandlord(returnTo: string) {
  const session = await requireUser(returnTo);
  if (!session.user.roles.includes('landlord')) redirect('/landlord/start');
  return session;
}

// ---------- Public, cached ----------

export async function searchListings(params: SearchParams) {
  'use cache';
  cacheTag('listings');
  cacheLife('minutes');
  return api.searchListings(params);
}

export async function getListing(slug: string) {
  'use cache';
  cacheTag('listings');
  cacheLife('minutes');
  return api.getListing(slug);
}

export async function getCities() {
  'use cache';
  cacheTag('listings');
  cacheLife('hours');
  return api.cities();
}

export async function getBanks() {
  'use cache';
  cacheLife('days');
  return api.banks();
}

export async function getPolicy(kind: PolicyVersion['kind']) {
  'use cache';
  cacheTag('policies');
  cacheLife('hours');
  return api.currentPolicy(kind);
}
