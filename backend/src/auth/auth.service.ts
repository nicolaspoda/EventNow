import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { FollowsService } from '../follows/follows.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly prisma: PrismaService;
  private readonly jwtService: JwtService;
  private readonly redis: RedisService;
  private readonly followsService: FollowsService;

  constructor(
    prisma: PrismaService,
    jwtService: JwtService,
    redis: RedisService,
    followsService: FollowsService,
  ) {
    this.prisma = prisma;
    this.jwtService = jwtService;
    this.redis = redis;
    this.followsService = followsService;
  }

  async register(dto: RegisterDto) {
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingByEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const existingByUsername = await this.prisma.user.findFirst({
      where: {
        username: { equals: dto.username, mode: 'insensitive' },
      },
    });

    if (existingByUsername) {
      throw new ConflictException('Ce nom d’utilisateur est déjà pris');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const isEmail = dto.email.includes('@');
    const user = isEmail
      ? await this.prisma.user.findUnique({
          where: { email: dto.email.trim() },
        })
      : await this.prisma.user.findFirst({
          where: {
            username: { equals: dto.email.trim(), mode: 'insensitive' },
          },
        });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const isBlacklisted = await this.redis.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token révoqué');
      }

      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
      const ttl = payload.exp
        ? payload.exp - Math.floor(Date.now() / 1000)
        : 604800;

      if (ttl > 0) {
        await this.redis.blacklistToken(refreshToken, ttl);
      }
    } catch {
      return;
    }
  }

  async getFullProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            organizedEvents: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const participantReviewStats = await this.prisma.participantReview.aggregate({
      where: { participantId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const organizerReviewStats = await this.prisma.review.aggregate({
      where: {
        event: { organizerId: userId },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const [followersCount, followingCount, friendsCount] = await Promise.all([
      this.followsService.getFollowersCount(userId),
      this.followsService.getFollowingCount(userId),
      this.followsService.getFriendsCount(userId),
    ]);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      followersCount,
      followingCount,
      friendsCount,
      stats: {
        ordersCount: user._count.orders,
        reviewsCount: user._count.reviews,
        eventsOrganized: user._count.organizedEvents,
        averageRatingAsParticipant: participantReviewStats._avg.rating != null
          ? Math.round(participantReviewStats._avg.rating * 10) / 10
          : null,
        totalReviewsAsParticipant: participantReviewStats._count.rating,
        averageRatingOnMyEvents: organizerReviewStats._avg.rating != null
          ? Math.round(organizerReviewStats._avg.rating * 10) / 10
          : null,
        totalReviewsOnMyEvents: organizerReviewStats._count.rating,
      },
    };
  }

  async getUserPublicProfile(userId: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const acceptedParticipations = await this.prisma.participationRequest.findMany({
      where: {
        userId,
        status: 'ACCEPTED',
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            location: true,
            imageUrl: true,
            type: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const participantReviews = await this.prisma.participantReview.findMany({
      where: { participantId: userId },
      include: {
        reviewer: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const avgRating = await this.prisma.participantReview.aggregate({
      where: { participantId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const organizerReviewStats = await this.prisma.review.aggregate({
      where: {
        event: { organizerId: userId },
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const [followRecord, followersCount, followingCount, friendsCount, isFriend] =
      await Promise.all([
        currentUserId
          ? this.followsService.getFollowRecord(currentUserId, userId)
          : Promise.resolve(null),
        this.followsService.getFollowersCount(userId),
        this.followsService.getFollowingCount(userId),
        this.followsService.getFriendsCount(userId),
        currentUserId
          ? this.followsService.isFriend(currentUserId, userId)
          : Promise.resolve(false),
      ]);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      ...(currentUserId && {
        isFollowing: !!followRecord,
        isFriend: !!isFriend,
        ...(followRecord && { notificationsEnabled: followRecord.notificationsEnabled }),
      }),
      followersCount,
      followingCount,
      friendsCount,
      participatedEvents: acceptedParticipations.map((p) => ({
        ...p.event,
        eventDate: p.event.eventDate.toISOString(),
      })),
      participantReviews: participantReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        reviewerName: r.reviewer.username ?? 'Anonyme',
      })),
      stats: {
        averageRating: avgRating._avg.rating != null
          ? Math.round(avgRating._avg.rating * 10) / 10
          : null,
        totalReviews: avgRating._count.rating,
        participatedEventsCount: acceptedParticipations.length,
        averageRatingOnMyEvents: organizerReviewStats._avg.rating != null
          ? Math.round(organizerReviewStats._avg.rating * 10) / 10
          : null,
        totalReviewsOnMyEvents: organizerReviewStats._count.rating,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: dto.avatarUrl || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async validateGoogleUser(googleUser: {
    googleId: string;
    email: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (user) {
      return user;
    }

    user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.googleId,
        },
      });
      return user;
    }

    const username = await this.generateUniqueUsernameFromEmail(googleUser.email);

    user = await this.prisma.user.create({
      data: {
        username,
        email: googleUser.email,
        googleId: googleUser.googleId,
        role: 'CLIENT',
      },
    });

    return user;
  }

  private async generateUniqueUsernameFromEmail(email: string): Promise<string> {
    const base = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || 'user';
    let username = base;
    let suffix = 0;
    while (true) {
      const existing = await this.prisma.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
      });
      if (!existing) return username;
      suffix += 1;
      username = `${base}_${suffix}`;
    }
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
      },
      orderBy: {
        username: 'asc',
      },
    });
  }

  async searchUsersByUsername(query: string, limit = 15) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return this.prisma.user.findMany({
      where: {
        username: {
          not: null,
          startsWith: q,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
      take: limit,
      orderBy: { username: 'asc' },
    });
  }
}
