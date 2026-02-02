import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QRGeneratorService {
  async generateQRImage(qrCodeData: string): Promise<string> {
    try {
      const options = {
        errorCorrectionLevel: 'H' as const,
        type: 'image/png' as const,
        width: 300,
        margin: 1,
      };

      const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, options);
      return qrCodeBase64;
    } catch {
      throw new Error('Erreur génération QR code');
    }
  }
}
