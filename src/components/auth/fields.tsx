'use client';

import { motion } from 'motion/react';
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from 'react';
import { PASSWORD_MIN, passwordStrength } from '@/lib/schemas';
import { CheckIcon } from '../ui';

const inputCls =
  'w-full rounded-xl border border-border bg-white px-4 py-3.5 text-[15px] text-navy placeholder:text-[#7D8A9C] transition-[border-color,box-shadow] focus:border-primary focus:ring-4 focus:ring-primary/15 focus:outline-none aria-invalid:border-danger aria-invalid:focus:ring-danger/15';

export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col items-center gap-1.5 text-center">
      <h1 className="font-display text-[1.7rem] leading-tight font-extrabold tracking-[-0.02em] text-navy">{title}</h1>
      {children && <div className="text-[15px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="text-sm text-danger" role="alert">
      {children}
    </p>
  );
}

/**
 * A field's server error disappears as soon as the user edits that field, and comes back if the next submit
 * fails again. Listening to the form's own submit event avoids threading extra props through every form.
 */
function useLiveError(error?: string) {
  const ref = useRef<HTMLInputElement>(null);
  const [edited, setEdited] = useState(false);
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const rearm = () => setEdited(false);
    form.addEventListener('submit', rearm);
    return () => form.removeEventListener('submit', rearm);
  }, []);
  return { ref, error: edited ? undefined : error, markEdited: () => setEdited(true) };
}

export function TextField({
  name,
  label,
  error: serverError,
  hint,
  aside,
  ...props
}: { name: string; label: string; error?: string; hint?: ReactNode; aside?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  // Unique per instance: Next keeps recently visited pages mounted (hidden), so name-based ids would collide.
  const id = `f-${name}-${useId()}`;
  const { ref, error, markEdited } = useLiveError(serverError);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-navy">
          {label}
        </label>
        {aside}
      </div>
      <input
        ref={ref}
        id={id}
        name={name}
        className={inputCls}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onInput={markEdited}
        {...props}
      />
      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Nigerian mobile number with a fixed +234 prefix. Accepts 0803…, 803… or +234803…; the server normalises it. */
export function PhoneField({
  name = 'phone',
  label = 'Mobile number',
  error: serverError,
  defaultValue,
  value,
  onValueChange,
  autoFocus,
}: {
  name?: string;
  label?: string;
  error?: string;
  defaultValue?: string;
  /** Pass `value` and `onValueChange` to control it from a multi-step form. */
  value?: string;
  onValueChange?: (v: string) => void;
  autoFocus?: boolean;
}) {
  const id = `f-${name}-${useId()}`;
  const { ref, error, markEdited } = useLiveError(serverError);
  const controlled = value !== undefined ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onValueChange?.(e.target.value) } : { defaultValue };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-navy">
        {label}
      </label>
      <div
        className={`flex overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 ${error ? 'border-danger' : 'border-border'}`}
      >
        <span className="flex items-center gap-2 border-r border-border bg-[#F5F8FC] px-3.5 text-[15px] font-semibold text-navy" aria-hidden>
          <span className="inline-flex h-4 w-6 overflow-hidden rounded-[3px] border border-black/10">
            <span className="w-1/3 bg-[#008751]" />
            <span className="w-1/3 bg-white" />
            <span className="w-1/3 bg-[#008751]" />
          </span>
          +234
        </span>
        <input
          ref={ref}
          onInput={markEdited}
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="803 123 4567"
          {...controlled}
          autoFocus={autoFocus}
          required
          className="min-w-0 flex-1 px-4 py-3.5 text-[15px] text-navy placeholder:text-[#7D8A9C] focus:outline-none"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/**
 * Password input with show/hide, a Caps Lock warning, and (for new passwords) a live strength meter and checklist.
 * The checklist mirrors `passwordSchema`; the server is what actually enforces it.
 */
export function PasswordField({
  name = 'password',
  label = 'Password',
  error: serverError,
  isNew = false,
  aside,
  autoFocus,
  autoComplete,
  value: controlledValue,
  onValueChange,
}: {
  name?: string;
  label?: string;
  error?: string;
  isNew?: boolean;
  aside?: ReactNode;
  autoFocus?: boolean;
  autoComplete?: string;
  /** Pass `value` and `onValueChange` to control it from a multi-step form. */
  value?: string;
  onValueChange?: (v: string) => void;
}) {
  const id = `f-${name}-${useId()}`;
  const { ref, error, markEdited } = useLiveError(serverError);
  const [ownValue, setOwnValue] = useState('');
  const value = controlledValue ?? ownValue;
  const setValue = (v: string) => (onValueChange ? onValueChange(v) : setOwnValue(v));
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const strength = passwordStrength(value);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;
  const colors = ['', 'bg-danger', 'bg-accent', 'bg-primary', 'bg-verified'] as const;
  const rules = [
    { ok: value.length >= PASSWORD_MIN, text: `At least ${PASSWORD_MIN} characters` },
    { ok: /[A-Za-z]/.test(value) && /\d/.test(value), text: 'A letter and a number' },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-navy">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete ?? (isNew ? 'new-password' : 'current-password')}
          required
          minLength={isNew ? PASSWORD_MIN : undefined}
          maxLength={128}
          autoFocus={autoFocus}
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            markEdited();
          }}
          onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
          onBlur={() => setCapsLock(false)}
          className={`${inputCls} pr-20`}
          aria-invalid={!!error}
          aria-describedby={[error && `${id}-error`, isNew && `${id}-rules`].filter(Boolean).join(' ') || undefined}
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          {visible ? 'Hide' : 'Show'}
          <span className="sr-only"> password</span>
        </button>
      </div>
      {capsLock && <p className="text-sm font-medium text-[#9A5A0C]">Caps Lock is on.</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
      {isNew && (
        <div id={`${id}-rules`} className="mt-1 flex flex-col gap-2">
          <div className="flex items-center gap-3" aria-live="polite">
            <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className="h-1.5 overflow-hidden rounded-full bg-border">
                  <motion.span
                    className={`block h-full ${colors[strength] || 'bg-border'}`}
                    initial={false}
                    animate={{ width: strength >= n ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              ))}
            </div>
            <span className="w-14 text-right text-xs font-semibold text-muted">{value ? labels[strength] : ''}</span>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {rules.map((r) => (
              <li key={r.text} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-verified' : 'text-muted'}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full ${r.ok ? 'bg-verified text-white' : 'border border-border'}`}>
                  {r.ok && <CheckIcon className="h-2.5 w-2.5" />}
                </span>
                {r.text}
                <span className="sr-only">{r.ok ? ' (done)' : ' (not yet)'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Six-box code entry. It is one real input (so paste, SMS autofill and screen readers all work) drawn as six boxes.
 * Submits the form by itself once six digits are in.
 */
export function CodeField({ error, autoSubmit = true }: { error?: string; autoSubmit?: boolean }) {
  const id = `f-code-${useId()}`;
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(true);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoSubmit && value.length === 6) ref.current?.form?.requestSubmit();
  }, [value, autoSubmit]);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-navy">
        6-digit code
      </label>
      <div className="relative" onClick={() => ref.current?.focus()}>
        <input
          ref={ref}
          id={id}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        />
        <div className="grid grid-cols-6 gap-2 sm:gap-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => {
            const active = focused && (i === value.length || (i === 5 && value.length === 6));
            return (
              <span
                key={i}
                className={`flex aspect-[5/6] items-center justify-center rounded-xl border-2 font-display text-2xl font-bold text-navy transition-colors ${
                  error ? 'border-danger/60' : active ? 'border-primary ring-4 ring-primary/15' : value[i] ? 'border-navy/30' : 'border-border'
                }`}
              >
                {value[i] ?? (active ? <span className="h-6 w-0.5 animate-pulse bg-primary" /> : '')}
              </span>
            );
          })}
        </div>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/** "Resend code" with a countdown. Calls `onResend`, which should return the next cooldown in seconds or an error. */
export function ResendCode({ initialSeconds, onResend }: { initialSeconds: number; onResend: () => Promise<{ resendIn?: number; error?: string; success?: string }> }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [note, setNote] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="flex flex-col items-center gap-1 text-sm">
      {seconds > 0 ? (
        <p className="text-muted">
          Didn’t get it? You can ask for a new code in <span className="font-semibold text-navy tabular-nums">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
        </p>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await onResend();
              if (res.error) setNote({ tone: 'err', text: res.error });
              else setNote({ tone: 'ok', text: res.success ?? 'We sent a new code.' });
              setSeconds(res.resendIn ?? 60);
            })
          }
          className="font-semibold text-primary hover:underline disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Send a new code'}
        </button>
      )}
      {note && (
        <p className={note.tone === 'ok' ? 'text-verified' : 'text-danger'} role="status">
          {note.text}
        </p>
      )}
    </div>
  );
}

/** Shown only on test data, where no SMS is sent. */
export function TestCodeNotice({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <p className="rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm text-primary" role="status">
      Test mode: no SMS is sent. Your code is <strong className="font-mono tracking-[0.3em]">{code}</strong>
    </p>
  );
}

export function FormAlert({ tone = 'danger', children }: { tone?: 'danger' | 'success'; children?: ReactNode }) {
  if (!children) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm ${tone === 'danger' ? 'border-danger/30 bg-danger/5 text-danger' : 'border-verified/30 bg-verified/10 text-verified'}`}
    >
      {children}
    </motion.div>
  );
}

export const authInputCls = inputCls;
