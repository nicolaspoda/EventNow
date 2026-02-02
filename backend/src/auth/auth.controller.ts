import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto, LoginDto, ExchangeCodeDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  private readonly authService: AuthService;
  private readonly redis: RedisService;

  constructor(authService: AuthService, redis: RedisService) {
    this.authService = authService;
    this.redis = redis;
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.generateTokens(
      user.id,
      user.email,
      user.role,
    );

    const userPayload = { id: user.id, email: user.email, role: user.role };
    const code = randomUUID();
    await this.redis.setOAuthCode(code, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userPayload,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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
      user: { id: string; email: string; role: string };
    };
  }
}
