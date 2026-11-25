/**
 * Data shapes the web app receives from the SkyHaven API (`/v1`, Developer Blueprint section 08).
 * These are response DTOs, not database rows: they only carry what the caller is allowed to see.
 */
import type { BookingStatus, ListingStatus, MinorUnits, Role } from './domain';

export type Currency = 'NGN';

export const LISTING_TYPES = ['apartment', 'house', 'duplex', 'studio', 'room'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export type RentPeriod = 'year';

export interface Photo {
  key: string;
  url: string;
  alt: string;
}

export interface ListingFees {
  serviceCharge: MinorUnits;
  cautionDeposit: MinorUnits;
  legalFee: MinorUnits;
}

/** A check our reviewers completed (Blueprint section 04, reviewer checklist). Shown on verified listings. */
export interface VerificationCheck {
  key: 'ownership' | 'photos' | 'location' | 'price' | 'fees';
  label: string;
}

/** Card-sized listing used in search results, saved lists, bookings. */
export interface ListingSummary {
  id: string;
  slug: string;
  title: string;
  type: ListingType;
  bedrooms: number;
  bathrooms: number;
  rent: MinorUnits;
  rentPeriod: RentPeriod;
  currency: Currency;
  area: string;
  city: string;
  coverPhoto: Photo;
  verifiedAt: string | null;
  /** Demo data built from stock photos. Never present these as real homes. */
  isSample: boolean;
}

/** Public listing page. Never includes the street address or landlord contact details. */
export interface ListingDetail extends ListingSummary {
  description: string;
  photos: Photo[];
  fees: ListingFees;
  amenities: string[];
  furnished: boolean;
  availableFrom: string;
  checks: VerificationCheck[];
  landlordFirstName: string;
  landlordVerified: boolean;
  /** False once a tenant has paid (Reserved) or moved in (Rented). The page stays up so links don't break. */
  available: boolean;
}

export interface User {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  roles: Role[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
}

export interface SearchParams {
  q?: string;
  city?: string;
  type?: ListingType;
  minBeds?: number;
  /** Major units (naira), as typed by the user. */
  maxRent?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  cursor?: string;
}

export interface SearchResult {
  items: ListingSummary[];
  total: number;
  nextCursor: string | null;
}

// ---------- Tenant ----------

export const INSPECTION_STATUSES = ['requested', 'confirmed', 'done', 'no_show', 'cancelled'] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export interface Inspection {
  id: string;
  listing: ListingSummary;
  slotAt: string;
  status: InspectionStatus;
}

/** What the tenant pays. Commission and landlord payout are never sent to tenants. */
export interface TenantPrice {
  rent: MinorUnits;
  tenantFee: MinorUnits;
  cautionDeposit: MinorUnits;
  tenantTotal: MinorUnits;
}

export interface Dispute {
  reason: string;
  openedAt: string;
  status: 'open' | 'resolved';
}

export interface Booking {
  id: string;
  listing: ListingSummary;
  status: BookingStatus;
  moveInDate: string;
  price: TenantPrice;
  currency: Currency;
  createdAt: string;
  /** Set while `pending_payment`: the booking expires and frees the listing after this. */
  expiresAt: string | null;
  paidAt: string | null;
  releasedAt: string | null;
  /** Funds release on their own after this unless the tenant opens a dispute. */
  autoReleaseAt: string | null;
  /** Revealed only after payment succeeds (anti-bypass, Blueprint section 09). */
  address: string | null;
  landlordContact: { name: string; phone: string } | null;
  dispute: Dispute | null;
}

// ---------- Landlord ----------

export type KycStatus = 'not_started' | 'pending' | 'verified' | 'failed';

export interface PayoutAccount {
  bankName: string;
  accountLast4: string;
  accountName: string;
  verifiedAt: string;
}

export interface PolicyVersion {
  id: string;
  kind: 'landlord' | 'tenant' | 'privacy';
  version: number;
  title: string;
  bodyMd: string;
  publishedAt: string;
}

export interface LandlordProfile {
  kycStatus: KycStatus;
  payoutAccount: PayoutAccount | null;
  currentPolicy: PolicyVersion;
  acceptedPolicyVersionId: string | null;
}

export interface Bank {
  code: string;
  name: string;
}

export interface StatusChange {
  from: ListingStatus | null;
  to: ListingStatus;
  at: string;
  reason: string | null;
}

/** The landlord's own view of a listing, including status and payout preview. */
export interface OwnListing extends ListingDetail {
  status: ListingStatus;
  address: string;
  updatedAt: string;
  history: StatusChange[];
  /** Reviewer notes when changes were requested or the listing was rejected. */
  reviewNote: string | null;
  /** What the landlord receives for one rental at the current rent and commission rule. */
  payoutPreview: { commission: MinorUnits; landlordPayout: MinorUnits };
  documents: { kind: OwnershipDocKind; fileName: string }[];
}

export const OWNERSHIP_DOC_KINDS = ['title_deed', 'certificate_of_occupancy', 'mandate_letter', 'other'] as const;
export type OwnershipDocKind = (typeof OWNERSHIP_DOC_KINDS)[number];

export interface LandlordMoney {
  /** Paid by tenants and held until move-in. */
  held: MinorUnits;
  /** Released after move-in, waiting for the next payout batch. */
  payable: MinorUnits;
  paidOut: MinorUnits;
  currency: Currency;
  recent: {
    bookingId: string;
    listingTitle: string;
    tenantFirstName: string;
    moveInDate: string;
    status: BookingStatus;
    landlordPayout: MinorUnits;
  }[];
}
