import * as Sentry from '@sentry/nestjs';

/**
 * Doit être importé avant tout le reste dans main.ts (Sentry a besoin de
 * patcher certains modules Node avant qu'ils soient require par NestJS).
 * No-op silencieux hors production ou si SENTRY_DSN n'est pas défini.
 */
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
}
