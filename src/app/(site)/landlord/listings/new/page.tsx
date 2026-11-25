import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ListingWizard } from '@/components/listing-wizard';
import { emptyWizardValues } from '@/lib/listing-draft';
import { PanelSkeleton } from '@/components/skeletons';
import { PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { SAMPLE_PHOTO_OPTIONS } from '@/lib/api/mock/seed';
import { IS_SANDBOX } from '@/lib/config';
import { requireLandlord } from '@/lib/dal';
import { lagosDate } from '@/lib/dates';
import { isSetupComplete } from '@/lib/landlord';

export const metadata: Metadata = { title: 'New listing', robots: { index: false } };

export default function NewListingPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Add a listing">Have your photos and ownership documents ready. You can save a draft at any point.</PageHeader>
      <Suspense fallback={<PanelSkeleton rows={4} />}>
        <Wizard />
      </Suspense>
    </div>
  );
}

async function Wizard() {
  await connection();
  const { token } = await requireLandlord('/landlord/listings/new');
  const profile = await api.landlordProfile(token);
  return (
    <ListingWizard
      initial={emptyWizardValues(lagosDate())}
      samplePhotos={IS_SANDBOX ? SAMPLE_PHOTO_OPTIONS : null}
      canSubmit={isSetupComplete(profile)}
    />
  );
}
