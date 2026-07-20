import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../services/orderService';
import { api } from '../services/api';
import type { Order, OrderWithUser } from '../types/order.types';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const order: Order = {
  id: 'o1',
  userId: 'u1',
  totalAmount: 20,
  status: 'PAID',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('orderService', () => {
  it('initiatePayment posts the booking and optional promo code', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { bookingId: 'b1', amount: 20, originalAmount: 20, eventId: 'e1' },
    });

    const result = await orderService.initiatePayment('b1', 'promo1');

    expect(api.post).toHaveBeenCalledWith('/orders/payment/initiate', {
      bookingId: 'b1',
      promoCodeId: 'promo1',
    });
    expect(result).toEqual({ bookingId: 'b1', amount: 20, originalAmount: 20, eventId: 'e1' });
  });

  it('initiatePayment omits the promo code when not given', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await orderService.initiatePayment('b1');

    expect(api.post).toHaveBeenCalledWith('/orders/payment/initiate', {
      bookingId: 'b1',
      promoCodeId: undefined,
    });
  });

  it('confirmPayment posts the booking, payment and promo ids', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { order, tickets: [] } });

    const result = await orderService.confirmPayment('b1', 'p1', 'promo1');

    expect(api.post).toHaveBeenCalledWith('/orders/payment/confirm', {
      bookingId: 'b1',
      paymentId: 'p1',
      promoCodeId: 'promo1',
    });
    expect(result).toEqual({ order, tickets: [] });
  });

  it('getMyOrders fetches the orders list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [order] });

    const result = await orderService.getMyOrders();

    expect(api.get).toHaveBeenCalledWith('/orders');
    expect(result).toEqual([order]);
  });

  it('getOrderById fetches a single order', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: order });

    const result = await orderService.getOrderById('o1');

    expect(api.get).toHaveBeenCalledWith('/orders/o1');
    expect(result).toEqual(order);
  });

  it('requestRefund patches the refund endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: order });

    const result = await orderService.requestRefund('o1');

    expect(api.patch).toHaveBeenCalledWith('/orders/o1/refund');
    expect(result).toEqual(order);
  });

  it('getRefundRequests fetches the refund-requests list', async () => {
    const withUser: OrderWithUser = { ...order, user: { id: 'u1', email: 'u1@example.com' } };
    vi.mocked(api.get).mockResolvedValue({ data: [withUser] });

    const result = await orderService.getRefundRequests();

    expect(api.get).toHaveBeenCalledWith('/orders/refund-requests');
    expect(result).toEqual([withUser]);
  });

  it('approveRefund patches the approve endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: order });

    const result = await orderService.approveRefund('o1');

    expect(api.patch).toHaveBeenCalledWith('/orders/o1/refund/approve');
    expect(result).toEqual(order);
  });

  it('rejectRefund patches the reject endpoint', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: order });

    const result = await orderService.rejectRefund('o1');

    expect(api.patch).toHaveBeenCalledWith('/orders/o1/refund/reject');
    expect(result).toEqual(order);
  });
});
