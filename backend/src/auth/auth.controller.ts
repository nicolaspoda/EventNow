import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Put,
  Param,
  Req,
  Res,
  UnauthorizedException,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import {
  RegisterDto,
  RegisterOrganizerDto,
  LoginDto,
  ExchangeCodeDto,
  UpdateProfileDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './types/auth-user.type';
import { CustomLoggerService } from '../logger/logger.service';

@Controller('auth')
export class AuthController {
  private readonly authService: AuthService;
  private readonly redis: RedisService;
  private readonly securityLogger?: CustomLoggerService;

  constructor(
    authService: AuthService,
    redis: RedisService,
    @Optional() securityLogger?: CustomLoggerService,
  ) {
    this.authService = authService;
    this.redis = redis;
    this.securityLogger = securityLogger;
  }

  private resolveFrontendUrl(): string {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim();
    if (frontendUrl) return frontendUrl;

    if (process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException(
        'FRONTEND_URL must be configured in production',
      );
    }

    return 'https://localhost:5173';
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register-organizer')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async registerOrganizer(@Body() dto: RegisterOrganizerDto) {
    return this.authService.registerOrganizer(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    try {
      return await this.authService.login(dto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.securityLogger?.logSecurityEvent({
          type: 'AUTH_FAILED',
          ip: req.ip,
          details: { email: dto.email, path: req.url },
        });
      }
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return { message: 'Déconnexion réussie' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getFullProfile(@CurrentUser() user: AuthUser) {
    return this.authService.getFullProfile(user.id);
  }

  @Get('user/:userId/public-profile')
  @UseGuards(JwtAuthGuard)
  async getUserPublicProfile(
    @Param('userId') userId: string,
    @CurrentUser() user: { id: string } | undefined,
  ) {
    return this.authService.getUserPublicProfile(userId, user?.id);
  }

  @Get('users/search')
  @UseGuards(JwtAuthGuard)
  async searchUsers(@Req() req: Request) {
    const q = typeof req.query?.q === 'string' ? req.query.q : '';
    const limit = Math.min(20, Math.max(1, Number(req.query?.limit) || 15));
    return this.authService.searchUsersByUsername(q, limit);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as AuthUser;
    const tokens = await this.authService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    const userPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username ?? null,
    };
    const code = randomUUID();
    await this.redis.setOAuthCode(code, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userPayload,
    });

    const frontendUrl = this.resolveFrontendUrl();
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleExchange(@Body() dto: ExchangeCodeDto) {
    const data = await this.redis.getAndDeleteOAuthCode(dto.code);
    if (!data || typeof data !== 'object' || !('accessToken' in data)) {
      throw new UnauthorizedException('Code invalide ou expiré');
    }
    return data as {
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        email: string;
        role: string;
        username: string | null;
      };
    };
  }
}
