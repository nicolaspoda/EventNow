import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => MessagesGateway))
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async getForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
        type: {
          notIn: ['NEW_MESSAGE', 'ADDED_TO_CONVERSATION'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notif) {
      throw new NotFoundException('Notification introuvable');
    }
    if (notif.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async delete(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notif) {
      throw new NotFoundException('Notification introuvable');
    }
    if (notif.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId },
      data: { read: true },
    });
    return { success: true };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
        type: {
          notIn: ['NEW_MESSAGE', 'ADDED_TO_CONVERSATION'],
        },
      },
    });
  }

  async create(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    relatedId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedId: data.relatedId ?? null,
      },
    });
    this.messagesGateway.emitNewNotificationToUser(data.userId);
    return notification;
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    relatedId?: string;
  }) {
    return this.create(data);
  }

  async createForManyUsers(
    userIds: string[],
    data: { type: string; title: string; body: string; relatedId?: string },
  ) {
    if (userIds.length === 0) return [];
    const result = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedId: data.relatedId ?? null,
      })),
    });
    userIds.forEach((userId) =>
      this.messagesGateway.emitNewNotificationToUser(userId),
    );
    return result;
  }

  async deleteByTypeAndRelatedId(
    userId: string,
    type: string,
    relatedId: string,
  ): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, type, relatedId },
    });
    return result.count;
  }

  /**
   * Supprime toutes les notifications d'un type donné dont relatedId est dans la liste.
   * Utile pour supprimer les notifications d'invitation staff lors de la suppression d'un événement.
   */
  async deleteByTypeAndRelatedIds(
    type: string,
    relatedIds: string[],
  ): Promise<number> {
    if (relatedIds.length === 0) return 0;
    const result = await this.prisma.notification.deleteMany({
      where: { type, relatedId: { in: relatedIds } },
    });
    return result.count;
  }
}
