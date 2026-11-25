import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { setSavedAction } from '@/app/actions/tenant';
import { BookForm, SignInToAct, ViewingForm } from '@/components/listing-forms';
import { SubmitButton } from '@/components/submit-button';
import {
  Alert,
  BathIcon,
  BedIcon,
  btn,
  card,
  CheckIcon,
  container,
  HeartIcon,
  LockIcon,
  PinIcon,
  SampleBadge,
  ShieldIcon,
  Skeleton,
  VerifiedBadge,
} from '@/components/ui';
import { api } from '@/lib/api';
import { getCurrentUser, getListing } from '@/lib/dal';
import { lagosDate } from '@/lib/dates';
import { bedsLabel, formatDate, formatMoney, LISTING_TYPE_LABEL } from '@/lib/format';
import { getAccessToken } from '@/lib/session';
import type { ListingDetail } from '@/lib/types';

type Props = PageProps<'/homes/[slug]'>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) return { title: 'Home not found' };
  const title = `${listing.title}, ${listing.area}`;
  const kind = listing.type === 'studio' ? 'Self-contain' : `${bedsLabel(listing.bedrooms, listing.type)} ${LISTING_TYPE_LABEL[listing.type].toLowerCase()}`;
  const description = `${kind} in ${listing.area}, ${listing.city}. ${formatMoney(listing.rent)} a year. Verified by SkyHaven.`;
  return {
    title,
    description,
    alternates: { canonical: `/homes/${slug}` },
    openGraph: { title, description, images: [{ url: listing.coverPhoto.url, alt: listing.coverPhoto.alt }] },
    // Sample data must never be indexed as real homes.
    robots: listing.isSample ? { index: false, follow: true } : undefined,
  };
}

export default function ListingPage({ params }: Props) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <Listing params={params} />
    </Suspense>
  );
}

async function Listing({ params }: { params: Props['params'] }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const dueAtBooking = listing.rent + listing.fees.cautionDeposit;

  return (
    <div className={`${container} flex flex-col gap-6 py-6 sm:py-8`}>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/homes" className="hover:text-primary">Homes</Link> <span aria-hidden>/</span>{' '}
        <Link href={`/homes?city=${encodeURIComponent(listing.city)}`} className="hover:text-primary">{listing.city}</Link>{' '}
        <span aria-hidden>/</span> <span>{listing.area}</span>
      </nav>

      {listing.isSample && (
        <Alert tone="info">
          <strong>Sample listing.</strong> This home uses stock photos to show how SkyHaven works. It is not a real home for rent.
        </Alert>
      )}

      <Gallery listing={listing} />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {listing.verifiedAt && <VerifiedBadge />}
              {listing.isSample && <SampleBadge />}
              <span className="text-sm text-muted">{LISTING_TYPE_LABEL[listing.type]}{listing.furnished ? ' · Furnished' : ''}</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading">{listing.title}</h1>
            <p className="flex items-center gap-1.5 text-muted">
              <PinIcon className="h-4 w-4" /> {listing.area}, {listing.city}
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
              <li className="flex items-center gap-2"><BedIcon className="h-5 w-5 text-muted" />{bedsLabel(listing.bedrooms, listing.type)}</li>
              <li className="flex items-center gap-2"><BathIcon className="h-5 w-5 text-muted" />{listing.bathrooms} bathroom{listing.bathrooms === 1 ? '' : 's'}</li>
              <li>Available from {formatDate(listing.availableFrom)}</li>
            </ul>
          </header>

          <section aria-labelledby="about">
            <h2 id="about" className="font-display text-xl font-bold text-heading">About this home</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-text">{listing.description}</p>
            {listing.amenities.length > 0 && (
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {listing.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-[15px]">
                    <CheckIcon className="h-4 w-4 text-primary" /> {a}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {listing.checks.length > 0 && (
            <section aria-labelledby="checks" className={`${card} p-5`}>
              <h2 id="checks" className="flex items-center gap-2 font-display text-xl font-bold text-heading">
                <ShieldIcon className="h-5 w-5 text-verified" /> What we checked
              </h2>
              <p className="mt-1 text-sm text-muted">
                Verified on {formatDate(listing.verifiedAt!)}. Landlord {listing.landlordFirstName}
                {listing.landlordVerified ? ' has verified their identity.' : '.'}
              </p>
              <ul className="mt-4 grid gap-2.5">
                {listing.checks.map((c) => (
                  <li key={c.key} className="flex items-start gap-2.5 text-[15px]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verified text-white">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {c.label}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="fees">
            <h2 id="fees" className="font-display text-xl font-bold text-heading">All fees, up front</h2>
            <p className="mt-1 text-sm text-muted">Every SkyHaven listing shows the full cost. There are no hidden agency fees.</p>
            <dl className="mt-4 divide-y divide-border rounded-[14px] border border-border bg-surface">
              {[
                ['Rent (per year)', listing.rent],
                ['Caution deposit (refundable)', listing.fees.cautionDeposit],
                ['Service charge (per year)', listing.fees.serviceCharge],
                ['Legal fee', listing.fees.legalFee],
              ].map(([label, amount]) => (
                <div key={label} className="flex justify-between gap-4 px-4 py-3 text-[15px]">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(amount as number)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className={`${card} flex flex-col gap-4 p-5 shadow-sm`}>
            <div>
              <p className="font-display text-3xl font-extrabold text-heading">
                {formatMoney(listing.rent)}
                <span className="text-base font-medium text-muted"> / year</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatMoney(dueAtBooking)} due when you book, including the {formatMoney(listing.fees.cautionDeposit)} caution deposit.
              </p>
            </div>
            {listing.available ? (
              <Suspense fallback={<Skeleton className="h-40 w-full" />}>
                <Actions listing={listing} />
              </Suspense>
            ) : (
              <Alert tone="info">This home has been reserved by another tenant.</Alert>
            )}
            <div className="flex gap-3 rounded-[10px] bg-primary-soft p-3 text-sm">
              <LockIcon className="h-5 w-5 shrink-0 text-primary" />
              <p>
                <strong className="text-text">Your rent is protected.</strong>{' '}
                <span className="text-muted">We hold it until you confirm you’ve moved in. Pay only through SkyHaven to stay covered.</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Gallery({ listing }: { listing: ListingDetail }) {
  const [main, ...rest] = listing.photos;
  return (
    <div className="grid gap-2 overflow-hidden rounded-[18px] sm:grid-cols-4 sm:grid-rows-2 sm:aspect-[2.4/1]">
      <div className="relative aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto">
        <Image src={main.url} alt={main.alt} fill priority sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
      </div>
      {rest.slice(0, 4).map((p) => (
        <div key={p.key} className="relative hidden sm:block">
          <Image src={p.url} alt={p.alt} fill sizes="25vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

const slotDay = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Africa/Lagos' });
const slotTime = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' });

/** Session-aware: book, view, save. Streams in after the cached listing content. */
async function Actions({ listing }: { listing: ListingDetail }) {
  await connection();
  const user = await getCurrentUser();
  if (!user) return <SignInToAct slug={listing.slug} />;

  const token = (await getAccessToken())!;
  const [slots, saved] = await Promise.all([api.inspectionSlots(listing.id), api.savedListings(token)]);
  const isSaved = saved.some((s) => s.id === listing.id);
  const tomorrow = lagosDate(1);
  const minDate = listing.availableFrom > tomorrow ? listing.availableFrom : tomorrow;

  return (
    <div className="flex flex-col gap-3">
      <BookForm listingId={listing.id} slug={listing.slug} minDate={minDate} />
      <ViewingForm
        listingId={listing.id}
        slug={listing.slug}
        slots={slots.map((s) => ({ value: s, day: slotDay.format(new Date(s)), label: slotTime.format(new Date(s)) }))}
      />
      <form action={setSavedAction.bind(null, listing.id, listing.slug, !isSaved)}>
        <SubmitButton className={`${btn.ghost} w-full`} pendingLabel={isSaved ? 'Removing…' : 'Saving…'}>
          <HeartIcon className="h-4 w-4" filled={isSaved} /> {isSaved ? 'Saved' : 'Save this home'}
        </SubmitButton>
      </form>
    </div>
  );
}

function ListingSkeleton() {
  return (
    <div className={`${container} flex flex-col gap-6 py-8`}>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="aspect-[2.4/1] w-full" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
