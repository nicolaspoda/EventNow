import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('events/:eventId/polls')
@UseGuards(JwtAuthGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getEventPolls(
    @Param('eventId') eventId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pollsService.getEventPolls(user.id, eventId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createPoll(
    @Param('eventId') eventId: string,
    @Body() dto: CreatePollDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pollsService.createPoll(user.id, eventId, dto);
  }

  @Post(':pollId/vote')
  @HttpCode(HttpStatus.OK)
  vote(
    @Param('eventId') eventId: string,
    @Param('pollId') pollId: string,
    @Body() dto: VotePollDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pollsService.vote(user.id, eventId, pollId, dto);
  }

  @Patch(':pollId/vote')
  @HttpCode(HttpStatus.OK)
  changeVote(
    @Param('eventId') eventId: string,
    @Param('pollId') pollId: string,
    @Body() dto: VotePollDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pollsService.changeVote(user.id, eventId, pollId, dto);
  }

  @Patch(':pollId/close')
  @HttpCode(HttpStatus.OK)
  closePoll(
    @Param('eventId') eventId: string,
    @Param('pollId') pollId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pollsService.closePoll(user.id, eventId, pollId);
  }

  @Delete(':pollId')
  @HttpCode(HttpStatus.OK)
  deletePoll(
    @Param('eventId') eventId: string,
    @Param('pollId') pollId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pollsService.deletePoll(user.id, eventId, pollId);
  }
}
