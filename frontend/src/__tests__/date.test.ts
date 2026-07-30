import { describe, it, expect } from 'vitest';
import { pickEventDate, safeFormat } from '../utils/date';

describe('pickEventDate', () => {
  it('returns undefined for a null or undefined event', () => {
    expect(pickEventDate(null)).toBeUndefined();
    expect(pickEventDate(undefined)).toBeUndefined();
  });

  it('reads eventDate first', () => {
    expect(pickEventDate({ eventDate: '2026-01-01' })).toBe('2026-01-01');
  });

  it('falls back to event_date when eventDate is missing', () => {
    expect(pickEventDate({ event_date: '2026-02-02' })).toBe('2026-02-02');
  });

  it('falls back to EventDate when neither eventDate nor event_date is set', () => {
    const event = { EventDate: '2026-03-03' } as { eventDate?: unknown };
    expect(pickEventDate(event)).toBe('2026-03-03');
  });

  it('returns undefined when no known key is present', () => {
    expect(pickEventDate({})).toBeUndefined();
  });
});

describe('safeFormat', () => {
  const FALLBACK = 'Date non renseignée';

  it('returns the fallback for null or undefined', () => {
    expect(safeFormat(null, 'dd/MM/yyyy')).toBe(FALLBACK);
    expect(safeFormat(undefined, 'dd/MM/yyyy')).toBe(FALLBACK);
  });

  it('formats a valid Date instance', () => {
    expect(safeFormat(new Date('2026-06-15T00:00:00Z'), 'yyyy-MM-dd')).toBe(
      '2026-06-15',
    );
  });

  it('returns the fallback for an invalid Date instance', () => {
    expect(safeFormat(new Date('invalid'), 'yyyy-MM-dd')).toBe(FALLBACK);
  });

  it('formats a valid numeric timestamp', () => {
    const timestamp = new Date('2026-06-15T00:00:00Z').getTime();
    expect(safeFormat(timestamp, 'yyyy-MM-dd')).toBe('2026-06-15');
  });

  it('returns the fallback for a non-finite number', () => {
    expect(safeFormat(NaN, 'yyyy-MM-dd')).toBe(FALLBACK);
    expect(safeFormat(Infinity, 'yyyy-MM-dd')).toBe(FALLBACK);
  });

  it('returns the fallback for a finite number outside the valid date range', () => {
    expect(safeFormat(8.65e15, 'yyyy-MM-dd')).toBe(FALLBACK);
  });

  it('formats a valid bigint timestamp', () => {
    const timestamp = BigInt(new Date('2026-06-15T00:00:00Z').getTime());
    expect(safeFormat(timestamp, 'yyyy-MM-dd')).toBe('2026-06-15');
  });

  it('returns the fallback for a bigint outside the valid date range', () => {
    expect(safeFormat(BigInt(8.65e15), 'yyyy-MM-dd')).toBe(FALLBACK);
  });

  it('formats a valid date string', () => {
    expect(safeFormat('2026-06-15T00:00:00Z', 'yyyy-MM-dd')).toBe('2026-06-15');
  });

  it('returns the fallback for an empty or whitespace-only string', () => {
    expect(safeFormat('', 'yyyy-MM-dd')).toBe(FALLBACK);
    expect(safeFormat('   ', 'yyyy-MM-dd')).toBe(FALLBACK);
  });

  it('returns the fallback for an unparsable string', () => {
    expect(safeFormat('not-a-date', 'yyyy-MM-dd')).toBe(FALLBACK);
  });

  it('returns the fallback for an unsupported type', () => {
    expect(safeFormat(true, 'yyyy-MM-dd')).toBe(FALLBACK);
    expect(safeFormat({ foo: 'bar' }, 'yyyy-MM-dd')).toBe(FALLBACK);
  });

  it('allows overriding the locale option', () => {
    const result = safeFormat('2026-06-15T00:00:00Z', 'EEEE', {});
    expect(result).not.toBe(FALLBACK);
  });
});
