import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { setListingPausedAction, submitListingAction } from '@/app/actions/landlord';
import { ActionButton } from '@/components/action-button';
import { PanelSkeleton } from '@/components/skeletons';
import { Alert, Badge, btn, card } from '@/components/ui';
import { api, isApiError } from '@/lib/api';
import { requireLandlord } from '@/lib/dal';
import { formatDate, formatDateTime, formatMoney, LISTING_STATUS_UI } from '@/lib/format';
import type { OwnListing } from '@/lib/types';

export const metadata: Metadata = { title: 'Your listing', robots: { index: false } };

export default function OwnListingPage({ params, searchParams }: PageProps<'/landlord/listings/[id]'>) {
  return (
    <Suspense fallback={<PanelSkeleton rows={4} />}>
      <View params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function View({ params, searchParams }: Pick<PageProps<'/landlord/listings/[id]'>, 'params' | 'searchParams'>) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { token } = await requireLandlord(`/landlord/listings/${id}`);
  let l: OwnListing;
  try {
    l = await api.myListing(token, id);
  } catch (e) {
    if (isApiError(e) && e.code === 'not_found') notFound();
    throw e;
  }
  const status = LISTING_STATUS_UI[l.status];
  const editable = ['draft', 'changes_requested', 'published', 'paused'].includes(l.status);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/landlord" className="text-sm text-muted hover:text-primary">
        ← Dashboard
      </Link>
      {sp.submitted && l.status === 'submitted' && <Alert tone="verified">Submitted for review. We’ll let you know within 24 hours.</Alert>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge tone={status.tone} className="self-start">
            {status.label}
          </Badge>
          <h1 className="font-display text-3xl font-extrabold text-heading">{l.title || 'Untitled listing'}</h1>
          <p className="text-muted">
            {l.address} · {l.area}, {l.city}
          </p>
          <p className="text-sm text-muted">{status.hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {l.status === 'published' && (
            <Link href={`/homes/${l.slug}`} className={btn.secondary}>
              View live listing
            </Link>
          )}
          {editable && (
            <Link href={`/landlord/listings/${l.id}/edit`} className={btn.secondary}>
              Edit
            </Link>
          )}
        </div>
      </div>

      {l.reviewNote && (
        <Alert tone="warning">
          <strong>What to fix:</strong> {l.reviewNote}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {l.photos.map((p, i) => (
              <li key={p.key} className="relative aspect-square overflow-hidden rounded-[10px]">
                <Image src={p.url} alt={p.alt} fill sizes="120px" className="object-cover" />
                {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-navy/85 px-1.5 text-[10px] font-semibold text-white">Cover</span>}
              </li>
            ))}
          </ul>

          <section className={`${card} p-5`} aria-labelledby="money">
            <h2 id="money" className="font-display text-lg font-bold text-heading">
              What you receive
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-[15px]">
              <div className="flex justify-between"><dt className="text-muted">Rent per year</dt><dd className="tabular-nums">{formatMoney(l.rent)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">SkyHaven fee</dt><dd className="tabular-nums">− {formatMoney(l.payoutPreview.commission)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Caution deposit (passed to you)</dt><dd className="tabular-nums">{formatMoney(l.fees.cautionDeposit)}</dd></div>
              <div className="mt-1 flex justify-between border-t border-border pt-3 font-semibold">
                <dt>Paid to your bank after move-in</dt>
                <dd className="tabular-nums">{formatMoney(l.payoutPreview.landlordPayout + l.fees.cautionDeposit)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">Based on today’s fee. The fee is fixed for each booking when the tenant books.</p>
          </section>

          <section aria-labelledby="history">
            <h2 id="history" className="font-display text-lg font-bold text-heading">
              History
            </h2>
            <ol className="mt-3 flex flex-col gap-3 border-l-2 border-border pl-4">
              {l.history.map((h, i) => (
                <li key={i} className="text-sm">
                  <p className="font-medium">{LISTING_STATUS_UI[h.to].label}</p>
                  <p className="text-muted">
                    {formatDateTime(h.at)}
                    {h.reason ? ` · ${h.reason}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <div className={`${card} flex flex-col gap-3 p-5`}>
            <h2 className="font-display text-lg font-bold text-heading">Actions</h2>
            {(l.status === 'draft' || l.status === 'changes_requested') && (
              <ActionButton action={submitListingAction.bind(null, l.id)} className={`${btn.accent} w-full`} pendingLabel="Submitting…">
                {l.status === 'draft' ? 'Submit for review' : 'Resubmit for review'}
              </ActionButton>
            )}
            {l.status === 'published' && (
              <ActionButton action={setListingPausedAction.bind(null, l.id, true)} className={`${btn.secondary} w-full`} pendingLabel="Pausing…">
                Pause listing
              </ActionButton>
            )}
            {l.status === 'paused' && (
              <ActionButton action={setListingPausedAction.bind(null, l.id, false)} className={`${btn.primary} w-full`} pendingLabel="Resuming…">
                Resume listing
              </ActionButton>
            )}
            {['submitted', 'in_review', 'reserved', 'rented', 'rejected', 'archived'].includes(l.status) && (
              <p className="text-sm text-muted">Nothing to do right now.</p>
            )}
            <p className="text-xs text-muted">Available from {formatDate(l.availableFrom)} · Updated {formatDateTime(l.updatedAt)}</p>
          </div>

        </aside>
      </div>
    </div>
  );
}
