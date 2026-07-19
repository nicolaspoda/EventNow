import { ExecutionContext, Injectable, Optional } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { CustomLoggerService } from '../../logger/logger.service';

/**
 * Désactive le rate limiting quand DISABLE_THROTTLE=true (ex. pour les tests E2E).
 */
@Injectable()
export class ThrottlerOverrideGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    @Optional() private readonly securityLogger?: CustomLoggerService,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.DISABLE_THROTTLE === 'true') {
      return true;
    }
    return super.canActivate(context);
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { req } = this.getRequestResponse(context);

    this.securityLogger?.logSecurityEvent({
      type: 'RATE_LIMIT',
      ip: req?.ip,
      details: {
        method: req?.method,
        path: req?.url,
      },
    });

    throw new ThrottlerException(
      await this.getErrorMessage(context, throttlerLimitDetail),
    );
  }
}
