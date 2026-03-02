import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async sendTestEmail(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email requis');
    }
    try {
      await this.mailService.sendTestEmail(email);
      return { message: 'Email de test envoyé avec succès' };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Erreur inconnue lors de l\'envoi';
      throw new BadRequestException(
        `Impossible d'envoyer l'email. Vérifiez MAIL_USER et MAIL_PASSWORD dans .env. Détail : ${message}`,
      );
    }
  }
}
