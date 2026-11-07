export const RANGE_OPTIONS = [7, 30, 90];

const toIso = (date) => date.toISOString().slice(0, 10); // "2026-11-07" (UTC)

// Last N days INCLUDING today, as the server expects (UTC, YYYY-MM-DD).
export function rangeFromDays(days) {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  return { from: toIso(from), to: toIso(to) };
}
