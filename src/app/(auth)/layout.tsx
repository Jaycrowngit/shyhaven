import Link from 'next/link';
import { AuthCarousel } from '@/components/auth/auth-carousel';
import { Logo } from '@/components/logo';

/**
 * Sign up, sign in and password reset. Large screens: photo carousel on the left, the form centred on the right.
 * Phones: the form only, so it starts at the top of the screen.
 */
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-4 lg:p-4">
      <div className="hidden lg:block">
        <div className="sticky top-4 h-[calc(100dvh-2rem)]">
          <AuthCarousel />
        </div>
      </div>

      <div className="flex min-h-dvh flex-col items-center px-5 py-8 sm:px-10 lg:min-h-0 lg:py-10">
        <Link href="/" aria-label="SkyHaven home">
          <Logo className="h-8 w-auto" />
        </Link>
        <main id="main" className="flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          {children}
        </main>
        <p className="text-center text-xs text-muted">
          © SkyHaven ·{' '}
          <Link href="/trust-and-safety#policy" className="hover:text-primary hover:underline">
            Terms and policy
          </Link>
        </p>
      </div>
    </div>
  );
}
