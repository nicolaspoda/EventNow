import { Module } from '@nestjs/common';
import { EmailRemindersJob } from './email-reminders.job';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [EmailRemindersJob],
})
export class JobsModule {}
