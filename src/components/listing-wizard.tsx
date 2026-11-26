'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveListingAction } from '@/app/actions/landlord';
import { formatMoney, LISTING_TYPE_LABEL } from '@/lib/format';
import type { WizardValues } from '@/lib/listing-draft';
import { findContactDetails } from '@/lib/redact';
import { fieldErrors, listingDraftSchema } from '@/lib/schemas';
import { LISTING_TYPES, OWNERSHIP_DOC_KINDS, type OwnershipDocKind } from '@/lib/types';
import { Alert, btn, card, CheckIcon, Field, input } from './ui';

const AMENITIES = ['24h power', 'Prepaid meter', 'Borehole water', 'Security', 'Gated estate', 'Parking', 'Fitted kitchen', 'Air conditioning', 'Swimming pool', 'Gym', 'Boys quarters', 'Waste disposal'];

const DOC_LABEL: Record<OwnershipDocKind, string> = {
  title_deed: 'Deed of assignment / title deed',
  certificate_of_occupancy: 'Certificate of Occupancy (C of O)',
  mandate_letter: 'Signed mandate letter from the owner',
  other: 'Other proof of ownership',
};

const STEPS = [
  { key: 'home', title: 'The home', fields: ['title', 'type', 'bedrooms', 'bathrooms', 'furnished', 'description', 'amenities'] },
  { key: 'location', title: 'Location', fields: ['city', 'area', 'address'] },
  { key: 'money', title: 'Rent and fees', fields: ['rent', 'serviceCharge', 'cautionDeposit', 'legalFee', 'availableFrom'] },
  { key: 'photos', title: 'Photos', fields: ['photoKeys'] },
  { key: 'documents', title: 'Ownership', fields: ['documents'] },
  { key: 'review', title: 'Review', fields: [] },
] as const;

const toInput = (v: WizardValues): unknown => ({
  ...v,
  bedrooms: v.type === 'studio' ? 0 : v.bedrooms,
  rent: v.rent.replace(/[,\s₦]/g, ''),
  serviceCharge: v.serviceCharge.replace(/[,\s₦]/g, '') || '0',
  cautionDeposit: v.cautionDeposit.replace(/[,\s₦]/g, '') || '0',
  legalFee: v.legalFee.replace(/[,\s₦]/g, '') || '0',
});

export function ListingWizard({
  initial,
  listingId,
  canSubmit,
}: {
  initial: WizardValues;
  listingId?: string;
  canSubmit: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>();
  const [pending, start] = useTransition();

  const set = <K extends keyof WizardValues>(key: K, value: WizardValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const contactHits = useMemo(() => findContactDetails(`${values.title}\n${values.description}`), [values.title, values.description]);

  /** Validates the given fields; on failure shows the errors and jumps to the first step that has one. */
  function validate(fields: readonly string[]) {
    const relevant = Object.fromEntries(Object.entries(errorsFor(values)).filter(([k]) => fields.includes(k.split('.')[0])));
    setErrors(relevant);
    const bad = Object.keys(relevant).map((k) => k.split('.')[0]);
    if (!bad.length) return true;
    setStep(STEPS.findIndex((s) => s.fields.some((f) => bad.includes(f))));
    return false;
  }

  function goTo(target: number) {
    if (target > step && !validate(STEPS.slice(0, target).flatMap((s) => s.fields))) return;
    setErrors({});
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save(submit: boolean) {
    setServerError(undefined);
    start(async () => {
      const res = await saveListingAction(toInput(values), { listingId, submit });
      // On success the action redirects; anything returned is an error.
      if (res?.fields) {
        setErrors(res.fields);
        const firstBad = STEPS.findIndex((s) => s.fields.some((f) => res.fields![f] !== undefined));
        if (firstBad >= 0) setStep(firstBad);
      }
      setServerError(res?.error);
    });
  }

  const current = STEPS[step];
  const err = (k: string) => errors[k];
  const errProps = (k: string) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-error` : undefined });

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Listing steps">
        <ol className="flex gap-2 overflow-x-auto lg:flex-col">
          {STEPS.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => i !== step && goTo(i)}
                aria-current={i === step ? 'step' : undefined}
                className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-sm whitespace-nowrap ${i === step ? 'bg-primary-soft font-semibold text-primary' : 'text-muted hover:text-text'}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${i < step ? 'bg-verified text-white' : i === step ? 'bg-primary text-on-primary' : 'border border-border'}`}>
                  {i < step ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={`${card} flex flex-col gap-6 p-5 sm:p-6`}>
        <h2 className="font-display text-xl font-bold text-heading">{current.title}</h2>

        {current.key === 'home' && (
          <div className="flex flex-col gap-5">
            <Field label="Listing title" htmlFor="title" error={err('title')} hint="For example: Bright 2-bedroom flat near Unilag">
              <input id="title" value={values.title} onChange={(e) => set('title', e.target.value)} maxLength={90} className={input} {...errProps('title')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Type" htmlFor="type">
                <select id="type" value={values.type} onChange={(e) => set('type', e.target.value as WizardValues['type'])} className={input}>
                  {LISTING_TYPES.map((t) => (
                    <option key={t} value={t}>{LISTING_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Bedrooms" htmlFor="bedrooms" error={err('bedrooms')}>
                <input id="bedrooms" type="number" min={0} max={12} disabled={values.type === 'studio'} value={values.type === 'studio' ? '0' : values.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} className={input} {...errProps('bedrooms')} />
              </Field>
              <Field label="Bathrooms" htmlFor="bathrooms" error={err('bathrooms')}>
                <input id="bathrooms" type="number" min={1} max={12} value={values.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} className={input} {...errProps('bathrooms')} />
              </Field>
            </div>
            <label className="flex items-center gap-2.5 text-[15px]">
              <input type="checkbox" checked={values.furnished} onChange={(e) => set('furnished', e.target.checked)} className="h-4 w-4 accent-[var(--sh-primary)]" />
              Furnished
            </label>
            <Field label="Description" htmlFor="description" error={err('description')} hint={`${values.description.trim().length} characters. Describe the rooms, the building and what’s nearby.`}>
              <textarea id="description" rows={7} value={values.description} onChange={(e) => set('description', e.target.value)} className={input} {...errProps('description')} />
            </Field>
            {contactHits.length > 0 && <ContactWarning hits={contactHits.map((h) => h.text)} />}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Amenities</legend>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => {
                  const on = values.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('amenities', on ? values.amenities.filter((x) => x !== a) : [...values.amenities, a])}
                      className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-primary bg-primary-soft font-medium text-primary' : 'border-border hover:border-primary'}`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {current.key === 'location' && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" htmlFor="city" error={err('city')}>
                <input id="city" list="cities" value={values.city} onChange={(e) => set('city', e.target.value)} className={input} {...errProps('city')} />
                <datalist id="cities">
                  <option value="Lagos" />
                  <option value="Abuja" />
                  <option value="Port Harcourt" />
                  <option value="Ibadan" />
                </datalist>
              </Field>
              <Field label="Area or neighbourhood" htmlFor="area" error={err('area')} hint="Shown on the listing, e.g. Yaba or Lekki Phase 1">
                <input id="area" value={values.area} onChange={(e) => set('area', e.target.value)} className={input} {...errProps('area')} />
              </Field>
            </div>
            <Field label="Street address" htmlFor="address" error={err('address')} hint="Private. We use it to check the location, and share it with the tenant only after they pay.">
              <input id="address" value={values.address} onChange={(e) => set('address', e.target.value)} autoComplete="street-address" className={input} {...errProps('address')} />
            </Field>
          </div>
        )}

        {current.key === 'money' && (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-muted">Tenants see every fee before they book. Listings with missing fees are sent back for changes.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyField id="rent" label="Rent per year" value={values.rent} onChange={(v) => set('rent', v)} error={err('rent')} />
              <MoneyField id="cautionDeposit" label="Caution deposit" value={values.cautionDeposit} onChange={(v) => set('cautionDeposit', v)} error={err('cautionDeposit')} hint="Refundable at the end of the tenancy" />
              <MoneyField id="serviceCharge" label="Service charge per year" value={values.serviceCharge} onChange={(v) => set('serviceCharge', v)} error={err('serviceCharge')} hint="Enter 0 if there isn’t one" />
              <MoneyField id="legalFee" label="Legal fee" value={values.legalFee} onChange={(v) => set('legalFee', v)} error={err('legalFee')} hint="Enter 0 if there isn’t one" />
            </div>
            <Field label="Available from" htmlFor="availableFrom" error={err('availableFrom')}>
              <input id="availableFrom" type="date" value={values.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} className={`${input} sm:max-w-xs`} {...errProps('availableFrom')} />
            </Field>
          </div>
        )}

        {current.key === 'photos' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              Add at least 5 recent photos you took yourself: the outside, the living room, the kitchen, every bedroom and a bathroom. The first photo is
              the cover. Photos found on other websites are rejected.
            </p>
            <Alert tone="warning">Photo upload isn’t available yet. It opens once the SkyHaven server is connected.</Alert>
            <p className="text-sm" aria-live="polite">
              {values.photoKeys.length} selected{values.photoKeys.length < 5 ? `, ${5 - values.photoKeys.length} more needed` : ''}
            </p>
            {err('photoKeys') && <p className="text-sm text-danger">{err('photoKeys')}</p>}
          </div>
        )}

        {current.key === 'documents' && (
          <DocumentsStep documents={values.documents} onChange={(d) => set('documents', d)} error={err('documents')} />
        )}

        {current.key === 'review' && (
          <div className="flex flex-col gap-4">
            <dl className="grid gap-x-6 gap-y-3 text-[15px] sm:grid-cols-2">
              <Summary label="Title" value={values.title} />
              <Summary label="Home" value={`${LISTING_TYPE_LABEL[values.type]} · ${values.type === 'studio' ? 'self-contain' : `${values.bedrooms} bed`} · ${values.bathrooms} bath${values.furnished ? ' · furnished' : ''}`} />
              <Summary label="Location" value={`${values.area}, ${values.city}`} />
              <Summary label="Address (private)" value={values.address} />
              <Summary label="Rent per year" value={naira(values.rent)} />
              <Summary label="Caution deposit" value={naira(values.cautionDeposit)} />
              <Summary label="Service charge" value={naira(values.serviceCharge)} />
              <Summary label="Legal fee" value={naira(values.legalFee)} />
              <Summary label="Photos" value={`${values.photoKeys.length}`} />
              <Summary label="Documents" value={values.documents.map((d) => DOC_LABEL[d.kind]).join(', ') || 'None'} />
            </dl>
            {contactHits.length > 0 && <ContactWarning hits={contactHits.map((h) => h.text)} />}
            {!canSubmit && (
              <Alert tone="warning">
                You can save this as a draft now. To submit it for review, finish your <a href="/landlord/onboarding" className="font-semibold underline">account setup</a> first.
              </Alert>
            )}
            <p className="text-sm text-muted">
              When you submit, our team checks the documents, photos, location and price. Most listings are reviewed within 24 hours. Changing the price,
              address, photos or documents later sends the listing back for review.
            </p>
          </div>
        )}

        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0 || pending} className={btn.ghost}>
            Back
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => save(false)} disabled={pending} className={btn.secondary}>
              {pending ? 'Saving…' : 'Save draft'}
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => goTo(step + 1)} disabled={pending} className={btn.primary}>
                Next
              </button>
            ) : (
              <button type="button" onClick={() => validate(STEPS.flatMap((s) => s.fields)) && save(true)} disabled={pending || !canSubmit} className={btn.accent}>
                {pending ? 'Submitting…' : 'Submit for review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function errorsFor(values: WizardValues) {
  const parsed = listingDraftSchema.safeParse(toInput(values));
  return parsed.success ? {} : fieldErrors(parsed.error);
}

function naira(v: string) {
  const n = Number(v.replace(/[,\s₦]/g, ''));
  return Number.isFinite(n) ? formatMoney(Math.round(n * 100)) : '—';
}

function MoneyField({ id, label, value, onChange, error, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string }) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">₦</span>
        <input id={id} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} className={`${input} pl-8 tabular-nums`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
      </div>
    </Field>
  );
}

function DocumentsStep({ documents, onChange, error }: { documents: WizardValues['documents']; onChange: (d: WizardValues['documents']) => void; error?: string }) {
  const [kind, setKind] = useState<OwnershipDocKind>('certificate_of_occupancy');
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Upload a document that shows you own the home, or a signed mandate letter if you let it for the owner. The name must match your verified ID.
        Documents are private: only our review team sees them.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr] sm:items-end">
        <Field label="Document type" htmlFor="docKind">
          <select id="docKind" value={kind} onChange={(e) => setKind(e.target.value as OwnershipDocKind)} className={input}>
            {OWNERSHIP_DOC_KINDS.map((k) => (
              <option key={k} value={k}>{DOC_LABEL[k]}</option>
            ))}
          </select>
        </Field>
        <Field label="File (PDF or photo)" htmlFor="docFile">
          <input
            id="docFile"
            type="file"
            accept="application/pdf,image/*"
            className="text-sm file:mr-3 file:rounded-[10px] file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onChange([...documents, { kind, fileName: f.name }]);
              e.target.value = '';
            }}
          />
        </Field>
      </div>
      {documents.length > 0 && (
        <ul className="flex flex-col gap-2">
          {documents.map((d, i) => (
            <li key={`${d.fileName}-${i}`} className="flex items-center justify-between gap-3 rounded-[10px] border border-border px-3 py-2 text-sm">
              <span>
                <strong>{DOC_LABEL[d.kind]}</strong> · {d.fileName}
              </span>
              <button type="button" onClick={() => onChange(documents.filter((_, j) => j !== i))} className="text-danger hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function ContactWarning({ hits }: { hits: string[] }) {
  return (
    <Alert tone="warning">
      <strong>Remove contact details.</strong> We found {hits.slice(0, 3).map((h) => `“${h}”`).join(', ')}. Tenants get your contact details after they
      pay, and listings with phone numbers, emails, links or handles are sent back for changes.
    </Alert>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-medium break-words">{value || '—'}</dd>
    </div>
  );
}

