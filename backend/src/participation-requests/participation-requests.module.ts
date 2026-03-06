import { Module } from '@nestjs/common';
import { ParticipationRequestsController } from './participation-requests.controller';
import { ParticipationRequestsService } from './participation-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParticipationRequestsController],
  providers: [ParticipationRequestsService],
  exports: [ParticipationRequestsService],
})
export class ParticipationRequestsModule {}
