import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { PanelSkeleton } from '@/components/skeletons';
import { Alert, Badge, btn, card, EmptyState, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { requireUser } from '@/lib/dal';
import { BOOKING_STATUS_UI, formatDate, formatDateTime, formatMoney, INSPECTION_STATUS_UI } from '@/lib/format';

export const metadata: Metadata = { title: 'My rentals', robots: { index: false } };

export default function AccountPage({ searchParams }: PageProps<'/account'>) {
  return (
    <>
      <PageHeader title="My rentals" />
      <Suspense>
        <PasswordResetNotice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<PanelSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function PasswordResetNotice({ searchParams }: { searchParams: PageProps<'/account'>['searchParams'] }) {
  if ((await searchParams).password !== 'reset') return null;
  return <Alert tone="verified">Your password has been changed, and you’ve been signed out everywhere else.</Alert>;
}

async function Overview() {
  const { token } = await requireUser('/account');
  const [bookings, inspections] = await Promise.all([api.myBookings(token), api.myInspections(token)]);
  const upcoming = inspections.filter((i) => i.status === 'requested' || i.status === 'confirmed');

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section aria-labelledby="bookings" className="flex flex-col gap-3">
        <h2 id="bookings" className="font-display text-lg font-bold text-heading">
          Bookings
        </h2>
        {bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            action={
              <Link href="/homes" className={btn.accent}>
                Find a home
              </Link>
            }
          >
            When you rent a home on SkyHaven, your booking and payment protection show up here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {bookings.map((b) => {
              const s = BOOKING_STATUS_UI[b.status];
              return (
                <li key={b.id} className={`${card} relative flex gap-4 overflow-hidden p-3 hover:border-primary`}>
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[10px]">
                    <Image src={b.listing.coverPhoto.url} alt="" fill sizes="128px" className="object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <Badge tone={s.tone} className="self-start">
                      {s.label}
                    </Badge>
                    <Link href={`/bookings/${b.id}`} className="truncate font-semibold after:absolute after:inset-0">
                      {b.listing.title}
                    </Link>
                    <p className="text-sm text-muted">
                      Move in {formatDate(b.moveInDate)} · {formatMoney(b.price.tenantTotal)}
                    </p>
                    {b.status === 'pending_payment' && <p className="text-sm font-medium text-primary">Finish paying to reserve →</p>}
                    {b.status === 'paid_held' && <p className="text-sm font-medium text-primary">Confirm when you’ve moved in →</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="viewings" className="flex flex-col gap-3">
        <h2 id="viewings" className="font-display text-lg font-bold text-heading">
          Inspections
        </h2>
        {upcoming.length === 0 ? (
          <p className={`${card} p-4 text-sm text-muted`}>No inspections booked. You can book one from any listing.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((i) => (
              <li key={i.id} className={`${card} flex flex-col gap-1 p-4`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{formatDateTime(i.slotAt)}</p>
                  <Badge tone={INSPECTION_STATUS_UI[i.status].tone}>{INSPECTION_STATUS_UI[i.status].label}</Badge>
                </div>
                <Link href={`/homes/${i.listing.slug}`} className="text-sm text-primary hover:underline">
                  {i.listing.title}
                </Link>
                <p className="text-xs text-muted">We’ll share directions before the inspection.</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
