/**
 * Calendar dates in Lagos (UTC+1, no daylight saving), as YYYY-MM-DD.
 * Reads the clock, so call it only at request time (after `connection()` or a cookie read).
 */
export function lagosDate(offsetDays = 0): string {
  return new Date(Date.now() + 3_600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
}
