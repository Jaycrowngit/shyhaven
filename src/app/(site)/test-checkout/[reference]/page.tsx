import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { completeSandboxPaymentAction } from '@/app/actions/sandbox';
import { SubmitButton } from '@/components/submit-button';
import { btn, card, LockIcon, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { sandbox } from '@/lib/api/mock';
import { IS_SANDBOX } from '@/lib/config';
import { requireUser } from '@/lib/dal';
import { formatMoney } from '@/lib/format';

export const metadata: Metadata = { title: 'Test checkout', robots: { index: false } };

/**
 * Stands in for the payment gateway's hosted checkout page (Blueprint 05) in sandbox mode.
 * In production the tenant is redirected to the gateway, and the API learns about the payment from a signed webhook.
 */
export default function TestCheckoutPage({ params }: PageProps<'/test-checkout/[reference]'>) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Checkout params={params} />
      </Suspense>
    </div>
  );
}

async function Checkout({ params }: { params: PageProps<'/test-checkout/[reference]'>['params'] }) {
  if (!IS_SANDBOX) notFound();
  const { reference } = await params;
  const { token } = await requireUser(`/test-checkout/${reference}`);
  const payment = sandbox.payment(reference);
  if (!payment) notFound();
  // Only the tenant who started this payment may see it.
  if (!(await api.verifyPayment(token, reference).then(() => true, () => false))) notFound();

  return (
    <div className={`${card} flex flex-col gap-5 overflow-hidden`}>
      <div className="flex items-center justify-between bg-[#0b1f33] px-5 py-3 text-white">
        <span className="text-sm font-semibold tracking-wide">TEST PAYMENT GATEWAY</span>
        <span className="rounded bg-white/15 px-2 py-0.5 text-xs">Test</span>
      </div>
      <div className="flex flex-col gap-1 px-5">
        <p className="text-sm text-muted">Paying SkyHaven for</p>
        <p className="font-semibold">{payment.listingTitle}</p>
        <p className="mt-2 font-display text-3xl font-extrabold text-heading">{formatMoney(payment.amount, 'NGN', { kobo: true })}</p>
        <p className="text-xs text-muted">Reference {reference}</p>
      </div>
      {payment.status !== 'initiated' ? (
        <p className="px-5 pb-5 text-sm text-muted">This payment has already been processed.</p>
      ) : (
        <div className="flex flex-col gap-2 px-5 pb-5">
          <p className="mb-1 text-sm text-muted">No real money moves. Choose what the gateway should report back to SkyHaven:</p>
          <form action={completeSandboxPaymentAction.bind(null, reference, 'success')}>
            <SubmitButton className={`${btn.primary} w-full`} pendingLabel="Processing…">
              <LockIcon className="h-4 w-4" /> Pay successfully
            </SubmitButton>
          </form>
          <form action={completeSandboxPaymentAction.bind(null, reference, 'failed')}>
            <SubmitButton className={`${btn.secondary} w-full`} pendingLabel="Processing…">
              Simulate a declined card
            </SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
