import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrisma = {
    booking: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with valid booking', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        ticketCategoryId: 'category-123',
        quantity: 2,
        status: BookingStatus.PENDING,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        ticketCategory: {
          price: 50.0,
        },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.createPaymentIntent(
        'booking-123',
        'user-123',
      );

      expect(result).toEqual({
        paymentId: expect.stringMatching(/^sim_\d+_[a-z0-9]+$/),
        bookingId: 'booking-123',
        amount: 100.0,
        currency: 'EUR',
        status: 'pending',
      });
    });

    it('should throw BadRequestException if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent('booking-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createPaymentIntent('booking-123', 'user-123'),
      ).rejects.toThrow('Réservation introuvable');
    });

    it('should throw BadRequestException if booking belongs to another user', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'other-user',
        status: BookingStatus.PENDING,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        ticketCategory: { price: 50.0 },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent('booking-123', 'user-123'),
      ).rejects.toThrow('Réservation introuvable');
    });

    it('should throw BadRequestException if booking already processed', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        status: BookingStatus.CONFIRMED,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        ticketCategory: { price: 50.0 },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent('booking-123', 'user-123'),
      ).rejects.toThrow('Réservation déjà traitée');
    });

    it('should throw BadRequestException if booking expired', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        status: BookingStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000),
        ticketCategory: { price: 50.0 },
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.createPaymentIntent('booking-123', 'user-123'),
      ).rejects.toThrow('Réservation expirée');
    });
  });

  describe('simulatePayment', () => {
    it('should return true for successful payment simulation', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await service.simulatePayment('payment-123');

      expect(result).toBe(true);
    });

    it('should return false for failed payment simulation', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.05);

      const result = await service.simulatePayment('payment-123');

      expect(result).toBe(false);
    });
  });

  describe('handlePaymentWebhook', () => {
    it('should handle payment webhook data', async () => {
      const webhookData = {
        paymentId: 'payment-123',
        status: 'succeeded',
        amount: 100.0,
      };

      const result = await service.handlePaymentWebhook(webhookData);

      expect(result).toEqual({
        paymentId: 'payment-123',
        status: 'succeeded',
      });
    });

    it('should handle webhook with different status', async () => {
      const webhookData = {
        paymentId: 'payment-456',
        status: 'failed',
      };

      const result = await service.handlePaymentWebhook(webhookData);

      expect(result).toEqual({
        paymentId: 'payment-456',
        status: 'failed',
      });
    });
  });
});
