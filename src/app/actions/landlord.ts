'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, isApiError } from '@/lib/api';
import { requireLandlord, requireUser } from '@/lib/dal';
import type { FormState } from '@/lib/form-state';
import { fieldErrors, listingDraftSchema, payoutAccountSchema } from '@/lib/schemas';

const message = (e: unknown, fallback: string) => (isApiError(e) ? e.message : fallback);

export async function becomeLandlordAction() {
  const { token } = await requireUser('/landlord/start');
  await api.becomeLandlord(token);
  redirect('/landlord/onboarding');
}

export async function startKycAction(): Promise<FormState> {
  const { token } = await requireLandlord('/landlord/onboarding');
  let url: string | null;
  try {
    url = (await api.startKyc(token)).verificationUrl;
  } catch (e) {
    return { error: message(e, 'We couldn’t start verification. Please try again.') };
  }
  if (url) redirect(url);
  refresh();
  return {};
}

export async function savePayoutAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { token } = await requireLandlord('/landlord/onboarding');
  const parsed = payoutAccountSchema.safeParse({ bankCode: formData.get('bankCode'), accountNumber: formData.get('accountNumber') });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  try {
    const account = await api.savePayoutAccount(token, parsed.data);
    refresh();
    return { success: `Account verified: ${account.accountName}, ${account.bankName} ••${account.accountLast4}` };
  } catch (e) {
    return { error: message(e, 'We couldn’t verify that account. Check the details and try again.') };
  }
}

export async function acceptPolicyAction(policyVersionId: string): Promise<FormState> {
  const { token } = await requireLandlord('/landlord/onboarding');
  try {
    await api.acceptPolicy(token, policyVersionId);
  } catch (e) {
    return { error: message(e, 'We couldn’t record your acceptance. Please try again.') };
  }
  refresh();
  return {};
}

export interface SaveListingResult extends FormState {
  listingId?: string;
}

/**
 * Creates or updates a listing from the wizard, then optionally submits it for review.
 * Submit guards (KYC, payout account, current policy) are enforced by the API; we surface its message.
 */
export async function saveListingAction(input: unknown, opts: { listingId?: string; submit: boolean }): Promise<SaveListingResult> {
  const { token } = await requireLandlord('/landlord/listings/new');
  const parsed = listingDraftSchema.safeParse(input);
  if (!parsed.success) return { error: 'Some details need attention.', fields: fieldErrors(parsed.error) };

  let listingId = opts.listingId;
  try {
    const saved = listingId ? await api.updateListing(token, listingId, parsed.data) : await api.createListing(token, parsed.data);
    listingId = saved.id;
    if (opts.submit) await api.submitListing(token, listingId);
  } catch (e) {
    return { listingId, error: message(e, 'We couldn’t save your listing. Please try again.') };
  }
  updateTag('listings');
  redirect(`/landlord/listings/${listingId}${opts.submit ? '?submitted=1' : ''}`);
}

export async function submitListingAction(listingId: string): Promise<FormState> {
  const { token } = await requireLandlord(`/landlord/listings/${listingId}`);
  try {
    await api.submitListing(token, listingId);
  } catch (e) {
    return { error: message(e, 'We couldn’t submit your listing. Please try again.') };
  }
  refresh();
  return { success: 'Submitted. Our team reviews listings within 24 hours.' };
}

export async function setListingPausedAction(listingId: string, paused: boolean): Promise<FormState> {
  const { token } = await requireLandlord(`/landlord/listings/${listingId}`);
  try {
    await api.setListingPaused(token, listingId, paused);
  } catch (e) {
    return { error: message(e, 'We couldn’t update your listing. Please try again.') };
  }
  updateTag('listings');
  refresh();
  return {};
}
