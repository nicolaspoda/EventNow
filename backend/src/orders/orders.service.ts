import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  private readonly prisma: PrismaService;
  private readonly paymentService: PaymentService;
  private readonly mailService: MailService;
  private readonly notificationsService: NotificationsService;

  constructor(
    prisma: PrismaService,
    paymentService: PaymentService,
    mailService: MailService,
    notificationsService: NotificationsService,
  ) {
    this.prisma = prisma;
    this.paymentService = paymentService;
    this.mailService = mailService;
    this.notificationsService = notificationsService;
  }

  async initiatePayment(bookingId: string, userId: string) {
    return this.paymentService.createPaymentIntent(bookingId, userId);
  }

  async confirmPayment(bookingId: string, paymentId: string, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
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

      await tx.booking.update({
        where: { id: bookingId },
        data: { orderId: order.id },
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
        ticketCategory: booking.ticketCategory,
      };
    });

    this.sendOrderConfirmationEmail(result, userId).catch((err) =>
      console.error('Erreur envoi email confirmation:', err),
    );

    await this.notificationsService.create({
      userId: userId,
      type: 'ORDER_CONFIRMED',
      title: 'Commande confirmée',
      body: `Votre commande pour "${result.event.title}" a été confirmée`,
      relatedId: result.order.id,
    });

    return result;
  }

  private async sendOrderConfirmationEmail(
    orderData: {
      order: any;
      tickets: any[];
      event: any;
      ticketCategory: any;
    },
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const userName = user.username ?? user.email.split('@')[0];

    await this.mailService.sendOrderConfirmation({
      userEmail: user.email,
      userName,
      orderId: orderData.order.id,
      totalAmount: Number(orderData.order.totalAmount),
      tickets: [
        {
          eventTitle: orderData.event.title,
          eventDate: new Date(orderData.event.eventDate).toLocaleString(
            'fr-FR',
            {
              dateStyle: 'full',
              timeStyle: 'short',
            },
          ),
          category: orderData.ticketCategory.name,
          quantity: orderData.tickets.length,
        },
      ],
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

    const categoryId = order.tickets[0]?.ticketCategoryId;
    const quantity = order.tickets?.length ?? 0;

    const updatedBookings = await this.prisma.booking.updateMany({
      where: { orderId: orderId },
      data: { status: BookingStatus.CANCELLED },
    });

    if (updatedBookings.count === 0 && categoryId && quantity > 0) {
      const legacyBooking = await this.prisma.booking.findFirst({
        where: {
          orderId: null,
          userId: order.userId,
          ticketCategoryId: categoryId,
          quantity,
          status: BookingStatus.CONFIRMED,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (legacyBooking) {
        await this.prisma.booking.update({
          where: { id: legacyBooking.id },
          data: { status: BookingStatus.CANCELLED },
        });
      }
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
          select: { id: true, email: true, username: true },
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

      await tx.booking.updateMany({
        where: { orderId: orderId },
        data: { status: BookingStatus.CANCELLED },
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

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'REFUND_APPROVED',
          title: 'Remboursement approuvé',
          body: `Votre demande de remboursement pour "${event.title}" a été approuvée`,
          relatedId: orderId,
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

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
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

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: 'REFUND_REJECTED',
          title: 'Demande de remboursement refusée',
          body: `Votre demande de remboursement pour "${event.title}" a été refusée`,
          relatedId: orderId,
        },
      });

      return updatedOrder;
    });

    return this.mapOrderDecimalToNumber(updated);
  }
}
