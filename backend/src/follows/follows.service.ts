import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

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

    const created = await this.prisma.follow.create({
      data: { followerId, followingId },
    });

    const follower = await this.prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, email: true },
    });
    const followerName = follower?.username ?? follower?.email?.split('@')[0] ?? 'Quelqu\'un';
    await this.notificationsService.create({
      userId: followingId,
      type: 'NEW_FOLLOWER',
      title: 'Nouvel abonné',
      body: `${followerName} a commencé à vous suivre`,
      relatedId: followerId,
    });

    return created;
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
  async getFollowers(
    userId: string,
    limit = 50,
    currentUserId?: string,
  ) {
    const follows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      take: limit,
      include: {
        follower: {
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const items = follows.map((f) => ({
      ...f.follower,
      followedAt: f.createdAt,
    }));
    if (!currentUserId) return items;
    return this.addFollowFlagsToUsers(
      items,
      currentUserId,
    );
  }

  /** Liste des utilisateurs que `userId` suit (following). */
  async getFollowing(
    userId: string,
    limit = 50,
    currentUserId?: string,
  ) {
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const items = follows.map((f) => ({
      ...f.following,
      followedAt: f.createdAt,
    }));
    if (!currentUserId) return items;
    return this.addFollowFlagsToUsers(
      items,
      currentUserId,
    );
  }

  /** IDs des utilisateurs que `followerId` suit (pour filtre catalogue). */
  async getFollowingIds(followerId: string): Promise<string[]> {
    const follows = await this.prisma.follow.findMany({
      where: { followerId },
      select: { followingId: true },
    });
    return follows.map((f) => f.followingId);
  }

  /**
   * Amis = follow mutuel. Retourne les IDs des utilisateurs qui sont "amis" avec userId
   * (ils se suivent mutuellement).
   */
  async getFriendIds(userId: string): Promise<string[]> {
    const [following, followers] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      this.prisma.follow.findMany({
        where: { followingId: userId },
        select: { followerId: true },
      }),
    ]);
    const followingSet = new Set(following.map((f) => f.followingId));
    const mutual = followers
      .map((f) => f.followerId)
      .filter((id) => followingSet.has(id));
    return mutual;
  }

  async getFriendsCount(userId: string): Promise<number> {
    const friendIds = await this.getFriendIds(userId);
    return friendIds.length;
  }

  /** Liste des amis (follow mutuel) avec infos utilisateur, même format que getFollowers. */
  async getFriends(
    userId: string,
    limit = 50,
    currentUserId?: string,
  ) {
    const friendIds = await this.getFriendIds(userId);
    if (friendIds.length === 0) return [];
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId, followingId: { in: friendIds } },
      take: limit,
      include: {
        following: {
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const items = follows.map((f) => ({
      ...f.following,
      followedAt: f.createdAt,
    }));
    if (!currentUserId) return items;
    return this.addFollowFlagsToUsers(
      items,
      currentUserId,
    );
  }

  /** Pour chaque utilisateur, ajoute isFollowingByCurrentUser et isFriendWithCurrentUser. */
  private async addFollowFlagsToUsers<
    T extends { id: string } & Record<string, unknown>,
  >(
    items: T[],
    currentUserId: string,
  ): Promise<(T & { isFollowingByCurrentUser: boolean; isFriendWithCurrentUser: boolean })[]> {
    if (items.length === 0) return [];
    const ids = items.map((u) => u.id);
    const [followingByMe, friendIds] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: currentUserId, followingId: { in: ids } },
        select: { followingId: true },
      }),
      this.getFriendIds(currentUserId),
    ]);
    const followingSet = new Set(followingByMe.map((f) => f.followingId));
    const friendSet = new Set(friendIds);
    return items.map((u) => ({
      ...u,
      isFollowingByCurrentUser: followingSet.has(u.id),
      isFriendWithCurrentUser: friendSet.has(u.id),
    }));
  }

  /** Vrai si les deux utilisateurs se suivent mutuellement. */
  async isFriend(userIdA: string, userIdB: string): Promise<boolean> {
    if (userIdA === userIdB) return false;
    const [aFollowsB, bFollowsA] = await Promise.all([
      this.isFollowing(userIdA, userIdB),
      this.isFollowing(userIdB, userIdA),
    ]);
    return aFollowsB && bFollowsA;
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
