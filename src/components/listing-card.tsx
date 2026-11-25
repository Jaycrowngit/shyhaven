import Image from 'next/image';
import Link from 'next/link';
import { bedsLabel, formatMoney, LISTING_TYPE_LABEL } from '@/lib/format';
import type { ListingSummary } from '@/lib/types';
import { BathIcon, BedIcon, PinIcon, SampleBadge, VerifiedBadge } from './ui';

export function ListingCard({ listing, priority = false }: { listing: ListingSummary; priority?: boolean }) {
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-[14px] border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-navy/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-border/40">
        <Image
          src={listing.coverPhoto.url}
          alt={listing.coverPhoto.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {listing.verifiedAt && <VerifiedBadge className="bg-white! shadow-sm" />}
          {listing.isSample && <SampleBadge />}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-display text-lg font-bold text-heading">
          {formatMoney(listing.rent, listing.currency)}
          <span className="text-sm font-medium text-muted"> / year</span>
        </p>
        <h3 className="line-clamp-2 text-[15px] font-semibold text-text">
          <Link href={`/homes/${listing.slug}`} className="after:absolute after:inset-0">
            {listing.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-sm text-muted">
          <PinIcon className="h-4 w-4 shrink-0" />
          {listing.area}, {listing.city}
        </p>
        <p className="mt-auto flex items-center gap-4 pt-1 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <BedIcon className="h-4 w-4" />
            {bedsLabel(listing.bedrooms, listing.type)}
          </span>
          <span className="flex items-center gap-1.5">
            <BathIcon className="h-4 w-4" />
            {listing.bathrooms} bath{listing.bathrooms === 1 ? '' : 's'}
          </span>
          {listing.type !== 'studio' && <span>{LISTING_TYPE_LABEL[listing.type]}</span>}
        </p>
      </div>
    </article>
  );
}

export function ListingGrid({ listings, priorityCount = 0 }: { listings: ListingSummary[]; priorityCount?: number }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {listings.map((l, i) => (
        <li key={l.id} className="flex">
          <div className="flex w-full">
            <ListingCard listing={l} priority={i < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}
