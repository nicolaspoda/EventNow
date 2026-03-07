import { Module } from '@nestjs/common';
import { ParticipantReviewsService } from './participant-reviews.service';
import { ParticipantReviewsController } from './participant-reviews.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParticipantReviewsController],
  providers: [ParticipantReviewsService],
  exports: [ParticipantReviewsService],
})
export class ParticipantReviewsModule {}
