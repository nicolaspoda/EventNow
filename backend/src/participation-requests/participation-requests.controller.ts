import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParticipationRequestsService } from './participation-requests.service';
import {
  CreateParticipationRequestDto,
  RespondToParticipationRequestDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('participation-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParticipationRequestsController {
  constructor(
    private readonly participationRequestsService: ParticipationRequestsService,
  ) {}

  @Post()
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateParticipationRequestDto,
  ) {
    return this.participationRequestsService.create(user.id, dto);
  }

  @Get('event/:eventId')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.participationRequestsService.getByEvent(eventId, user.id);
  }

  @Get('resolve-event-id/:relatedId')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  resolveEventIdForNotification(
    @Param('relatedId') relatedId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.participationRequestsService.resolveEventIdForNotification(
      relatedId,
      user.id,
    );
  }

  @Get('my')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getMyRequests(@CurrentUser() user: { id: string }) {
    return this.participationRequestsService.getMyRequests(user.id);
  }

  @Get('my/event/:eventId')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getMyRequestForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.participationRequestsService.getMyRequestForEvent(
      eventId,
      user.id,
    );
  }

  @Get('pending-for-organizer')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getPendingForOrganizer(@CurrentUser() user: { id: string }) {
    return this.participationRequestsService.getPendingRequestsForOrganizer(
      user.id,
    );
  }

  @Patch(':id/respond')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  respond(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RespondToParticipationRequestDto,
  ) {
    return this.participationRequestsService.respond(id, user.id, dto);
  }
}
