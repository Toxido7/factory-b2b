const MAX_LENGTH = 100;

export function buildSearchUrl(term) {
  const q = term.trim().slice(0, MAX_LENGTH);
  if (!q) return null;
  return `/products?${new URLSearchParams({ q }).toString()}`;
}
