import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedId: data.relatedId ?? null,
      },
    });
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
    return this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        relatedId: data.relatedId ?? null,
      })),
    });
  }
}
