'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { requestOtpAction, signInAction, verifyOtpAction, type OtpState, type SignInState } from '@/app/actions/auth';
import { SubmitButton } from '../submit-button';
import { AuthHeading, CodeField, FormAlert, PasswordField, ResendCode, TestCodeNotice, TextField } from './fields';

const ease = [0.22, 1, 0.36, 1] as const;
const btnPrimary =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--sh-primary-hover)] disabled:opacity-60';

export function SignInFlow({ next, notice }: { next: string; notice?: string }) {
  const [method, setMethod] = useState<'password' | 'code'>('password');
  const q = `?next=${encodeURIComponent(next)}`;
  return (
    <>
      <AuthHeading title="Welcome back">
        New to SkyHaven?{' '}
        <Link href={`/sign-up${q}`} className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </AuthHeading>
      {notice && (
        <div className="mb-5">
          <FormAlert tone="success">{notice}</FormAlert>
        </div>
      )}

      <div role="tablist" aria-label="Sign in with" className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-[#F5F8FC] p-1.5">
        {(
          [
            ['password', 'Password'],
            ['code', 'One-time code'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={method === key}
            onClick={() => setMethod(key)}
            className={`relative rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${method === key ? 'text-navy' : 'text-muted hover:text-navy'}`}
          >
            {method === key && <motion.span layoutId="signin-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease }}>
          {method === 'password' ? <PasswordSignIn next={next} /> : <CodeSignIn next={next} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function PasswordSignIn({ next }: { next: string }) {
  const [state, action] = useActionState(signInAction, {} as SignInState);
  const f = state.fields ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormAlert>{state.error}</FormAlert>
      <TextField
        name="identifier"
        label="Phone number or email"
        autoComplete="username"
        inputMode="email"
        placeholder="0803 123 4567"
        defaultValue={state.identifier}
        error={f.identifier}
        autoFocus
        required
      />
      <PasswordField
        error={f.password}
        aside={
          <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Forgot password?
          </Link>
        }
      />
      <SubmitButton className={btnPrimary} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

function CodeSignIn({ next }: { next: string }) {
  const [request, send] = useActionState(requestOtpAction, { step: 'request' } as OtpState);
  if (request.step === 'verify') return <CodeVerify key={request.destination} start={request} next={next} />;
  return (
    <form action={send} className="flex flex-col gap-5" noValidate>
      <p className="text-[15px] text-muted">We’ll send a 6-digit code to your phone or email. No password needed.</p>
      <FormAlert>{request.error}</FormAlert>
      <TextField
        name="destination"
        label="Phone number or email"
        autoComplete="username"
        inputMode="email"
        placeholder="0803 123 4567"
        error={request.fields?.destination}
        autoFocus
        required
      />
      <SubmitButton className={btnPrimary} pendingLabel="Sending code…">
        Send code
      </SubmitButton>
    </form>
  );
}

function CodeVerify({ start, next }: { start: OtpState; next: string }) {
  const [state, verify] = useActionState(verifyOtpAction, start);
  const [devCode, setDevCode] = useState(start.devCode);
  return (
    <form action={verify} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <p className="text-[15px] text-muted">
        Enter the code we sent to <strong className="text-navy">{start.sentTo}</strong>.
      </p>
      <TestCodeNotice code={devCode} />
      <FormAlert>{state.error}</FormAlert>
      <CodeField error={state.fields?.code} />
      <SubmitButton className={btnPrimary} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
      <ResendCode
        initialSeconds={start.resendIn ?? 60}
        onResend={async () => {
          const fd = new FormData();
          fd.set('destination', start.destination ?? '');
          const res = await requestOtpAction({ step: 'request' }, fd);
          if (res.devCode) setDevCode(res.devCode);
          return { resendIn: res.resendIn, error: res.error, success: res.error ? undefined : 'We sent a new code.' };
        }}
      />
    </form>
  );
}
