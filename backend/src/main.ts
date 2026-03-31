import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { configureHelmet } from './security/helmet.config';
import { corsConfig } from './security/cors.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CustomLoggerService } from './logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const certsPath = path.join(process.cwd(), 'certs');
  const httpsOptions = {
    key: fs.readFileSync(path.join(certsPath, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(certsPath, 'localhost-cert.pem')),
  };

  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
    httpsOptions,
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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application listening on https://localhost:${port}`, 'Bootstrap');
}

bootstrap();
