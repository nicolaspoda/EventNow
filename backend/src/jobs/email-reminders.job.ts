import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmailRemindersJob {
  private readonly logger = new Logger(EmailRemindersJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron('0 9 * * *')
  async sendReminders7Days() {
    this.logger.log('Envoi rappels J-7...');

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const startOfDay = new Date(sevenDaysFromNow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(sevenDaysFromNow.setHours(23, 59, 59, 999));

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'PAID',
        tickets: {
          some: {
            ticketCategory: {
              event: {
                eventDate: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
        },
      },
      include: {
        user: true,
        tickets: {
          include: {
            ticketCategory: {
              include: {
                event: true,
              },
            },
          },
        },
      },
    });

    let sentCount = 0;

    for (const order of orders) {
      const eventsMap = new Map<string, any>();

      for (const ticket of order.tickets) {
        const event = ticket.ticketCategory.event;
        if (
          !event ||
          event.eventDate < startOfDay ||
          event.eventDate > endOfDay
        ) {
          continue;
        }

        if (!eventsMap.has(event.id)) {
          eventsMap.set(event.id, {
            event,
            ticketCount: 0,
          });
        }
        eventsMap.get(event.id).ticketCount++;
      }

      for (const [, { event, ticketCount }] of eventsMap) {
        try {
          const userName =
            order.user.firstName && order.user.lastName
              ? `${order.user.firstName} ${order.user.lastName}`
              : order.user.email.split('@')[0];

          await this.mailService.sendEventReminder7Days({
            userEmail: order.user.email,
            userName,
            eventTitle: event.title,
            eventDate: new Date(event.eventDate).toLocaleString('fr-FR', {
              dateStyle: 'full',
              timeStyle: 'short',
            }),
            eventLocation: event.location,
            ticketsCount: ticketCount,
            orderId: order.id,
          });
          sentCount++;
        } catch (error) {
          this.logger.error(
            `Erreur envoi rappel J-7 pour commande ${order.id}: ${error.message}`,
          );
        }
      }
    }

    this.logger.log(`Rappels J-7 envoyés: ${sentCount}`);
  }

  @Cron('0 10 * * *')
  async sendReminders1Day() {
    this.logger.log('Envoi rappels J-1...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'PAID',
        tickets: {
          some: {
            ticketCategory: {
              event: {
                eventDate: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
        },
      },
      include: {
        user: true,
        tickets: {
          include: {
            ticketCategory: {
              include: {
                event: true,
              },
            },
          },
        },
      },
    });

    let sentCount = 0;

    for (const order of orders) {
      const eventsMap = new Map<string, any>();

      for (const ticket of order.tickets) {
        const event = ticket.ticketCategory.event;
        if (
          !event ||
          event.eventDate < startOfDay ||
          event.eventDate > endOfDay
        ) {
          continue;
        }

        if (!eventsMap.has(event.id)) {
          eventsMap.set(event.id, {
            event,
            ticketCount: 0,
          });
        }
        eventsMap.get(event.id).ticketCount++;
      }

      for (const [, { event, ticketCount }] of eventsMap) {
        try {
          const userName =
            order.user.firstName && order.user.lastName
              ? `${order.user.firstName} ${order.user.lastName}`
              : order.user.email.split('@')[0];

          await this.mailService.sendEventReminder1Day({
            userEmail: order.user.email,
            userName,
            eventTitle: event.title,
            eventDate: new Date(event.eventDate).toLocaleString('fr-FR', {
              dateStyle: 'full',
              timeStyle: 'short',
            }),
            eventLocation: event.location,
            ticketsCount: ticketCount,
            orderId: order.id,
          });
          sentCount++;
        } catch (error) {
          this.logger.error(
            `Erreur envoi rappel J-1 pour commande ${order.id}: ${error.message}`,
          );
        }
      }
    }

    this.logger.log(`Rappels J-1 envoyés: ${sentCount}`);
  }
}
