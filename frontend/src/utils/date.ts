import { format as dateFnsFormat, type Locale } from 'date-fns';
import { fr } from 'date-fns/locale';

const FALLBACK = 'Date non renseignée';

function toValidDate(input: unknown): Date | null {
  if (input == null) return null;
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number' && Number.isFinite(input)) {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'bigint') {
    const d = new Date(Number(input));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Extrait la date d'événement depuis une réponse API (camelCase, snake_case, etc.). */
export function pickEventDate(
  event:
    | { eventDate?: unknown; event_date?: unknown }
    | null
    | undefined,
): unknown {
  if (!event) return undefined;
  const e = event as Record<string, unknown>;
  return (
    e.eventDate ??
    e.event_date ??
    e.EventDate
  );
}

export function safeFormat(
  dateStr: string | Date | unknown,
  formatStr: string,
  options?: { locale?: Locale }
): string {
  const d = toValidDate(dateStr);
  if (!d) return FALLBACK;
  return dateFnsFormat(d, formatStr, { locale: fr, ...options });
}
