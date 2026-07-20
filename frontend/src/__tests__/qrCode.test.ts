import { describe, it, expect, vi, beforeEach } from 'vitest';
import QRCode from 'qrcode';
import { generateQRCodeDataUrl } from '../utils/qrCode';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateQRCodeDataUrl', () => {
  it('generates a data URL using the given text and default options', async () => {
    vi.mocked(QRCode.toDataURL).mockResolvedValue('data:image/png;base64,fake');

    const result = await generateQRCodeDataUrl('ticket-123');

    expect(QRCode.toDataURL).toHaveBeenCalledWith('ticket-123', {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 1,
    });
    expect(result).toBe('data:image/png;base64,fake');
  });

  it('propagates errors from the underlying qrcode library', async () => {
    vi.mocked(QRCode.toDataURL).mockRejectedValue(new Error('encoding failed'));

    await expect(generateQRCodeDataUrl('bad')).rejects.toThrow('encoding failed');
  });
});
