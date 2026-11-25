import 'server-only';
import { API_URL } from '../config';
import type { SkyHavenApi } from './contract';
import { ApiError, type ApiErrorCode } from './errors';

/**
 * The real SkyHaven API over HTTP (`/v1`, Developer Blueprint section 08).
 * Server-side only: tokens come from httpOnly cookies and never reach the browser.
 *
 * Expected error body from the API: `{ code, message, fields? }`.
 */

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'validation',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'guard_failed',
  429: 'rate_limited',
};

async function request<T>(
  method: Method,
  path: string,
  opts: { token?: string; body?: unknown; query?: Record<string, string | number | undefined>; headers?: Record<string, string> } = {},
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== '') url.searchParams.set(k, String(v));

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        ...opts.headers,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError('unavailable', 'SkyHaven is having trouble right now. Please try again.', 503);
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = (data?.code as ApiErrorCode) ?? STATUS_CODES[res.status] ?? 'unavailable';
    const message = typeof data?.message === 'string' ? data.message : 'Something went wrong. Please try again.';
    throw new ApiError(code, message, res.status, data?.fields);
  }
  return data as T;
}

const get = <T>(path: string, opts?: Parameters<typeof request>[2]) => request<T>('GET', path, opts);
const post = <T>(path: string, opts?: Parameters<typeof request>[2]) => request<T>('POST', path, opts);

export const httpApi: SkyHavenApi = {
  startSignup: (body) => post('/auth/signup', { body }),
  resendSignupCode: (signupId) => post('/auth/signup/resend', { body: { signupId } }),
  completeSignup: (body) => post('/auth/signup/verify', { body }),
  login: (body) => post('/auth/login', { body }),
  requestPasswordReset: (body) => post('/auth/password/forgot', { body }),
  verifyPasswordReset: (body) => post('/auth/password/verify', { body }),
  completePasswordReset: (body) => post('/auth/password/reset', { body }),
  requestOtp: (body) => post('/auth/otp/request', { body }),
  verifyOtp: (body) => post('/auth/otp/verify', { body }),
  refresh: (refreshToken) => post('/auth/refresh', { body: { refreshToken } }),
  logout: (token) => post('/auth/logout', { token }),
  me: (token) => get('/me', { token }),
  updateProfile: (token, body) => request('PATCH', '/me', { token, body }),

  searchListings: ({ q, city, type, minBeds, maxRent, sort, cursor }) =>
    get('/search/listings', { query: { q, city, type, minBeds, maxRent: maxRent ? maxRent * 100 : undefined, sort, cursor } }),
  getListing: async (slug) => {
    try {
      return await get(`/listings/${encodeURIComponent(slug)}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'not_found') return null;
      throw e;
    }
  },
  inspectionSlots: (listingId) => get(`/listings/${listingId}/inspection-slots`),
  cities: () => get('/search/cities'),

  savedListings: (token) => get('/me/saved-listings', { token }),
  setSaved: (token, listingId, saved) => request(saved ? 'PUT' : 'DELETE', `/me/saved-listings/${listingId}`, { token }),
  requestInspection: (token, { listingId, slotAt }) => post(`/listings/${listingId}/inspections`, { token, body: { slotAt } }),
  myInspections: (token) => get('/me/inspections', { token }),
  createBooking: (token, body) => post('/bookings', { token, body }),
  initPayment: (token, bookingId, idempotencyKey) =>
    post('/payments/init', { token, body: { bookingId }, headers: { 'Idempotency-Key': idempotencyKey } }),
  verifyPayment: (token, reference) => post(`/payments/${encodeURIComponent(reference)}/verify`, { token }),
  myBookings: (token) => get('/bookings', { token }),
  getBooking: (token, bookingId) => get(`/bookings/${bookingId}`, { token }),
  confirmMoveIn: (token, bookingId) => post(`/bookings/${bookingId}/confirm-move-in`, { token }),
  openDispute: (token, bookingId, body) => post(`/bookings/${bookingId}/disputes`, { token, body }),

  becomeLandlord: (token) => post('/me/roles/landlord', { token }),
  landlordProfile: (token) => get('/landlord/profile', { token }),
  startKyc: (token) => post('/kyc/sessions', { token }),
  banks: () => get('/payout-accounts/banks'),
  savePayoutAccount: (token, body) => post('/payout-accounts', { token, body }),
  currentPolicy: (kind) => get('/policies/current', { query: { kind } }),
  acceptPolicy: (token, policyVersionId) => post(`/policies/${policyVersionId}/accept`, { token }),
  myListings: (token) => get('/landlord/listings', { token }),
  myListing: (token, listingId) => get(`/landlord/listings/${listingId}`, { token }),
  createListing: (token, body) => post('/listings', { token, body }),
  updateListing: (token, listingId, body) => request('PATCH', `/listings/${listingId}`, { token, body }),
  submitListing: (token, listingId) => post(`/listings/${listingId}/submit`, { token }),
  setListingPaused: (token, listingId, paused) => post(`/listings/${listingId}/${paused ? 'pause' : 'resume'}`, { token }),
  landlordMoney: (token) => get('/landlord/money', { token }),
};
