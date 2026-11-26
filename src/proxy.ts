import { NextResponse, type NextRequest } from 'next/server';

/**
 * Runs before signed-in pages render.
 * 1. Optimistic guard: no session cookies at all means straight to sign-in (pages still check properly via the DAL).
 * 2. If the 15-minute access token has expired but the refresh token is still valid, rotate both
 *    here, because Server Components can't set cookies while rendering.
 */
const ACCESS = 'sh_at';
const REFRESH = 'sh_rt';
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS)?.value;
  const refresh = request.cookies.get(REFRESH)?.value;

  if (!access && !refresh) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (!access && refresh) {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        const tokens = (await res.json()) as { accessToken: string; refreshToken: string; expiresIn: number };
        // Forward the new access token to this render, and store both for the browser.
        request.cookies.set(ACCESS, tokens.accessToken);
        const response = NextResponse.next({ request });
        const opts = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
        response.cookies.set(ACCESS, tokens.accessToken, { ...opts, maxAge: tokens.expiresIn });
        response.cookies.set(REFRESH, tokens.refreshToken, { ...opts, maxAge: 30 * 24 * 3600 });
        return response;
      }
      // A rejected refresh token (expired, or reused and revoked) ends the session.
      const url = new URL('/sign-in', request.url);
      url.searchParams.set('next', request.nextUrl.pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete(REFRESH);
      return response;
    } catch {
      // API unreachable: let the page render and show its own error state.
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/bookings/:path*', '/landlord/:path*'],
};
