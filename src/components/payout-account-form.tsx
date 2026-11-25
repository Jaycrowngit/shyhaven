'use client';

import { useActionState, useState } from 'react';
import { savePayoutAccountAction } from '@/app/actions/landlord';
import { initialFormState } from '@/lib/form-state';
import type { Bank } from '@/lib/types';
import { SubmitButton } from './submit-button';
import { Alert, btn, Field, input } from './ui';

export function PayoutAccountForm({ banks, hasAccount }: { banks: Bank[]; hasAccount: boolean }) {
  const [state, action] = useActionState(savePayoutAccountAction, initialFormState);
  const [open, setOpen] = useState(!hasAccount);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${btn.secondary} ${btn.small} self-start`}>
        Change account
      </button>
    );
  }
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
      <Field label="Bank" htmlFor="bankCode" error={state.fields?.bankCode}>
        <select id="bankCode" name="bankCode" required defaultValue="" className={input} aria-invalid={!!state.fields?.bankCode}>
          <option value="" disabled>
            Choose your bank
          </option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Account number" htmlFor="accountNumber" error={state.fields?.accountNumber}>
        <input
          id="accountNumber"
          name="accountNumber"
          inputMode="numeric"
          maxLength={10}
          autoComplete="off"
          placeholder="10 digits"
          required
          className={input}
          aria-invalid={!!state.fields?.accountNumber}
        />
      </Field>
      <SubmitButton className={btn.primary} pendingLabel="Checking…">
        Verify account
      </SubmitButton>
      <div className="sm:col-span-3">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        {state.success && <Alert tone="verified">{state.success}</Alert>}
      </div>
    </form>
  );
}
