import { ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { CustomLoggerService } from '../../logger/logger.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly securityLogger?: CustomLoggerService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (err || !user) {
      const request = context.switchToHttp().getRequest();
      this.securityLogger?.logSecurityEvent({
        type: 'UNAUTHORIZED_ACCESS',
        ip: request?.ip,
        details: {
          method: request?.method,
          path: request?.url,
          reason: info?.message || err?.message || 'No valid token',
        },
      });
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
