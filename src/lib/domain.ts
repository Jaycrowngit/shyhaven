/**
 * NOTE: a copy of this file lives in each SkyHaven project (web, admin, api, mobile). Keep them identical.
 *
 * Shared domain types and money rules for SkyHaven.
 * Mirrors the Developer Blueprint: listing lifecycle (section 04), roles (02) and money rules (06).
 */

// ---------- Roles ----------
export const ROLES = ['tenant', 'landlord', 'reviewer', 'finance', 'super_admin'] as const;
export type Role = (typeof ROLES)[number];

// ---------- Listing lifecycle ----------
export const LISTING_STATUSES = [
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'rejected',
  'published',
  'paused',
  'reserved',
  'rented',
  'archived',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Allowed listing status transitions. The API must reject anything not listed here. */
export const LISTING_TRANSITIONS: Readonly<Record<ListingStatus, readonly ListingStatus[]>> = {
  draft: ['submitted'],
  submitted: ['in_review'],
  in_review: ['changes_requested', 'rejected', 'published'],
  changes_requested: ['submitted'],
  rejected: [],
  published: ['paused', 'submitted', 'reserved'],
  paused: ['published'],
  reserved: ['published', 'rented'],
  rented: ['archived'],
  archived: [],
};

export function canTransition(from: ListingStatus, to: ListingStatus): boolean {
  return LISTING_TRANSITIONS[from].includes(to);
}

// ---------- Bookings and payments ----------
export const BOOKING_STATUSES = ['pending_payment', 'paid_held', 'disputed', 'released', 'refunded', 'expired', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ['initiated', 'pending', 'succeeded', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ---------- Money ----------
/** Amounts are always integers in minor units (kobo, cents). Never use floats for money. */
export type MinorUnits = number;

/** Rates are stored in basis points: 1000 bps = 10%. */
export type BasisPoints = number;

function assertMinor(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer in minor units, got ${value}`);
  }
}

/** Percentage of an amount, rounded half up, in integer maths. */
export function applyRate(amount: MinorUnits, rateBps: BasisPoints): MinorUnits {
  assertMinor(amount, 'amount');
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10_000) {
    throw new RangeError(`rateBps must be an integer from 0 to 10000, got ${rateBps}`);
  }
  return Math.floor((amount * rateBps + 5_000) / 10_000);
}

export interface PriceBreakdown {
  rent: MinorUnits;
  commission: MinorUnits;
  tenantFee: MinorUnits;
  cautionDeposit: MinorUnits;
  tenantTotal: MinorUnits;
  landlordPayout: MinorUnits;
}

/**
 * Price snapshot stored on a booking when it is created (Blueprint section 06).
 * Changing a commission rule later never affects a booking that already has a snapshot.
 */
export function priceBreakdown(input: {
  rent: MinorUnits;
  commissionBps: BasisPoints;
  tenantFeeBps?: BasisPoints;
  cautionDeposit?: MinorUnits;
}): PriceBreakdown {
  const tenantFeeBps = input.tenantFeeBps ?? 0;
  const cautionDeposit = input.cautionDeposit ?? 0;
  assertMinor(cautionDeposit, 'cautionDeposit');
  const commission = applyRate(input.rent, input.commissionBps);
  const tenantFee = applyRate(input.rent, tenantFeeBps);
  return {
    rent: input.rent,
    commission,
    tenantFee,
    cautionDeposit,
    tenantTotal: input.rent + tenantFee + cautionDeposit,
    landlordPayout: input.rent - commission,
  };
}
