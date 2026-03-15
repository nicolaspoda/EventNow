import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
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
  @Roles('CLIENT', 'ORGANIZER')
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
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.delete(id, user.id);
  }

  @Post('test/create-samples')
  @Roles('CLIENT', 'ORGANIZER')
  @HttpCode(HttpStatus.CREATED)
  async createTestNotifications(@CurrentUser() user: { id: string }) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Endpoint disponible uniquement en développement' };
    }

    const notifications = [
      {
        userId: user.id,
        type: 'NEW_EVENT_FROM_FOLLOWED',
        title: 'Nouvel événement',
        body: 'Un organisateur que vous suivez a créé un événement : Festival de Musique 2026',
      },
      {
        userId: user.id,
        type: 'EVENT_REMINDER_7_DAYS',
        title: 'Événement dans 7 jours',
        body: 'L\'événement "Concert Rock" aura lieu dans 7 jours',
      },
      {
        userId: user.id,
        type: 'ORDER_CONFIRMED',
        title: 'Commande confirmée',
        body: 'Votre commande pour "Conférence Tech 2026" a été confirmée',
      },
      {
        userId: user.id,
        type: 'PARTICIPATION_ACCEPTED',
        title: 'Demande acceptée',
        body: 'Votre demande pour participer à « Atelier Cuisine » a été acceptée.',
      },
    ];

    for (const notification of notifications) {
      await this.notificationsService.create(notification);
    }

    return {
      message: `${notifications.length} notifications de test créées`,
      count: notifications.length,
    };
  }
}
