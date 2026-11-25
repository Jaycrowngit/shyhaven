import { z } from 'zod';
import { LISTING_TYPES, OWNERSHIP_DOC_KINDS } from './types';

/** Nigerian mobile numbers in local (0803…), short (803…) or international (+234…) form, normalised to +234. */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[\s().-]/g, '');
  if (/^\+234[789][01]\d{8}$/.test(digits)) return digits;
  if (/^234[789][01]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^0[789][01]\d{8}$/.test(digits)) return `+234${digits.slice(1)}`;
  if (/^[789][01]\d{8}$/.test(digits)) return `+234${digits}`;
  return null;
}

/** "+2348031234567" → "+234 803 ••• 4567"; "amaka@gmail.com" → "a•••a@gmail.com". For showing where a code went. */
export function maskDestination(destination: string): string {
  if (destination.includes('@')) {
    const [user, domain] = destination.split('@');
    return `${user[0]}•••${user.length > 1 ? user[user.length - 1] : ''}@${domain}`;
  }
  return `${destination.slice(0, 4)} ${destination.slice(4, 7)} ••• ${destination.slice(-4)}`;
}

/** Phone number or email, as typed on the sign-in and forgot-password forms. */
const identifier = z
  .string()
  .trim()
  .min(1, 'Enter your phone number or email')
  .transform((v, ctx) => {
    if (v.includes('@')) {
      const email = z.email().safeParse(v.toLowerCase());
      if (email.success) return { channel: 'email' as const, destination: email.data };
      ctx.addIssue({ code: 'custom', message: 'That email address doesn’t look right' });
      return z.NEVER;
    }
    const phone = normalisePhone(v);
    if (phone) return { channel: 'phone' as const, destination: phone };
    ctx.addIssue({ code: 'custom', message: 'Enter a Nigerian mobile number, like 0803 123 4567' });
    return z.NEVER;
  });

export const otpRequestSchema = z.object({ destination: identifier });

const code = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code');

export const otpVerifySchema = z.object({ destination: z.string().min(3), code });

// ---------- Passwords ----------

/**
 * Most-used passwords in Nigerian and global breach lists. Rejected outright; the API keeps the full list.
 * Rules follow NIST SP 800-63B: length over complexity, block known-bad passwords, no forced rotation.
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', '12345678', '123456789', '1234567890', '11111111', '00000000', '12341234',
  'qwerty123', 'qwertyuiop', 'abc12345', 'abcd1234', 'iloveyou', 'iloveyou1', 'princess', 'football', 'baseball', 'welcome1',
  'sunshine', 'letmein1', 'admin123', 'blessing', 'blessing1', 'jesus123', 'godisgood', 'success1', 'nigeria1', 'nigeria123',
  'naija123', 'lagos123', 'abuja123', 'skyhaven', 'skyhaven1', 'skyhaven123', 'chelsea1', 'arsenal1', 'manutd123', 'liverpool',
]);

export const PASSWORD_MIN = 8;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(128, 'Use 128 characters or fewer')
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Use at least one letter and one number')
  .refine((p) => !COMMON_PASSWORDS.has(p.toLowerCase()), 'That password is too common. Choose something harder to guess');

/** 0–4, for the strength meter only. The schema above is what actually decides. */
export function passwordStrength(p: string): 0 | 1 | 2 | 3 | 4 {
  if (!p) return 0;
  if (p.length < PASSWORD_MIN || COMMON_PASSWORDS.has(p.toLowerCase())) return 1;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
  if (p.length >= 14 && kinds >= 3) return 4;
  if (p.length >= 10 && kinds >= 2) return 3;
  return kinds >= 2 ? 2 : 1;
}

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Enter your first name').max(40),
    lastName: z.string().trim().min(1, 'Enter your last name').max(40),
    email: z.string().trim().toLowerCase().min(1, 'Enter your email address').pipe(z.email('That email address doesn’t look right')),
    phone: z
      .string()
      .trim()
      .min(1, 'Enter your phone number')
      .transform((v, ctx) => normalisePhone(v) ?? (ctx.addIssue({ code: 'custom', message: 'Enter a Nigerian mobile number, like 0803 123 4567' }), z.NEVER)),
    password: passwordSchema,
    confirm: z.string().min(1, 'Confirm your password'),
    intent: z.enum(['rent', 'list']),
    terms: z.literal('on', { error: 'Please accept the terms to continue' }),
  })
  .superRefine((v, ctx) => {
    if (v.confirm !== v.password) ctx.addIssue({ code: 'custom', path: ['confirm'], message: 'The passwords don’t match' });
    const lower = v.password.toLowerCase();
    const parts = [v.phone.slice(-10), v.email.split('@')[0], v.firstName.toLowerCase(), v.lastName.toLowerCase()].filter((s) => s.length >= 3);
    if (parts.some((s) => lower.includes(s))) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Don’t use your name, phone number or email in your password' });
    }
  });

export const signInSchema = z.object({
  identifier,
  password: z.string().min(1, 'Enter your password').max(128),
});

export const codeSchema = z.object({ code });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'The passwords don’t match' });

export const forgotPasswordSchema = z.object({ identifier });

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
});

const naira = (label: string, { min = 0, max = 1_000_000_000 } = {}) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole naira amount`)
    .min(min, `${label} must be at least ₦${min.toLocaleString('en-NG')}`)
    .max(max, `${label} is too high`);

/** A listing as the landlord fills it in. Money is in whole naira here and converted to kobo on the server. */
export const listingDraftSchema = z.object({
  title: z.string().trim().min(10, 'Use at least 10 characters').max(90),
  type: z.enum(LISTING_TYPES),
  bedrooms: z.coerce.number().int().min(0).max(12),
  bathrooms: z.coerce.number().int().min(1).max(12),
  furnished: z.boolean(),
  description: z.string().trim().min(80, 'Describe the home in at least 80 characters').max(4000),
  amenities: z.array(z.string().max(40)).max(20),
  city: z.string().trim().min(2).max(60),
  area: z.string().trim().min(2, 'Enter the area or neighbourhood').max(60),
  address: z.string().trim().min(8, 'Enter the street address').max(160),
  rent: naira('Annual rent', { min: 50_000 }),
  serviceCharge: naira('Service charge'),
  cautionDeposit: naira('Caution deposit'),
  legalFee: naira('Legal fee'),
  availableFrom: z.iso.date('Pick the date the home is available'),
  photoKeys: z.array(z.string()).min(5, 'Add at least 5 photos').max(30),
  documents: z
    .array(z.object({ kind: z.enum(OWNERSHIP_DOC_KINDS), fileName: z.string().min(1).max(200) }))
    .min(1, 'Add a document that proves you own the home or may let it'),
});

export type ListingDraftInput = z.infer<typeof listingDraftSchema>;

export const bookingSchema = z.object({
  listingId: z.string().min(1),
  moveInDate: z.iso.date('Pick a move-in date'),
});

export const disputeSchema = z.object({
  reason: z.string().trim().min(20, 'Tell us what went wrong in at least 20 characters').max(2000),
});

export const payoutAccountSchema = z.object({
  bankCode: z.string().min(3, 'Choose your bank'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Account numbers have 10 digits'),
});

export const inspectionSchema = z.object({
  listingId: z.string().min(1),
  slotAt: z.iso.datetime({ error: 'Choose a time slot' }),
});

/** Flattens zod issues to `{ field: firstMessage }` for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    out[key] ??= issue.message;
  }
  return out;
}
