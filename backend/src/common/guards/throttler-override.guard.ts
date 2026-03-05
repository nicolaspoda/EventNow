import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Désactive le rate limiting quand DISABLE_THROTTLE=true (ex. pour les tests E2E).
 */
@Injectable()
export class ThrottlerOverrideGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.DISABLE_THROTTLE === 'true') {
      return true;
    }
    return super.canActivate(context);
  }
}
