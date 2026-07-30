import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validationService } from '../services/validationService';
import { api } from '../services/api';
import type { ValidationResponse, ValidationItem } from '../services/validationService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const validationResponse: ValidationResponse = {
  valid: true,
  reason: 'OK',
  message: 'Ticket valid',
  timestamp: '2026-01-01T00:00:00Z',
};

const validationItem: ValidationItem = {
  id: 'v1',
  qr_code: 'qr-code-value',
  event: 'Event',
  category: 'Standard',
  holder_email: 'user@example.com',
  validated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validationService', () => {
  it('validateTicket trims the qr code before posting', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: validationResponse });

    const result = await validationService.validateTicket('  qr-code-value  ');

    expect(api.post).toHaveBeenCalledWith('/tickets/validate', { qrCode: 'qr-code-value' });
    expect(result).toEqual(validationResponse);
  });

  it('getValidations fetches without an event filter by default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [validationItem] });

    const result = await validationService.getValidations();

    expect(api.get).toHaveBeenCalledWith('/tickets/validations', { params: {} });
    expect(result).toEqual([validationItem]);
  });

  it('getValidations filters by event id when given', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await validationService.getValidations('e1');

    expect(api.get).toHaveBeenCalledWith('/tickets/validations', { params: { event_id: 'e1' } });
  });

  it('getStats fetches validation stats for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { total: 5 } });

    const result = await validationService.getStats('e1');

    expect(api.get).toHaveBeenCalledWith('/tickets/validations/stats', { params: { event_id: 'e1' } });
    expect(result).toEqual({ total: 5 });
  });

  it('getStaffEvents fetches the events the staff member can validate for', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const result = await validationService.getStaffEvents();

    expect(api.get).toHaveBeenCalledWith('/tickets/staff-events');
    expect(result).toEqual([]);
  });
});
