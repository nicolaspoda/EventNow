import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Same as JwtAuthGuard but does not throw when the token is missing or invalid.
 * Request continues with request.user undefined. Use for routes that work with or without auth.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser | undefined {
    if (err || user === false) {
      return undefined;
    }
    return user;
  }
}
