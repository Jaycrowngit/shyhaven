import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ConfirmMoveIn, DisputeForm, ExpiryCountdown, PayForm } from '@/components/booking-actions';
import { Alert, Badge, btn, card, CheckIcon, container, Skeleton } from '@/components/ui';
import { api, isApiError } from '@/lib/api';
import { requireUser } from '@/lib/dal';
import { BOOKING_STATUS_UI, formatDate, formatDateTime, formatMoney } from '@/lib/format';
import type { Booking } from '@/lib/types';

export const metadata: Metadata = { title: 'Your booking', robots: { index: false } };

export default function BookingPage({ params, searchParams }: PageProps<'/bookings/[id]'>) {
  return (
    <div className={`${container} py-8`}>
      <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
        <BookingView params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BookingView({ params, searchParams }: Pick<PageProps<'/bookings/[id]'>, 'params' | 'searchParams'>) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { token } = await requireUser(`/bookings/${id}`);
  let booking: Booking;
  try {
    booking = await api.getBooking(token, id);
  } catch (e) {
    if (isApiError(e) && e.code === 'not_found') notFound();
    throw e;
  }
  const status = BOOKING_STATUS_UI[booking.status];
  const total = formatMoney(booking.price.tenantTotal, booking.currency);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/account" className="text-sm text-muted hover:text-primary">
        ← My rentals
      </Link>

      {sp.payment === 'failed' && booking.status === 'pending_payment' && (
        <Alert tone="danger">Your payment didn’t go through and you haven’t been charged. You can try again below.</Alert>
      )}
      {sp.payment === 'done' && booking.status === 'paid_held' && (
        <Alert tone="verified">
          <strong>Payment received.</strong> We’re holding your rent safely until you move in. We’ve sent you a receipt.
        </Alert>
      )}
      {booking.status === 'refunded' && (
        <Alert tone="info">This home was reserved by someone else before your payment completed. We’ve refunded you in full.</Alert>
      )}

      <div className={`${card} flex flex-col gap-4 overflow-hidden sm:flex-row`}>
        <div className="relative aspect-[4/3] sm:aspect-auto sm:w-64 sm:shrink-0">
          <Image src={booking.listing.coverPhoto.url} alt={booking.listing.coverPhoto.alt} fill sizes="256px" className="object-cover" />
        </div>
        <div className="flex flex-col gap-2 p-5 sm:pl-1">
          <Badge tone={status.tone} className="self-start">
            {status.label}
          </Badge>
          <h1 className="font-display text-2xl font-extrabold text-heading">{booking.listing.title}</h1>
          <p className="text-muted">
            {booking.listing.area}, {booking.listing.city} · Move in {formatDate(booking.moveInDate)}
          </p>
          <Link href={`/homes/${booking.listing.slug}`} className="text-sm font-medium text-primary hover:underline">
            View listing
          </Link>
        </div>
      </div>

      <Progress booking={booking} />

      <div className="grid gap-6 md:grid-cols-[1fr_340px]">
        <section aria-labelledby="price" className={`${card} p-5`}>
          <h2 id="price" className="font-display text-lg font-bold text-heading">
            Payment
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-[15px]">
            <Row label="Rent for 1 year" value={formatMoney(booking.price.rent)} />
            <Row label="Caution deposit" value={formatMoney(booking.price.cautionDeposit)} />
            {booking.price.tenantFee > 0 && <Row label="SkyHaven service fee" value={formatMoney(booking.price.tenantFee)} />}
            <div className="mt-2 flex justify-between border-t border-border pt-3 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{total}</dd>
            </div>
          </dl>
          {booking.paidAt && <p className="mt-3 text-sm text-muted">Paid {formatDateTime(booking.paidAt)}</p>}
        </section>

        <section aria-labelledby="next" className={`${card} flex flex-col gap-4 p-5`}>
          <h2 id="next" className="font-display text-lg font-bold text-heading">
            {booking.status === 'pending_payment' ? 'Pay to reserve' : 'Next steps'}
          </h2>
          <NextStep booking={booking} total={total} />
        </section>
      </div>

      {booking.address && booking.landlordContact && (
        <section aria-labelledby="contact" className={`${card} grid gap-4 p-5 sm:grid-cols-2`}>
          <h2 id="contact" className="font-display text-lg font-bold text-heading sm:col-span-2">
            Your new home
          </h2>
          <div>
            <p className="text-sm text-muted">Address</p>
            <p className="font-medium">{booking.address}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Landlord</p>
            <p className="font-medium">
              {booking.landlordContact.name} ·{' '}
              <a href={`tel:${booking.landlordContact.phone}`} className="text-primary hover:underline">
                {booking.landlordContact.phone}
              </a>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

async function NextStep({ booking, total }: { booking: Booking; total: string }) {
  switch (booking.status) {
    case 'pending_payment':
      return (
        <>
          <ExpiryCountdown expiresAt={booking.expiresAt!} />
          <PayForm bookingId={booking.id} idempotencyKey={crypto.randomUUID()} amountLabel={total} />
        </>
      );
    case 'paid_held':
      return (
        <>
          <p className="text-sm text-muted">
            Collect the keys from the landlord. When you’re in and the home matches the listing, confirm below. If you don’t, we release the
            rent automatically on <strong className="text-text">{formatDateTime(booking.autoReleaseAt!)}</strong> unless you report a problem.
          </p>
          <ConfirmMoveIn bookingId={booking.id} />
          <DisputeForm bookingId={booking.id} />
        </>
      );
    case 'disputed':
      return (
        <p className="text-sm text-muted">
          You reported a problem on {formatDate(booking.dispute!.openedAt)}. The payment to the landlord is paused while our team reviews it. We’ll
          contact you within 24 hours.
        </p>
      );
    case 'released':
      return (
        <p className="flex items-start gap-2 text-sm">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-verified" /> You moved in and the rent was released on {formatDate(booking.releasedAt!)}. Enjoy your new home.
        </p>
      );
    case 'expired':
      return (
        <>
          <p className="text-sm text-muted">The 30-minute payment window closed, so we released the home. If it’s still available you can start again.</p>
          <Link href={`/homes/${booking.listing.slug}`} className={btn.secondary}>
            Back to the listing
          </Link>
        </>
      );
    default:
      return <p className="text-sm text-muted">This booking is closed.</p>;
  }
}

function Progress({ booking }: { booking: Booking }) {
  const steps = [
    { label: 'Booked', done: true },
    { label: 'Paid · held', done: ['paid_held', 'disputed', 'released'].includes(booking.status) },
    { label: 'Moved in', done: booking.status === 'released' },
  ];
  if (['expired', 'refunded', 'cancelled'].includes(booking.status)) return null;
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Booking progress">
      {steps.map((s, i) => (
        <li key={s.label} className="flex flex-col gap-2">
          <span className={`h-1.5 rounded-full ${s.done ? 'bg-verified' : 'bg-border'}`} />
          <span className={`text-sm ${s.done ? 'font-semibold text-text' : 'text-muted'}`}>
            {i + 1}. {s.label}
            <span className="sr-only">{s.done ? ' (done)' : ''}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
