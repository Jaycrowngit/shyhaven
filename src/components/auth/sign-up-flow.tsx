'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from 'react';
import { resendSignUpCodeAction, signUpAction, verifySignUpAction, type SignUpState } from '@/app/actions/auth';
import { fieldErrors, signUpSchema } from '@/lib/schemas';
import { SubmitButton } from '../submit-button';
import { CheckIcon, KeyIcon, ShieldIcon } from '../ui';
import { CodeField, FormAlert, PasswordField, PhoneField, ResendCode, TestCodeNotice, TextField } from './fields';

const ease = [0.22, 1, 0.36, 1] as const;
const btnPrimary =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--sh-primary-hover)] disabled:opacity-60';
const btnBack = 'inline-flex items-center justify-center rounded-xl border border-border px-5 py-3.5 text-[15px] font-semibold text-navy hover:border-primary hover:text-primary';

/** The four steps. The fields listed are validated before the user can leave that step. */
const STEPS = [
  { title: 'Choose your account type', fields: ['intent'] },
  { title: 'Tell us about you', fields: ['firstName', 'lastName', 'email', 'phone'] },
  { title: 'Create a password', fields: ['password', 'confirm', 'terms'] },
  { title: 'Verify your phone number', fields: [] },
] as const;

interface Values {
  intent: 'rent' | 'list';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  terms: boolean;
}

const toRaw = (v: Values) => ({ ...v, terms: v.terms ? 'on' : undefined });
const stepOf = (field: string) => STEPS.findIndex((s) => (s.fields as readonly string[]).includes(field));

export function SignUpFlow({ next, intent }: { next: string; intent: 'rent' | 'list' }) {
  const [values, setValues] = useState<Values>({ intent, firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '', terms: false });
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [server, submit, pending] = useActionState(signUpAction, { step: 'details' } as SignUpState);
  const [handled, setHandled] = useState(server);

  // A new answer from the server: move to code entry, or back to the step that has a problem.
  if (server !== handled) {
    setHandled(server);
    if (server.step === 'verify') {
      setDirection(1);
      setStep(3);
    } else if (server.fields) {
      setErrors(server.fields);
      const bad = Math.min(...Object.keys(server.fields).map(stepOf).filter((i) => i >= 0));
      if (Number.isFinite(bad)) setStep(bad);
    }
  }

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  function go(to: number) {
    setDirection(to > step ? 1 : -1);
    setStep(to);
  }

  /** Checks the current step's fields only; on success moves on, or sends everything on the last step. */
  function onContinue(e: FormEvent) {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(toRaw(values));
    const all = parsed.success ? {} : fieldErrors(parsed.error);
    const mine = Object.fromEntries(Object.entries(all).filter(([k]) => (STEPS[step].fields as readonly string[]).includes(k)));
    setErrors(mine);
    if (Object.keys(mine).length) return;
    if (step < 2) return go(step + 1);
    const fd = new FormData();
    for (const [k, v] of Object.entries(toRaw(values))) if (v !== undefined) fd.set(k, String(v));
    startTransition(() => submit(fd));
  }

  return (
    <div>
      <Progress step={step} />
      {server.error && step < 3 && (
        <div className="mb-5">
          <FormAlert>{server.error}</FormAlert>
        </div>
      )}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={{ enter: (d: number) => ({ opacity: 0, x: 28 * d }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: -28 * d }) }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease }}
        >
          {step === 0 && (
            <StepForm onSubmit={onContinue} footer={<ContinueButton>Continue</ContinueButton>}>
              <div className="grid gap-3" role="radiogroup" aria-label="Account type">
                {(
                  [
                    { value: 'rent', icon: <KeyIcon className="h-6 w-6" />, title: 'I’m looking for a home', body: 'Find verified homes and pay safely.' },
                    { value: 'list', icon: <ShieldIcon className="h-6 w-6" />, title: 'I’m a landlord', body: 'List your property and get paid after move-in.' },
                  ] as const
                ).map((o) => {
                  const on = values.intent === o.value;
                  return (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                        on ? 'border-primary bg-primary-soft/60' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <input type="radio" name="intent" value={o.value} checked={on} onChange={() => set('intent', o.value)} className="sr-only" />
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${on ? 'bg-primary text-white' : 'bg-[#F5F8FC] text-primary'}`}>
                        {o.icon}
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold text-navy">{o.title}</span>
                        <span className="text-sm text-muted">{o.body}</span>
                      </span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? 'border-primary bg-primary text-white' : 'border-border'}`} aria-hidden>
                        {on && <CheckIcon className="h-3.5 w-3.5" />}
                      </span>
                    </label>
                  );
                })}
              </div>
            </StepForm>
          )}

          {step === 1 && (
            <StepForm
              onSubmit={onContinue}
              footer={
                <>
                  <BackButton onClick={() => go(0)} />
                  <ContinueButton>Continue</ContinueButton>
                </>
              }
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField name="firstName" label="First name" autoComplete="given-name" value={values.firstName} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} autoFocus />
                <TextField name="lastName" label="Last name" autoComplete="family-name" value={values.lastName} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
              </div>
              <TextField name="email" type="email" label="Email address" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
              <PhoneField label="Phone number" value={values.phone} onValueChange={(v) => set('phone', v)} error={errors.phone} />
              <p className="-mt-2 text-sm text-muted">We’ll send a code to this number to confirm it’s yours.</p>
            </StepForm>
          )}

          {step === 2 && (
            <StepForm
              onSubmit={onContinue}
              footer={
                <>
                  <BackButton onClick={() => go(1)} />
                  <ContinueButton pending={pending}>Create account</ContinueButton>
                </>
              }
            >
              <PasswordField isNew value={values.password} onValueChange={(v) => set('password', v)} error={errors.password} autoFocus />
              <PasswordField name="confirm" label="Confirm password" autoComplete="new-password" value={values.confirm} onValueChange={(v) => set('confirm', v)} error={errors.confirm} />
              <div className="flex flex-col gap-1.5">
                <label className="flex items-start gap-3 text-sm text-muted">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={values.terms}
                    onChange={(e) => set('terms', e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--sh-primary)]"
                    aria-invalid={!!errors.terms}
                  />
                  <span>
                    I agree to the{' '}
                    <Link href="/trust-and-safety#policy" target="_blank" className="font-semibold text-primary hover:underline">
                      terms and policy
                    </Link>
                  </span>
                </label>
                {errors.terms && (
                  <p className="text-sm text-danger" role="alert">
                    {errors.terms}
                  </p>
                )}
              </div>
            </StepForm>
          )}

          {step === 3 && server.step === 'verify' && <VerifyStep key={server.signupId} start={server} next={next} onBack={() => go(1)} />}
        </motion.div>
      </AnimatePresence>

      {step < 3 && (
        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="mb-7 text-center">
      <p className="text-sm font-semibold text-primary">
        Step {step + 1} of {STEPS.length}
      </p>
      <h1 className="mt-1 font-display text-[1.7rem] leading-tight font-extrabold tracking-[-0.02em] text-navy">{STEPS[step].title}</h1>
      <div className="mt-4 grid grid-cols-4 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Sign-up progress">
        {STEPS.map((s, i) => (
          <span key={s.title} className="h-1.5 overflow-hidden rounded-full bg-border">
            <motion.span className="block h-full rounded-full bg-primary" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.4, ease }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function StepForm({ onSubmit, children, footer }: { onSubmit: (e: FormEvent) => void; children: ReactNode; footer: ReactNode }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {children}
      <div className="mt-2 flex gap-3">{footer}</div>
    </form>
  );
}

function ContinueButton({ children, pending = false }: { children: ReactNode; pending?: boolean }) {
  return (
    <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          Sending your code…
        </>
      ) : (
        children
      )}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={btnBack}>
      Back
    </button>
  );
}

function VerifyStep({ start, next, onBack }: { start: SignUpState; next: string; onBack: () => void }) {
  const [state, verify] = useActionState(verifySignUpAction, start);
  const [sent, setSent] = useState({ to: start.sentTo, devCode: start.devCode });
  return (
    <>
      <p className="mb-5 text-center text-[15px] text-muted">
        Enter the 6-digit code we sent to <strong className="text-navy">{sent.to}</strong>. It expires in 10 minutes.
      </p>
      <form action={verify} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <TestCodeNotice code={sent.devCode} />
        <FormAlert>{state.error}</FormAlert>
        {state.step === 'details' && (
          <p className="text-sm">
            <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
              Go to sign in
            </Link>{' '}
            or{' '}
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              reset your password
            </Link>
          </p>
        )}
        <CodeField error={state.fields?.code} />
        <SubmitButton className={btnPrimary} pendingLabel="Verifying…">
          Verify and finish
        </SubmitButton>
        <ResendCode
          initialSeconds={start.resendIn ?? 60}
          onResend={async () => {
            const res = await resendSignUpCodeAction(start.signupId!);
            if (res.sentTo) setSent({ to: res.sentTo, devCode: res.devCode });
            return res;
          }}
        />
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Wrong number?{' '}
        <button type="button" onClick={onBack} className="font-semibold text-primary hover:underline">
          Change it
        </button>
      </p>
    </>
  );
}
