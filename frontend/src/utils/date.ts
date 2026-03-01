import { format as dateFnsFormat, type Locale } from 'date-fns';
import { fr } from 'date-fns/locale';

const FALLBACK = 'Date non renseignée';

export function safeFormat(
  dateStr: string | Date | unknown,
  formatStr: string,
  options?: { locale?: Locale }
): string {
  if (dateStr instanceof Date) {
    if (Number.isNaN(dateStr.getTime())) return FALLBACK;
    return dateFnsFormat(dateStr, formatStr, { locale: fr, ...options });
  }
  const str = typeof dateStr === 'string' ? dateStr.trim() : '';
  if (!str) return FALLBACK;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return FALLBACK;
  return dateFnsFormat(d, formatStr, { locale: fr, ...options });
}
