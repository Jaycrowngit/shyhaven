import 'server-only';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { canTransition, priceBreakdown, type BookingStatus, type ListingStatus, type PriceBreakdown } from '../../domain';
import { findContactDetails } from '../../redact';
import type { ListingDraftInput } from '../../schemas';
import type {
  Booking,
  Inspection,
  KycStatus,
  LandlordMoney,
  ListingDetail,
  ListingFees,
  ListingSummary,
  ListingType,
  OwnershipDocKind,
  OwnListing,
  PolicyVersion,
  SearchParams,
  StatusChange,
  User,
  VerificationCheck,
} from '../../types';
import type { SkyHavenApi } from '../contract';
import { ApiError } from '../errors';
import { photoUrl, POLICIES, SAMPLE_PHOTOS, SEED_LISTINGS, SEED_USERS, seedFees, seedPhotos } from './seed';

/**
 * In-memory SkyHaven API. Implements the rules from the Developer Blueprint so the web app behaves the way it will
 * against the real API: listing state machine (04), submit guards (04), price snapshots and the double-entry ledger
 * (06), 30-minute payment expiry and reserve-on-pay (05), auto-release after move-in (06), and contact redaction (09).
 *
 * State lives on `globalThis` so it survives hot reloads and is shared by every server module in the process.
 * It resets when the dev server restarts.
 */

// ---------- Settings (env names match the API's .env.example) ----------
const COMMISSION_BPS = 1_000; // illustrative 10%; the real rate is a client decision (Blueprint 17)
const TENANT_FEE_BPS = 0;
const PAYMENT_EXPIRY_MS = 30 * 60_000;
const AUTO_RELEASE_HOURS = Number(process.env.ESCROW_AUTO_RELEASE_HOURS ?? 72);
const NEW_ACCOUNT_SUBMIT_LIMIT = 3;
const PAGE_SIZE = 12;
const DAY = 86_400_000;

const BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '058', name: 'GTBank' },
  { code: '011', name: 'First Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '033', name: 'UBA' },
  { code: '035', name: 'Wema Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '50211', name: 'Kuda' },
  { code: '999992', name: 'OPay' },
  { code: '50515', name: 'Moniepoint' },
];

// ---------- Rows ----------
interface UserRow {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  roles: User['roles'];
  kyc: KycStatus;
  payout: { bankCode: string; bankName: string; accountLast4: string; accountName: string; verifiedAt: string } | null;
  payoutHoldUntil: number | null;
  acceptedPolicyId: string | null;
  createdAt: number;
  /** `scrypt$N$salt$hash`. Null for accounts that only sign in with a code. */
  passwordHash: string | null;
  termsAcceptedAt: number | null;
}

interface PendingSignup {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  intent: 'rent' | 'list';
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number[];
}

interface PendingReset {
  id: string;
  /** Null when no account matched: the flow still runs so the response can't reveal that. */
  userId: string | null;
  destination: string;
  code: string;
  expiresAt: number;
  attempts: number;
  sentAt: number[];
}

interface ListingRow {
  id: string;
  slug: string;
  landlordId: string;
  title: string;
  type: ListingType;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  description: string;
  amenities: string[];
  city: string;
  area: string;
  address: string;
  rent: number;
  fees: ListingFees;
  availableFrom: string;
  photoKeys: string[];
  documents: { kind: OwnershipDocKind; fileName: string }[];
  status: ListingStatus;
  verifiedAt: string | null;
  isSample: boolean;
  createdAt: number;
  updatedAt: number;
  history: StatusChange[];
  reviewNote: string | null;
  /** Internal auto-flags for reviewers (Blueprint 04). Never sent to landlords or tenants. */
  flags: string[];
}

interface BookingRow {
  id: string;
  listingId: string;
  tenantId: string;
  moveInDate: string;
  /** Rates and amounts snapshotted at creation (Blueprint 06). */
  commissionBps: number;
  tenantFeeBps: number;
  price: PriceBreakdown;
  status: BookingStatus;
  createdAt: number;
  expiresAt: number;
  paidAt: number | null;
  releasedAt: number | null;
  dispute: Booking['dispute'];
  paymentRef: string | null;
}

interface PaymentRow {
  reference: string;
  bookingId: string;
  amount: number;
  status: 'initiated' | 'succeeded' | 'failed' | 'refunded';
}

interface LedgerTxn {
  id: string;
  kind: string;
  ref: string;
  at: number;
  entries: { account: string; amount: number }[];
}

interface Db {
  users: Map<string, UserRow>;
  listings: Map<string, ListingRow>;
  bookings: Map<string, BookingRow>;
  payments: Map<string, PaymentRow>;
  inspections: Map<string, { id: string; listingId: string; tenantId: string; slotAt: string; status: Inspection['status'] }>;
  saved: Set<string>;
  ledger: LedgerTxn[];
  otps: Map<string, { code: string; expiresAt: number; attempts: number; sentAt: number[] }>;
  accessTokens: Map<string, string>;
  refreshTokens: Map<string, string>;
  idempotency: Map<string, { checkoutUrl: string; reference: string }>;
  policies: PolicyVersion[];
  signups: Map<string, PendingSignup>;
  resets: Map<string, PendingReset>;
  resetTokens: Map<string, { userId: string | null; expiresAt: number }>;
  /** Failed sign-ins per identifier (phone or email), whether or not an account exists. */
  loginFailures: Map<string, number[]>;
}

const now = () => Date.now();
const iso = (ms: number) => new Date(ms).toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;

function slugify(title: string, listingId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  // Generated ids (l_ + 12 hex) get a short suffix so titles can repeat; seeded ids have unique titles already.
  const generated = /^l_([0-9a-f]{12})$/.exec(listingId);
  return generated ? `${base}-${generated[1].slice(-6)}` : base;
}

/** Midnight in Lagos (UTC+1, no DST) for a YYYY-MM-DD date. */
const lagosMidnight = (date: string) => Date.parse(`${date}T00:00:00+01:00`);
const lagosToday = () => new Date(now() + 3_600_000).toISOString().slice(0, 10);
const addDays = (date: string, days: number) => new Date(lagosMidnight(date) + days * DAY + 3_600_000).toISOString().slice(0, 10);

// ---------- Seeding ----------
function createDb(): Db {
  const t = now();
  const db: Db = {
    users: new Map(),
    listings: new Map(),
    bookings: new Map(),
    payments: new Map(),
    inspections: new Map(),
    saved: new Set(),
    ledger: [],
    otps: new Map(),
    accessTokens: new Map(),
    refreshTokens: new Map(),
    idempotency: new Map(),
    policies: POLICIES.map((p) => ({ ...p, publishedAt: iso(t - 24 * DAY) })),
    signups: new Map(),
    resets: new Map(),
    resetTokens: new Map(),
    loginFailures: new Map(),
  };

  for (const u of SEED_USERS) {
    db.users.set(u.id, {
      ...u,
      payout: u.payout ? { ...u.payout, verifiedAt: iso(t - 60 * DAY) } : null,
      payoutHoldUntil: null,
      acceptedPolicyId: u.acceptedPolicyVersion ? 'pol_landlord_v2' : null,
      createdAt: t - 90 * DAY,
      passwordHash: null,
      termsAcceptedAt: t - 90 * DAY,
    });
  }

  for (const s of SEED_LISTINGS) {
    const created = t - s.ageDays * DAY;
    const live = s.status === 'published' || s.status === 'reserved';
    const history: StatusChange[] = [{ from: null, to: 'draft', at: iso(created), reason: null }];
    if (s.status !== 'draft') history.push({ from: 'draft', to: 'submitted', at: iso(created + 3_600_000), reason: null });
    if (s.status !== 'draft') history.push({ from: 'submitted', to: 'in_review', at: iso(created + 5 * 3_600_000), reason: null });
    if (live) history.push({ from: 'in_review', to: 'published', at: iso(created + 6 * 3_600_000), reason: 'All checks passed' });
    if (s.status === 'changes_requested')
      history.push({ from: 'in_review', to: 'changes_requested', at: iso(created + 6 * 3_600_000), reason: s.reviewNote ?? null });
    if (s.status === 'reserved') history.push({ from: 'published', to: 'reserved', at: iso(t - 2 * DAY), reason: 'Payment succeeded' });

    db.listings.set(s.id, {
      id: s.id,
      slug: slugify(s.title, s.id),
      landlordId: s.landlordId,
      title: s.title,
      type: s.type,
      bedrooms: s.bedrooms,
      bathrooms: s.bathrooms,
      furnished: s.furnished,
      description: s.description,
      amenities: s.amenities,
      city: s.city,
      area: s.area,
      address: s.address,
      rent: s.rentNaira * 100,
      fees: seedFees(s.fees),
      availableFrom: addDays(lagosToday(), s.status === 'published' ? 7 : 14),
      photoKeys: seedPhotos(s.cover),
      documents: s.documents ?? [{ kind: 'certificate_of_occupancy', fileName: 'C-of-O.pdf' }],
      status: s.status,
      verifiedAt: live ? iso(created + 6 * 3_600_000) : null,
      isSample: true,
      createdAt: created,
      updatedAt: created + 6 * 3_600_000,
      history,
      reviewNote: s.reviewNote ?? null,
      flags: [],
    });
  }

  // No demo people, bookings, payments, saved homes or viewings: only the Find a Home listings are seeded.
  return db;
}

declare global {
  var __skyhavenMockDb: Db | undefined;
}

function db(): Db {
  globalThis.__skyhavenMockDb ??= createDb();
  const d = globalThis.__skyhavenMockDb;
  sweep(d);
  return d;
}

// ---------- Ledger (Blueprint 06): every transaction's entries sum to zero ----------
function postTxn(d: Db, kind: string, ref: string, entries: LedgerTxn['entries']) {
  const sum = entries.reduce((s, e) => s + e.amount, 0);
  if (sum !== 0) throw new Error(`Ledger transaction ${kind}/${ref} does not balance (${sum})`);
  d.ledger.push({ id: id('txn'), kind, ref, at: now(), entries });
}

/** Debits are positive, credits negative. */
function postChargeToLedger(d: Db, reference: string, amount: number) {
  postTxn(d, 'charge_succeeded', reference, [
    { account: 'gateway_clearing', amount },
    { account: 'escrow_held', amount: -amount },
  ]);
  // Illustrative gateway fee: 1.5% capped at ₦2,000, absorbed by the platform.
  const fee = Math.min(Math.floor((amount * 150 + 5_000) / 10_000), 200_000);
  postTxn(d, 'gateway_fee', reference, [
    { account: 'gateway_fees', amount: fee },
    { account: 'gateway_clearing', amount: -fee },
  ]);
}

function balance(d: Db, account: string) {
  return d.ledger.reduce((s, t) => s + t.entries.filter((e) => e.account === account).reduce((a, e) => a + e.amount, 0), 0);
}

// ---------- Time-based rules ----------
function sweep(d: Db) {
  const t = now();
  for (const b of d.bookings.values()) {
    if (b.status === 'pending_payment' && t > b.expiresAt) b.status = 'expired';
    if (b.status === 'paid_held' && !b.dispute && t > autoReleaseAt(b)) release(d, b, 'Auto-released after move-in date');
  }
}

const autoReleaseAt = (b: BookingRow) => lagosMidnight(b.moveInDate) + AUTO_RELEASE_HOURS * 3_600_000;

function release(d: Db, b: BookingRow, reason: string) {
  const listing = d.listings.get(b.listingId)!;
  // Caution deposit is passed to the landlord with the rent (default in Blueprint 17 until decided).
  const toLandlord = b.price.landlordPayout + b.price.cautionDeposit;
  const toPlatform = b.price.commission + b.price.tenantFee;
  postTxn(d, 'release', b.id, [
    { account: 'escrow_held', amount: b.price.tenantTotal },
    { account: `landlord_payable:${listing.landlordId}`, amount: -toLandlord },
    { account: 'platform_revenue', amount: -toPlatform },
  ]);
  b.status = 'released';
  b.releasedAt = now();
  transition(listing, 'rented', null, reason);
}

function transition(l: ListingRow, to: ListingStatus, _actorId: string | null, reason: string | null) {
  if (!canTransition(l.status, to)) {
    throw new ApiError('conflict', `This listing can’t move from ${l.status.replace('_', ' ')} to ${to.replace('_', ' ')}.`, 409);
  }
  l.history.push({ from: l.status, to, at: iso(now()), reason });
  l.status = to;
  l.updatedAt = now();
}

// ---------- Auth helpers ----------
function userFor(d: Db, token: string): UserRow {
  const userId = d.accessTokens.get(token);
  const user = userId ? d.users.get(userId) : undefined;
  if (!user) throw new ApiError('unauthorized', 'Please sign in again.', 401);
  return user;
}

function requireRole(user: UserRow, role: User['roles'][number]) {
  if (!user.roles.includes(role)) throw new ApiError('forbidden', 'Your account can’t do that yet.', 403);
}

function issueTokens(d: Db, userId: string) {
  const accessToken = `mock_at_${crypto.randomUUID()}`;
  const refreshToken = `mock_rt_${crypto.randomUUID()}`;
  d.accessTokens.set(accessToken, userId);
  d.refreshTokens.set(refreshToken, userId);
  return { accessToken, refreshToken, expiresIn: 30 * 24 * 3600 };
}

const toUser = (u: UserRow): User => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, roles: [...u.roles] });

/** Signs the user out everywhere (after a password reset). */
function revokeSessions(d: Db, userId: string) {
  for (const [t, uid] of d.accessTokens) if (uid === userId) d.accessTokens.delete(t);
  for (const [t, uid] of d.refreshTokens) if (uid === userId) d.refreshTokens.delete(t);
}

// ---------- Passwords (the real API should use argon2id; scrypt is what Node ships with) ----------
const SCRYPT_N = 16_384;
const scryptAsync = (password: string, salt: Buffer, n: number) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password.normalize('NFKC'), salt, 64, { N: n, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))));

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT_N);
  return `scrypt$${SCRYPT_N}$${salt.toString('base64')}$${key.toString('base64')}`;
}

/** Hash used when no account matches, so a wrong identifier takes as long as a wrong password. */
let dummyHash: Promise<string> | undefined;

async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const [scheme, n, salt, hash] = (stored ?? (await (dummyHash ??= hashPassword(crypto.randomUUID())))).split('$');
  if (scheme !== 'scrypt') return false;
  const key = await scryptAsync(password, Buffer.from(salt, 'base64'), Number(n));
  const expected = Buffer.from(hash, 'base64');
  return key.length === expected.length && timingSafeEqual(key, expected) && stored !== null;
}

function assertPasswordAllowed(password: string) {
  // Defence in depth: the web form checks the full rules first.
  if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError('validation', 'Use at least 8 characters, with a letter and a number.', 400, { password: 'Too weak' });
  }
}

// ---------- One-time codes ----------
const CODE_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_S = 60;
const MAX_CODE_ATTEMPTS = 5;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MS = 15 * 60_000;

const newCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');

/** Enforces the resend cooldown and at most 5 codes per 10 minutes. Returns the updated send history. */
function allowSend(sentAt: number[]): number[] {
  const t = now();
  const recent = sentAt.filter((s) => t - s < CODE_TTL_MS);
  const last = recent.at(-1);
  if (last && t - last < RESEND_COOLDOWN_S * 1000) {
    throw new ApiError('rate_limited', `Please wait ${Math.ceil((RESEND_COOLDOWN_S * 1000 - (t - last)) / 1000)} seconds before asking for another code.`, 429);
  }
  if (recent.length >= 5) throw new ApiError('rate_limited', 'Too many codes requested. Try again in a few minutes.', 429);
  return [...recent, t];
}

/** Checks a submitted code: expiry, attempt limit, then a constant-time compare. */
function checkCode(pending: { code: string; expiresAt: number; attempts: number }, submitted: string) {
  if (now() > pending.expiresAt) throw new ApiError('validation', 'That code has expired. Ask for a new one.', 400, { code: 'Expired' });
  pending.attempts += 1;
  if (pending.attempts > MAX_CODE_ATTEMPTS) throw new ApiError('rate_limited', 'Too many wrong codes. Ask for a new one.', 429);
  const a = Buffer.from(pending.code);
  const b = Buffer.from(submitted.padEnd(pending.code.length).slice(0, pending.code.length));
  if (!timingSafeEqual(a, b)) throw new ApiError('validation', 'That code isn’t right. Check it and try again.', 400, { code: 'Incorrect code' });
}

function maskDestination(destination: string): string {
  if (destination.includes('@')) {
    const [user, domain] = destination.split('@');
    return `${user[0]}•••${user.length > 1 ? user[user.length - 1] : ''}@${domain}`;
  }
  return `${destination.slice(0, 4)} ${destination.slice(4, 7)} ••• ${destination.slice(-4)}`;
}

function findByIdentifier(d: Db, identifier: string) {
  const key = identifier.toLowerCase();
  return [...d.users.values()].find((u) => u.phone === key || u.email === key);
}

// ---------- Mappers ----------
const CHECKS: VerificationCheck[] = [
  { key: 'ownership', label: 'Ownership documents match the landlord’s ID' },
  { key: 'photos', label: 'Photos are real and current' },
  { key: 'location', label: 'Location matches the address' },
  { key: 'price', label: 'Price is in line with the area' },
  { key: 'fees', label: 'All fees are shown up front' },
];

function photo(key: string) {
  const name = key.replace(/^sample\//, '');
  return { key, url: photoUrl(name), alt: SAMPLE_PHOTOS[name] ?? 'Photo of the home' };
}

function toSummary(l: ListingRow): ListingSummary {
  return {
    id: l.id,
    slug: l.slug,
    title: l.title,
    type: l.type,
    bedrooms: l.bedrooms,
    bathrooms: l.bathrooms,
    rent: l.rent,
    rentPeriod: 'year',
    currency: 'NGN',
    area: l.area,
    city: l.city,
    coverPhoto: photo(l.photoKeys[0]),
    verifiedAt: l.verifiedAt,
    isSample: l.isSample,
  };
}

function toDetail(d: Db, l: ListingRow): ListingDetail {
  const landlord = d.users.get(l.landlordId);
  return {
    ...toSummary(l),
    description: l.description,
    photos: l.photoKeys.map(photo),
    fees: l.fees,
    amenities: l.amenities,
    furnished: l.furnished,
    availableFrom: l.availableFrom,
    checks: l.verifiedAt ? CHECKS : [],
    landlordFirstName: landlord?.name?.split(' ')[0] ?? 'Landlord',
    landlordVerified: landlord?.kyc === 'verified',
    available: l.status === 'published',
  };
}

function toOwn(d: Db, l: ListingRow): OwnListing {
  const p = priceBreakdown({ rent: l.rent, commissionBps: COMMISSION_BPS });
  return {
    ...toDetail(d, l),
    status: l.status,
    address: l.address,
    updatedAt: iso(l.updatedAt),
    history: [...l.history].reverse(),
    reviewNote: l.status === 'changes_requested' || l.status === 'rejected' ? l.reviewNote : null,
    payoutPreview: { commission: p.commission, landlordPayout: p.landlordPayout },
    documents: l.documents,
  };
}

function toBooking(d: Db, b: BookingRow): Booking {
  const l = d.listings.get(b.listingId)!;
  const landlord = d.users.get(l.landlordId)!;
  const paid = b.paidAt !== null && b.status !== 'refunded';
  return {
    id: b.id,
    listing: toSummary(l),
    status: b.status,
    moveInDate: b.moveInDate,
    price: { rent: b.price.rent, tenantFee: b.price.tenantFee, cautionDeposit: b.price.cautionDeposit, tenantTotal: b.price.tenantTotal },
    currency: 'NGN',
    createdAt: iso(b.createdAt),
    expiresAt: b.status === 'pending_payment' ? iso(b.expiresAt) : null,
    paidAt: b.paidAt ? iso(b.paidAt) : null,
    releasedAt: b.releasedAt ? iso(b.releasedAt) : null,
    autoReleaseAt: b.status === 'paid_held' ? iso(autoReleaseAt(b)) : null,
    address: paid ? l.address : null,
    landlordContact: paid ? { name: landlord.name ?? 'Landlord', phone: landlord.phone ?? '' } : null,
    dispute: b.dispute,
  };
}

function ownedListing(d: Db, user: UserRow, listingId: string) {
  const l = d.listings.get(listingId);
  if (!l || l.landlordId !== user.id) throw new ApiError('not_found', 'Listing not found.', 404);
  return l;
}

function ownedBooking(d: Db, user: UserRow, bookingId: string) {
  const b = d.bookings.get(bookingId);
  if (!b || b.tenantId !== user.id) throw new ApiError('not_found', 'Booking not found.', 404);
  return b;
}

function applyDraft(l: ListingRow, input: ListingDraftInput) {
  l.title = input.title;
  l.type = input.type;
  l.bedrooms = input.type === 'studio' ? 0 : input.bedrooms;
  l.bathrooms = input.bathrooms;
  l.furnished = input.furnished;
  l.description = input.description;
  l.amenities = input.amenities;
  l.city = input.city;
  l.area = input.area;
  l.address = input.address;
  l.rent = input.rent * 100;
  l.fees = { serviceCharge: input.serviceCharge * 100, cautionDeposit: input.cautionDeposit * 100, legalFee: input.legalFee * 100 };
  l.availableFrom = input.availableFrom;
  l.photoKeys = input.photoKeys;
  l.documents = input.documents;
  l.updatedAt = now();
}

/** Reviewer auto-flags (Blueprint 04): contact details in text, price far below the area median, missing fees. */
function autoFlags(d: Db, l: ListingRow): string[] {
  const flags: string[] = [];
  if (findContactDetails(`${l.title}\n${l.description}`).length) flags.push('contact_details_in_text');
  const peers = [...d.listings.values()].filter((o) => o.id !== l.id && o.area === l.area && o.type === l.type && o.verifiedAt);
  if (peers.length) {
    const rents = peers.map((p) => p.rent).sort((a, b) => a - b);
    const median = rents[Math.floor(rents.length / 2)];
    if (l.rent < median * 0.65) flags.push('price_below_area_median');
  }
  if (!l.fees.cautionDeposit && !l.fees.serviceCharge) flags.push('fees_missing');
  return flags;
}

// ---------- The API ----------
const LATENCY_MS = Number(process.env.MOCK_LATENCY_MS ?? 0);

/**
 * Makes every method yield to the event loop before touching the store, like a network call would. Without this the
 * store answers synchronously, and Next.js would try to fold request-time data (and clock reads) into prerendered
 * shells. `MOCK_LATENCY_MS` adds a delay so loading states can be seen in development.
 */
function asNetworkCalls<T extends object>(impl: T): T {
  const wrapped = {} as Record<string, unknown>;
  for (const [name, fn] of Object.entries(impl)) {
    wrapped[name] = async (...args: unknown[]) => {
      await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
      return (fn as (...a: unknown[]) => unknown)(...args);
    };
  }
  return wrapped as T;
}

/**
 * For its own tests only, the in-memory API also returns the code it would have sent. The web app never uses this
 * API for accounts, so no code ever reaches a page.
 */
type CodeMethods = 'startSignup' | 'resendSignupCode' | 'requestPasswordReset' | 'requestOtp';
type WithCode<F> = F extends (...args: infer A) => Promise<infer R> ? (...args: A) => Promise<R & { devCode?: string }> : never;
type MockApi = Omit<SkyHavenApi, CodeMethods> & { [K in CodeMethods]: WithCode<SkyHavenApi[K]> };

const mockImpl: MockApi = {
  // ----- Sign-up -----
  async startSignup(input) {
    const d = db();
    assertPasswordAllowed(input.password);
    const signup: PendingSignup = {
      id: `su_${crypto.randomUUID()}`,
      name: input.name,
      phone: input.phone,
      email: input.email?.toLowerCase() ?? null,
      passwordHash: await hashPassword(input.password),
      intent: input.intent,
      code: newCode(),
      expiresAt: now() + CODE_TTL_MS,
      attempts: 0,
      // Per-phone send history, so starting over doesn't bypass the cooldown.
      sentAt: allowSend([...d.signups.values()].filter((s) => s.phone === input.phone).flatMap((s) => s.sentAt)),
    };
    d.signups.set(signup.id, signup);
    return { signupId: signup.id, sentTo: maskDestination(signup.phone), resendIn: RESEND_COOLDOWN_S, devCode: signup.code };
  },

  async resendSignupCode(signupId) {
    const d = db();
    const s = d.signups.get(signupId);
    if (!s) throw new ApiError('not_found', 'This sign-up has expired. Please start again.', 404);
    s.sentAt = allowSend(s.sentAt);
    s.code = newCode();
    s.expiresAt = now() + CODE_TTL_MS;
    s.attempts = 0;
    return { sentTo: maskDestination(s.phone), resendIn: RESEND_COOLDOWN_S, devCode: s.code };
  },

  async completeSignup({ signupId, code }) {
    const d = db();
    const s = d.signups.get(signupId);
    if (!s) throw new ApiError('not_found', 'This sign-up has expired. Please start again.', 404);
    checkCode(s, code);
    d.signups.delete(signupId);
    // Only now, with the phone proven, do we say whether it's already registered.
    if (findByIdentifier(d, s.phone)) {
      throw new ApiError('conflict', 'This phone number already has a SkyHaven account. Sign in, or reset your password if you’ve forgotten it.', 409);
    }
    if (s.email && findByIdentifier(d, s.email)) {
      throw new ApiError('conflict', 'That email is already used by another account. Sign up again without it, or with a different email.', 409);
    }
    const user: UserRow = {
      id: id('u'),
      name: s.name,
      phone: s.phone,
      email: s.email,
      roles: s.intent === 'list' ? ['tenant', 'landlord'] : ['tenant'],
      kyc: 'not_started',
      payout: null,
      payoutHoldUntil: null,
      acceptedPolicyId: null,
      createdAt: now(),
      passwordHash: s.passwordHash,
      termsAcceptedAt: now(),
    };
    d.users.set(user.id, user);
    return { ...issueTokens(d, user.id), user: toUser(user) };
  },

  // ----- Password sign-in -----
  async login({ identifier, password }) {
    const d = db();
    const key = identifier.toLowerCase();
    const t = now();
    const failures = (d.loginFailures.get(key) ?? []).filter((f) => t - f < LOGIN_LOCK_MS);
    if (failures.length >= LOGIN_MAX_FAILURES) {
      const minutes = Math.ceil((LOGIN_LOCK_MS - (t - failures[0])) / 60_000);
      throw new ApiError('rate_limited', `Too many attempts. For your security, try again in ${minutes} minute${minutes === 1 ? '' : 's'}, or reset your password.`, 429);
    }
    const user = findByIdentifier(d, key);
    const ok = await verifyPassword(password, user?.passwordHash ?? null); // runs even with no user: same timing
    if (!user || !ok) {
      d.loginFailures.set(key, [...failures, t]);
      const left = LOGIN_MAX_FAILURES - failures.length - 1;
      throw new ApiError(
        'unauthorized',
        left > 0 && left <= 2
          ? `That phone number, email or password isn’t right. ${left} attempt${left === 1 ? '' : 's'} left before a 15-minute pause.`
          : 'That phone number, email or password isn’t right.',
        401,
      );
    }
    d.loginFailures.delete(key);
    return { ...issueTokens(d, user.id), user: toUser(user) };
  },

  // ----- Forgot password -----
  async requestPasswordReset({ identifier }) {
    const d = db();
    const key = identifier.toLowerCase();
    const user = findByIdentifier(d, key);
    const history = [...d.resets.values()].filter((r) => r.destination === key).flatMap((r) => r.sentAt);
    const reset: PendingReset = {
      id: `pr_${crypto.randomUUID()}`,
      userId: user?.id ?? null,
      destination: key,
      code: newCode(),
      expiresAt: now() + CODE_TTL_MS,
      attempts: 0,
      sentAt: allowSend(history),
    };
    d.resets.set(reset.id, reset);
    // Same answer whether or not the account exists. A real API only sends the SMS or email when it does.
    return { resetId: reset.id, sentTo: maskDestination(key), resendIn: RESEND_COOLDOWN_S, devCode: reset.code };
  },

  async verifyPasswordReset({ resetId, code }) {
    const d = db();
    const r = d.resets.get(resetId);
    if (!r) throw new ApiError('not_found', 'This reset has expired. Please start again.', 404);
    checkCode(r, code);
    d.resets.delete(resetId);
    const resetToken = `rt_${crypto.randomUUID()}`;
    d.resetTokens.set(resetToken, { userId: r.userId, expiresAt: now() + CODE_TTL_MS });
    return { resetToken };
  },

  async completePasswordReset({ resetToken, password }) {
    const d = db();
    const entry = d.resetTokens.get(resetToken);
    d.resetTokens.delete(resetToken); // single use
    const user = entry?.userId ? d.users.get(entry.userId) : undefined;
    if (!entry || now() > entry.expiresAt || !user) throw new ApiError('not_found', 'This reset link has expired. Please start again.', 404);
    assertPasswordAllowed(password);
    user.passwordHash = await hashPassword(password);
    revokeSessions(d, user.id);
    if (user.phone) d.loginFailures.delete(user.phone);
    if (user.email) d.loginFailures.delete(user.email);
    return { ...issueTokens(d, user.id), user: toUser(user) };
  },

  // ----- One-time-code sign-in (existing accounts only) -----
  async requestOtp({ destination }) {
    const d = db();
    const prev = d.otps.get(destination);
    const sentAt = allowSend(prev?.sentAt ?? []);
    const code = newCode();
    d.otps.set(destination, { code, expiresAt: now() + CODE_TTL_MS, attempts: 0, sentAt });
    return { sentTo: maskDestination(destination), devCode: code };
  },

  async verifyOtp({ destination, code }) {
    const d = db();
    const otp = d.otps.get(destination);
    if (!otp) throw new ApiError('validation', 'That code has expired. Ask for a new one.', 400, { code: 'Expired' });
    checkCode(otp, code);
    d.otps.delete(destination);
    const user = findByIdentifier(d, destination);
    if (!user) throw new ApiError('not_found', 'There’s no SkyHaven account with that phone number or email yet. Create one to continue.', 404);
    return { ...issueTokens(d, user.id), user: toUser(user) };
  },

  async refresh(refreshToken) {
    const d = db();
    const userId = d.refreshTokens.get(refreshToken);
    if (!userId) throw new ApiError('unauthorized', 'Please sign in again.', 401);
    d.refreshTokens.delete(refreshToken); // rotate: each refresh token works once
    return issueTokens(d, userId);
  },

  async logout(token) {
    db().accessTokens.delete(token);
  },

  async me(token) {
    return toUser(userFor(db(), token));
  },

  async updateProfile(token, { name }) {
    const user = userFor(db(), token);
    user.name = name;
    return toUser(user);
  },

  async searchListings(params: SearchParams) {
    const d = db();
    const q = params.q?.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    let items = [...d.listings.values()].filter((l) => l.status === 'published');
    if (terms.length) {
      items = items.filter((l) => {
        const hay = `${l.title} ${l.area} ${l.city} ${l.type}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      });
    }
    if (params.city) items = items.filter((l) => l.city.toLowerCase() === params.city!.toLowerCase());
    if (params.type) items = items.filter((l) => l.type === params.type);
    if (params.minBeds) items = items.filter((l) => l.bedrooms >= params.minBeds!);
    if (params.maxRent) items = items.filter((l) => l.rent <= params.maxRent! * 100);
    const sort = params.sort ?? 'newest';
    items.sort((a, b) =>
      sort === 'price_asc' ? a.rent - b.rent : sort === 'price_desc' ? b.rent - a.rent : (b.verifiedAt ?? '').localeCompare(a.verifiedAt ?? ''),
    );
    const offset = Number(params.cursor ?? 0) || 0;
    const page = items.slice(offset, offset + PAGE_SIZE);
    return {
      items: page.map(toSummary),
      total: items.length,
      nextCursor: offset + PAGE_SIZE < items.length ? String(offset + PAGE_SIZE) : null,
    };
  },

  async getListing(slug) {
    const d = db();
    const l = [...d.listings.values()].find((x) => x.slug === slug);
    if (!l || !['published', 'reserved', 'rented'].includes(l.status)) return null;
    return toDetail(d, l);
  },

  async inspectionSlots(listingId) {
    const d = db();
    const taken = new Set([...d.inspections.values()].filter((i) => i.listingId === listingId && i.status !== 'cancelled').map((i) => i.slotAt));
    const slots: string[] = [];
    for (let day = 1; slots.length < 12 && day <= 10; day++) {
      const date = addDays(lagosToday(), day);
      if (new Date(lagosMidnight(date) + 3_600_000).getUTCDay() === 0) continue; // no Sunday viewings
      for (const hour of [10, 12, 15]) {
        const slot = iso(lagosMidnight(date) + hour * 3_600_000);
        if (!taken.has(slot)) slots.push(slot);
      }
    }
    return slots;
  },

  async cities() {
    return [...new Set([...db().listings.values()].filter((l) => l.status === 'published').map((l) => l.city))].sort();
  },

  async savedListings(token) {
    const d = db();
    const user = userFor(d, token);
    return [...d.saved]
      .filter((k) => k.startsWith(`${user.id}:`))
      .map((k) => d.listings.get(k.split(':')[1]))
      .filter((l): l is ListingRow => !!l && l.status === 'published')
      .map(toSummary);
  },

  async setSaved(token, listingId, saved) {
    const d = db();
    const user = userFor(d, token);
    if (!d.listings.has(listingId)) throw new ApiError('not_found', 'Listing not found.', 404);
    const key = `${user.id}:${listingId}`;
    if (saved) d.saved.add(key);
    else d.saved.delete(key);
  },

  async requestInspection(token, { listingId, slotAt }) {
    const d = db();
    const user = userFor(d, token);
    requireRole(user, 'tenant');
    const l = d.listings.get(listingId);
    if (!l || l.status !== 'published') throw new ApiError('conflict', 'This home is no longer available for inspection.', 409);
    if (l.landlordId === user.id) throw new ApiError('forbidden', 'You can’t book an inspection of your own listing.', 403);
    const existing = [...d.inspections.values()].find(
      (i) => i.listingId === listingId && i.tenantId === user.id && (i.status === 'requested' || i.status === 'confirmed'),
    );
    if (existing) throw new ApiError('conflict', 'You already have an inspection booked for this home.', 409);
    if (!(await mockApi.inspectionSlots(listingId)).includes(slotAt)) {
      throw new ApiError('conflict', 'That time was just taken. Pick another slot.', 409);
    }
    const row = { id: id('i'), listingId, tenantId: user.id, slotAt, status: 'requested' as const };
    d.inspections.set(row.id, row);
    return { id: row.id, listing: toSummary(l), slotAt, status: row.status };
  },

  async myInspections(token) {
    const d = db();
    const user = userFor(d, token);
    return [...d.inspections.values()]
      .filter((i) => i.tenantId === user.id)
      .sort((a, b) => a.slotAt.localeCompare(b.slotAt))
      .map((i) => ({ id: i.id, listing: toSummary(d.listings.get(i.listingId)!), slotAt: i.slotAt, status: i.status }));
  },

  async createBooking(token, { listingId, moveInDate }) {
    const d = db();
    const user = userFor(d, token);
    requireRole(user, 'tenant');
    const l = d.listings.get(listingId);
    if (!l || l.status !== 'published') throw new ApiError('conflict', 'Someone else has just reserved this home.', 409);
    if (l.landlordId === user.id) throw new ApiError('forbidden', 'You can’t rent your own listing.', 403);
    const earliest = l.availableFrom > lagosToday() ? l.availableFrom : addDays(lagosToday(), 1);
    if (moveInDate < earliest) throw new ApiError('validation', 'Pick a move-in date on or after the date the home is available.', 400, { moveInDate: 'Too early' });
    if (moveInDate > addDays(lagosToday(), 180)) throw new ApiError('validation', 'Move-in must be within the next 6 months.', 400, { moveInDate: 'Too far ahead' });

    const pending = [...d.bookings.values()].find((b) => b.listingId === listingId && b.tenantId === user.id && b.status === 'pending_payment');
    if (pending) {
      pending.moveInDate = moveInDate;
      return toBooking(d, pending);
    }
    const price = priceBreakdown({ rent: l.rent, commissionBps: COMMISSION_BPS, tenantFeeBps: TENANT_FEE_BPS, cautionDeposit: l.fees.cautionDeposit });
    const b: BookingRow = {
      id: id('b'),
      listingId,
      tenantId: user.id,
      moveInDate,
      commissionBps: COMMISSION_BPS,
      tenantFeeBps: TENANT_FEE_BPS,
      price,
      status: 'pending_payment',
      createdAt: now(),
      expiresAt: now() + PAYMENT_EXPIRY_MS,
      paidAt: null,
      releasedAt: null,
      dispute: null,
      paymentRef: null,
    };
    d.bookings.set(b.id, b);
    return toBooking(d, b);
  },

  async initPayment(token, bookingId, idempotencyKey) {
    const d = db();
    const user = userFor(d, token);
    const cached = d.idempotency.get(`${user.id}:${idempotencyKey}`);
    if (cached) return cached;
    const b = ownedBooking(d, user, bookingId);
    if (b.status === 'expired') throw new ApiError('conflict', 'This booking expired. Start again from the listing.', 409);
    if (b.status !== 'pending_payment') throw new ApiError('conflict', 'This booking is already paid.', 409);
    const l = d.listings.get(b.listingId)!;
    if (l.status !== 'published') throw new ApiError('conflict', 'Someone else has just reserved this home.', 409);
    const reference = `SH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    d.payments.set(reference, { reference, bookingId: b.id, amount: b.price.tenantTotal, status: 'initiated' });
    b.paymentRef = reference;
    const result = { checkoutUrl: `/test-checkout/${reference}`, reference };
    d.idempotency.set(`${user.id}:${idempotencyKey}`, result);
    return result;
  },

  async verifyPayment(token, reference) {
    const d = db();
    const user = userFor(d, token);
    const p = d.payments.get(reference);
    if (!p) throw new ApiError('not_found', 'Payment not found.', 404);
    return toBooking(d, ownedBooking(d, user, p.bookingId));
  },

  async myBookings(token) {
    const d = db();
    const user = userFor(d, token);
    return [...d.bookings.values()]
      .filter((b) => b.tenantId === user.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((b) => toBooking(d, b));
  },

  async getBooking(token, bookingId) {
    const d = db();
    return toBooking(d, ownedBooking(d, userFor(d, token), bookingId));
  },

  async confirmMoveIn(token, bookingId) {
    const d = db();
    const b = ownedBooking(d, userFor(d, token), bookingId);
    if (b.status !== 'paid_held') throw new ApiError('conflict', 'This booking can’t be confirmed now.', 409);
    release(d, b, 'Tenant confirmed move-in');
    return toBooking(d, b);
  },

  async openDispute(token, bookingId, { reason }) {
    const d = db();
    const b = ownedBooking(d, userFor(d, token), bookingId);
    if (b.status !== 'paid_held') throw new ApiError('conflict', 'You can report a problem only while rent is held.', 409);
    b.status = 'disputed';
    b.dispute = { reason, openedAt: iso(now()), status: 'open' };
    return toBooking(d, b);
  },

  async becomeLandlord(token) {
    const user = userFor(db(), token);
    if (!user.roles.includes('landlord')) user.roles.push('landlord');
    return toUser(user);
  },

  async landlordProfile(token) {
    const d = db();
    const user = userFor(d, token);
    requireRole(user, 'landlord');
    return {
      kycStatus: user.kyc,
      payoutAccount: user.payout
        ? { bankName: user.payout.bankName, accountLast4: user.payout.accountLast4, accountName: user.payout.accountName, verifiedAt: user.payout.verifiedAt }
        : null,
      currentPolicy: await mockApi.currentPolicy('landlord'),
      acceptedPolicyVersionId: user.acceptedPolicyId,
    };
  },

  async startKyc(token) {
    const user = userFor(db(), token);
    requireRole(user, 'landlord');
    if (!user.name) throw new ApiError('guard_failed', 'Add your full name to your profile first.', 422);
    // Sandbox: the KYC provider approves straight away. The real flow opens the provider's ID + selfie check.
    user.kyc = 'verified';
    return { status: user.kyc, verificationUrl: null };
  },

  async banks() {
    return BANKS;
  },

  async savePayoutAccount(token, { bankCode, accountNumber }) {
    const user = userFor(db(), token);
    requireRole(user, 'landlord');
    const bank = BANKS.find((b) => b.code === bankCode);
    if (!bank) throw new ApiError('validation', 'Choose your bank.', 400, { bankCode: 'Unknown bank' });
    if (user.kyc !== 'verified') throw new ApiError('guard_failed', 'Verify your identity before adding a bank account.', 422);
    // Sandbox account-resolve returns the KYC name, so the fuzzy name match passes.
    const accountName = (user.name ?? '').toUpperCase();
    if (user.payout) user.payoutHoldUntil = now() + 48 * 3_600_000; // changed bank account: 48-hour payout hold
    user.payout = { bankCode, bankName: bank.name, accountLast4: accountNumber.slice(-4), accountName, verifiedAt: iso(now()) };
    return { bankName: bank.name, accountLast4: user.payout.accountLast4, accountName, verifiedAt: user.payout.verifiedAt };
  },

  async currentPolicy(kind) {
    const p = db()
      .policies.filter((x) => x.kind === kind)
      .sort((a, b) => b.version - a.version)[0];
    if (!p) throw new ApiError('not_found', 'Policy not found.', 404);
    return p;
  },

  async acceptPolicy(token, policyVersionId) {
    const d = db();
    const user = userFor(d, token);
    const policy = d.policies.find((p) => p.id === policyVersionId);
    if (!policy) throw new ApiError('not_found', 'Policy not found.', 404);
    if (policy.kind === 'landlord') user.acceptedPolicyId = policy.id;
  },

  async myListings(token) {
    const d = db();
    const user = userFor(d, token);
    requireRole(user, 'landlord');
    return [...d.listings.values()]
      .filter((l) => l.landlordId === user.id)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((l) => toOwn(d, l));
  },

  async myListing(token, listingId) {
    const d = db();
    return toOwn(d, ownedListing(d, userFor(d, token), listingId));
  },

  async createListing(token, input) {
    const d = db();
    const user = userFor(d, token);
    requireRole(user, 'landlord');
    const listingId = id('l');
    const l: ListingRow = {
      id: listingId,
      slug: slugify(input.title, listingId),
      landlordId: user.id,
      title: '',
      type: 'apartment',
      bedrooms: 0,
      bathrooms: 1,
      furnished: false,
      description: '',
      amenities: [],
      city: '',
      area: '',
      address: '',
      rent: 0,
      fees: { serviceCharge: 0, cautionDeposit: 0, legalFee: 0 },
      availableFrom: lagosToday(),
      photoKeys: [],
      documents: [],
      status: 'draft',
      verifiedAt: null,
      isSample: input.photoKeys.some((k) => k.startsWith('sample/')),
      createdAt: now(),
      updatedAt: now(),
      history: [{ from: null, to: 'draft', at: iso(now()), reason: null }],
      reviewNote: null,
      flags: [],
    };
    applyDraft(l, input);
    d.listings.set(l.id, l);
    return toOwn(d, l);
  },

  async updateListing(token, listingId, input) {
    const d = db();
    const l = ownedListing(d, userFor(d, token), listingId);
    if (!['draft', 'changes_requested', 'published', 'paused'].includes(l.status)) {
      throw new ApiError('conflict', 'This listing can’t be edited right now.', 409);
    }
    const material =
      l.rent !== input.rent * 100 ||
      l.address !== input.address ||
      l.photoKeys.join() !== input.photoKeys.join() ||
      JSON.stringify(l.documents) !== JSON.stringify(input.documents) ||
      l.fees.cautionDeposit !== input.cautionDeposit * 100 ||
      l.fees.serviceCharge !== input.serviceCharge * 100 ||
      l.fees.legalFee !== input.legalFee * 100;
    applyDraft(l, input);
    // Material edits on a live listing send it back for review (Blueprint 04).
    if (material && l.status === 'published') transition(l, 'submitted', l.landlordId, 'Material edit');
    return toOwn(d, l);
  },

  async submitListing(token, listingId) {
    const d = db();
    const user = userFor(d, token);
    requireRole(user, 'landlord');
    const l = ownedListing(d, user, listingId);
    // Submit guard (Blueprint 04)
    const policy = await mockApi.currentPolicy('landlord');
    if (user.kyc !== 'verified') throw new ApiError('guard_failed', 'Verify your identity before submitting a listing.', 422);
    if (!user.payout) throw new ApiError('guard_failed', 'Add a verified payout bank account before submitting.', 422);
    if (user.acceptedPolicyId !== policy.id) throw new ApiError('guard_failed', 'Accept the latest landlord policy before submitting.', 422);
    if (l.photoKeys.length < 5) throw new ApiError('guard_failed', 'Add at least 5 photos before submitting.', 422);
    if (!l.documents.length) throw new ApiError('guard_failed', 'Add an ownership document before submitting.', 422);
    // New-account velocity limit (Blueprint 09)
    if (now() - user.createdAt < 14 * DAY) {
      const submitted = [...d.listings.values()].filter((x) => x.landlordId === user.id && x.history.some((h) => h.to === 'submitted')).length;
      if (submitted >= NEW_ACCOUNT_SUBMIT_LIMIT) {
        throw new ApiError('guard_failed', 'New accounts can submit up to 3 listings in their first 14 days.', 422);
      }
    }
    transition(l, 'submitted', user.id, l.status === 'changes_requested' ? 'Resubmitted' : null);
    l.flags = autoFlags(d, l);
    return toOwn(d, l);
  },

  async setListingPaused(token, listingId, paused) {
    const d = db();
    const l = ownedListing(d, userFor(d, token), listingId);
    transition(l, paused ? 'paused' : 'published', l.landlordId, paused ? 'Paused by landlord' : 'Resumed by landlord');
    return toOwn(d, l);
  },

  async landlordMoney(token) {
    const d = db();
    const user = userFor(d, token);
    requireRole(user, 'landlord');
    const mine = [...d.bookings.values()].filter((b) => d.listings.get(b.listingId)?.landlordId === user.id);
    const toLandlord = (b: BookingRow) => b.price.landlordPayout + b.price.cautionDeposit;
    return {
      held: mine.filter((b) => b.status === 'paid_held' || b.status === 'disputed').reduce((s, b) => s + toLandlord(b), 0),
      payable: -balance(d, `landlord_payable:${user.id}`),
      paidOut: 0,
      currency: 'NGN',
      recent: mine
        .filter((b) => b.paidAt)
        .sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0))
        .slice(0, 10)
        .map((b) => ({
          bookingId: b.id,
          listingTitle: d.listings.get(b.listingId)!.title,
          tenantFirstName: d.users.get(b.tenantId)?.name?.split(' ')[0] ?? 'Tenant',
          moveInDate: b.moveInDate,
          status: b.status,
          landlordPayout: toLandlord(b),
        })),
    } satisfies LandlordMoney;
  },
};

export const mockApi: MockApi = asNetworkCalls(mockImpl);

// ---------- Sandbox-only controls (no equivalent in the real API) ----------
export const sandbox = {
  payment(reference: string) {
    const d = db();
    const p = d.payments.get(reference);
    if (!p) return null;
    const b = d.bookings.get(p.bookingId)!;
    return { reference, amount: p.amount, status: p.status, bookingId: b.id, listingTitle: d.listings.get(b.listingId)!.title };
  },

  /** Simulates the gateway's signed `charge.success` webhook followed by server-to-server verify (Blueprint 05). */
  completePayment(reference: string, outcome: 'success' | 'failed'): { bookingId: string } {
    const d = db();
    const p = d.payments.get(reference);
    if (!p) throw new ApiError('not_found', 'Payment not found.', 404);
    const b = d.bookings.get(p.bookingId)!;
    if (p.status !== 'initiated') return { bookingId: b.id }; // webhooks are de-duplicated
    if (outcome === 'failed') {
      p.status = 'failed';
      return { bookingId: b.id };
    }
    p.status = 'succeeded';
    postChargeToLedger(d, reference, p.amount);
    const l = d.listings.get(b.listingId)!;
    if (b.status !== 'pending_payment' || l.status !== 'published') {
      // Paid after expiry, or another tenant reserved first: refund in full (before release).
      postTxn(d, 'refund', reference, [
        { account: 'escrow_held', amount: p.amount },
        { account: 'refunds_payable', amount: -p.amount },
      ]);
      p.status = 'refunded';
      b.status = 'refunded';
      b.paidAt = now();
      return { bookingId: b.id };
    }
    b.status = 'paid_held';
    b.paidAt = now();
    transition(l, 'reserved', null, 'Payment succeeded');
    return { bookingId: b.id };
  },

  /** Stands in for the admin console's review queue so the full listing lifecycle can be demoed. */
  review(listingId: string, decision: 'approve' | 'request_changes') {
    const d = db();
    const l = d.listings.get(listingId);
    if (!l) throw new ApiError('not_found', 'Listing not found.', 404);
    if (l.status === 'submitted') transition(l, 'in_review', 'u_reviewer', 'Claimed by reviewer');
    if (decision === 'approve') {
      transition(l, 'published', 'u_reviewer', 'All checks passed');
      l.verifiedAt = iso(now());
      l.reviewNote = null;
    } else {
      l.reviewNote = 'Please add a clear photo of the kitchen and confirm the service charge covers power.';
      transition(l, 'changes_requested', 'u_reviewer', l.reviewNote);
    }
  },

  ledgerIsBalanced() {
    return db().ledger.every((t) => t.entries.reduce((s, e) => s + e.amount, 0) === 0);
  },
};
