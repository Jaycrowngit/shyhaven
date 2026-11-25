import Link from 'next/link';
import { LogoMark } from '@/components/logo';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { btn } from '@/components/ui';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
          <LogoMark className="h-14 w-14" />
          <h1 className="font-display text-3xl font-extrabold text-heading">We couldn’t find that page</h1>
          <p className="text-muted">The home may have been rented or removed, or the link may be wrong.</p>
          <Link href="/homes" className={btn.primary}>
            Find a home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
