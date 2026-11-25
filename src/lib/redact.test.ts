import { describe, expect, it } from 'vitest';
import { findContactDetails, redactContactDetails } from './redact';
import { normalisePhone, passwordStrength, signUpSchema } from './schemas';
import { parseSearchParams } from './search-params';

describe('contact detail detector (Blueprint 09)', () => {
  it.each([
    ['Call 0803 123 4567 for viewing', 'phone'],
    ['WhatsApp +234-803-123-4567', 'phone'],
    ['zero eight zero three one two three', 'phone'],
    ['email me: tunde.b@gmail.com', 'email'],
    ['tunde (at) gmail (dot) com', 'email'],
    ['see www.myflats.ng for more', 'url'],
    ['DM @lagos_homes on IG', 'handle'],
  ])('flags %j', (text, kind) => {
    expect(findContactDetails(text).map((m) => m.kind)).toContain(kind);
  });

  it('leaves an ordinary description alone', () => {
    const text = 'Bright 2-bedroom flat on the 2nd floor, 10 minutes from Unilag. Rent is paid yearly. 3 bathrooms, parking for 1 car.';
    expect(findContactDetails(text)).toEqual([]);
  });

  it('redacts what it finds', () => {
    expect(redactContactDetails('Call 08031234567 today')).toBe('Call [hidden]today');
  });
});

describe('phone normalisation', () => {
  it.each([
    ['0803 123 4567', '+2348031234567'],
    ['+234 803 123 4567', '+2348031234567'],
    ['2348031234567', '+2348031234567'],
  ])('%s -> %s', (input, out) => expect(normalisePhone(input)).toBe(out));

  it('rejects landlines and short numbers', () => {
    expect(normalisePhone('01 234 5678')).toBeNull();
    expect(normalisePhone('0803123')).toBeNull();
  });
});

describe('sign-up rules', () => {
  const base = {
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'Amaka@Example.com',
    phone: '0803 123 4567',
    password: 'Lekki-sunrise-42',
    confirm: 'Lekki-sunrise-42',
    intent: 'rent',
    terms: 'on',
  };

  it('accepts a good sign-up and normalises the phone and email', () => {
    const r = signUpSchema.safeParse(base);
    expect(r.success && r.data).toMatchObject({ phone: '+2348031234567', email: 'amaka@example.com' });
  });

  it.each([
    ['too short', 'abc12'],
    ['no number', 'onlyletters'],
    ['common', 'Password123'],
    ['contains the name', 'amaka2024!'],
    ['contains the phone', 'x8031234567'],
  ])('rejects a password that is %s', (_why, password) => {
    expect(signUpSchema.safeParse({ ...base, password, confirm: password }).success).toBe(false);
  });

  it('requires every detail: names, email, terms and a matching confirmation', () => {
    expect(signUpSchema.safeParse({ ...base, terms: undefined }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, lastName: '' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, email: '' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, confirm: 'Lekki-sunrise-43' }).success).toBe(false);
  });

  it('accepts short Nigerian numbers without the leading 0', () => {
    expect(normalisePhone('803 123 4567')).toBe('+2348031234567');
  });

  it('rates password strength for the meter', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('password1')).toBe(1);
    expect(passwordStrength('Harmattan-Breeze-2026')).toBe(4);
  });
});

describe('search params from the URL', () => {
  it('keeps valid filters and drops junk', () => {
    expect(parseSearchParams({ q: ' Yaba ', type: 'castle', minBeds: '-2', maxRent: '3000000', sort: 'price_asc', cursor: 'abc' })).toEqual({
      q: 'Yaba',
      city: undefined,
      type: undefined,
      minBeds: undefined,
      maxRent: 3_000_000,
      sort: 'price_asc',
      cursor: undefined,
    });
  });
});
