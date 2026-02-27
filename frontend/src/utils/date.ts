import { format as dateFnsFormat, type Locale } from 'date-fns';
import { fr } from 'date-fns/locale';

const FALLBACK = 'Date non renseignée';

export function safeFormat(
  dateStr: string | unknown,
  formatStr: string,
  options?: { locale?: Locale }
): string {
  const str = typeof dateStr === 'string' ? dateStr : '';
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str || FALLBACK;
  return dateFnsFormat(d, formatStr, { locale: fr, ...options });
}
