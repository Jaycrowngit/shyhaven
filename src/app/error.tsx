'use client';

import { btn } from '@/components/ui';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-extrabold text-heading">Something went wrong</h1>
      <p className="text-muted">Please try again. If it keeps happening, contact support{error.digest ? ` and quote ${error.digest}` : ''}.</p>
      <button type="button" onClick={reset} className={btn.primary}>
        Try again
      </button>
    </div>
  );
}
