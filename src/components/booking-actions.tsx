'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { confirmMoveInAction, openDisputeAction, payAction } from '@/app/actions/tenant';
import { initialFormState, type FormState } from '@/lib/form-state';
import { SubmitButton } from './submit-button';
import { Alert, btn, Field, input, LockIcon } from './ui';

export function PayForm({ bookingId, idempotencyKey, amountLabel }: { bookingId: string; idempotencyKey: string; amountLabel: string }) {
  const [state, action] = useActionState(payAction, initialFormState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <SubmitButton className={`${btn.accent} w-full text-base`} pendingLabel="Opening secure checkout…">
        <LockIcon className="h-4 w-4" /> Pay {amountLabel}
      </SubmitButton>
      <p className="text-center text-xs text-muted">Card, bank transfer or USSD on our payment partner’s secure page. We never see your card details.</p>
    </form>
  );
}

/** Live countdown to the 30-minute payment window closing (Blueprint 05). */
export function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Date.parse(expiresAt) - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (left === null) return null;
  if (left === 0) return <Alert tone="warning">Time’s up. Reload the page to start again.</Alert>;
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <p className="text-sm text-muted" role="timer" aria-live="off">
      We’ll hold this home for you for <strong className="tabular-nums text-text">{m}:{String(s).padStart(2, '0')}</strong> while you pay.
    </p>
  );
}

export function ConfirmMoveIn({ bookingId }: { bookingId: string }) {
  const [asking, setAsking] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [pending, start] = useTransition();
  if (state.success) return <Alert tone="verified">{state.success}</Alert>;
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`${btn.accent} w-full`}>
        I’ve moved in
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-accent/40 bg-accent/10 p-4">
      <p className="text-sm">
        <strong>Only confirm once you have the keys</strong> and the home matches the listing. We’ll release your rent to the landlord, and
        this can’t be undone.
      </p>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setState(await confirmMoveInAction(bookingId)))}
          className={`${btn.accent} flex-1`}
        >
          {pending ? 'Releasing…' : 'Yes, release the rent'}
        </button>
        <button type="button" onClick={() => setAsking(false)} className={btn.secondary} disabled={pending}>
          Not yet
        </button>
      </div>
    </div>
  );
}

export function DisputeForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(openDisputeAction, initialFormState);
  const [open, setOpen] = useState(false);
  if (state.success) return <Alert tone="info">{state.success}</Alert>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btn.ghost} w-full`}>
        Something’s wrong with the home
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="bookingId" value={bookingId} />
      <Field label="What’s wrong?" htmlFor="reason" error={state.fields?.reason} hint="We pause the payment to the landlord while we look into it.">
        <textarea
          id="reason"
          name="reason"
          rows={4}
          required
          className={input}
          aria-invalid={!!state.fields?.reason}
          aria-describedby={state.fields?.reason ? 'reason-error' : undefined}
        />
      </Field>
      {state.error && <Alert tone="danger">{state.error}</Alert>}
      <div className="flex gap-2">
        <SubmitButton className={`${btn.danger} flex-1`} pendingLabel="Sending…">
          Report a problem
        </SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
