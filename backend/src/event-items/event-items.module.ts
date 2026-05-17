import { Module } from '@nestjs/common';
import { EventItemsController } from './event-items.controller';
import { EventItemsService } from './event-items.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventItemsController],
  providers: [EventItemsService],
})
export class EventItemsModule {}
