import { Module } from '@nestjs/common';
import { EmailRemindersJob } from './email-reminders.job';
import { StaffCleanupJob } from './staff-cleanup.job';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [PrismaModule, MailModule, NotificationsModule, TicketsModule],
  providers: [EmailRemindersJob, StaffCleanupJob],
})
export class JobsModule {}
