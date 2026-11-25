'use client';

import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';

export function SubmitButton({
  children,
  pendingLabel,
  className,
  name,
  value,
  formAction,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className: string;
  name?: string;
  value?: string;
  formAction?: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending} name={name} value={value} formAction={formAction}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          {pendingLabel ?? 'Working…'}
        </>
      ) : (
        children
      )}
    </button>
  );
}
