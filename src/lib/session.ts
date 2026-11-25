import 'server-only';
import { cookies } from 'next/headers';
import type { AuthTokens } from './types';

/**
 * Session cookies. The access token (15 min on the real API) and the rotating refresh token (30 days) are both
 * httpOnly, so page scripts can never read them. `proxy.ts` refreshes an expired access token before a page renders.
 */
export const ACCESS_COOKIE = 'sh_at';
export const REFRESH_COOKIE = 'sh_rt';
export const REFRESH_MAX_AGE = 30 * 24 * 3600;

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function setSession(tokens: AuthTokens): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: tokens.expiresIn });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: REFRESH_MAX_AGE });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** Only same-site paths are allowed as a post-sign-in destination, to prevent open redirects. */
export function safeNext(next: unknown, fallback = '/account'): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}
