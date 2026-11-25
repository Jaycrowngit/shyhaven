'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { api, isApiError } from '@/lib/api';
import { requireUser } from '@/lib/dal';
import type { FormState } from '@/lib/form-state';
import { bookingSchema, disputeSchema, fieldErrors, inspectionSchema } from '@/lib/schemas';

const message = (e: unknown, fallback: string) => (isApiError(e) ? e.message : fallback);

export async function setSavedAction(listingId: string, slug: string, saved: boolean) {
  const { token } = await requireUser(`/homes/${slug}`);
  await api.setSaved(token, listingId, saved);
  refresh();
}

export async function requestInspectionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const slug = String(formData.get('slug') ?? '');
  const { token } = await requireUser(`/homes/${slug}`);
  const parsed = inspectionSchema.safeParse({ listingId: formData.get('listingId'), slotAt: formData.get('slotAt') });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  try {
    await api.requestInspection(token, parsed.data);
  } catch (e) {
    return { error: message(e, 'We couldn’t book that inspection. Please try again.') };
  }
  refresh();
  return { success: 'Inspection requested. We’ll confirm the time with the landlord and let you know.' };
}

export async function createBookingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const slug = String(formData.get('slug') ?? '');
  const { token } = await requireUser(`/homes/${slug}`);
  const parsed = bookingSchema.safeParse({ listingId: formData.get('listingId'), moveInDate: formData.get('moveInDate') });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  let bookingId: string;
  try {
    bookingId = (await api.createBooking(token, parsed.data)).id;
  } catch (e) {
    return { error: message(e, 'We couldn’t start your booking. Please try again.'), fields: isApiError(e) ? e.fields : undefined };
  }
  redirect(`/bookings/${bookingId}`);
}

/** Starts checkout. The amount comes from the booking's price snapshot on the server, never from the form. */
export async function payAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const bookingId = String(formData.get('bookingId') ?? '');
  const idempotencyKey = String(formData.get('idempotencyKey') ?? '');
  const { token } = await requireUser(`/bookings/${bookingId}`);
  if (!idempotencyKey) return { error: 'Please reload the page and try again.' };
  let checkoutUrl: string;
  try {
    checkoutUrl = (await api.initPayment(token, bookingId, idempotencyKey)).checkoutUrl;
  } catch (e) {
    refresh();
    return { error: message(e, 'We couldn’t start the payment. Please try again.') };
  }
  redirect(checkoutUrl);
}

export async function confirmMoveInAction(bookingId: string): Promise<FormState> {
  const { token } = await requireUser(`/bookings/${bookingId}`);
  try {
    await api.confirmMoveIn(token, bookingId);
  } catch (e) {
    return { error: message(e, 'We couldn’t confirm your move-in. Please try again.') };
  }
  updateTag('listings');
  refresh();
  return { success: 'Thanks. We’ve released the rent to your landlord. Welcome home.' };
}

export async function openDisputeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const bookingId = String(formData.get('bookingId') ?? '');
  const { token } = await requireUser(`/bookings/${bookingId}`);
  const parsed = disputeSchema.safeParse({ reason: formData.get('reason') });
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  try {
    await api.openDispute(token, bookingId, parsed.data);
  } catch (e) {
    return { error: message(e, 'We couldn’t send your report. Please try again.') };
  }
  refresh();
  return { success: 'We’ve received your report and paused the payment to the landlord. Our team will contact you within 24 hours.' };
}
