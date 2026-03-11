import { Module } from '@nestjs/common';
import { StaffInvitationsController } from './staff-invitations.controller';
import { StaffInvitationsService } from './staff-invitations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule, MessagesModule],
  controllers: [StaffInvitationsController],
  providers: [StaffInvitationsService],
  exports: [StaffInvitationsService],
})
export class StaffInvitationsModule {}
