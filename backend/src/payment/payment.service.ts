import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly prisma: PrismaService;
  private readonly stripe: Stripe;

  constructor(
    prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.prisma = prisma;
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey);
  }

  async createPaymentIntent(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ticketCategory: {
          include: { event: true },
        },
      },
    });

    if (!booking || booking.userId !== userId) {
      throw new BadRequestException('Réservation introuvable');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Réservation déjà traitée');
    }

    if (new Date() > booking.expiresAt) {
      throw new BadRequestException('Réservation expirée');
    }

    const amount = Number(booking.ticketCategory.price) * booking.quantity;
    const amountCents = Math.round(amount * 100);

    if (amountCents < 50) {
      throw new BadRequestException(
        'Le montant minimum pour un paiement Stripe est 0,50 €',
      );
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'eur',
        metadata: {
          bookingId,
          userId,
          eventId: booking.ticketCategory.event.id,
          eventTitle: booking.ticketCategory.event.title,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        bookingId,
        amount,
        currency: 'EUR',
        status: 'pending',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue';
      throw new BadRequestException(
        `Impossible d'initialiser le paiement: ${message}`,
      );
    }
  }

  async simulatePayment(_paymentId: string): Promise<boolean> {
    const isSuccess = Math.random() > 0.1;
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000),
    );
    return isSuccess;
  }

  async handlePaymentWebhook(webhookData: any) {
    return {
      paymentId: webhookData.paymentId,
      status: webhookData.status,
    };
  }

  getPublishableKey(): string {
    return this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') || '';
  }
}
