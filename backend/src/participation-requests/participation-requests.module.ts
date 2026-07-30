import { Module } from '@nestjs/common';
import { ParticipationRequestsController } from './participation-requests.controller';
import { ParticipationRequestsService } from './participation-requests.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MessagesModule],
  controllers: [ParticipationRequestsController],
  providers: [ParticipationRequestsService],
  exports: [ParticipationRequestsService],
})
export class ParticipationRequestsModule {}
