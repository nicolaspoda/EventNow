import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { configureHelmet } from './security/helmet.config';
import { corsConfig } from './security/cors.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CustomLoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  configureHelmet(app);

  app.enableCors(corsConfig);

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

  await app.listen(process.env.PORT || 3000);

  logger.log(
    `Application listening on port ${process.env.PORT || 3000}`,
    'Bootstrap',
  );
}

bootstrap();
