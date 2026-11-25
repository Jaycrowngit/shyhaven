import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SignInFlow } from '@/components/auth/sign-in-flow';
import { Skeleton } from '@/components/ui';
import { getCurrentUser } from '@/lib/dal';
import { safeNext } from '@/lib/session';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  return (
    <Suspense fallback={<Skeleton className="h-[420px] w-full" />}>
      <SignIn searchParams={searchParams} />
    </Suspense>
  );
}

async function SignIn({ searchParams }: { searchParams: PageProps<'/sign-in'>['searchParams'] }) {
  const sp = await searchParams;
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next, '/homes');
  if (await getCurrentUser()) redirect(next);
  // Pages that need an account send people here with ?next=…; tell them why.
  const notice = sp.next && next !== '/homes' ? 'Please sign in to continue.' : undefined;
  return <SignInFlow next={next} notice={notice} />;
}
