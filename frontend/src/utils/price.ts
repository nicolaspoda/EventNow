export function parsePrice(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isNaN(n) ? 0 : n;
  }
  if (value != null && typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
    const s = (value as { toString: () => string }).toString();
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

export function formatPrice(value: unknown): string {
  return parsePrice(value).toFixed(2);
}
