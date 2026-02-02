import { Test, TestingModule } from '@nestjs/testing';
import { QRGeneratorService } from './qr-generator.service';
import * as QRCode from 'qrcode';

jest.mock('qrcode');

describe('QRGeneratorService', () => {
  let service: QRGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QRGeneratorService],
    }).compile();

    service = module.get<QRGeneratorService>(QRGeneratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQRImage', () => {
    it('should generate QR code image successfully', async () => {
      const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANS...';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockDataUrl);

      const result = await service.generateQRImage('TICKET-123');

      expect(result).toBe(mockDataUrl);
      expect(QRCode.toDataURL).toHaveBeenCalledWith('TICKET-123', {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
    });

    it('should throw error if QR generation fails', async () => {
      (QRCode.toDataURL as jest.Mock).mockRejectedValue(
        new Error('QR generation failed'),
      );

      await expect(service.generateQRImage('TICKET-123')).rejects.toThrow(
        'Erreur génération QR code',
      );
    });

    it('should handle different QR data inputs', async () => {
      const mockDataUrl = 'data:image/png;base64,abc123';
      (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockDataUrl);

      const result = await service.generateQRImage(
        'TICKET-ABCD1234-1738456789',
      );

      expect(result).toBe(mockDataUrl);
    });
  });
});
