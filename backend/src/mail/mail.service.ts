import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {}

  async sendOrderConfirmation(orderData: {
    userEmail: string;
    userName: string;
    orderId: string;
    totalAmount: number;
    tickets: Array<{
      eventTitle: string;
      eventDate: string;
      category: string;
      quantity: number;
    }>;
  }) {
    const frontendUrl = this.configService.get('FRONTEND_URL');

    try {
      await this.mailerService.sendMail({
        to: orderData.userEmail,
        subject: 'Confirmation de votre commande EventNow',
        template: 'order-confirmation',
        context: {
          userName: orderData.userName,
          orderId: orderData.orderId,
          totalAmount: orderData.totalAmount.toFixed(2),
          tickets: orderData.tickets,
          orderUrl: `${frontendUrl}/my-orders`,
          supportEmail: 'support@eventnow.com',
        },
      });
      this.logger.log(
        `Email confirmation envoyé à ${orderData.userEmail}`,
        'MailService',
      );
    } catch (error) {
      this.logger.error(
        `Erreur envoi email à ${orderData.userEmail}: ${(error as Error).message}`,
        (error as Error).stack,
        'MailService',
      );
    }
  }

  async sendEventReminder7Days(reminderData: {
    userEmail: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    ticketsCount: number;
    orderId: string;
  }) {
    const frontendUrl = this.configService.get('FRONTEND_URL');

    try {
      await this.mailerService.sendMail({
        to: reminderData.userEmail,
        subject: `J-7 : ${reminderData.eventTitle}`,
        template: 'event-reminder-7days',
        context: {
          ...reminderData,
          orderUrl: `${frontendUrl}/my-orders`,
          ticketsUrl: `${frontendUrl}/my-tickets`,
        },
      });
      this.logger.log(
        `Rappel J-7 envoyé à ${reminderData.userEmail}`,
        'MailService',
      );
    } catch (error) {
      this.logger.error(
        `Erreur envoi rappel J-7 à ${reminderData.userEmail}: ${(error as Error).message}`,
        (error as Error).stack,
        'MailService',
      );
    }
  }

  async sendEventReminder1Day(reminderData: {
    userEmail: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    ticketsCount: number;
    orderId: string;
  }) {
    const frontendUrl = this.configService.get('FRONTEND_URL');

    try {
      await this.mailerService.sendMail({
        to: reminderData.userEmail,
        subject: `Demain : ${reminderData.eventTitle} !`,
        template: 'event-reminder-1day',
        context: {
          ...reminderData,
          orderUrl: `${frontendUrl}/my-orders`,
          ticketsUrl: `${frontendUrl}/my-tickets`,
        },
      });
      this.logger.log(
        `Rappel J-1 envoyé à ${reminderData.userEmail}`,
        'MailService',
      );
    } catch (error) {
      this.logger.error(
        `Erreur envoi rappel J-1 à ${reminderData.userEmail}: ${(error as Error).message}`,
        (error as Error).stack,
        'MailService',
      );
    }
  }

  async sendEventCancellation(data: {
    userEmail: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    refundAmount?: number;
    cancelReason?: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: data.userEmail,
        subject: `[EventNow] L'événement "${data.eventTitle}" a été annulé`,
        template: 'event-cancelled',
        context: {
          userName: data.userName,
          eventTitle: data.eventTitle,
          eventDate: data.eventDate,
          refundAmount:
            data.refundAmount != null ? data.refundAmount.toFixed(2) : null,
          cancelReason: data.cancelReason ?? null,
        },
      });
      this.logger.log(
        `Email annulation événement envoyé à ${data.userEmail}`,
        'MailService',
      );
    } catch (error) {
      this.logger.error(
        `Erreur envoi email annulation à ${data.userEmail}: ${(error as Error).message}`,
        (error as Error).stack,
        'MailService',
      );
    }
  }

  async sendContactMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    const contactEmail =
      this.configService.get<string>('CONTACT_EMAIL') ||
      this.configService.get<string>('MAIL_USER');

    if (!contactEmail) {
      throw new Error('CONTACT_EMAIL must be configured');
    }

    try {
      await this.mailerService.sendMail({
        to: contactEmail,
        replyTo: data.email,
        subject: `[Contact EventNow] ${data.subject}`,
        template: 'contact-message',
        context: {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
        },
      });
      this.logger.log(
        `Message de contact envoyé par ${data.email}`,
        'MailService',
      );
    } catch (error) {
      this.logger.error(
        `Erreur envoi message de contact de ${data.email}: ${(error as Error).message}`,
        (error as Error).stack,
        'MailService',
      );
      throw error;
    }
  }

  async sendTestEmail(to: string) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Test Email EventNow',
        text: 'Ceci est un email de test. Si vous recevez ce message, la configuration fonctionne !',
        html: '<h1>✅ Email de test</h1><p>Configuration email fonctionnelle !</p>',
      });
      this.logger.log(`Email test envoyé à ${to}`, 'MailService');
    } catch (error) {
      this.logger.error(
        `Erreur envoi email test: ${(error as Error).message}`,
        (error as Error).stack,
        'MailService',
      );
      throw error;
    }
  }
}
