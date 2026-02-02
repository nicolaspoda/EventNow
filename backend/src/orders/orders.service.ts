import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { BookingStatus, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  async initiatePayment(bookingId: string, userId: string) {
    return this.paymentService.createPaymentIntent(bookingId, userId);
  }

  async confirmPayment(bookingId: string, paymentId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          ticketCategory: {
            include: { event: true },
          },
        },
      });

      if (!booking || booking.userId !== userId) {
        throw new NotFoundException('Réservation introuvable');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new BadRequestException('Réservation déjà traitée');
      }

      if (new Date() > booking.expiresAt) {
        throw new BadRequestException('Réservation expirée');
      }

      const totalAmount =
        Number(booking.ticketCategory.price) * booking.quantity;

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      const order = await tx.order.create({
        data: {
          userId: userId,
          totalAmount: totalAmount,
          status: OrderStatus.PAID,
          paymentIntentId: paymentId,
        },
      });

      const tickets = await Promise.all(
        Array(booking.quantity)
          .fill(null)
          .map(async (_, index) => {
            const qrCode = this.generateQRCode(order.id, index);

            return tx.ticket.create({
              data: {
                orderId: order.id,
                ticketCategoryId: booking.ticketCategoryId,
                qrCode: qrCode,
              },
            });
          }),
      );

      return {
        order,
        tickets,
        event: booking.ticketCategory.event,
      };
    });
  }

  private generateQRCode(orderId: string, index: number): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const hash = crypto
      .createHash('sha256')
      .update(`${orderId}-${index}-${timestamp}-${randomBytes}`)
      .digest('hex')
      .substring(0, 16);

    return `TICKET-${hash.toUpperCase()}-${timestamp}`;
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId: userId },
      include: {
        tickets: {
          include: {
            ticketCategory: {
              include: { event: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: {
          include: {
            ticketCategory: {
              include: { event: true },
            },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Commande introuvable');
    }

    return order;
  }

  async refundOrder(orderId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          tickets: {
            include: {
              ticketCategory: {
                include: { event: true },
              },
            },
          },
        },
      });

      if (!order || order.userId !== userId) {
        throw new NotFoundException('Commande introuvable');
      }

      if (order.status !== OrderStatus.PAID) {
        throw new BadRequestException('Commande déjà annulée ou remboursée');
      }

      const eventDate = order.tickets[0].ticketCategory.event.eventDate;
      const daysUntilEvent = Math.ceil(
        (new Date(eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilEvent < 7) {
        throw new BadRequestException(
          'Impossible de rembourser : événement dans moins de 7 jours',
        );
      }

      const ticketCount = order.tickets.length;
      const categoryId = order.tickets[0].ticketCategoryId;

      await tx.ticketCategory.update({
        where: { id: categoryId },
        data: { currentStock: { increment: ticketCount } },
      });

      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      });
    });
  }
}
