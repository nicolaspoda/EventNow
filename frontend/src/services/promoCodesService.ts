import { api } from './api';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface PromoCode {
  id: string;
  code: string;
  eventId: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidatePromoCodeResponse {
  promoCode: PromoCode;
  discountAmount: number;
  finalAmount: number;
}

export interface CreatePromoCodeDto {
  code: string;
  eventId: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  expiresAt?: string;
}

export const promoCodesService = {
  async validatePromoCode(
    code: string,
    eventId: string,
    orderAmount: number,
  ): Promise<ValidatePromoCodeResponse> {
    const response = await api.post<ValidatePromoCodeResponse>(
      '/promo-codes/validate',
      { code, eventId, orderAmount },
    );
    return response.data;
  },

  async createPromoCode(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const response = await api.post<PromoCode>('/promo-codes', dto);
    return response.data;
  },

  async getEventPromoCodes(eventId: string): Promise<PromoCode[]> {
    const response = await api.get<PromoCode[]>(`/promo-codes/event/${eventId}`);
    return response.data;
  },

  async deletePromoCode(id: string): Promise<PromoCode> {
    const response = await api.delete<PromoCode>(`/promo-codes/${id}`);
    return response.data;
  },
};
