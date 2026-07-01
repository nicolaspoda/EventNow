import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StaffInvitationsService } from './staff-invitations.service';
import { CreateStaffInvitationDto, AcceptStaffInvitationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('staff-invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffInvitationsController {
  constructor(
    private readonly staffInvitationsService: StaffInvitationsService,
  ) {}

  @Post()
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.CREATED)
  async createInvitation(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateStaffInvitationDto,
  ) {
    return this.staffInvitationsService.createInvitation(user.id, dto);
  }

  @Get('my-invitations')
  @Roles('ORGANIZER')
  async getMyInvitations(@CurrentUser() user: { id: string }) {
    return this.staffInvitationsService.getMyInvitations(user.id);
  }

  @Get('pending')
  @Roles('USER', 'ORGANIZER')
  async getPendingInvitations(@CurrentUser() user: { email: string }) {
    return this.staffInvitationsService.getPendingInvitationsForEmail(
      user.email,
    );
  }

  @Get('token/:token')
  async getInvitationByToken(@Param('token') token: string) {
    return this.staffInvitationsService.getInvitationByToken(token);
  }

  @Post('accept')
  @Roles('USER', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(
    @CurrentUser() user: { id: string },
    @Body() dto: AcceptStaffInvitationDto,
  ) {
    return this.staffInvitationsService.acceptInvitation(user.id, dto.token);
  }

  @Post('decline')
  @Roles('USER', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  async declineInvitation(
    @CurrentUser() user: { id: string },
    @Body() dto: AcceptStaffInvitationDto,
  ) {
    return this.staffInvitationsService.declineInvitation(user.id, dto.token);
  }

  @Delete(':id')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  async cancelInvitation(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.staffInvitationsService.cancelInvitation(user.id, id);
  }
}
