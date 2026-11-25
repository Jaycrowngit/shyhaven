'use client';

import { useState, useTransition, type ReactNode } from 'react';
import type { FormState } from '@/lib/form-state';
import { Alert } from './ui';

/** A button that runs one server action and shows its error or success message underneath. */
export function ActionButton({
  action,
  children,
  pendingLabel,
  className,
}: {
  action: () => Promise<FormState | void>;
  children: ReactNode;
  pendingLabel?: string;
  className: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<FormState>({});
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setResult((await action()) ?? {});
          })
        }
      >
        {pending ? (pendingLabel ?? 'Working…') : children}
      </button>
      {result.error && <Alert tone="danger">{result.error}</Alert>}
      {result.success && <Alert tone="verified">{result.success}</Alert>}
    </div>
  );
}
