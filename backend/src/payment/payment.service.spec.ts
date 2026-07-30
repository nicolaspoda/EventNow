import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

const stripePaymentIntentsCreateMock = jest.fn();
const stripePaymentIntentsRetrieveMock = jest.fn();
const stripeRefundsListMock = jest.fn();
const stripeRefundsCreateMock = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: stripePaymentIntentsCreateMock,
      retrieve: stripePaymentIntentsRetrieveMock,
    },
    refunds: {
      list: stripeRefundsListMock,
      create: stripeRefundsCreateMock,
    },
  })),
);

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPrisma = {
    booking: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock_123';
      if (key === 'STRIPE_PUBLISHABLE_KEY') return 'pk_test_mock_123';
      return undefined;
    }),
  };

  const mockBookingBase = {
    id: 'booking-123',
    userId: 'user-123',
    quantity: 2,
    status: BookingStatus.PENDING,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    ticketCategory: {
      price: 50.0,
      event: { id: 'event-123', title: 'Concert test' },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock_123';
      if (key === 'STRIPE_PUBLISHABLE_KEY') return 'pk_test_mock_123';
      return undefined;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('constructor', () => {
    it('should throw if STRIPE_SECRET_KEY is not configured', async () => {
      const noKeyConfig = { get: jest.fn().mockReturnValue(null) };
      await expect(
        Test.createTestingModule({
          providers: [
            PaymentService,
            { provide: PrismaService, useValue: mockPrisma },
            { provide: ConfigService, useValue: noKeyConfig },
          ],
        }).compile(),
      ).rejects.toThrow('STRIPE_SECRET_KEY is not configured');
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with valid booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingBase);
      stripePaymentIntentsCreateMock.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'cs_test_123',
      });

      const result = await service.createPaymentIntent('booking-123', 'user-123');

      expect(result).toEqual({
        paymentId: 'pi_test_123',
        clientSecret: 'cs_test_123',
        bookingId: 'booking-123',
        amount: 100.0,
        originalAmount: 100.0,
        eventId: 'event-123',
        currency: 'EUR',
        status: 'pending',
      });
    });

    it('should use overrideAmount when provided', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingBase);
      stripePaymentIntentsCreateMock.mockResolvedValue({
        id: 'pi_override',
        client_secret: 'cs_override',
      });

      const result = await service.createPaymentIntent('booking-123', 'user-123', 75.0);

      expect(result.amount).toBe(75.0);
      expect(result.originalAmount).toBe(100.0);
    });

    it('should throw BadRequestException if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.createPaymentIntent('booking-123', 'user-123')).rejects.toThrow('Réservation introuvable');
    });

    it('should throw BadRequestException if booking belongs to another user', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ ...mockBookingBase, userId: 'other-user' });
      await expect(service.createPaymentIntent('booking-123', 'user-123')).rejects.toThrow('Réservation introuvable');
    });

    it('should throw BadRequestException if booking already processed', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ ...mockBookingBase, status: BookingStatus.CONFIRMED });
      await expect(service.createPaymentIntent('booking-123', 'user-123')).rejects.toThrow('Réservation déjà traitée');
    });

    it('should throw BadRequestException if booking expired', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ ...mockBookingBase, expiresAt: new Date(Date.now() - 1000) });
      await expect(service.createPaymentIntent('booking-123', 'user-123')).rejects.toThrow('Réservation expirée');
    });

    it('should throw BadRequestException if amount is below Stripe minimum', async () => {
      const cheapBooking = {
        ...mockBookingBase,
        quantity: 1,
        ticketCategory: { price: 0.1, event: { id: 'e-1', title: 'Free' } },
      };
      mockPrisma.booking.findUnique.mockResolvedValue(cheapBooking);
      await expect(service.createPaymentIntent('booking-123', 'user-123')).rejects.toThrow(
        'Le montant minimum pour un paiement Stripe est 0,50 €',
      );
    });

    it('should wrap Stripe Error in BadRequestException', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingBase);
      stripePaymentIntentsCreateMock.mockRejectedValue(new Error('Stripe network error'));
      await expect(service.createPaymentIntent('booking-123', 'user-123')).rejects.toThrow(
        "Impossible d'initialiser le paiement",
      );
    });

    it('should wrap non-Error Stripe failure in BadRequestException', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingBase);
      stripePaymentIntentsCreateMock.mockRejectedValue('unknown stripe error');
      await expect(service.createPaymentIntent('booking-123', 'user-123')).rejects.toThrow(BadRequestException);
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
    it('should return paymentId and status from webhook data', async () => {
      const result = await service.handlePaymentWebhook({ paymentId: 'pi_123', status: 'succeeded' });
      expect(result).toEqual({ paymentId: 'pi_123', status: 'succeeded' });
    });
  });

  describe('getPublishableKey', () => {
    it('should return the publishable key', () => {
      const result = service.getPublishableKey();
      expect(result).toBe('pk_test_mock_123');
    });

    it('should return empty string if key not configured', () => {
      mockConfigService.get.mockReturnValue(undefined);
      const result = service.getPublishableKey();
      expect(result).toBe('');
    });
  });

  describe('refundPayment', () => {
    it('should throw BadRequestException if paymentIntentId is empty', async () => {
      await expect(service.refundPayment('', 'order-1')).rejects.toThrow(
        'Aucun identifiant de paiement trouvé pour cette commande',
      );
    });

    it('should throw BadRequestException if payment not in succeeded state', async () => {
      stripePaymentIntentsRetrieveMock.mockResolvedValue({ status: 'processing', amount: 10000 });
      await expect(service.refundPayment('pi_123', 'order-1')).rejects.toThrow(
        "Le paiement n'est pas dans un état remboursable",
      );
    });

    it('should throw BadRequestException if payment already fully refunded', async () => {
      stripePaymentIntentsRetrieveMock.mockResolvedValue({ status: 'succeeded', amount: 10000 });
      stripeRefundsListMock.mockResolvedValue({
        data: [{ status: 'succeeded', amount: 10000 }],
      });
      await expect(service.refundPayment('pi_123', 'order-1')).rejects.toThrow(
        'Ce paiement a déjà été entièrement remboursé',
      );
    });

    it('should process refund successfully without amount', async () => {
      stripePaymentIntentsRetrieveMock.mockResolvedValue({ status: 'succeeded', amount: 10000 });
      stripeRefundsListMock.mockResolvedValue({ data: [] });
      stripeRefundsCreateMock.mockResolvedValue({
        id: 'ref_123',
        amount: 10000,
        currency: 'eur',
        status: 'succeeded',
        payment_intent: 'pi_123',
      });

      const result = await service.refundPayment('pi_123', 'order-1');
      expect(result).toEqual({
        refundId: 'ref_123',
        amount: 100,
        currency: 'EUR',
        status: 'succeeded',
        paymentIntentId: 'pi_123',
      });
      expect(stripeRefundsCreateMock).toHaveBeenCalledWith(
        expect.not.objectContaining({ amount: expect.anything() }),
      );
    });

    it('should process refund with specific amount', async () => {
      stripePaymentIntentsRetrieveMock.mockResolvedValue({ status: 'succeeded', amount: 10000 });
      stripeRefundsListMock.mockResolvedValue({ data: [] });
      stripeRefundsCreateMock.mockResolvedValue({
        id: 'ref_456',
        amount: 5000,
        currency: 'eur',
        status: 'succeeded',
        payment_intent: 'pi_123',
      });

      const result = await service.refundPayment('pi_123', 'order-1', 50);
      expect(result.amount).toBe(50);
      expect(stripeRefundsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 5000 }),
      );
    });

    it('should re-throw BadRequestException from inner Stripe calls', async () => {
      stripePaymentIntentsRetrieveMock.mockResolvedValue({ status: 'succeeded', amount: 10000 });
      stripeRefundsListMock.mockResolvedValue({ data: [] });
      stripeRefundsCreateMock.mockRejectedValue(new BadRequestException('Already refunded'));

      await expect(service.refundPayment('pi_123', 'order-1')).rejects.toThrow('Already refunded');
    });

    it('should wrap non-BadRequestException Stripe error', async () => {
      stripePaymentIntentsRetrieveMock.mockResolvedValue({ status: 'succeeded', amount: 10000 });
      stripeRefundsListMock.mockResolvedValue({ data: [] });
      stripeRefundsCreateMock.mockRejectedValue(new Error('Stripe network failure'));

      await expect(service.refundPayment('pi_123', 'order-1')).rejects.toThrow(
        "Impossible d'effectuer le remboursement Stripe",
      );
    });

    it('should wrap non-Error thrown during refund', async () => {
      stripePaymentIntentsRetrieveMock.mockResolvedValue({ status: 'succeeded', amount: 10000 });
      stripeRefundsListMock.mockResolvedValue({ data: [] });
      stripeRefundsCreateMock.mockRejectedValue('unknown');

      await expect(service.refundPayment('pi_123', 'order-1')).rejects.toThrow(BadRequestException);
    });
  });
});
