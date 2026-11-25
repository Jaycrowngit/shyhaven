import { LISTING_TYPES, type SearchParams } from './types';

type Raw = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const int = (v: string | undefined, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= max ? n : undefined;
};

/** Parses untrusted URL search params into a safe `SearchParams`. Unknown or bad values are dropped. */
export function parseSearchParams(raw: Raw): SearchParams {
  const type = one(raw.type);
  const sort = one(raw.sort);
  return {
    q: one(raw.q)?.slice(0, 80),
    city: one(raw.city)?.slice(0, 60),
    type: (LISTING_TYPES as readonly string[]).includes(type ?? '') ? (type as SearchParams['type']) : undefined,
    minBeds: int(one(raw.minBeds), 12),
    maxRent: int(one(raw.maxRent), 1_000_000_000),
    sort: sort === 'price_asc' || sort === 'price_desc' || sort === 'newest' ? sort : undefined,
    cursor: int(one(raw.cursor), 100_000)?.toString(),
  };
}

export function toQueryString(params: SearchParams): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return s ? `?${s}` : '';
}
