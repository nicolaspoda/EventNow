import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { CustomLoggerService } from '../../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : rawMessage &&
            typeof rawMessage === 'object' &&
            'message' in rawMessage
          ? (() => {
              const m = (rawMessage as { message: unknown }).message;
              if (Array.isArray(m)) return m.join(', ');
              return typeof m === 'string' ? m : 'Erreur serveur';
            })()
          : 'Erreur serveur';

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
      'ExceptionFilter',
    );

    // Erreurs inattendues uniquement (5xx) : les 4xx sont des rejets métier
    // normaux (validation, auth...) et noieraient Sentry sous du bruit.
    if (status === 500) {
      Sentry.captureException(exception);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        process.env.NODE_ENV === 'production' && status === 500
          ? 'Internal server error'
          : message,
    };

    response.status(status).json(errorResponse);
  }
}
