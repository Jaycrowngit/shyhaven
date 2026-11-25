import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { acceptPolicyAction, startKycAction } from '@/app/actions/landlord';
import { ActionButton } from '@/components/action-button';
import { PayoutAccountForm } from '@/components/payout-account-form';
import { PanelSkeleton } from '@/components/skeletons';
import { Badge, btn, card, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { getBanks, requireLandlord } from '@/lib/dal';
import { formatDate } from '@/lib/format';
import { isSetupComplete } from '@/lib/landlord';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Account setup', robots: { index: false } };

export default function OnboardingPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader eyebrow="Landlord setup" title="Get ready to list">
        Tenants trust SkyHaven because every landlord is verified. This takes about 5 minutes and you only do it once.
      </PageHeader>
      <Suspense fallback={<PanelSkeleton />}>
        <Steps />
      </Suspense>
    </div>
  );
}

async function Steps() {
  const { token } = await requireLandlord('/landlord/onboarding');
  const [profile, banks] = await Promise.all([api.landlordProfile(token), getBanks()]);
  const policyAccepted = profile.acceptedPolicyVersionId === profile.currentPolicy.id;
  const hadOlderPolicy = !!profile.acceptedPolicyVersionId && !policyAccepted;

  return (
    <ol className="flex flex-col gap-4">
      <Step n={1} title="Verify your identity" done={profile.kycStatus === 'verified'}>
        {profile.kycStatus === 'verified' ? (
          <p className="text-sm text-muted">Your ID and selfie check passed.</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              Take a photo of your NIN slip, driver’s licence or passport, then a quick selfie. We check that they match. Your documents are stored
              privately and only our verification team can see them.
            </p>
            {profile.kycStatus === 'pending' ? (
              <Badge tone="info">Checking your documents</Badge>
            ) : (
              <ActionButton action={startKycAction} className={`${btn.primary} self-start`} pendingLabel="Starting…">
                Start verification
              </ActionButton>
            )}
          </>
        )}
      </Step>

      <Step n={2} title="Add your bank account" done={!!profile.payoutAccount}>
        <p className="text-sm text-muted">
          We pay your rent here after the tenant moves in. The account name must match the name on your ID.
          {profile.payoutAccount && ' Changing it pauses payouts for 48 hours, for your security.'}
        </p>
        {profile.payoutAccount && (
          <p className="text-[15px] font-medium">
            {profile.payoutAccount.accountName} · {profile.payoutAccount.bankName} ••{profile.payoutAccount.accountLast4}
          </p>
        )}
        {profile.kycStatus === 'verified' ? (
          <PayoutAccountForm banks={banks} hasAccount={!!profile.payoutAccount} />
        ) : (
          <p className="text-sm text-muted italic">Verify your identity first.</p>
        )}
      </Step>

      <Step n={3} title={profile.currentPolicy.title} done={policyAccepted}>
        {hadOlderPolicy && <Badge tone="warning">Updated: please review and accept version {profile.currentPolicy.version}</Badge>}
        <div className="max-h-64 overflow-y-auto rounded-[10px] border border-border bg-bg p-4 text-sm leading-relaxed">
          {profile.currentPolicy.bodyMd.split('\n\n').map((p, i) => (
            <p key={i} className="mb-3 last:mb-0">
              {p}
            </p>
          ))}
        </div>
        <p className="text-xs text-muted">
          Version {profile.currentPolicy.version}, published {formatDate(profile.currentPolicy.publishedAt)}.
        </p>
        {policyAccepted ? (
          <p className="text-sm text-muted">You accepted this version.</p>
        ) : (
          <ActionButton action={acceptPolicyAction.bind(null, profile.currentPolicy.id)} className={`${btn.primary} self-start`} pendingLabel="Saving…">
            I agree to the landlord policy
          </ActionButton>
        )}
      </Step>

      {isSetupComplete(profile) && (
        <li className={`${card} flex flex-wrap items-center justify-between gap-4 border-verified/40 p-5`}>
          <p className="font-semibold">You’re all set. Add a home and we’ll review it within 24 hours.</p>
          <Link href="/landlord/listings/new" className={btn.accent}>
            Add a listing
          </Link>
        </li>
      )}
    </ol>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <li className={`${card} flex gap-4 p-5`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-verified text-white' : 'bg-primary-soft text-primary'}`}
        aria-hidden
      >
        {done ? '✓' : n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-heading">
          {title}
          {done && <span className="sr-only"> (done)</span>}
        </h2>
        {children}
      </div>
    </li>
  );
}
