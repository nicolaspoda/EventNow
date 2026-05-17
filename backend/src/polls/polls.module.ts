import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, MessagesModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
