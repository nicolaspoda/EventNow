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

  async createPaymentIntent(
    bookingId: string,
    userId: string,
    overrideAmount?: number,
  ) {
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

    const amount =
      overrideAmount !== undefined
        ? overrideAmount
        : Number(booking.ticketCategory.price) * booking.quantity;
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
          allow_redirects: 'always',
        },
        payment_method_options: {
          card: {
            request_three_d_secure: 'any',
          },
        },
      });

      return {
        paymentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        bookingId,
        amount,
        originalAmount: Number(booking.ticketCategory.price) * booking.quantity,
        eventId: booking.ticketCategory.event.id,
        currency: 'EUR',
        status: 'pending',
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur Stripe inconnue';
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

  async refundPayment(paymentIntentId: string, orderId: string) {
    if (!paymentIntentId) {
      throw new BadRequestException(
        'Aucun identifiant de paiement trouvé pour cette commande',
      );
    }

    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new BadRequestException(
          `Le paiement n'est pas dans un état remboursable (statut: ${paymentIntent.status})`,
        );
      }

      const existingRefunds = await this.stripe.refunds.list({
        payment_intent: paymentIntentId,
        limit: 10,
      });

      const totalRefunded = existingRefunds.data.reduce(
        (sum, refund) =>
          sum + (refund.status === 'succeeded' ? refund.amount : 0),
        0,
      );

      if (totalRefunded >= paymentIntent.amount) {
        throw new BadRequestException(
          'Ce paiement a déjà été entièrement remboursé',
        );
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        metadata: {
          orderId,
          refundedAt: new Date().toISOString(),
        },
      });

      return {
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
        paymentIntentId: refund.payment_intent as string,
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        throw err;
      }

      const message =
        err instanceof Error ? err.message : 'Erreur Stripe inconnue';
      throw new BadRequestException(
        `Impossible d'effectuer le remboursement Stripe: ${message}`,
      );
    }
  }
}
