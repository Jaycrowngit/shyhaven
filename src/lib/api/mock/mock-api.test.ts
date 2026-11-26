import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListingDraftInput } from '../../schemas';
import { ApiError } from '../errors';
import { mockApi as api, sandbox } from './index';

/**
 * Drives the in-memory API through the flows in the Developer Blueprint, so the web app is built against the same
 * rules the NestJS API must enforce. Only the Find a Home listings are seeded; every test creates its own users.
 */

const START = new Date('2026-11-25T09:00:00Z');
const YABA = 'bright-2-bedroom-flat-near-unilag';
const OGBA = '2-bedroom-flat-in-ogba';

const PASSWORD = 'Lekki-sunrise-42';

/** Creates an account through the real sign-up flow and returns its access token. */
async function signUp(phone: string, name = 'Test User', extra: { email?: string; intent?: 'rent' | 'list' } = {}) {
  const { signupId, devCode } = await api.startSignup({ name, phone, password: PASSWORD, intent: 'rent', ...extra });
  const res = await api.completeSignup({ signupId, code: devCode! });
  return res.accessToken;
}
const signIn = signUp;
/** Moves the clock past the 60-second resend cooldown. */
const passCooldown = () => vi.setSystemTime(Date.now() + 61_000);

/** A landlord who has finished setup: identity, payout account, current policy. */
async function readyLandlord(phone: string, name = 'Ngozi Okafor') {
  const token = await signIn(phone, name);
  await api.becomeLandlord(token);
  await api.startKyc(token);
  await api.savePayoutAccount(token, { bankCode: '058', accountNumber: '0123456789' });
  await api.acceptPolicy(token, (await api.currentPolicy('landlord')).id);
  return token;
}

async function bookAndPay(token: string, slug: string, key = 'k') {
  const listing = (await api.getListing(slug))!;
  const booking = await api.createBooking(token, { listingId: listing.id, moveInDate: listing.availableFrom });
  const { reference } = await api.initPayment(token, booking.id, key);
  sandbox.completePayment(reference, 'success');
  return { listing, booking: await api.getBooking(token, booking.id) };
}

const draft = (over: Partial<ListingDraftInput> = {}): ListingDraftInput => ({
  title: 'Two-bedroom flat in Surulere',
  type: 'apartment',
  bedrooms: 2,
  bathrooms: 2,
  furnished: false,
  description: 'A bright, quiet flat on the second floor, close to shops and transport, with a separate kitchen and a balcony.',
  amenities: ['Parking'],
  city: 'Lagos',
  area: 'Surulere',
  address: '1 Test Street, Surulere',
  rent: 2_000_000,
  serviceCharge: 100_000,
  cautionDeposit: 200_000,
  legalFee: 100_000,
  availableFrom: '2026-12-01',
  photoKeys: ['sample/house-08', 'sample/kitchen-01', 'sample/kitchen-02', 'sample/bedroom-01', 'sample/bedroom-02'],
  documents: [{ kind: 'certificate_of_occupancy', fileName: 'cofo.pdf' }],
  ...over,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(START);
  globalThis.__skyhavenMockDb = undefined;
});
afterEach(() => vi.useRealTimers());

describe('seed data', () => {
  it('holds only published Find a Home listings and no demo accounts', async () => {
    const all = await api.searchListings({});
    expect(all.total).toBe(16);
    expect(await api.cities()).toEqual(['Abuja', 'Enugu', 'Ibadan', 'Lagos', 'Port Harcourt']);
    // Nobody can sign in as a listing owner: they have no phone or email.
    const token = await signIn('+2348031234567');
    expect(await api.myBookings(token)).toEqual([]);
    expect(await api.savedListings(token)).toEqual([]);
    expect(await api.myInspections(token)).toEqual([]);
  });

  it('finds homes by area and city', async () => {
    expect((await api.searchListings({ q: 'rumuokoro port harcourt' })).total).toBe(1);
    expect((await api.searchListings({ city: 'Abuja' })).items.every((l) => l.city === 'Abuja')).toBe(true);
  });
});

describe('sign-up', () => {
  const phone = '+2348031234567';
  const wrong = (code: string) => (code === '000000' ? '111111' : '000000');

  it('creates nothing until the phone is verified, then signs the user in', async () => {
    const { signupId, devCode, sentTo } = await api.startSignup({ name: 'Amaka Obi', phone, password: PASSWORD, intent: 'rent' });
    expect(sentTo).toBe('+234 803 ••• 4567');
    await expect(api.login({ identifier: phone, password: PASSWORD })).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(api.completeSignup({ signupId, code: wrong(devCode!) })).rejects.toThrow(ApiError);
    const { user } = await api.completeSignup({ signupId, code: devCode! });
    expect(user).toMatchObject({ name: 'Amaka Obi', phone, roles: ['tenant'] });
    await expect(api.completeSignup({ signupId, code: devCode! })).rejects.toMatchObject({ code: 'not_found' }); // single use
  });

  it('gives landlords the landlord role straight away', async () => {
    const token = await signUp(phone, 'Tunde Bakare', { intent: 'list' });
    expect((await api.me(token)).roles).toEqual(['tenant', 'landlord']);
  });

  it('only reveals that a number is registered after the code proves it is theirs', async () => {
    await signUp(phone);
    passCooldown();
    // Starting a sign-up for a registered number looks exactly like a new one...
    const again = await api.startSignup({ name: 'Someone Else', phone, password: 'Another-pass-9', intent: 'rent' });
    expect(again.sentTo).toBe('+234 803 ••• 4567');
    // ...and only the person holding the phone learns it already has an account.
    await expect(api.completeSignup({ signupId: again.signupId, code: again.devCode! })).rejects.toMatchObject({ code: 'conflict' });
  });

  it('locks out a sign-up after 5 wrong codes', async () => {
    const { signupId, devCode } = await api.startSignup({ name: 'Amaka Obi', phone, password: PASSWORD, intent: 'rent' });
    for (let i = 0; i < 5; i++) await expect(api.completeSignup({ signupId, code: wrong(devCode!) })).rejects.toMatchObject({ code: 'validation' });
    await expect(api.completeSignup({ signupId, code: devCode! })).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('enforces a 60-second wait between codes', async () => {
    const { signupId } = await api.startSignup({ name: 'Amaka Obi', phone, password: PASSWORD, intent: 'rent' });
    await expect(api.resendSignupCode(signupId)).rejects.toMatchObject({ code: 'rate_limited' });
    passCooldown();
    const res = await api.resendSignupCode(signupId);
    expect(res.resendIn).toBe(60);
  });

  it('rejects weak passwords even if the form is bypassed', async () => {
    await expect(api.startSignup({ name: 'Amaka Obi', phone, password: 'short', intent: 'rent' })).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('sign-in', () => {
  const phone = '+2348031234567';

  it('accepts phone or email with the right password', async () => {
    await signUp(phone, 'Amaka Obi', { email: 'amaka@example.com' });
    expect((await api.login({ identifier: phone, password: PASSWORD })).user.name).toBe('Amaka Obi');
    expect((await api.login({ identifier: 'AMAKA@example.com', password: PASSWORD })).user.name).toBe('Amaka Obi');
  });

  it('gives the same error for an unknown account and a wrong password', async () => {
    await signUp(phone);
    const unknown = await api.login({ identifier: '+2348099999999', password: PASSWORD }).catch((e: ApiError) => e);
    const wrongPw = (await api.login({ identifier: phone, password: 'Wrong-pass-1' }).catch((e: ApiError) => e)) as ApiError;
    expect(unknown).toMatchObject({ code: 'unauthorized', message: wrongPw.message });
  });

  it('pauses sign-in for 15 minutes after 5 failures, even with the right password', async () => {
    await signUp(phone);
    for (let i = 0; i < 5; i++) await expect(api.login({ identifier: phone, password: 'Wrong-pass-1' })).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(api.login({ identifier: phone, password: PASSWORD })).rejects.toMatchObject({ code: 'rate_limited' });
    vi.setSystemTime(Date.now() + 15 * 60_000 + 1000);
    expect((await api.login({ identifier: phone, password: PASSWORD })).user.phone).toBe(phone);
  });

  it('signs in with a one-time code, but only for existing accounts', async () => {
    const { devCode } = await api.requestOtp({ channel: 'phone', destination: phone });
    await expect(api.verifyOtp({ destination: phone, code: devCode! })).rejects.toMatchObject({ code: 'not_found' });
    await signUp(phone);
    passCooldown();
    const again = await api.requestOtp({ channel: 'phone', destination: phone });
    expect((await api.verifyOtp({ destination: phone, code: again.devCode! })).user.phone).toBe(phone);
  });

  it('rotates refresh tokens: each one works only once', async () => {
    await signUp(phone);
    const { refreshToken } = await api.login({ identifier: phone, password: PASSWORD });
    await api.refresh(refreshToken);
    await expect(api.refresh(refreshToken)).rejects.toMatchObject({ code: 'unauthorized' });
  });
});

describe('forgot password', () => {
  const phone = '+2348031234567';

  async function reset(identifier: string, password: string) {
    const { resetId, devCode } = await api.requestPasswordReset({ identifier });
    const { resetToken } = await api.verifyPasswordReset({ resetId, code: devCode! });
    return api.completePasswordReset({ resetToken, password });
  }

  it('answers the same way whether or not the account exists', async () => {
    await signUp(phone);
    const known = await api.requestPasswordReset({ identifier: phone });
    const unknown = await api.requestPasswordReset({ identifier: '+2348099999999' });
    expect(Object.keys(known).sort()).toEqual(Object.keys(unknown).sort());
    expect(unknown.sentTo).toBe('+234 809 ••• 9999');
  });

  it('sets the new password, signs out every other session and clears lockouts', async () => {
    const oldSession = await signUp(phone);
    for (let i = 0; i < 5; i++) await api.login({ identifier: phone, password: 'Wrong-pass-1' }).catch(() => undefined);
    const { accessToken } = await reset(phone, 'New-harmattan-77');
    await expect(api.me(oldSession)).rejects.toMatchObject({ code: 'unauthorized' });
    expect((await api.me(accessToken)).phone).toBe(phone);
    await expect(api.login({ identifier: phone, password: PASSWORD })).rejects.toMatchObject({ code: 'unauthorized' });
    expect((await api.login({ identifier: phone, password: 'New-harmattan-77' })).user.phone).toBe(phone);
  });

  it('uses each reset token once', async () => {
    await signUp(phone);
    const { resetId, devCode } = await api.requestPasswordReset({ identifier: phone });
    const { resetToken } = await api.verifyPasswordReset({ resetId, code: devCode! });
    await api.completePasswordReset({ resetToken, password: 'New-harmattan-77' });
    await expect(api.completePasswordReset({ resetToken, password: 'Another-one-88' })).rejects.toMatchObject({ code: 'not_found' });
  });

  it('cannot reset an account that does not exist', async () => {
    await expect(reset('+2348099999999', 'New-harmattan-77')).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('renter: book, pay, move in (Blueprint 05 and 06)', () => {
  it('runs end to end, reserves the listing and keeps the ledger balanced', async () => {
    const renter = await signIn('+2348031234567', 'Amaka Obi');
    const listing = (await api.getListing(YABA))!;
    expect(listing.available).toBe(true);

    const booking = await api.createBooking(renter, { listingId: listing.id, moveInDate: listing.availableFrom });
    expect(booking.status).toBe('pending_payment');
    // Renters see what they pay, never the commission.
    expect(booking.price).toEqual({ rent: 55_000_000, tenantFee: 0, cautionDeposit: 5_500_000, tenantTotal: 60_500_000 });
    expect(booking.address).toBeNull();
    expect(booking.landlordContact).toBeNull();

    const first = await api.initPayment(renter, booking.id, 'key-1');
    expect(await api.initPayment(renter, booking.id, 'key-1')).toEqual(first); // idempotent

    sandbox.completePayment(first.reference, 'success');
    sandbox.completePayment(first.reference, 'success'); // duplicate webhook is ignored
    const paid = await api.getBooking(renter, booking.id);
    expect(paid.status).toBe('paid_held');
    expect(paid.address).toBe('14 Herbert Macaulay Way, Yaba');
    expect(paid.landlordContact?.name).toBe('Tunde Bakare');
    expect((await api.searchListings({ q: 'unilag' })).total).toBe(0); // Reserved is hidden from search

    const released = await api.confirmMoveIn(renter, booking.id);
    expect(released.status).toBe('released');
    expect((await api.getListing(YABA))?.available).toBe(false); // rented
    expect(sandbox.ledgerIsBalanced()).toBe(true);
  });

  it('pays the landlord rent minus commission, plus the caution deposit', async () => {
    const landlord = await readyLandlord('+2348099999999');
    const listing = await api.createListing(landlord, draft());
    await api.submitListing(landlord, listing.id);
    sandbox.review(listing.id, 'approve');

    const renter = await signIn('+2348031234567');
    const { booking } = await bookAndPay(renter, listing.slug);
    expect((await api.landlordMoney(landlord)).held).toBe(180_000_000 + 20_000_000);
    await api.confirmMoveIn(renter, booking.id);
    const money = await api.landlordMoney(landlord);
    expect(money.held).toBe(0);
    expect(money.payable).toBe(180_000_000 + 20_000_000); // 10% illustrative commission on ₦2m, plus deposit
    expect(sandbox.ledgerIsBalanced()).toBe(true);
  });

  it('expires an unpaid booking after 30 minutes', async () => {
    const renter = await signIn('+2348031234567');
    const listing = (await api.getListing(OGBA))!;
    const booking = await api.createBooking(renter, { listingId: listing.id, moveInDate: listing.availableFrom });
    vi.setSystemTime(START.getTime() + 31 * 60_000);
    expect((await api.getBooking(renter, booking.id)).status).toBe('expired');
    await expect(api.initPayment(renter, booking.id, 'k')).rejects.toThrow(/expired/);
  });

  it('refunds a second renter whose payment lands after the home was reserved', async () => {
    const a = await signIn('+2348031234567');
    const b = await signIn('+2348051234567');
    const listing = (await api.getListing(OGBA))!;
    const ba = await api.createBooking(a, { listingId: listing.id, moveInDate: listing.availableFrom });
    const bb = await api.createBooking(b, { listingId: listing.id, moveInDate: listing.availableFrom });
    const pa = await api.initPayment(a, ba.id, 'a');
    const pb = await api.initPayment(b, bb.id, 'b');
    sandbox.completePayment(pa.reference, 'success');
    sandbox.completePayment(pb.reference, 'success');
    expect((await api.getBooking(a, ba.id)).status).toBe('paid_held');
    expect((await api.getBooking(b, bb.id)).status).toBe('refunded');
    expect(sandbox.ledgerIsBalanced()).toBe(true);
  });

  it('auto-releases 72 hours after move-in unless there is a dispute', async () => {
    const renter = await signIn('+2348031234567');
    const { booking } = await bookAndPay(renter, OGBA);
    vi.setSystemTime(Date.parse(booking.autoReleaseAt!) + 1000);
    expect((await api.getBooking(renter, booking.id)).status).toBe('released');
  });

  it('a dispute freezes the auto-release', async () => {
    const renter = await signIn('+2348031234567');
    const { booking } = await bookAndPay(renter, OGBA);
    await api.openDispute(renter, booking.id, { reason: 'The second bedroom has no window, unlike the photos.' });
    vi.setSystemTime(Date.parse(booking.autoReleaseAt!) + 1000);
    expect((await api.getBooking(renter, booking.id)).status).toBe('disputed');
  });

  it('never lets one renter read another renter’s booking', async () => {
    const a = await signIn('+2348031234567');
    const b = await signIn('+2348051234567');
    const { booking } = await bookAndPay(a, OGBA);
    await expect(api.getBooking(b, booking.id)).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('landlord: listing lifecycle (Blueprint 04)', () => {
  it('blocks submit until KYC, payout account and current policy are done', async () => {
    const token = await signIn('+2348099999999', 'Ngozi Okafor');
    await api.becomeLandlord(token);
    const listing = await api.createListing(token, draft());
    expect(listing.status).toBe('draft');

    await expect(api.submitListing(token, listing.id)).rejects.toThrow(/identity/);
    await api.startKyc(token);
    await expect(api.submitListing(token, listing.id)).rejects.toThrow(/payout/);
    await api.savePayoutAccount(token, { bankCode: '058', accountNumber: '0123456789' });
    await expect(api.submitListing(token, listing.id)).rejects.toThrow(/policy/);
    await api.acceptPolicy(token, (await api.currentPolicy('landlord')).id);

    const submitted = await api.submitListing(token, listing.id);
    expect(submitted.status).toBe('submitted');
    expect(submitted.history[0]).toMatchObject({ from: 'draft', to: 'submitted' });
  });

  it('limits new accounts to 3 submitted listings in 14 days (Blueprint 09)', async () => {
    const token = await readyLandlord('+2348099999998', 'Bola Ade');
    for (let i = 0; i < 3; i++) await api.submitListing(token, (await api.createListing(token, draft())).id);
    const fourth = await api.createListing(token, draft());
    await expect(api.submitListing(token, fourth.id)).rejects.toThrow(/3 listings/);
  });

  it('publishes on approval and sends material edits back to review', async () => {
    const token = await readyLandlord('+2348099999999');
    const listing = await api.createListing(token, draft());
    await api.submitListing(token, listing.id);
    sandbox.review(listing.id, 'approve');
    const live = await api.myListing(token, listing.id);
    expect(live.status).toBe('published');
    expect((await api.getListing(live.slug))?.verifiedAt).toBeTruthy();

    const textOnly = await api.updateListing(token, listing.id, draft({ title: 'Two-bedroom flat in Surulere, newly painted' }));
    expect(textOnly.status).toBe('published');
    const priceChange = await api.updateListing(token, listing.id, draft({ rent: 2_400_000 }));
    expect(priceChange.status).toBe('submitted');
  });

  it('rejects transitions the state machine does not allow', async () => {
    const token = await readyLandlord('+2348099999999');
    const listing = await api.createListing(token, draft());
    await expect(api.setListingPaused(token, listing.id, true)).rejects.toMatchObject({ code: 'conflict' });
  });

  it('never exposes another landlord’s listing', async () => {
    const token = await readyLandlord('+2348099999999');
    await expect(api.myListing(token, 'l_yaba')).rejects.toMatchObject({ code: 'not_found' });
  });
});
