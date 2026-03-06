import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  getForUser(
    @CurrentUser() user: { id: string },
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getForUser(
      user.id,
      unreadOnly === 'true',
    );
  }

  @Get('unread-count')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @Roles('CLIENT', 'ORGANIZER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
