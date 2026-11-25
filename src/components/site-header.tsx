import Link from 'next/link';
import { Suspense } from 'react';
import { signOutAction } from '@/app/actions/auth';
import { getCurrentUser } from '@/lib/dal';
import { NavBar } from './nav-bar';
import { btn, Skeleton } from './ui';

/** Server wrapper: the sign-in state is read here and handed to the client navbar as ready-made slots. */
export function SiteHeader() {
  return (
    <NavBar
      desktopAuth={
        <Suspense fallback={<Skeleton className="h-10 w-48" />}>
          <UserNav variant="desktop" />
        </Suspense>
      }
      mobileAuth={
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <UserNav variant="mobile" />
        </Suspense>
      }
    />
  );
}

async function UserNav({ variant }: { variant: 'desktop' | 'mobile' }) {
  const user = await getCurrentUser();
  const mobile = variant === 'mobile';

  if (!user) {
    return mobile ? (
      <>
        <Link href="/sign-up" className={`${btn.primary} w-full`}>
          Get Started
        </Link>
        <Link href="/sign-in" className={`${btn.secondary} w-full`}>
          Sign In
        </Link>
      </>
    ) : (
      <>
        <Link href="/sign-in" className="rounded-full px-4 py-2 text-[15px] font-semibold whitespace-nowrap text-navy hover:text-primary">
          Sign In
        </Link>
        <Link href="/sign-up" className={`${btn.primary} ${btn.small} px-5 whitespace-nowrap`}>
          Get Started
        </Link>
      </>
    );
  }

  const links = [
    { href: '/account', label: 'My rentals' },
    { href: '/account/saved', label: 'Saved homes' },
    user.roles.includes('landlord') ? { href: '/landlord', label: 'Landlord dashboard' } : { href: '/landlord/start', label: 'List your property' },
  ];

  if (mobile) {
    return (
      <>
        <p className="px-3 text-sm text-muted">Signed in as {user.name ?? user.phone ?? user.email}</p>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-xl px-3 py-2.5 font-medium text-navy hover:bg-primary-soft">
            {l.label}
          </Link>
        ))}
        <form action={signOutAction}>
          <button type="submit" className={`${btn.secondary} mt-2 w-full`}>
            Sign out
          </button>
        </form>
      </>
    );
  }

  const initials = (user.name ?? user.phone ?? user.email ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <details className="relative">
      <summary className="flex cursor-pointer items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 hover:border-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary" aria-hidden>
          {initials}
        </span>
        <span className="max-w-32 truncate text-sm font-medium">{user.name?.split(' ')[0] ?? 'Account'}</span>
      </summary>
      <div className="absolute right-0 mt-2 flex w-60 flex-col rounded-[14px] border border-border bg-white p-2 text-[15px] shadow-xl">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2.5 hover:bg-primary-soft">
            {l.label}
          </Link>
        ))}
        <form action={signOutAction} className="mt-1 border-t border-border pt-1">
          <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left text-muted hover:bg-primary-soft">
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
