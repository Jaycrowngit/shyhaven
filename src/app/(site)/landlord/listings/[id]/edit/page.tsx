import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ListingWizard } from '@/components/listing-wizard';
import type { WizardValues } from '@/lib/listing-draft';
import { PanelSkeleton } from '@/components/skeletons';
import { Alert, btn, PageHeader } from '@/components/ui';
import { api, isApiError } from '@/lib/api';
import { requireLandlord } from '@/lib/dal';
import { isSetupComplete } from '@/lib/landlord';
import type { OwnListing } from '@/lib/types';

export const metadata: Metadata = { title: 'Edit listing', robots: { index: false } };

const EDITABLE = new Set(['draft', 'changes_requested', 'published', 'paused']);

export default function EditListingPage({ params }: PageProps<'/landlord/listings/[id]/edit'>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Edit listing" />
      <Suspense fallback={<PanelSkeleton rows={4} />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: { params: PageProps<'/landlord/listings/[id]/edit'>['params'] }) {
  const { id } = await params;
  const { token } = await requireLandlord(`/landlord/listings/${id}/edit`);
  let listing: OwnListing;
  try {
    listing = await api.myListing(token, id);
  } catch (e) {
    if (isApiError(e) && e.code === 'not_found') notFound();
    throw e;
  }
  if (!EDITABLE.has(listing.status)) {
    return (
      <Alert tone="info">
        This listing can’t be edited while it is {listing.status.replace('_', ' ')}.{' '}
        <Link href={`/landlord/listings/${id}`} className={`${btn.ghost} ${btn.small}`}>
          Back to listing
        </Link>
      </Alert>
    );
  }
  const profile = await api.landlordProfile(token);
  const naira = (minor: number) => String(Math.round(minor / 100));
  const initial: WizardValues = {
    title: listing.title,
    type: listing.type,
    bedrooms: String(listing.bedrooms),
    bathrooms: String(listing.bathrooms),
    furnished: listing.furnished,
    description: listing.description,
    amenities: listing.amenities,
    city: listing.city,
    area: listing.area,
    address: listing.address,
    rent: naira(listing.rent),
    serviceCharge: naira(listing.fees.serviceCharge),
    cautionDeposit: naira(listing.fees.cautionDeposit),
    legalFee: naira(listing.fees.legalFee),
    availableFrom: listing.availableFrom,
    photoKeys: listing.photos.map((p) => p.key),
    documents: listing.documents,
  };
  return (
    <>
      {listing.status === 'published' && (
        <Alert tone="warning">This listing is live. Changing the rent, fees, address, photos or documents sends it back for review and hides it until it’s approved.</Alert>
      )}
      {listing.reviewNote && (
        <Alert tone="warning">
          <strong>Reviewer’s note:</strong> {listing.reviewNote}
        </Alert>
      )}
      <ListingWizard
        initial={initial}
        listingId={listing.id}
        
        canSubmit={isSetupComplete(profile) && (listing.status === 'draft' || listing.status === 'changes_requested')}
      />
    </>
  );
}
