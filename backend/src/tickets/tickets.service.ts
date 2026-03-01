import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

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
        order: {
          userId: userId,
          status: 'PAID',
        },
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
    const QRCode = await import('qrcode');
    const PDFDocument = await import('pdfkit');

    const ticket = await this.getTicketById(ticketId, userId);
    const event = ticket.ticketCategory.event;

    const qrCodeDataURL = await QRCode.toDataURL(ticket.qrCode, {
      errorCorrectionLevel: 'H',
      width: 220,
      margin: 1,
    });

    return new Promise((resolve, reject) => {
      const doc = new (PDFDocument as any).default({
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
