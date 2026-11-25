import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { PanelSkeleton } from '@/components/skeletons';
import { Badge, btn, card, CheckIcon, EmptyState, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { requireLandlord } from '@/lib/dal';
import { BOOKING_STATUS_UI, formatDate, formatMoney, LISTING_STATUS_UI } from '@/lib/format';
import { isSetupComplete, setupSteps } from '@/lib/landlord';

export const metadata: Metadata = { title: 'Landlord dashboard', robots: { index: false } };

export default function LandlordDashboard() {
  return (
    <Suspense fallback={<PanelSkeleton rows={4} />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const { user, token } = await requireLandlord('/landlord');
  const [profile, listings, money] = await Promise.all([api.landlordProfile(token), api.myListings(token), api.landlordMoney(token)]);
  const steps = setupSteps(profile);
  const ready = isSetupComplete(profile);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={`Hello, ${user.name?.split(' ')[0] ?? 'there'}`}>Your listings, tenants and rent in one place.</PageHeader>
        <Link href="/landlord/listings/new" className={btn.accent}>
          Add a listing
        </Link>
      </div>

      {!ready && (
        <section aria-labelledby="setup" className={`${card} border-accent/50 p-5`}>
          <h2 id="setup" className="font-display text-lg font-bold text-heading">
            Finish setting up to publish listings
          </h2>
          <p className="mt-1 text-sm text-muted">You can start a listing now. We need these before we can review it.</p>
          <ol className="mt-4 flex flex-col gap-2">
            {steps.map((s) => (
              <li key={s.key} className="flex items-center gap-2.5 text-[15px]">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${s.done ? 'border-verified bg-verified text-white' : 'border-border text-muted'}`}
                >
                  {s.done ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                </span>
                <span className={s.done ? 'text-muted line-through' : ''}>{s.label}</span>
              </li>
            ))}
          </ol>
          <Link href="/landlord/onboarding" className={`${btn.primary} mt-4`}>
            Continue setup
          </Link>
        </section>
      )}

      <section aria-labelledby="money" className="flex flex-col gap-3">
        <h2 id="money" className="font-display text-lg font-bold text-heading">
          Rent
        </h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Held until tenants move in', value: money.held },
            { label: 'Released, in the next payout', value: money.payable },
            { label: 'Paid to your bank', value: money.paidOut },
          ].map((m) => (
            <div key={m.label} className={`${card} p-4`}>
              <dt className="text-sm text-muted">{m.label}</dt>
              <dd className="mt-1 font-display text-2xl font-extrabold text-heading tabular-nums">{formatMoney(m.value, money.currency)}</dd>
            </div>
          ))}
        </dl>
        {profile.payoutAccount && (
          <p className="text-sm text-muted">
            Payouts go to {profile.payoutAccount.accountName}, {profile.payoutAccount.bankName} ••{profile.payoutAccount.accountLast4}, in daily batches.
          </p>
        )}
        {money.recent.length > 0 && (
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">Recent rent payments</caption>
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Home</th>
                  <th className="px-4 py-2.5 font-medium">Tenant</th>
                  <th className="px-4 py-2.5 font-medium">Move-in</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">You receive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {money.recent.map((r) => (
                  <tr key={r.bookingId}>
                    <td className="px-4 py-3">{r.listingTitle}</td>
                    <td className="px-4 py-3">{r.tenantFirstName}</td>
                    <td className="px-4 py-3">{formatDate(r.moveInDate)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={BOOKING_STATUS_UI[r.status].tone}>{BOOKING_STATUS_UI[r.status].label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(r.landlordPayout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="listings" className="flex flex-col gap-3">
        <h2 id="listings" className="font-display text-lg font-bold text-heading">
          Your listings
        </h2>
        {listings.length === 0 ? (
          <EmptyState title="No listings yet" action={<Link href="/landlord/listings/new" className={btn.primary}>Add your first listing</Link>}>
            It takes about 10 minutes. Have your photos and ownership documents ready.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {listings.map((l) => {
              const s = LISTING_STATUS_UI[l.status];
              return (
                <li key={l.id} className={`${card} relative flex items-center gap-4 p-3 hover:border-primary`}>
                  <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[10px] bg-border/40">
                    {l.photos[0] && <Image src={l.photos[0].url} alt="" fill sizes="112px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/landlord/listings/${l.id}`} className="truncate font-semibold after:absolute after:inset-0">
                      {l.title || 'Untitled listing'}
                    </Link>
                    <p className="text-sm text-muted">
                      {l.area}, {l.city} · {formatMoney(l.rent)} / year
                    </p>
                    <p className="text-xs text-muted">{s.hint}</p>
                  </div>
                  <Badge tone={s.tone} className="shrink-0">
                    {s.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
