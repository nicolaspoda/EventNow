import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '../logger/logger.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus, OrderStatus } from '@prisma/client';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('OrdersService', () => {
  let service: OrdersService;

  const mockTx = {
    booking: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn() },
    order: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    ticket: { create: jest.fn() },
    ticketCategory: { update: jest.fn() },
    notification: { create: jest.fn() },
  };

  const mockPrismaService = {
    booking: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    order: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockPaymentService = {
    createPaymentIntent: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockMailService = {
    sendOrderConfirmation: jest.fn(),
    sendEventCancellation: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockPromoCodesService = {
    validatePromoCodeById: jest.fn(),
    applyPromoCode: jest.fn(),
  };

  const mockMessagesGateway = {
    emitNewNotificationToUser: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_fake';
      if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test';
      return null;
    }),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockEvent = {
    id: 'event-1',
    title: 'Test Event',
    eventDate: new Date('2025-06-01'),
    organizerId: 'org-1',
  };

  const mockTicketCategory = {
    id: 'cat-1',
    name: 'Standard',
    price: 25,
    event: mockEvent,
  };

  const mockBooking = {
    id: 'booking-1',
    userId: 'user-1',
    ticketCategoryId: 'cat-1',
    quantity: 2,
    status: BookingStatus.PENDING,
    expiresAt: new Date(Date.now() + 3600000),
    orderId: null,
    ticketCategory: mockTicketCategory,
    order: null,
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    totalAmount: 50,
    status: OrderStatus.PAID,
    paymentIntentId: 'pi_test123',
    tickets: [
      {
        id: 'ticket-1',
        qrCode: 'QR1',
        ticketCategoryId: 'cat-1',
        ticketCategory: { ...mockTicketCategory, price: 25 },
        order: null,
      },
    ],
    user: { email: 'user@test.com', username: 'user1' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: MailService, useValue: mockMailService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PromoCodesService, useValue: mockPromoCodesService },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should delegate to paymentService when no promo code', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPaymentService.createPaymentIntent.mockResolvedValue({ clientSecret: 'secret' });
      await service.initiatePayment('booking-1', 'user-1');
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith('booking-1', 'user-1', 50);
    });

    it('should throw NotFoundException if booking not found with promo code', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);
      await expect(service.initiatePayment('booking-1', 'user-1', 'promo-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if booking belongs to different user', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({ ...mockBooking, userId: 'user-2' });
      await expect(service.initiatePayment('booking-1', 'user-1', 'promo-1')).rejects.toThrow(NotFoundException);
    });

    it('should apply promo code discount and create payment intent', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPromoCodesService.validatePromoCodeById.mockResolvedValue({ finalAmount: 40 });
      mockPaymentService.createPaymentIntent.mockResolvedValue({ clientSecret: 'secret' });
      await service.initiatePayment('booking-1', 'user-1', 'promo-1');
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith('booking-1', 'user-1', 40);
    });

    it('should confirm the order directly without Stripe when the amount is free', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPromoCodesService.validatePromoCodeById.mockResolvedValue({ finalAmount: 0 });
      mockPromoCodesService.applyPromoCode.mockResolvedValue({});
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue(mockBooking);
      mockTx.booking.update.mockResolvedValue({});
      mockTx.order.create.mockResolvedValue({ id: 'order-1' });
      mockTx.ticket.create.mockResolvedValue({ id: 'ticket-1' });
      mockNotificationsService.create.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.com', username: null });
      mockMailService.sendOrderConfirmation.mockResolvedValue({});

      const result = await service.initiatePayment('booking-1', 'user-1', 'promo-1');

      expect(mockPaymentService.createPaymentIntent).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({ free: true, orderId: 'order-1', amount: 0 }),
      );
    });
  });

  describe('confirmPayment', () => {
    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue(null);
      await expect(service.confirmPayment('booking-1', 'pi_test', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if booking belongs to different user', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue({ ...mockBooking, userId: 'user-2' });
      await expect(service.confirmPayment('booking-1', 'pi_test', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking already processed', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue({ ...mockBooking, status: BookingStatus.CANCELLED, orderId: null });
      await expect(service.confirmPayment('booking-1', 'pi_test', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should return existing order for already-confirmed booking (idempotency)', async () => {
      const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED, orderId: 'order-1' };
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue(confirmedBooking);
      mockTx.order.findUnique.mockResolvedValue({
        ...mockOrder,
        tickets: [{ ...mockOrder.tickets[0], ticketCategory: mockTicketCategory }],
      });
      mockNotificationsService.create.mockResolvedValue({});
      const result = await service.confirmPayment('booking-1', 'pi_test', 'user-1');
      expect(result.order.id).toBe('order-1');
    });

    it('should throw NotFoundException if existing order not found during idempotency check', async () => {
      const confirmedBooking = { ...mockBooking, status: BookingStatus.CONFIRMED, orderId: 'order-1' };
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue(confirmedBooking);
      mockTx.order.findUnique.mockResolvedValue(null);
      await expect(service.confirmPayment('booking-1', 'pi_test', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking expired', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.confirmPayment('booking-1', 'pi_test', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should create order and tickets successfully', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue(mockBooking);
      mockTx.booking.update.mockResolvedValue({});
      mockTx.order.create.mockResolvedValue(mockOrder);
      mockTx.ticket.create.mockResolvedValue({ id: 'ticket-1', qrCode: 'QR1' });
      mockNotificationsService.create.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.com', username: 'user1' });
      mockMailService.sendOrderConfirmation.mockResolvedValue({});
      const result = await service.confirmPayment('booking-1', 'pi_test', 'user-1');
      expect(mockTx.order.create).toHaveBeenCalled();
    });

    it('should apply promo code during confirmation', async () => {
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.booking.findUnique.mockResolvedValue(mockBooking);
      mockTx.booking.update.mockResolvedValue({});
      mockTx.order.create.mockResolvedValue(mockOrder);
      mockTx.ticket.create.mockResolvedValue({ id: 'ticket-1', qrCode: 'QR1' });
      mockPromoCodesService.validatePromoCodeById.mockResolvedValue({ finalAmount: 40 });
      mockPromoCodesService.applyPromoCode.mockResolvedValue({});
      mockNotificationsService.create.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.com', username: null });
      mockMailService.sendOrderConfirmation.mockResolvedValue({});
      await service.confirmPayment('booking-1', 'pi_test', 'user-1', 'promo-1');
      expect(mockPromoCodesService.validatePromoCodeById).toHaveBeenCalled();
    });
  });

  describe('getUserOrders', () => {
    it('should return orders with amounts as numbers', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([
        { ...mockOrder, totalAmount: { toNumber: () => 50 } as any, tickets: [] },
      ]);
      const result = await service.getUserOrders('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('getOrderById', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      await expect(service.getOrderById('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order belongs to different user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, userId: 'user-2', tickets: [] });
      await expect(service.getOrderById('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should return order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, tickets: [] });
      const result = await service.getOrderById('order-1', 'user-1');
      expect(result.id).toBe('order-1');
    });
  });

  describe('requestRefund', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      await expect(service.requestRefund('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order belongs to different user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, userId: 'user-2' });
      await expect(service.requestRefund('order-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order not PAID', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_REQUESTED,
      });
      await expect(service.requestRefund('order-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should create refund request and notify organizer', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        tickets: [{ ticketCategoryId: 'cat-1', ticketCategory: { event: { ...mockEvent, organizerId: 'org-1' } } }],
        user: { username: 'user1', email: 'user@test.com' },
      });
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.REFUND_REQUESTED, tickets: [] });
      mockNotificationsService.create.mockResolvedValue({});
      const result = await service.requestRefund('order-1', 'user-1');
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'REFUND_REQUESTED' }),
      );
    });

    it('should handle legacy booking update when no bookings updated', async () => {
      const orderNoOrg = {
        ...mockOrder,
        tickets: [{ ticketCategoryId: 'cat-1', ticketCategory: { event: { ...mockEvent, organizerId: null } } }],
        user: { username: null, email: 'user@test.com' },
      };
      mockPrismaService.order.findUnique.mockResolvedValue(orderNoOrg);
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.booking.findFirst.mockResolvedValue({ id: 'legacy-booking-1' });
      mockPrismaService.booking.update.mockResolvedValue({});
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.REFUND_REQUESTED, tickets: [] });
      await service.requestRefund('order-1', 'user-1');
      expect(mockPrismaService.booking.update).toHaveBeenCalled();
    });
  });

  describe('getRefundRequests', () => {
    it('should return refund requests for organizer', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([{ ...mockOrder, tickets: [] }]);
      const result = await service.getRefundRequests('org-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('approveRefund', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      await expect(service.approveRefund('order-1', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order not in REFUND_REQUESTED state', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PAID, tickets: [] });
      await expect(service.approveRefund('order-1', 'org-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no event or wrong organizer', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_REQUESTED,
        tickets: [{ ticketCategory: { event: { organizerId: 'other-org' } } }],
      });
      await expect(service.approveRefund('order-1', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no paymentIntentId', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_REQUESTED,
        paymentIntentId: null,
        tickets: [{ ticketCategoryId: 'cat-1', ticketCategory: { event: { ...mockEvent, organizerId: 'org-1' } } }],
      });
      await expect(service.approveRefund('order-1', 'org-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stripe refund fails', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_REQUESTED,
        tickets: [{ ticketCategoryId: 'cat-1', ticketCategory: { event: { ...mockEvent, organizerId: 'org-1' } } }],
      });
      mockPaymentService.refundPayment.mockRejectedValue(new Error('Stripe error'));
      await expect(service.approveRefund('order-1', 'org-1')).rejects.toThrow(BadRequestException);
    });

    it('should approve refund and notify user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_REQUESTED,
        tickets: [{ id: 'ticket-1', ticketCategoryId: 'cat-1', ticketCategory: { event: { ...mockEvent, organizerId: 'org-1' } } }],
      });
      mockPaymentService.refundPayment.mockResolvedValue({});
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.ticketCategory.update.mockResolvedValue({});
      mockTx.booking.updateMany.mockResolvedValue({ count: 1 });
      mockTx.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.REFUNDED, tickets: [] });
      mockTx.notification.create.mockResolvedValue({});
      const result = await service.approveRefund('order-1', 'org-1');
      expect(mockTx.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'REFUND_APPROVED' }) }),
      );
    });
  });

  describe('rejectRefund', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      await expect(service.rejectRefund('order-1', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order not in REFUND_REQUESTED state', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({ ...mockOrder, status: OrderStatus.PAID, tickets: [] });
      await expect(service.rejectRefund('order-1', 'org-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no event or wrong organizer', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_REQUESTED,
        tickets: [{ ticketCategory: { event: null } }],
      });
      await expect(service.rejectRefund('order-1', 'org-1')).rejects.toThrow(NotFoundException);
    });

    it('should reject refund and notify user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUND_REQUESTED,
        tickets: [{ ticketCategoryId: 'cat-1', ticketCategory: { event: { ...mockEvent, organizerId: 'org-1' } } }],
      });
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockTx));
      mockTx.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.PAID, tickets: [] });
      mockTx.notification.create.mockResolvedValue({});
      const result = await service.rejectRefund('order-1', 'org-1');
      expect(mockTx.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'REFUND_REJECTED' }) }),
      );
    });
  });

  describe('handleStripeWebhook', () => {
    it('should throw BadRequestException on invalid signature', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      await expect(service.handleStripeWebhook(Buffer.from('{}'), 'bad-sig')).rejects.toThrow(BadRequestException);
    });

    it('should handle payment_intent.succeeded event', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            metadata: { bookingId: 'booking-1', userId: 'user-1' },
          },
        },
      });
      mockPrismaService.booking.findUnique.mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED, order: mockOrder });
      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test',
            metadata: { bookingId: 'booking-1', userId: 'user-1' },
          },
        },
      });
      mockNotificationsService.create.mockResolvedValue({});
      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'PAYMENT_FAILED' }),
      );
    });

    it('should handle payment_intent.requires_action event', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.requires_action',
        data: { object: { id: 'pi_test' } },
      });
      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
    });

    it('should handle unknown event type', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'unknown.event',
        data: { object: {} },
      });
      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
    });

    it('should parse rawBody as JSON when no webhookSecret', async () => {
      (service as any).webhookSecret = '';
      const event = {
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_test', metadata: { bookingId: 'b-1', userId: 'u-1' } } },
      };
      mockNotificationsService.create.mockResolvedValue({});
      const result = await service.handleStripeWebhook(Buffer.from(JSON.stringify(event)), 'sig');
      expect(result).toEqual({ received: true });
    });

    it('should log error and return early if metadata missing for succeeded intent', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test', metadata: {} } },
      });
      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log error if booking not found for succeeded intent', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test', metadata: { bookingId: 'b-1', userId: 'u-1' } } },
      });
      mockPrismaService.booking.findUnique.mockResolvedValue(null);
      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
    });

    it('should handle missing metadata for failed payment', async () => {
      const stripeInstance = (service as any).stripe;
      stripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_test', metadata: {} } },
      });
      const result = await service.handleStripeWebhook(Buffer.from('{}'), 'sig');
      expect(result).toEqual({ received: true });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('refundOrder', () => {
    it('should delegate to requestRefund', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        tickets: [{ ticketCategoryId: 'cat-1', ticketCategory: { event: { ...mockEvent, organizerId: 'org-1' } } }],
        user: { username: 'user1', email: 'user@test.com' },
      });
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.REFUND_REQUESTED, tickets: [] });
      mockNotificationsService.create.mockResolvedValue({});
      await service.refundOrder('order-1', 'user-1');
      expect(mockPrismaService.order.findUnique).toHaveBeenCalled();
    });
  });
});
