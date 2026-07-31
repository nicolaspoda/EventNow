import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MailService } from '../mail/mail.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly mailService: MailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async sendContactMessage(@Body() dto: ContactDto) {
    try {
      await this.mailService.sendContactMessage(dto);
    } catch {
      throw new InternalServerErrorException(
        "Impossible d'envoyer votre message pour le moment. Veuillez réessayer plus tard.",
      );
    }
    return { message: 'Votre message a bien été envoyé.' };
  }
}
