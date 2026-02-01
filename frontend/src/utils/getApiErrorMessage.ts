export function getApiErrorMessage(err: unknown, defaultMessage: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { status?: number; data?: { message?: string } } })
      .response;
    if (response?.status === 429) {
      return 'Vous avez atteint la limite de réservations (10 par minute). Veuillez patienter un moment avant de réessayer.';
    }
    if (response?.data?.message && typeof response.data.message === 'string') {
      return response.data.message;
    }
  }
  if (err instanceof Error) return err.message;
  return defaultMessage;
}
