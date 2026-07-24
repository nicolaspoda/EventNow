import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly appService: AppService;

  constructor(
    appService: AppService,
    private readonly configService: ConfigService,
  ) {
    this.appService = appService;
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('config/stripe')
  getStripeConfig() {
    return {
      publishableKey: this.configService.get<string>('STRIPE_PUBLISHABLE_KEY'),
    };
  }

  // TEMPORARY — remove once Sentry capture is confirmed on the Sentry dashboard.
  @Get('debug-sentry')
  debugSentry(): never {
    throw new Error('Sentry test error - EventNow backend');
  }
}
