import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    initiatePayment: jest.fn(),
    confirmPayment: jest.fn(),
    getUserOrders: jest.fn(),
    getRefundRequests: jest.fn(),
    getOrderById: jest.fn(),
    refundOrder: jest.fn(),
    approveRefund: jest.fn(),
    rejectRefund: jest.fn(),
    handleStripeWebhook: jest.fn(),
  };

  const mockUser = { id: 'user-1', email: 'test@test.com', role: 'CLIENT' } as any;

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    totalAmount: 200,
    status: OrderStatus.PAID,
    tickets: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: mockOrdersService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should initiate payment', async () => {
      const paymentIntent = { paymentId: 'sim_123', amount: 200 };
      mockOrdersService.initiatePayment.mockResolvedValue(paymentIntent);
      const result = await controller.initiatePayment({ bookingId: 'booking-1' }, mockUser);
      expect(result).toEqual(paymentIntent);
      expect(service.initiatePayment).toHaveBeenCalledWith('booking-1', mockUser.id, undefined);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment and create order', async () => {
      const confirmResult = { order: mockOrder, tickets: [] };
      mockOrdersService.confirmPayment.mockResolvedValue(confirmResult);
      const result = await controller.confirmPayment(
        { bookingId: 'booking-1', paymentId: 'payment-1' },
        mockUser,
      );
      expect(result).toEqual(confirmResult);
      expect(service.confirmPayment).toHaveBeenCalledWith('booking-1', 'payment-1', mockUser.id, undefined);
    });
  });

  describe('getUserOrders', () => {
    it('should return user orders', async () => {
      mockOrdersService.getUserOrders.mockResolvedValue([mockOrder]);
      const result = await controller.getUserOrders(mockUser);
      expect(result).toEqual([mockOrder]);
      expect(service.getUserOrders).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getRefundRequests', () => {
    it('should return refund requests for organizer', async () => {
      mockOrdersService.getRefundRequests.mockResolvedValue([mockOrder]);
      const result = await controller.getRefundRequests(mockUser);
      expect(result).toEqual([mockOrder]);
      expect(service.getRefundRequests).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getOrder', () => {
    it('should return order by id', async () => {
      mockOrdersService.getOrderById.mockResolvedValue(mockOrder);
      const result = await controller.getOrder('order-1', mockUser);
      expect(result).toEqual(mockOrder);
      expect(service.getOrderById).toHaveBeenCalledWith('order-1', mockUser.id);
    });
  });

  describe('refundOrder', () => {
    it('should refund order', async () => {
      const refundedOrder = { ...mockOrder, status: OrderStatus.REFUNDED };
      mockOrdersService.refundOrder.mockResolvedValue(refundedOrder);
      const result = await controller.refundOrder('order-1', mockUser);
      expect((result as typeof refundedOrder).status).toBe(OrderStatus.REFUNDED);
      expect(service.refundOrder).toHaveBeenCalledWith('order-1', mockUser.id);
    });
  });

  describe('approveRefund', () => {
    it('should approve refund', async () => {
      mockOrdersService.approveRefund.mockResolvedValue({ success: true });
      const result = await controller.approveRefund('order-1', mockUser);
      expect(result).toEqual({ success: true });
      expect(service.approveRefund).toHaveBeenCalledWith('order-1', mockUser.id);
    });
  });

  describe('rejectRefund', () => {
    it('should reject refund', async () => {
      mockOrdersService.rejectRefund.mockResolvedValue({ success: true });
      const result = await controller.rejectRefund('order-1', mockUser);
      expect(result).toEqual({ success: true });
      expect(service.rejectRefund).toHaveBeenCalledWith('order-1', mockUser.id);
    });
  });

  describe('handleStripeWebhook', () => {
    it('should throw BadRequestException if no stripe signature', async () => {
      await expect(
        controller.handleStripeWebhook('', { rawBody: Buffer.from('body') } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no raw body', async () => {
      await expect(
        controller.handleStripeWebhook('sig_123', { rawBody: undefined } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call handleStripeWebhook on service with rawBody and signature', async () => {
      const rawBody = Buffer.from('stripe-payload');
      mockOrdersService.handleStripeWebhook.mockResolvedValue({ received: true });
      const result = await controller.handleStripeWebhook('sig_123', {
        rawBody,
      } as any);
      expect(result).toEqual({ received: true });
      expect(service.handleStripeWebhook).toHaveBeenCalledWith(rawBody, 'sig_123');
    });
  });
});
