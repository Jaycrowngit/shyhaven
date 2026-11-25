import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

/** Every page except sign-up, sign-in and password reset: navbar, content, footer. */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
