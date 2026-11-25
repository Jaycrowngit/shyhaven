import Link from 'next/link';
import { container } from '@/components/ui';

export default function AccountLayout({ children }: LayoutProps<'/account'>) {
  return (
    <div className={`${container} flex flex-col gap-6 py-8`}>
      <nav aria-label="Account" className="flex gap-1 border-b border-border">
        {[
          { href: '/account', label: 'My rentals' },
          { href: '/account/saved', label: 'Saved homes' },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-[15px] font-medium text-muted hover:text-primary">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
