import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingStatus, OrderStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    ticketCategory: {
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPaymentService = {
    createPaymentIntent: jest.fn(),
    simulatePayment: jest.fn(),
  };

  const mockBooking = {
    id: 'booking-1',
    userId: 'user-1',
    ticketCategoryId: 'category-1',
    quantity: 2,
    status: BookingStatus.PENDING,
    expiresAt: new Date(Date.now() + 600000),
    ticketCategory: {
      id: 'category-1',
      name: 'VIP',
      price: 100,
      event: {
        id: 'event-1',
        title: 'Test Event',
        eventDate: new Date('2026-12-31'),
      },
    },
  };

  const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    totalAmount: 200,
    status: OrderStatus.PAID,
    paymentIntentId: 'payment-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tickets: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initiatePayment', () => {
    it('should create payment intent', async () => {
      const paymentIntent = {
        paymentId: 'sim_123',
        bookingId: 'booking-1',
        amount: 200,
        currency: 'EUR',
      };
      mockPaymentService.createPaymentIntent.mockResolvedValue(paymentIntent);

      const result = await service.initiatePayment('booking-1', 'user-1');

      expect(result).toEqual(paymentIntent);
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith(
        'booking-1',
        'user-1',
      );
    });
  });

  describe('confirmPayment', () => {
    it('should create order and tickets after payment', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });
      mockPrismaService.order.create.mockResolvedValue(mockOrder);
      mockPrismaService.ticket.create.mockResolvedValue({
        id: 'ticket-1',
        orderId: 'order-1',
        qrCode: 'TICKET-ABC123-123456',
      });

      const result = await service.confirmPayment(
        'booking-1',
        'payment-1',
        'user-1',
      );

      expect(result.order).toBeDefined();
      expect(result.tickets).toHaveLength(2);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.CONFIRMED },
      });
    });

    it('should throw if booking not found', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmPayment('nonexistent', 'payment-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if booking expired', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.confirmPayment('booking-1', 'payment-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if booking not owned by user', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        userId: 'other-user',
      });

      await expect(
        service.confirmPayment('booking-1', 'payment-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if booking status not PENDING', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.confirmPayment('booking-1', 'payment-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refundOrder', () => {
    it('should refund order if event is > 7 days away', async () => {
      const futureEvent = new Date();
      futureEvent.setDate(futureEvent.getDate() + 10);

      const orderWithTickets = {
        ...mockOrder,
        tickets: [
          {
            id: 'ticket-1',
            ticketCategoryId: 'category-1',
            ticketCategory: {
              event: { eventDate: futureEvent },
            },
          },
        ],
      };

      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.order.findUnique.mockResolvedValue(orderWithTickets);
      mockPrismaService.ticketCategory.update.mockResolvedValue({});
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUNDED,
      });

      const result = await service.refundOrder('order-1', 'user-1');

      expect(result.status).toBe(OrderStatus.REFUNDED);
      expect(mockPrismaService.ticketCategory.update).toHaveBeenCalled();
    });

    it('should throw if event is < 7 days away', async () => {
      const nearEvent = new Date();
      nearEvent.setDate(nearEvent.getDate() + 5);

      const orderWithTickets = {
        ...mockOrder,
        tickets: [
          {
            id: 'ticket-1',
            ticketCategoryId: 'category-1',
            ticketCategory: {
              event: { eventDate: nearEvent },
            },
          },
        ],
      };

      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.order.findUnique.mockResolvedValue(orderWithTickets);

      await expect(service.refundOrder('order-1', 'user-1')).rejects.toThrow(
        'événement dans moins de 7 jours',
      );
    });

    it('should throw if order not found', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.refundOrder('order-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if order not owned by user', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'other-user',
        tickets: [],
      });

      await expect(service.refundOrder('order-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if order already refunded', async () => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUNDED,
        tickets: [],
      });

      await expect(service.refundOrder('order-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserOrders', () => {
    it('should return all orders for user', async () => {
      const orders = [mockOrder, { ...mockOrder, id: 'order-2' }];
      mockPrismaService.order.findMany.mockResolvedValue(orders);

      const result = await service.getUserOrders('user-1');

      expect(result).toEqual(orders);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getUserOrders('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getOrderById', () => {
    it('should return order if owned by user', async () => {
      const orderWithTickets = {
        ...mockOrder,
        tickets: [{ id: 'ticket-1' }],
      };
      mockPrismaService.order.findUnique.mockResolvedValue(orderWithTickets);

      const result = await service.getOrderById('order-1', 'user-1');

      expect(result).toEqual(orderWithTickets);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.getOrderById('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if order belongs to another user', async () => {
      const otherUserOrder = { ...mockOrder, userId: 'other-user' };
      mockPrismaService.order.findUnique.mockResolvedValue(otherUserOrder);

      await expect(service.getOrderById('order-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateQRCode', () => {
    it('should generate unique QR codes', () => {
      const qrCodes = new Set();
      for (let i = 0; i < 100; i++) {
        const code = service['generateQRCode']('order-id', i);
        qrCodes.add(code);
      }
      expect(qrCodes.size).toBe(100);
    });

    it('should generate QR codes with correct format', () => {
      const qrCode = service['generateQRCode']('order-id', 0);
      expect(qrCode).toMatch(/^TICKET-[A-F0-9]{16}-\d+$/);
    });
  });
});
