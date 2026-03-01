import { api } from './api';

export interface ValidationResponse {
  valid: boolean;
  reason: string;
  message: string;
  ticket?: {
    id?: string;
    event: string;
    category: string;
    holder_email?: string;
    event_date?: string;
    validated_at: string;
  };
  timestamp: string;
}

export interface ValidationItem {
  id: string;
  qr_code: string;
  event: string;
  category: string;
  holder_email: string;
  validated_at: string;
}

export const validationService = {
  validateTicket: async (qrCode: string): Promise<ValidationResponse> => {
    const response = await api.post<ValidationResponse>('/tickets/validate', {
      qrCode,
    });
    return response.data;
  },

  getValidations: async (eventId?: string): Promise<ValidationItem[]> => {
    const params = eventId ? { event_id: eventId } : {};
    const response = await api.get<ValidationItem[]>('/tickets/validations', {
      params,
    });
    return response.data;
  },

  getStats: async (eventId: string) => {
    const response = await api.get('/tickets/validations/stats', {
      params: { event_id: eventId },
    });
    return response.data;
  },
};
