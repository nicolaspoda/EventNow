import { Module } from '@nestjs/common';
import { EmailRemindersJob } from './email-reminders.job';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, MailModule, NotificationsModule],
  providers: [EmailRemindersJob],
})
export class JobsModule {}
