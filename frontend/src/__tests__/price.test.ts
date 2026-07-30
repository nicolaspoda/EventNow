import { describe, it, expect } from 'vitest';
import { parsePrice, formatPrice } from '../utils/price';

describe('parsePrice', () => {
  it('returns a valid number as-is', () => {
    expect(parsePrice(42.5)).toBe(42.5);
  });

  it('returns 0 for NaN', () => {
    expect(parsePrice(NaN)).toBe(0);
  });

  it('parses a numeric string', () => {
    expect(parsePrice('19.99')).toBe(19.99);
  });

  it('returns 0 for a non-numeric string', () => {
    expect(parsePrice('abc')).toBe(0);
  });

  it('parses an object with a numeric toString (e.g. Prisma Decimal)', () => {
    expect(parsePrice({ toString: () => '12.34' })).toBe(12.34);
  });

  it('returns 0 for an object whose toString is not numeric', () => {
    expect(parsePrice({})).toBe(0);
  });

  it('returns 0 for null or undefined', () => {
    expect(parsePrice(null)).toBe(0);
    expect(parsePrice(undefined)).toBe(0);
  });

  it('returns 0 for an unsupported type', () => {
    expect(parsePrice(true)).toBe(0);
  });
});

describe('formatPrice', () => {
  it('formats a number to two decimal places', () => {
    expect(formatPrice(5)).toBe('5.00');
  });

  it('formats a numeric string to two decimal places', () => {
    expect(formatPrice('19.999')).toBe('20.00');
  });

  it('formats an unsupported value as 0.00', () => {
    expect(formatPrice(undefined)).toBe('0.00');
  });
});
