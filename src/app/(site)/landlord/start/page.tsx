import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { becomeLandlordAction } from '@/app/actions/landlord';
import { SubmitButton } from '@/components/submit-button';
import { btn, card, PageHeader, Skeleton } from '@/components/ui';
import { requireUser } from '@/lib/dal';

export const metadata: Metadata = { title: 'List your property', robots: { index: false } };

export default function StartPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader eyebrow="For landlords" title="List your property on SkyHaven">
        Listing is free. You pay a fee only when a tenant moves in, taken from the rent before we pay you.
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <Start />
      </Suspense>
    </div>
  );
}

async function Start() {
  const { user } = await requireUser('/landlord/start');
  if (user.roles.includes('landlord')) redirect('/landlord');
  return (
    <div className={`${card} flex flex-col gap-4 p-6`}>
      <p className="font-semibold">What you’ll need</p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] text-muted">
        <li>A government ID (NIN slip, driver’s licence or passport) for a quick selfie check</li>
        <li>The bank account where you want the rent paid</li>
        <li>Recent photos of the home, and a document that shows you own it or may let it</li>
      </ul>
      <form action={becomeLandlordAction}>
        <SubmitButton className={btn.primary} pendingLabel="Setting up…">
          Set up my landlord account
        </SubmitButton>
      </form>
    </div>
  );
}
