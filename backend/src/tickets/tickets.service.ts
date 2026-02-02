import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async validateTicket(qrCode: string, staffUserId: string) {
    const staff = await this.prisma.user.findUnique({
      where: { id: staffUserId },
    });

    if (!staff || staff.role !== 'STAFF') {
      throw new BadRequestException('Accès réservé au personnel');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCode: qrCode },
      include: {
        ticketCategory: {
          include: { event: true },
        },
        order: true,
      },
    });

    if (!ticket) {
      return {
        valid: false,
        reason: 'QR code invalide',
      };
    }

    if (ticket.validatedAt) {
      return {
        valid: false,
        reason: 'Billet déjà utilisé',
        validatedAt: ticket.validatedAt,
      };
    }

    if (ticket.order.status !== 'PAID') {
      return {
        valid: false,
        reason: 'Commande annulée ou remboursée',
      };
    }

    const validatedTicket = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { validatedAt: new Date() },
    });

    return {
      valid: true,
      ticket: validatedTicket,
      event: ticket.ticketCategory.event,
    };
  }

  async getUserTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: {
        order: { userId: userId },
      },
      include: {
        ticketCategory: {
          include: { event: true },
        },
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketByQRCode(qrCode: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        ticketCategory: {
          include: { event: true },
        },
        order: {
          include: { user: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket introuvable');
    }

    return ticket;
  }
}
