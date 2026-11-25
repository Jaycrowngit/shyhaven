import type { ListingDraftInput } from '../schemas';
import type {
  AuthTokens,
  Bank,
  Booking,
  Inspection,
  LandlordMoney,
  LandlordProfile,
  ListingDetail,
  ListingSummary,
  OwnListing,
  PayoutAccount,
  PolicyVersion,
  SearchParams,
  SearchResult,
  User,
} from '../types';

export interface SignupInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  intent: 'rent' | 'list';
}

/** Where a code was sent, masked. `devCode` is only present against the in-memory API, where no SMS is sent. */
export interface CodeSent {
  sentTo: string;
  /** Seconds before another code can be requested. */
  resendIn: number;
  devCode?: string;
}

/**
 * The SkyHaven API as the web app uses it. One method per `/v1` route in the Developer Blueprint (section 08),
 * so the `http` adapter is a thin mapping and the `mock` adapter can stand in until the NestJS modules land.
 *
 * Methods that need a signed-in user take the access token first. Every method throws `ApiError` on failure.
 */
export interface SkyHavenApi {
  // Sign-up: POST /auth/signup, /auth/signup/verify, /auth/signup/resend.
  // Nothing is created until the phone number is proven with the code; "number already registered" is only
  // revealed after that, so the form can't be used to find out who has an account.
  startSignup(input: SignupInput): Promise<CodeSent & { signupId: string }>;
  resendSignupCode(signupId: string): Promise<CodeSent>;
  completeSignup(input: { signupId: string; code: string }): Promise<AuthTokens & { user: User }>;

  // Password sign-in: POST /auth/login. Wrong identifier and wrong password give the same error; repeated
  // failures lock the identifier for 15 minutes.
  login(input: { identifier: string; password: string }): Promise<AuthTokens & { user: User }>;

  // Forgot password: POST /auth/password/forgot, /auth/password/verify, /auth/password/reset.
  // `forgot` answers the same way whether or not an account exists. A successful reset signs out every session.
  requestPasswordReset(input: { identifier: string }): Promise<CodeSent & { resetId: string }>;
  verifyPasswordReset(input: { resetId: string; code: string }): Promise<{ resetToken: string }>;
  completePasswordReset(input: { resetToken: string; password: string }): Promise<AuthTokens & { user: User }>;

  // One-time-code sign-in for existing accounts: POST /auth/otp/request, /auth/otp/verify; /auth/refresh; GET /me
  requestOtp(input: { channel: 'phone' | 'email'; destination: string }): Promise<{ sentTo: string; devCode?: string }>;
  verifyOtp(input: { destination: string; code: string }): Promise<AuthTokens & { user: User }>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(token: string): Promise<void>;
  me(token: string): Promise<User>;
  updateProfile(token: string, input: { name: string }): Promise<User>;

  // Public: GET /search/listings, GET /listings/:slug, GET /listings/:id/inspection-slots
  searchListings(params: SearchParams): Promise<SearchResult>;
  getListing(slug: string): Promise<ListingDetail | null>;
  inspectionSlots(listingId: string): Promise<string[]>;
  cities(): Promise<string[]>;

  // Tenant
  savedListings(token: string): Promise<ListingSummary[]>;
  setSaved(token: string, listingId: string, saved: boolean): Promise<void>;
  requestInspection(token: string, input: { listingId: string; slotAt: string }): Promise<Inspection>;
  myInspections(token: string): Promise<Inspection[]>;
  createBooking(token: string, input: { listingId: string; moveInDate: string }): Promise<Booking>;
  /** POST /payments/init. The API computes the amount from the booking snapshot; the client never sends one. */
  initPayment(token: string, bookingId: string, idempotencyKey: string): Promise<{ checkoutUrl: string; reference: string }>;
  /** Called when the gateway redirects back. Asks the API to verify server-to-server; never trusts the redirect. */
  verifyPayment(token: string, reference: string): Promise<Booking>;
  myBookings(token: string): Promise<Booking[]>;
  getBooking(token: string, bookingId: string): Promise<Booking>;
  confirmMoveIn(token: string, bookingId: string): Promise<Booking>;
  openDispute(token: string, bookingId: string, input: { reason: string }): Promise<Booking>;

  // Landlord
  becomeLandlord(token: string): Promise<User>;
  landlordProfile(token: string): Promise<LandlordProfile>;
  startKyc(token: string): Promise<{ status: LandlordProfile['kycStatus']; verificationUrl: string | null }>;
  banks(): Promise<Bank[]>;
  savePayoutAccount(token: string, input: { bankCode: string; accountNumber: string }): Promise<PayoutAccount>;
  currentPolicy(kind: PolicyVersion['kind']): Promise<PolicyVersion>;
  acceptPolicy(token: string, policyVersionId: string): Promise<void>;
  myListings(token: string): Promise<OwnListing[]>;
  myListing(token: string, listingId: string): Promise<OwnListing>;
  /** POST /listings with the draft, then the landlord submits separately (guards apply on submit). */
  createListing(token: string, input: ListingDraftInput): Promise<OwnListing>;
  updateListing(token: string, listingId: string, input: ListingDraftInput): Promise<OwnListing>;
  submitListing(token: string, listingId: string): Promise<OwnListing>;
  setListingPaused(token: string, listingId: string, paused: boolean): Promise<OwnListing>;
  landlordMoney(token: string): Promise<LandlordMoney>;
}
