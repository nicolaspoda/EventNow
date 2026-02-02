/** Messages techniques du backend à ne pas afficher à l'utilisateur. */
const TECHNICAL_PATTERNS = [
  /exception/i,
  /too many requests/i,
  /bad request/i,
  /internal server error/i,
  /status code \d{3}/i,
  /request failed/i,
];

function isTechnicalMessage(text: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(text));
}

/** Message explicite pour l'utilisateur quand il dépasse la limite de requêtes (429). */
const MESSAGE_TROP_DE_TENTATIVES =
  'Trop de tentatives. Veuillez patienter une minute avant de réessayer.';

/**
 * Retourne un message d'erreur compréhensible pour l'utilisateur, en français,
 * qui explique ce qui s'est passé (pas de code technique ni de message en anglais).
 */
export function getApiErrorMessage(err: unknown, defaultMessage: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as {
      response?: { status?: number; data?: { message?: string | string[] } };
    }).response;
    const status = response?.status;
    const dataMessage = response?.data?.message;

    if (status === 429) {
      return MESSAGE_TROP_DE_TENTATIVES;
    }

    if (dataMessage && typeof dataMessage === 'string' && dataMessage.trim()) {
      const msg = dataMessage.trim();
      if (!isTechnicalMessage(msg)) return msg;
    }
    if (Array.isArray(dataMessage) && dataMessage.length > 0) {
      const first = dataMessage[0];
      const text = (typeof first === 'string' ? first : String(first)).trim();
      if (text && !isTechnicalMessage(text)) return text;
    }
  }
  return defaultMessage;
}
