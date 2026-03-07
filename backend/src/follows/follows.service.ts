import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Vous ne pouvez pas vous suivre vous-même');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: followingId },
    });
    if (!target) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  async unfollow(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (!follow) {
      return { success: true };
    }
    await this.prisma.follow.delete({
      where: { id: follow.id },
    });
    return { success: true };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return !!follow;
  }

  async getFollowersCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followingId: userId },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followerId: userId },
    });
  }

  /** Liste des utilisateurs qui suivent `userId` (followers). */
  async getFollowers(userId: string, limit = 50) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map((f) => ({
      ...f.follower,
      followedAt: f.createdAt,
    }));
  }

  /** Liste des utilisateurs que `userId` suit (following). */
  async getFollowing(userId: string, limit = 50) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map((f) => ({
      ...f.following,
      followedAt: f.createdAt,
    }));
  }

  /** IDs des utilisateurs que `followerId` suit (pour filtre catalogue). */
  async getFollowingIds(followerId: string): Promise<string[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId },
      select: { followingId: true },
    });
    return follows.map((f) => f.followingId);
  }

  /** Récupère les followerIds qui ont activé les notifications (pour envoi à la création d'event). */
  async getFollowerIds(followingId: string): Promise<string[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followingId, notificationsEnabled: true },
      select: { followerId: true },
    });
    return follows.map((f) => f.followerId);
  }

  async getFollowRecord(followerId: string, followingId: string) {
    return this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  }

  async setNotificationsEnabled(
    followerId: string,
    followingId: string,
    enabled: boolean,
  ) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    if (!follow) {
      throw new NotFoundException('Abonnement introuvable');
    }
    return this.prisma.follow.update({
      where: { id: follow.id },
      data: { notificationsEnabled: enabled },
    });
  }
}
