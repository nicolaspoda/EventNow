import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { QRGeneratorService } from './qr-generator.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TicketsController],
  providers: [TicketsService, QRGeneratorService],
  exports: [TicketsService, QRGeneratorService],
})
export class TicketsModule {}
