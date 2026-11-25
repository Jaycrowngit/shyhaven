import Link from 'next/link';
import { container } from '@/components/ui';

export default function LandlordLayout({ children }: LayoutProps<'/landlord'>) {
  return (
    <div className={`${container} flex flex-col gap-6 py-8`}>
      <nav aria-label="Landlord" className="flex gap-1 overflow-x-auto border-b border-border">
        {[
          { href: '/landlord', label: 'Dashboard' },
          { href: '/landlord/listings/new', label: 'New listing' },
          { href: '/landlord/onboarding', label: 'Account setup' },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="-mb-px shrink-0 border-b-2 border-transparent px-3 py-2.5 text-[15px] font-medium text-muted hover:text-primary">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
