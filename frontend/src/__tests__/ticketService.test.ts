import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ticketService } from '../services/ticketService';
import { api } from '../services/api';
import type { Ticket, ValidateTicketResponse } from '../types/order.types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const ticket: Ticket = {
  id: 't1',
  orderId: 'o1',
  qrCode: 'qr-code-value',
  createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ticketService', () => {
  it('getMyTickets fetches the current user tickets', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [ticket] });

    const result = await ticketService.getMyTickets();

    expect(api.get).toHaveBeenCalledWith('/tickets/my-tickets');
    expect(result).toEqual([ticket]);
  });

  it('validateTicket posts the validation data', async () => {
    const response: ValidateTicketResponse = { ticket, message: 'Valid' };
    vi.mocked(api.post).mockResolvedValue({ data: response });

    const result = await ticketService.validateTicket({ qrCode: 'qr-code-value' });

    expect(api.post).toHaveBeenCalledWith('/tickets/validate', { qrCode: 'qr-code-value' });
    expect(result).toEqual(response);
  });

  describe('downloadTicketPDF', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('URL', { ...window.URL, createObjectURL, revokeObjectURL });
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('fetches the PDF as a blob and triggers a browser download', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: new Blob(['pdf-content']) });

      await ticketService.downloadTicketPDF('t1');

      expect(api.get).toHaveBeenCalledWith('/tickets/download/t1', { responseType: 'blob' });
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
