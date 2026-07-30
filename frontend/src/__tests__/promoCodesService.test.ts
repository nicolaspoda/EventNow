import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promoCodesService } from '../services/promoCodesService';
import { api } from '../services/api';
import type { PromoCode, CreatePromoCodeDto } from '../services/promoCodesService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const promoCode: PromoCode = {
  id: 'p1',
  code: 'SUMMER10',
  eventId: 'e1',
  discountType: 'PERCENTAGE',
  discountValue: 10,
  maxUses: null,
  currentUses: 0,
  expiresAt: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('promoCodesService', () => {
  it('validatePromoCode posts the code, event id and order amount', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { promoCode, discountAmount: 2, finalAmount: 18 },
    });

    const result = await promoCodesService.validatePromoCode('SUMMER10', 'e1', 20);

    expect(api.post).toHaveBeenCalledWith('/promo-codes/validate', {
      code: 'SUMMER10',
      eventId: 'e1',
      orderAmount: 20,
    });
    expect(result).toEqual({ promoCode, discountAmount: 2, finalAmount: 18 });
  });

  it('createPromoCode posts the new promo code dto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: promoCode });
    const dto: CreatePromoCodeDto = {
      code: 'SUMMER10',
      eventId: 'e1',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    };

    const result = await promoCodesService.createPromoCode(dto);

    expect(api.post).toHaveBeenCalledWith('/promo-codes', dto);
    expect(result).toEqual(promoCode);
  });

  it('getEventPromoCodes fetches promo codes for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [promoCode] });

    const result = await promoCodesService.getEventPromoCodes('e1');

    expect(api.get).toHaveBeenCalledWith('/promo-codes/event/e1');
    expect(result).toEqual([promoCode]);
  });

  it('deletePromoCode deletes the promo code by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: promoCode });

    const result = await promoCodesService.deletePromoCode('p1');

    expect(api.delete).toHaveBeenCalledWith('/promo-codes/p1');
    expect(result).toEqual(promoCode);
  });
});
