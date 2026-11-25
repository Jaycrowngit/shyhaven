import type { Metadata } from 'next';
import Form from 'next/form';
import Link from 'next/link';
import { Suspense } from 'react';
import { ListingGrid } from '@/components/listing-card';
import { GridSkeleton } from '@/components/skeletons';
import { btn, container, EmptyState, input, Skeleton } from '@/components/ui';
import { getCities, searchListings } from '@/lib/dal';
import { LISTING_TYPE_LABEL } from '@/lib/format';
import { parseSearchParams, toQueryString } from '@/lib/search-params';
import { LISTING_TYPES, type SearchParams } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Find a verified home',
  description: 'Search verified homes for rent in Nigeria. Every listing is checked, and your rent is held until you move in.',
};

export default function HomesPage({ searchParams }: PageProps<'/homes'>) {
  return (
    <div className={`${container} flex flex-col gap-6 py-8`}>
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading">Find a verified home</h1>
        <p className="mt-1 text-muted">Verified homes for rent across Nigeria. Every one has been checked by our team.</p>
      </div>
      <Suspense
        fallback={
          <>
            <Skeleton className="h-[74px] w-full" />
            <GridSkeleton />
          </>
        }
      >
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<'/homes'>['searchParams'] }) {
  const params = parseSearchParams(await searchParams);
  const [result, cities] = await Promise.all([searchListings(params), getCities()]);
  const offset = Number(params.cursor ?? 0);
  const hasFilters = Boolean(params.q || params.city || params.type || params.minBeds || params.maxRent);

  return (
    <>
      <Filters params={params} cities={cities} />
      <div className="flex items-center justify-between gap-4" aria-live="polite">
        <p className="text-sm text-muted">
          {result.total === 0
            ? 'No homes match'
            : `${result.total} verified home${result.total === 1 ? '' : 's'}${params.q ? ` for “${params.q}”` : ''}`}
        </p>
        {hasFilters && (
          <Link href="/homes" className="text-sm font-medium text-primary hover:underline">
            Clear filters
          </Link>
        )}
      </div>
      {result.items.length ? (
        <ListingGrid listings={result.items} priorityCount={3} />
      ) : (
        <EmptyState
          title="No homes match your search yet"
          action={
            <Link href="/homes" className={btn.secondary}>
              See all homes
            </Link>
          }
        >
          Try a nearby area, a higher budget or fewer bedrooms. New homes are verified every day.
        </EmptyState>
      )}
      {(offset > 0 || result.nextCursor) && (
        <nav aria-label="Pages" className="flex items-center justify-between gap-4 pt-2">
          {offset > 0 ? (
            <Link href={`/homes${toQueryString({ ...params, cursor: offset - 12 > 0 ? String(offset - 12) : undefined })}`} className={btn.secondary}>
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">
            {offset + 1}–{offset + result.items.length} of {result.total}
          </span>
          {result.nextCursor ? (
            <Link href={`/homes${toQueryString({ ...params, cursor: result.nextCursor })}`} className={btn.secondary}>
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

function Filters({ params, cities }: { params: SearchParams; cities: string[] }) {
  const select = `${input} pr-8`;
  return (
    <Form action="/homes" role="search" className="grid gap-3 rounded-[14px] border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr_auto]">
      <div>
        <label htmlFor="f-q" className="sr-only">Area, city or keyword</label>
        <input id="f-q" name="q" defaultValue={params.q} placeholder="Area, city or keyword" className={input} />
      </div>
      <div>
        <label htmlFor="f-city" className="sr-only">City</label>
        <select id="f-city" name="city" defaultValue={params.city ?? ''} className={select}>
          <option value="">Any city</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-type" className="sr-only">Type of home</label>
        <select id="f-type" name="type" defaultValue={params.type ?? ''} className={select}>
          <option value="">Any type</option>
          {LISTING_TYPES.map((t) => (
            <option key={t} value={t}>{LISTING_TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-beds" className="sr-only">Bedrooms</label>
        <select id="f-beds" name="minBeds" defaultValue={params.minBeds?.toString() ?? ''} className={select}>
          <option value="">Any beds</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}+ beds</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-rent" className="sr-only">Maximum rent per year</label>
        <select id="f-rent" name="maxRent" defaultValue={params.maxRent?.toString() ?? ''} className={select}>
          <option value="">Any price</option>
          {[1_000_000, 2_000_000, 3_000_000, 5_000_000, 8_000_000, 12_000_000, 20_000_000].map((n) => (
            <option key={n} value={n}>Up to ₦{(n / 1_000_000).toLocaleString('en-NG')}m / yr</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-sort" className="sr-only">Sort by</label>
        <select id="f-sort" name="sort" defaultValue={params.sort ?? 'newest'} className={select}>
          <option value="newest">Newest</option>
          <option value="price_asc">Lowest price</option>
          <option value="price_desc">Highest price</option>
        </select>
      </div>
      <button type="submit" className={btn.accent}>
        Search
      </button>
    </Form>
  );
}
