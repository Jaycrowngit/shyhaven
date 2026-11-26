'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, isApiError } from '@/lib/api';
import type { CodeSent } from '@/lib/api/contract';
import type { FormState } from '@/lib/form-state';
import {
  codeSchema,
  fieldErrors,
  forgotPasswordSchema,
  newPasswordSchema,
  otpRequestSchema,
  otpVerifySchema,
  signInSchema,
  signUpSchema,
} from '@/lib/schemas';
import { clearSession, cookieOptions, getAccessToken, safeNext, setSession } from '@/lib/session';

const message = (e: unknown, fallback: string) => (isApiError(e) ? e.message : fallback);

export interface CodeStep extends FormState {
  sentTo?: string;
  resendIn?: number;
}

// ---------------------------------------------------------------- Sign up

export interface SignUpState extends CodeStep {
  step: 'details' | 'verify';
  signupId?: string;
  /** Echoed back so the form keeps what was typed. Never includes the password. */
  values?: { firstName?: string; lastName?: string; phone?: string; email?: string; intent?: string; terms?: boolean };
}

export async function signUpAction(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const text = (k: string) => String(formData.get(k) ?? '');
  const raw = {
    firstName: text('firstName'),
    lastName: text('lastName'),
    phone: text('phone'),
    email: text('email'),
    password: text('password'),
    confirm: text('confirm'),
    intent: text('intent') || 'rent',
    terms: formData.get('terms') ?? undefined,
  };
  const values = { firstName: raw.firstName, lastName: raw.lastName, phone: raw.phone, email: raw.email, intent: raw.intent, terms: raw.terms === 'on' };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { step: 'details', values, fields: fieldErrors(parsed.error) };
  const { firstName, lastName, phone, email, password, intent } = parsed.data;
  const input = { name: `${firstName} ${lastName}`, phone, email, password, intent };
  try {
    const res = await api.startSignup(input);
    return { step: 'verify', values, signupId: res.signupId, sentTo: res.sentTo, resendIn: res.resendIn };
  } catch (e) {
    return { step: 'details', values, error: message(e, 'We couldn’t send your code. Please try again.'), fields: isApiError(e) ? e.fields : undefined };
  }
}

export async function verifySignUpAction(prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = codeSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) return { ...prev, error: undefined, fields: fieldErrors(parsed.error) };
  if (!prev.signupId) return { step: 'details', values: prev.values, error: 'Please start again.' };
  try {
    await setSession(await api.completeSignup({ signupId: prev.signupId, code: parsed.data.code }));
  } catch (e) {
    // A number that is already registered sends the user back to the details step with the message.
    if (isApiError(e) && (e.code === 'conflict' || e.code === 'not_found')) return { step: 'details', values: prev.values, error: e.message };
    return { ...prev, fields: undefined, error: message(e, 'We couldn’t check that code. Please try again.') };
  }
  redirect(prev.values?.intent === 'list' ? '/landlord/onboarding' : safeNext(formData.get('next'), '/homes'));
}

export async function resendSignUpCodeAction(signupId: string): Promise<CodeStep> {
  try {
    const res: CodeSent = await api.resendSignupCode(signupId);
    return { sentTo: res.sentTo, resendIn: res.resendIn, success: 'We sent a new code.' };
  } catch (e) {
    return { error: message(e, 'We couldn’t send a new code. Please try again.') };
  }
}

// ---------------------------------------------------------------- Sign in with password

export interface SignInState extends FormState {
  identifier?: string;
}

export async function signInAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const identifier = String(formData.get('identifier') ?? '');
  const parsed = signInSchema.safeParse({ identifier, password: formData.get('password') ?? '' });
  if (!parsed.success) return { identifier, fields: fieldErrors(parsed.error) };
  try {
    await setSession(await api.login({ identifier: parsed.data.identifier.destination, password: parsed.data.password }));
  } catch (e) {
    return { identifier, error: message(e, 'We couldn’t sign you in. Please try again.') };
  }
  redirect(safeNext(formData.get('next'), '/homes'));
}

// ---------------------------------------------------------------- Sign in with a one-time code

export interface OtpState extends CodeStep {
  step: 'request' | 'verify';
  destination?: string;
}

export async function requestOtpAction(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const parsed = otpRequestSchema.safeParse({ destination: formData.get('destination') });
  if (!parsed.success) return { step: 'request', fields: fieldErrors(parsed.error) };
  try {
    const res = await api.requestOtp(parsed.data.destination);
    return { step: 'verify', destination: parsed.data.destination.destination, sentTo: res.sentTo, resendIn: 60 };
  } catch (e) {
    return { step: 'request', error: message(e, 'We couldn’t send a code. Please try again.') };
  }
}

export async function verifyOtpAction(prev: OtpState, formData: FormData): Promise<OtpState> {
  const parsed = otpVerifySchema.safeParse({ destination: prev.destination, code: formData.get('code') });
  if (!parsed.success) return { ...prev, error: undefined, fields: fieldErrors(parsed.error) };
  try {
    await setSession(await api.verifyOtp(parsed.data));
  } catch (e) {
    return { ...prev, fields: undefined, error: message(e, 'We couldn’t sign you in. Please try again.') };
  }
  redirect(safeNext(formData.get('next'), '/homes'));
}

// ---------------------------------------------------------------- Forgot password

const RESET_COOKIE = 'sh_pw_reset';

export interface ResetState extends CodeStep {
  step: 'request' | 'verify' | 'password';
  identifier?: string;
  resetId?: string;
}

export async function forgotPasswordAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const identifier = String(formData.get('identifier') ?? '');
  const parsed = forgotPasswordSchema.safeParse({ identifier });
  if (!parsed.success) return { step: 'request', identifier, fields: fieldErrors(parsed.error) };
  try {
    const res = await api.requestPasswordReset({ identifier: parsed.data.identifier.destination });
    return { step: 'verify', identifier, resetId: res.resetId, sentTo: res.sentTo, resendIn: res.resendIn };
  } catch (e) {
    return { step: 'request', identifier, error: message(e, 'We couldn’t send a code. Please try again.') };
  }
}

export async function resendResetCodeAction(identifier: string): Promise<CodeStep & { resetId?: string }> {
  const parsed = forgotPasswordSchema.safeParse({ identifier });
  if (!parsed.success) return { error: 'Please start again.' };
  try {
    const res = await api.requestPasswordReset({ identifier: parsed.data.identifier.destination });
    return { resetId: res.resetId, sentTo: res.sentTo, resendIn: res.resendIn, success: 'We sent a new code.' };
  } catch (e) {
    return { error: message(e, 'We couldn’t send a new code. Please try again.') };
  }
}

export async function verifyResetCodeAction(prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = codeSchema.safeParse({ code: formData.get('code') });
  if (!parsed.success) return { ...prev, error: undefined, fields: fieldErrors(parsed.error) };
  const resetId = String(formData.get('resetId') ?? prev.resetId ?? '');
  try {
    const { resetToken } = await api.verifyPasswordReset({ resetId, code: parsed.data.code });
    // The token that authorises the new password never reaches the page: httpOnly, 10 minutes, this page only.
    (await cookies()).set(RESET_COOKIE, resetToken, { ...cookieOptions, path: '/forgot-password', maxAge: 600 });
  } catch (e) {
    return { ...prev, fields: undefined, error: message(e, 'We couldn’t check that code. Please try again.') };
  }
  return { step: 'password', identifier: prev.identifier };
}

export async function resetPasswordAction(prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get('password') ?? '', confirm: formData.get('confirm') ?? '' });
  if (!parsed.success) return { ...prev, error: undefined, fields: fieldErrors(parsed.error) };
  const jar = await cookies();
  const resetToken = jar.get(RESET_COOKIE)?.value;
  if (!resetToken) return { step: 'request', identifier: prev.identifier, error: 'This reset has expired. Please start again.' };
  try {
    const session = await api.completePasswordReset({ resetToken, password: parsed.data.password });
    jar.delete({ name: RESET_COOKIE, path: '/forgot-password' });
    await setSession(session);
  } catch (e) {
    if (isApiError(e) && e.code === 'not_found') {
      jar.delete({ name: RESET_COOKIE, path: '/forgot-password' });
      return { step: 'request', identifier: prev.identifier, error: e.message };
    }
    return { ...prev, error: message(e, 'We couldn’t change your password. Please try again.'), fields: isApiError(e) ? e.fields : undefined };
  }
  redirect('/account?password=reset');
}

// ---------------------------------------------------------------- Sign out

export async function signOutAction() {
  const token = await getAccessToken();
  if (token) await api.logout(token).catch(() => undefined);
  await clearSession();
  redirect('/');
}
