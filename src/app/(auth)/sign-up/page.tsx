import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SignUpFlow } from '@/components/auth/sign-up-flow';
import { Skeleton } from '@/components/ui';
import { getCurrentUser } from '@/lib/dal';
import { safeNext } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Join SkyHaven to rent a verified home or list your property in Nigeria.',
  robots: { index: false },
};

export default function SignUpPage({ searchParams }: PageProps<'/sign-up'>) {
  return (
    <Suspense fallback={<Skeleton className="h-[640px] w-full" />}>
      <SignUp searchParams={searchParams} />
    </Suspense>
  );
}

async function SignUp({ searchParams }: { searchParams: PageProps<'/sign-up'>['searchParams'] }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const next = safeNext(one(sp.next), '/homes');
  if (await getCurrentUser()) redirect(next);
  return <SignUpFlow next={next} intent={one(sp.intent) === 'list' ? 'list' : 'rent'} />;
}
