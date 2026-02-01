import {
  Injectable,
  ServiceUnavailableException,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientID || !clientSecret) {
      throw new ServiceUnavailableException(
        'Google OAuth non configuré : définir GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans backend/.env',
      );
    }
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue (Google OAuth)';
      throw new InternalServerErrorException(
        `Google OAuth a échoué: ${message}`,
      );
    }
  }
}
