import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { configureHelmet } from './security/helmet.config';
import { corsConfig } from './security/cors.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CustomLoggerService } from './logger/logger.service';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  configureHelmet(app);

  app.enableCors(corsConfig);

  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        if (req.originalUrl.includes('/webhook/stripe')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  const logger = app.get(CustomLoggerService);
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  app.setGlobalPrefix('api/v1');

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application listening on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();
