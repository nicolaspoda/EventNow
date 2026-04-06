import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  private readonly dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }

  @Get('organizer/overview')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  async getOrganizerOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOrganizerOverview(user.id);
  }

  @Get('organizer/events')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  async getOrganizerEvents(@CurrentUser() user: any) {
    return this.dashboardService.getOrganizerEvents(user.id);
  }

  @Get('organizer/events/:id/stats')
  @Roles('ORGANIZER')
  @HttpCode(HttpStatus.OK)
  async getEventStats(@Param('id') eventId: string, @CurrentUser() user: any) {
    return this.dashboardService.getEventStats(eventId, user.id);
  }

  @Get('client/overview')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  async getClientOverview(@CurrentUser() user: any) {
    return this.dashboardService.getClientOverview(user.id);
  }

  @Get('client/events')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  async getClientEvents(@CurrentUser() user: any) {
    return this.dashboardService.getClientEvents(user.id);
  }

  @Get('client/events/:id/participants')
  @Roles('CLIENT')
  @HttpCode(HttpStatus.OK)
  async getEventParticipants(
    @Param('id') eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.dashboardService.getEventParticipants(eventId, user.id);
  }

  @Get('my-upcoming-events')
  @HttpCode(HttpStatus.OK)
  async getMyUpcomingEvents(@CurrentUser() user: any) {
    return this.dashboardService.getMyUpcomingEvents(user.id);
  }

  @Get('my-participated-events')
  @HttpCode(HttpStatus.OK)
  async getMyParticipatedEvents(@CurrentUser() user: any) {
    return this.dashboardService.getMyParticipatedEvents(user.id);
  }

  @Get('my-calendar-events')
  @HttpCode(HttpStatus.OK)
  async getMyCalendarEvents(@CurrentUser() user: any) {
    return this.dashboardService.getMyCalendarEvents(user.id);
  }
}
