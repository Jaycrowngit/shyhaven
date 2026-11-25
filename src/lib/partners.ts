/**
 * Partners and sponsors shown in the landing page carousel.
 *
 * Only list organisations that have agreed in writing to appear, and use the logo files they supply.
 * To add one: put the logo in `public/partners/` (SVG or a transparent PNG, about 160×48) and add
 * `{ name: 'Company name', logo: '/partners/company.svg', href: 'https://…' }`.
 *
 * Until real partners are signed, the entries below are placeholders describing the kind of partner each slot is for.
 */
export interface Partner {
  name: string;
  /** Short description shown on placeholder slots. */
  role?: string;
  logo?: string;
  href?: string;
}

export const PARTNERS: Partner[] = [
  { name: 'Payment partner', role: 'Secure checkout' },
  { name: 'Identity partner', role: 'ID verification' },
  { name: 'Banking partner', role: 'Landlord payouts' },
  { name: 'Legal partner', role: 'Tenancy law' },
  { name: 'Estate partner', role: 'Managed estates' },
  { name: 'Developer partner', role: 'New builds' },
  { name: 'Sponsor', role: 'Launch sponsor' },
  { name: 'Community partner', role: 'Renter support' },
];
