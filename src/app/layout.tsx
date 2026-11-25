import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { MotionProvider } from '@/components/motion-provider';
import { SITE_URL } from '@/lib/config';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], weight: ['500', '700', '800'] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'SkyHaven · Find a verified home. Pay safely.', template: '%s · SkyHaven' },
  description: 'Verified homes for rent in Nigeria. Every listing is checked by our team, and your rent is held until you move in.',
  applicationName: 'SkyHaven',
  openGraph: { siteName: 'SkyHaven', type: 'website', locale: 'en_NG' },
};

// Light only, like the marketing site.
export const viewport: Viewport = { themeColor: '#1D5FD6', colorScheme: 'light' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-NG" data-theme="light" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Without JavaScript, scroll-reveal content would stay at its hidden starting style. Show it instead. */}
        <noscript>
          <style>{'[style*="opacity:0"]{opacity:1!important;transform:none!important}'}</style>
        </noscript>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
