import QRCode from 'qrcode';

const DEFAULT_OPTIONS = {
  errorCorrectionLevel: 'H' as const,
  width: 300,
  margin: 1,
};

/**
 * Génère une image QR code (data URL) à partir d'un texte (ex. identifiant du billet).
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, DEFAULT_OPTIONS);
}
