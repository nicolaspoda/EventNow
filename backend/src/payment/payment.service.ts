import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPaymentIntent(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ticketCategory: true,
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

    const paymentId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      paymentId,
      bookingId,
      amount,
      currency: 'EUR',
      status: 'pending',
    };
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
}
