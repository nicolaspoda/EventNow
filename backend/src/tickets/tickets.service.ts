import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  /** Normalise le code QR pour éviter les échecs dus au copier-coller (espaces, tirets Unicode, casse). */
  private normalizeQrCodeInput(raw: string): string {
    return raw
      .trim()
      .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-') // tirets Unicode → ASCII
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  async validateTicket(qrCode: string, staffUserId: string) {
    const normalizedQrCode = this.normalizeQrCodeInput(qrCode);
    let ticket = await this.prisma.ticket.findUnique({
      where: { qrCode: normalizedQrCode },
      include: {
        ticketCategory: {
          include: {
            event: true,
          },
        },
        order: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });
    if (!ticket && normalizedQrCode !== qrCode.trim()) {
      ticket = await this.prisma.ticket.findUnique({
        where: { qrCode: qrCode.trim() },
        include: {
          ticketCategory: { include: { event: true } },
          order: { include: { user: { select: { id: true, email: true } } } },
        },
      });
    }

    const timestamp = new Date().toISOString();

    if (!ticket) {
      if (process.env.NODE_ENV !== 'production') {
        const firstFew = await this.prisma.ticket.findFirst({
          select: { qrCode: true },
        });
        const exampleQr = firstFew?.qrCode ?? '';
        console.warn('[validateTicket] Aucun billet trouvé.', {
          receivedLength: qrCode?.length,
          normalized: normalizedQrCode?.slice(0, 30) + (normalizedQrCode?.length > 30 ? '…' : ''),
          exampleInDb: exampleQr.slice(0, 30) + (exampleQr.length > 30 ? '…' : ''),
        });
      }
      return {
        valid: false,
        reason: 'QR_CODE_INVALID',
        message: 'QR code invalide ou billet inexistant',
        timestamp,
      };
    }

    const eventId = ticket.ticketCategory.event.id;
    const isStaffForEvent = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: { eventId, userId: staffUserId },
      },
    });

    if (!isStaffForEvent) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à valider des billets pour cet événement',
      );
    }

    if (ticket.validatedAt) {
      return {
        valid: false,
        reason: 'ALREADY_VALIDATED',
        message: 'Billet déjà utilisé',
        ticket: {
          event: ticket.ticketCategory.event.title,
          category: ticket.ticketCategory.name,
          validated_at: ticket.validatedAt?.toISOString?.() ?? timestamp,
        },
        timestamp,
      };
    }

    if (ticket.order.status !== 'PAID') {
      return {
        valid: false,
        reason: 'ORDER_CANCELLED',
        message:
          ticket.order.status === 'CANCELLED'
            ? 'Commande annulée'
            : 'Commande remboursée',
        timestamp,
      };
    }

    const event = ticket.ticketCategory.event;
    const eventDate = new Date(event.eventDate);
    let eventEndDate: Date;
    if (event.endDate) {
      eventEndDate = new Date(event.endDate);
    } else {
      const tmp = new Date(eventDate);
      tmp.setHours(tmp.getHours() + 6);
      eventEndDate = tmp;
    }

    // En production : bloquer la validation après la fin de l'événement.
    // En développement : autoriser pour pouvoir valider puis tester les avis.
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && new Date() > eventEndDate) {
      return {
        valid: false,
        reason: 'EVENT_ENDED',
        message: 'Événement terminé',
        timestamp,
      };
    }

    const eventStartTolerance = new Date(eventDate);
    eventStartTolerance.setHours(eventStartTolerance.getHours() - 1);

    if (new Date() < eventStartTolerance) {
      return {
        valid: false,
        reason: 'EVENT_NOT_STARTED',
        message: 'Trop tôt - Événement pas encore commencé',
        event_date: eventDate,
        timestamp,
      };
    }

    const validatedTicket = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { validatedAt: new Date() },
      include: {
        ticketCategory: {
          include: { event: true },
        },
        order: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    const validatedAt = validatedTicket.validatedAt ?? new Date();
    return {
      valid: true,
      reason: 'SUCCESS',
      message: 'Billet validé avec succès',
      ticket: {
        id: validatedTicket.id,
        event: validatedTicket.ticketCategory.event.title,
        category: validatedTicket.ticketCategory.name,
        holder_email: validatedTicket.order.user.email,
        event_date: validatedTicket.ticketCategory.event.eventDate,
        validated_at:
          validatedAt instanceof Date
            ? validatedAt.toISOString()
            : String(validatedAt),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getStaffValidations(staffUserId: string, eventId?: string) {
    const staffEventIds = await this.prisma.eventStaff.findMany({
      where: { userId: staffUserId },
      select: { eventId: true },
    });
    const allowedEventIds = staffEventIds.map((e) => e.eventId);

    if (allowedEventIds.length === 0) {
      return [];
    }

    if (eventId && !allowedEventIds.includes(eventId)) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à consulter les validations de cet événement',
      );
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        validatedAt: { not: null },
        ticketCategory: {
          eventId: eventId
            ? eventId
            : { in: allowedEventIds },
        },
      },
      include: {
        ticketCategory: { include: { event: true } },
        order: { include: { user: { select: { email: true } } } },
      },
      orderBy: { validatedAt: 'desc' },
      take: 100,
    });

    return tickets.map((t) => ({
      id: t.id,
      qr_code: t.qrCode,
      event: t.ticketCategory.event.title,
      category: t.ticketCategory.name,
      holder_email: t.order.user.email,
      validated_at: t.validatedAt,
    }));
  }

  async getValidationStats(eventId: string, staffUserId: string) {
    const isStaffForEvent = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: { eventId, userId: staffUserId },
      },
    });

    if (!isStaffForEvent) {
      throw new ForbiddenException(
        'Vous n\'êtes pas autorisé à consulter les stats de cet événement',
      );
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketCategories: true },
    });

    if (!event) {
      throw new NotFoundException('Événement introuvable');
    }

    const totalTickets = event.ticketCategories.reduce(
      (sum, cat) => sum + (cat.initialStock - cat.currentStock),
      0
    );

    const validatedTickets = await this.prisma.ticket.count({
      where: {
        ticketCategory: { eventId },
        validatedAt: { not: null },
      },
    });

    return {
      event: {
        id: event.id,
        title: event.title,
        event_date: event.eventDate,
      },
      stats: {
        totalSold: totalTickets,
        validated: validatedTickets,
        pending: totalTickets - validatedTickets,
        validationRate:
          totalTickets > 0
            ? Math.round((validatedTickets / totalTickets) * 100)
            : 0,
      },
    };
  }

  /** Date de fin d'événement : endDate si défini, sinon eventDate + 6h. */
  private getEventEndDate(event: {
    eventDate: Date;
    endDate?: Date | null;
  }): Date {
    if (event.endDate) return new Date(event.endDate);
    const end = new Date(event.eventDate);
    end.setHours(end.getHours() + 6);
    return end;
  }

  /**
   * Supprime les affectations staff pour les événements dont la date de fin est dépassée.
   * Appelé à chaque getStaffEvents (avec throttle) et par le job cron pour que le menu
   * staff et l'accès disparaissent dès la fin d'un événement.
   */
  async removeStaffForEndedEvents(): Promise<void> {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const endedEvents = await this.prisma.event.findMany({
      where: {
        OR: [
          { endDate: { not: null, lt: now } },
          { endDate: null, eventDate: { lt: sixHoursAgo } },
        ],
      },
      select: { id: true },
    });

    const endedEventIds = endedEvents.map((e) => e.id);
    if (endedEventIds.length === 0) return;

    await this.prisma.eventStaff.deleteMany({
      where: { eventId: { in: endedEventIds } },
    });
  }

  private lastStaffCleanupAt = 0;
  private static readonly STAFF_CLEANUP_THROTTLE_MS = 60_000;

  async getStaffEvents(staffUserId: string) {
    const now = new Date();
    if (now.getTime() - this.lastStaffCleanupAt > TicketsService.STAFF_CLEANUP_THROTTLE_MS) {
      await this.removeStaffForEndedEvents();
      this.lastStaffCleanupAt = now.getTime();
    }

    const assignments = await this.prisma.eventStaff.findMany({
      where: { userId: staffUserId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            endDate: true,
          },
        },
      },
      orderBy: { event: { eventDate: 'asc' } },
    });

    const upcoming = assignments.filter(
      (a) => this.getEventEndDate(a.event) > now,
    );

    return upcoming.map((a) => ({
      id: a.event.id,
      title: a.event.title,
      eventDate: a.event.eventDate,
    }));
  }

  async getUserTickets(userId: string) {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    return this.prisma.ticket.findMany({
      where: {
        order: {
          userId: userId,
          status: 'PAID',
        },
        validatedAt: null,
        OR: [
          {
            ticketCategory: {
              event: {
                endDate: { not: null, gt: now },
              },
            },
          },
          {
            ticketCategory: {
              event: {
                endDate: null,
                eventDate: { gt: sixHoursAgo },
              },
            },
          },
        ],
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
    const normalizedQrCode = this.normalizeQrCodeInput(qrCode);
    const ticket = await this.prisma.ticket.findUnique({
      where: { qrCode: normalizedQrCode },
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

  async getTicketById(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        ticketCategory: {
          include: { event: true },
        },
        order: true,
      },
    });

    if (!ticket || ticket.order.userId !== userId) {
      throw new NotFoundException('Billet introuvable');
    }

    if (ticket.order.status !== 'PAID') {
      throw new NotFoundException('Billet introuvable');
    }

    return ticket;
  }

  async generateTicketPDF(ticketId: string, userId: string): Promise<Buffer> {
    const ticket = await this.getTicketById(ticketId, userId);
    const event = ticket.ticketCategory.event;

    const qrCodeDataURL = await QRCode.toDataURL(ticket.qrCode, {
      errorCorrectionLevel: 'H',
      width: 220,
      margin: 1,
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
      });
      const chunks: Buffer[] = [];
      const pageWidth = 595.28 - 80;
      const centerX = 297.64;

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Bandeau header
      doc
        .save()
        .rect(40, 40, pageWidth + 80, 36)
        .fillColor('#374151')
        .fill()
        .restore();

      doc
        .fillColor('#ffffff')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('EventNow', 40, 48, { width: pageWidth + 80, align: 'center' });

      doc.fillColor('#111827').moveDown(1.2);

      // Titre événement
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(event.title, { align: 'center', width: pageWidth })
        .moveDown(0.8);

      // Bloc infos
      const dateStr = new Date(event.eventDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      doc.fontSize(11).font('Helvetica');
      doc.fillColor('#6b7280').text('Date', { continued: true });
      doc.fillColor('#111827').text(`  ${dateStr}`);
      doc.fillColor('#6b7280').text('Lieu', { continued: true });
      doc.fillColor('#111827').text(`  ${event.location}`);
      doc.fillColor('#6b7280').text('Catégorie', { continued: true });
      doc.fillColor('#111827').text(`  ${ticket.ticketCategory.name}`);
      doc.moveDown(1.5);

      // Cadre QR code
      const qrSize = 200;
      const qrX = centerX - qrSize / 2;
      const qrY = doc.y;

      doc
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 4)
        .stroke();

      const qrImageBuffer = Buffer.from(
        qrCodeDataURL.replace(/^data:image\/png;base64,/, ''),
        'base64'
      );

      doc.image(qrImageBuffer, qrX, qrY + 8, {
        width: qrSize,
        height: qrSize,
      });

      doc.y = qrY + qrSize + 20;

      // Code billet sous le QR (centré, petit)
      doc
        .fontSize(8)
        .font('Courier')
        .fillColor('#6b7280')
        .text(ticket.qrCode, {
          align: 'center',
          width: pageWidth - 40,
          lineGap: 2,
        });
      doc.moveDown(1.2);

      // Instructions
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#374151')
        .text('Présentez ce QR code à l\'entrée de l\'événement', {
          align: 'center',
        })
        .text('Ce billet est personnel et non transférable', {
          align: 'center',
        });
      doc.moveDown(1.5);

      // Ligne et footer
      doc
        .strokeColor('#e5e7eb')
        .lineWidth(0.5)
        .moveTo(40, doc.y)
        .lineTo(pageWidth + 80, doc.y)
        .stroke();

      doc.moveDown(0.6);

      doc
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(`Commande ${ticket.order.id}`, { align: 'center' })
        .text(
          `Acheté le ${new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}`,
          { align: 'center' }
        );

      doc.end();
    });
  }
}
