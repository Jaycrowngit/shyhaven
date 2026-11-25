'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { sandbox } from '@/lib/api/mock';
import { DEV_TOOLS, IS_SANDBOX } from '@/lib/config';
import { requireLandlord, requireUser } from '@/lib/dal';

/**
 * Stand-ins for systems outside the web app (payment gateway, admin review queue), used only in sandbox mode.
 * Each one refuses to run against the real API. Bound arguments are editable by the client, so each action
 * checks that the signed-in user owns what it touches.
 */
function assertSandbox() {
  if (!IS_SANDBOX) throw new Error('Sandbox actions are disabled');
}

export async function completeSandboxPaymentAction(reference: string, outcome: 'success' | 'failed') {
  assertSandbox();
  const { token } = await requireUser(`/test-checkout/${reference}`);
  await api.verifyPayment(token, reference); // throws not_found unless this payment is the user's
  const { bookingId } = sandbox.completePayment(reference, outcome);
  updateTag('listings');
  redirect(`/bookings/${bookingId}?payment=${outcome === 'success' ? 'done' : 'failed'}`);
}

export async function sandboxReviewAction(listingId: string, decision: 'approve' | 'request_changes') {
  if (!DEV_TOOLS) throw new Error('Reviewer shortcut is only available in development');
  const { token } = await requireLandlord(`/landlord/listings/${listingId}`);
  await api.myListing(token, listingId); // throws not_found unless the listing is the user's
  sandbox.review(listingId, decision);
  updateTag('listings');
  refresh();
}
