import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { getGoogleStrategyOptions } from './google-options';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    const options = getGoogleStrategyOptions();
    super({
      ...options,
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
    this.authService = authService;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails } = profile;

    const user = await this.authService.validateGoogleUser({
      googleId: id,
      email: emails[0].value,
    });

    done(null, user);
  }
}
