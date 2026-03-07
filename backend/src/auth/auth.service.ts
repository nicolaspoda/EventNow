import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly prisma: PrismaService;
  private readonly jwtService: JwtService;
  private readonly redis: RedisService;

  constructor(
    prisma: PrismaService,
    jwtService: JwtService,
    redis: RedisService,
  ) {
    this.prisma = prisma;
    this.jwtService = jwtService;
    this.redis = redis;
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
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
        email: true,
        role: true,
        firstName: true,
        lastName: true,
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

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
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

  async getUserPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
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
            firstName: true,
            lastName: true,
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

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      participatedEvents: acceptedParticipations.map((p) => ({
        ...p.event,
        eventDate: p.event.eventDate.toISOString(),
      })),
      participantReviews: participantReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        reviewerName: r.reviewer.firstName && r.reviewer.lastName
          ? `${r.reviewer.firstName} ${r.reviewer.lastName}`
          : 'Anonyme',
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
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        avatarUrl: dto.avatarUrl || null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
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
    firstName?: string;
    lastName?: string;
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
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
        },
      });
      return user;
    }

    user = await this.prisma.user.create({
      data: {
        email: googleUser.email,
        googleId: googleUser.googleId,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        role: 'CLIENT',
      },
    });

    return user;
  }
}
