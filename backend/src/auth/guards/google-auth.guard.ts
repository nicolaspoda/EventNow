import {
  Injectable,
  ServiceUnavailableException,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Erreur token renvoyée par passport-oauth2 après parsing du JSON Google (RFC 6749 §5.2). */
function isTokenError(
  err: unknown,
): err is { name: string; message?: string; code?: string } {
  return (
    !!err &&
    typeof err === 'object' &&
    (err as { name?: string }).name === 'TokenError'
  );
}

/** Extrait error / error_description du corps renvoyé par Google (échange de code). */
function formatGoogleOAuthError(err: unknown): string {
  if (isTokenError(err)) {
    return [err.code, err.message].filter(Boolean).join(' — ');
  }

  const fromData = (data: string, statusCode?: number, prefix?: string) => {
    try {
      const parsed = JSON.parse(data) as {
        error?: string;
        error_description?: string;
      };
      if (parsed.error || parsed.error_description) {
        return [
          prefix,
          [parsed.error, parsed.error_description].filter(Boolean).join(' — '),
        ]
          .filter(Boolean)
          .join(' | ');
      }
    } catch {
      // corps non JSON
    }
    return [prefix, statusCode && `HTTP ${statusCode}`, data].filter(Boolean).join(' | ');
  };

  if (err instanceof Error) {
    const oauthErr = (
      err as { oauthError?: { statusCode?: number; data?: string } }
    ).oauthError;
    if (oauthErr?.data) {
      return fromData(oauthErr.data, oauthErr.statusCode, err.message);
    }
    return err.message;
  }

  if (
    err &&
    typeof err === 'object' &&
    'data' in err &&
    typeof (err as { data: unknown }).data === 'string'
  ) {
    const e = err as { statusCode?: number; data: string };
    return fromData(e.data, e.statusCode);
  }

  return 'Erreur inconnue (Google OAuth)';
}

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
      const message = formatGoogleOAuthError(err);
      throw new InternalServerErrorException(
        `Google OAuth a échoué: ${message}`,
      );
    }
  }
}
