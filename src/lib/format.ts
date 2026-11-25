import type { BookingStatus, ListingStatus, MinorUnits } from './domain';
import type { Currency, InspectionStatus, ListingType } from './types';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Formats minor units for display only. Never do money maths on the result. */
export function formatMoney(amount: MinorUnits, currency: Currency = 'NGN', opts: { kobo?: boolean } = {}): string {
  const key = `${currency}:${opts.kobo ? 2 : 0}`;
  let f = moneyFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: opts.kobo ? 2 : 0,
      maximumFractionDigits: opts.kobo ? 2 : 0,
    });
    moneyFormatters.set(key, f);
  }
  return f.format(amount / 100);
}

/** Converts a whole-naira amount typed by a user into kobo, rejecting anything that isn't a safe integer. */
export function nairaToMinor(naira: number): MinorUnits {
  const minor = Math.round(naira * 100);
  if (!Number.isSafeInteger(minor) || minor < 0) throw new RangeError('Amount out of range');
  return minor;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Africa/Lagos',
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  apartment: 'Flat',
  house: 'House',
  duplex: 'Duplex',
  studio: 'Self-contain',
  room: 'Room',
};

export function bedsLabel(bedrooms: number, type: ListingType): string {
  if (type === 'studio') return 'Self-contain';
  return `${bedrooms} bed${bedrooms === 1 ? '' : 's'}`;
}

type Tone = 'neutral' | 'info' | 'verified' | 'warning' | 'danger';

export const LISTING_STATUS_UI: Record<ListingStatus, { label: string; tone: Tone; hint: string }> = {
  draft: { label: 'Draft', tone: 'neutral', hint: 'Only you can see this. Submit it when it is ready.' },
  submitted: { label: 'Waiting for review', tone: 'info', hint: 'Our team reviews new listings within 24 hours.' },
  in_review: { label: 'In review', tone: 'info', hint: 'A reviewer is checking your listing now.' },
  changes_requested: { label: 'Changes needed', tone: 'warning', hint: 'Fix the points below and resubmit.' },
  rejected: { label: 'Not approved', tone: 'danger', hint: 'This listing cannot be published.' },
  published: { label: 'Live', tone: 'verified', hint: 'Verified and visible to tenants.' },
  paused: { label: 'Paused', tone: 'neutral', hint: 'Hidden from search until you resume it.' },
  reserved: { label: 'Reserved', tone: 'info', hint: 'A tenant has paid. Rent is held until they move in.' },
  rented: { label: 'Rented', tone: 'verified', hint: 'The tenant moved in and rent was released.' },
  archived: { label: 'Archived', tone: 'neutral', hint: 'No longer active.' },
};

export const BOOKING_STATUS_UI: Record<BookingStatus, { label: string; tone: Tone }> = {
  pending_payment: { label: 'Awaiting payment', tone: 'warning' },
  paid_held: { label: 'Paid · held safely', tone: 'verified' },
  disputed: { label: 'Under review', tone: 'danger' },
  released: { label: 'Moved in', tone: 'verified' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const INSPECTION_STATUS_UI: Record<InspectionStatus, { label: string; tone: Tone }> = {
  requested: { label: 'Requested', tone: 'info' },
  confirmed: { label: 'Confirmed', tone: 'verified' },
  done: { label: 'Done', tone: 'neutral' },
  no_show: { label: 'Missed', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export type { Tone };
