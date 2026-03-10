import { Module } from '@nestjs/common';
import { StaffInvitationsController } from './staff-invitations.controller';
import { StaffInvitationsService } from './staff-invitations.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffInvitationsController],
  providers: [StaffInvitationsService],
  exports: [StaffInvitationsService],
})
export class StaffInvitationsModule {}
