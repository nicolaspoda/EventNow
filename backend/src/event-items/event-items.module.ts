import { Module } from '@nestjs/common';
import { EventItemsController } from './event-items.controller';
import { EventItemsService } from './event-items.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, MessagesModule],
  controllers: [EventItemsController],
  providers: [EventItemsService],
})
export class EventItemsModule {}
