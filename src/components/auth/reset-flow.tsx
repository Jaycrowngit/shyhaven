'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { forgotPasswordAction, resendResetCodeAction, resetPasswordAction, verifyResetCodeAction, type ResetState } from '@/app/actions/auth';
import { SubmitButton } from '../submit-button';
import { AuthHeading, CodeField, FormAlert, PasswordField, ResendCode, TestCodeNotice, TextField } from './fields';

const ease = [0.22, 1, 0.36, 1] as const;
const btnPrimary =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--sh-primary-hover)] disabled:opacity-60';

/** Forgot password: identify → code → new password. Each step's result feeds the next. */
export function ResetFlow() {
  const [state, setState] = useState<ResetState>({ step: 'request' });
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={state.step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
        {state.step === 'request' && <RequestStep initial={state} onDone={setState} />}
        {state.step === 'verify' && <VerifyStep initial={state} onDone={setState} />}
        {state.step === 'password' && <PasswordStep initial={state} onRestart={setState} />}
      </motion.div>
    </AnimatePresence>
  );
}

/** Runs a server action and hands the result to the parent flow when it moves to another step. */
function useStep(action: (prev: ResetState, fd: FormData) => Promise<ResetState>, initial: ResetState, onDone: (s: ResetState) => void) {
  return useActionState(async (prev: ResetState, fd: FormData) => {
    const next = await action(prev, fd);
    if (next.step !== initial.step) onDone(next);
    return next;
  }, initial);
}

function RequestStep({ initial, onDone }: { initial: ResetState; onDone: (s: ResetState) => void }) {
  const [state, action] = useStep(forgotPasswordAction, initial, onDone);
  return (
    <>
      <AuthHeading title="Reset your password">Enter the phone number or email on your account and we’ll send you a code to set a new password.</AuthHeading>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <FormAlert>{state.error}</FormAlert>
        <TextField
          name="identifier"
          label="Phone number or email"
          autoComplete="username"
          inputMode="email"
          placeholder="0803 123 4567"
          defaultValue={state.identifier}
          error={state.fields?.identifier}
          autoFocus
          required
        />
        <SubmitButton className={btnPrimary} pendingLabel="Sending code…">
          Send code
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{' '}
        <Link href="/sign-in" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}

function VerifyStep({ initial, onDone }: { initial: ResetState; onDone: (s: ResetState) => void }) {
  const [current, setCurrent] = useState(initial);
  const [state, action] = useStep(verifyResetCodeAction, current, onDone);
  return (
    <>
      <AuthHeading title="Check your messages">
        If <strong className="text-navy">{current.sentTo}</strong> belongs to a SkyHaven account, we’ve sent it a 6-digit code. It expires in 10 minutes.
      </AuthHeading>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="resetId" value={current.resetId} />
        <TestCodeNotice code={current.devCode} />
        <FormAlert>{state.error}</FormAlert>
        <CodeField error={state.fields?.code} />
        <SubmitButton className={btnPrimary} pendingLabel="Checking…">
          Continue
        </SubmitButton>
        <ResendCode
          initialSeconds={current.resendIn ?? 60}
          onResend={async () => {
            const res = await resendResetCodeAction(current.identifier ?? '');
            if (res.resetId) setCurrent((c) => ({ ...c, resetId: res.resetId, sentTo: res.sentTo, devCode: res.devCode }));
            return res;
          }}
        />
      </form>
    </>
  );
}

function PasswordStep({ initial, onRestart }: { initial: ResetState; onRestart: (s: ResetState) => void }) {
  const [state, action] = useStep(resetPasswordAction, initial, onRestart);
  return (
    <>
      <AuthHeading title="Choose a new password">For your security, this signs you out on every other phone and computer.</AuthHeading>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <FormAlert>{state.error}</FormAlert>
        <PasswordField isNew label="New password" error={state.fields?.password} autoFocus />
        <PasswordField name="confirm" label="Confirm new password" autoComplete="new-password" error={state.fields?.confirm} />
        <SubmitButton className={btnPrimary} pendingLabel="Saving…">
          Save password and sign in
        </SubmitButton>
      </form>
    </>
  );
}
