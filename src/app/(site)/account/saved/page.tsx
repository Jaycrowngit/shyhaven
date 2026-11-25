import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ListingGrid } from '@/components/listing-card';
import { GridSkeleton } from '@/components/skeletons';
import { btn, EmptyState, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { requireUser } from '@/lib/dal';

export const metadata: Metadata = { title: 'Saved homes', robots: { index: false } };

export default function SavedPage() {
  return (
    <>
      <PageHeader title="Saved homes" />
      <Suspense fallback={<GridSkeleton count={3} />}>
        <Saved />
      </Suspense>
    </>
  );
}

async function Saved() {
  const { token } = await requireUser('/account/saved');
  const saved = await api.savedListings(token);
  if (!saved.length) {
    return (
      <EmptyState
        title="No saved homes"
        action={
          <Link href="/homes" className={btn.secondary}>
            Browse homes
          </Link>
        }
      >
        Tap “Save this home” on any listing to keep it here.
      </EmptyState>
    );
  }
  return <ListingGrid listings={saved} />;
}
