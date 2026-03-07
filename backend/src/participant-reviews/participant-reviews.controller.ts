import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParticipantReviewsService } from './participant-reviews.service';
import {
  CreateParticipantReviewDto,
  UpdateParticipantReviewDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('participant-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParticipantReviewsController {
  constructor(
    private readonly participantReviewsService: ParticipantReviewsService,
  ) {}

  @Post()
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateParticipantReviewDto,
  ) {
    return this.participantReviewsService.create(user.id, dto);
  }

  @Get('participant/:participantId')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  findAllByParticipant(@Param('participantId') participantId: string) {
    return this.participantReviewsService.findAllByParticipant(participantId);
  }

  @Get('event/:eventId')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  findAllByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.participantReviewsService.findAllByEvent(eventId, user.id);
  }

  @Get('event/:eventId/participants')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  getParticipantsForEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.participantReviewsService.getParticipantsForEvent(eventId, user.id);
  }

  @Patch(':id')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateParticipantReviewDto,
  ) {
    return this.participantReviewsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.participantReviewsService.delete(id, user.id);
  }
}
