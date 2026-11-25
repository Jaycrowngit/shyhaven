'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { createBookingAction, requestInspectionAction } from '@/app/actions/tenant';
import { initialFormState } from '@/lib/form-state';
import { SubmitButton } from './submit-button';
import { Alert, btn, CalendarIcon, Field, input } from './ui';

export function BookForm({ listingId, slug, minDate }: { listingId: string; slug: string; minDate: string }) {
  const [state, action] = useActionState(createBookingAction, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="slug" value={slug} />
      <Field label="Move-in date" htmlFor="moveInDate" error={state.fields?.moveInDate}>
        <input
          id="moveInDate"
          name="moveInDate"
          type="date"
          min={minDate}
          defaultValue={minDate}
          required
          className={input}
          aria-invalid={!!state.fields?.moveInDate}
          aria-describedby={state.fields?.moveInDate ? 'moveInDate-error' : undefined}
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton className={`${btn.accent} w-full`} pendingLabel="Reserving…">
        Rent this home
      </SubmitButton>
    </form>
  );
}

export function ViewingForm({ listingId, slug, slots }: { listingId: string; slug: string; slots: { value: string; label: string; day: string }[] }) {
  const [state, action] = useActionState(requestInspectionAction, initialFormState);
  const [open, setOpen] = useState(false);

  if (state.success) return <Alert tone="verified">{state.success}</Alert>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btn.secondary} w-full`}>
        <CalendarIcon className="h-4 w-4" /> Book an inspection
      </button>
    );
  }
  if (!slots.length) return <p className="text-sm text-muted">No inspection times are free this week. Check back tomorrow.</p>;

  const days = [...new Set(slots.map((s) => s.day))];
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="slug" value={slug} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Choose a time</legend>
        <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {days.map((day) => (
            <div key={day}>
              <p className="mb-1.5 text-xs font-semibold text-muted uppercase">{day}</p>
              <div className="grid grid-cols-3 gap-2">
                {slots
                  .filter((s) => s.day === day)
                  .map((s) => (
                    <label key={s.value} className="cursor-pointer">
                      <input type="radio" name="slotAt" value={s.value} required className="peer sr-only" />
                      <span className="block rounded-[10px] border border-border px-2 py-2 text-center text-sm peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:font-semibold peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
                        {s.label}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      {state.fields?.slotAt && <p className="text-sm text-danger">{state.fields.slotAt}</p>}
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton className={`${btn.primary} w-full`} pendingLabel="Requesting…">
        Request inspection
      </SubmitButton>
    </form>
  );
}

export function SignInToAct({ slug }: { slug: string }) {
  const next = encodeURIComponent(`/homes/${slug}`);
  return (
    <div className="flex flex-col gap-2">
      <Link href={`/sign-in?next=${next}`} className={`${btn.accent} w-full`}>
        Rent this home
      </Link>
      <Link href={`/sign-in?next=${next}`} className={`${btn.secondary} w-full`}>
        <CalendarIcon className="h-4 w-4" /> Book an inspection
      </Link>
      <p className="text-center text-xs text-muted">
        New to SkyHaven?{' '}
        <Link href={`/sign-up?next=${next}`} className="font-semibold text-primary hover:underline">
          Create a free account
        </Link>{' '}
        in a minute.
      </p>
    </div>
  );
}
