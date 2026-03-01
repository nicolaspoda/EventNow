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
  private readonly prisma: PrismaService;
  private readonly paymentService: PaymentService;

  constructor(prisma: PrismaService, paymentService: PaymentService) {
    this.prisma = prisma;
    this.paymentService = paymentService;
  }

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
    const orders = await this.prisma.order.findMany({
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
    return orders.map((order) => this.mapOrderDecimalToNumber(order));
  }

  private mapOrderDecimalToNumber(order: {
    totalAmount: unknown;
    tickets: Array<{
      ticketCategory: { price: unknown; event?: unknown; [k: string]: unknown };
      [k: string]: unknown;
    }>;
    [k: string]: unknown;
  }) {
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      tickets: order.tickets.map((t) => ({
        ...t,
        ticketCategory: t.ticketCategory
          ? {
              ...t.ticketCategory,
              price: Number(t.ticketCategory.price),
            }
          : t.ticketCategory,
      })),
    };
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

    return this.mapOrderDecimalToNumber(order);
  }

  async refundOrder(orderId: string, userId: string) {
    return this.requestRefund(orderId, userId);
  }

  async requestRefund(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: {
          include: {
            ticketCategory: { include: { event: true } },
          },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Commande introuvable');
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Seules les commandes payées peuvent faire l\'objet d\'une demande de remboursement.',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUND_REQUESTED },
      include: {
        tickets: {
          include: {
            ticketCategory: { include: { event: true } },
          },
        },
      },
    });

    return this.mapOrderDecimalToNumber(updated);
  }

  async getRefundRequests(organizerId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.REFUND_REQUESTED,
        tickets: {
          some: {
            ticketCategory: { event: { organizerId } },
          },
        },
      },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        tickets: {
          include: {
            ticketCategory: { include: { event: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return orders.map((o) => this.mapOrderDecimalToNumber(o));
  }

  async approveRefund(orderId: string, organizerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          tickets: {
            include: {
              ticketCategory: { include: { event: true } },
            },
          },
        },
      });

      if (!order) throw new NotFoundException('Commande introuvable');
      if (order.status !== OrderStatus.REFUND_REQUESTED) {
        throw new BadRequestException('Cette commande n\'est pas en attente de remboursement.');
      }

      const event = order.tickets[0]?.ticketCategory?.event;
      if (!event || event.organizerId !== organizerId) {
        throw new NotFoundException('Commande introuvable ou non autorisée');
      }

      const ticketCount = order.tickets.length;
      const categoryId = order.tickets[0].ticketCategoryId;

      await tx.ticketCategory.update({
        where: { id: categoryId },
        data: { currentStock: { increment: ticketCount } },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
        include: {
          tickets: {
            include: {
              ticketCategory: { include: { event: true } },
            },
          },
        },
      });

      return this.mapOrderDecimalToNumber(updated);
    });
  }

  async rejectRefund(orderId: string, organizerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tickets: {
          include: {
            ticketCategory: { include: { event: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.status !== OrderStatus.REFUND_REQUESTED) {
      throw new BadRequestException('Cette commande n\'est pas en attente de remboursement.');
    }

    const event = order.tickets[0]?.ticketCategory?.event;
    if (!event || event.organizerId !== organizerId) {
      throw new NotFoundException('Commande introuvable ou non autorisée');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
      include: {
        tickets: {
          include: {
            ticketCategory: { include: { event: true } },
          },
        },
      },
    });

    return this.mapOrderDecimalToNumber(updated);
  }
}
