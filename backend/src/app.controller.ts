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

  /** Utilisé par Docker / Nginx pour vérifier que l’API répond (évite 502 si l’amont n’est pas prêt). */
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Get('config/stripe')
  getStripeConfig() {
    return {
      publishableKey: this.configService.get<string>('STRIPE_PUBLISHABLE_KEY'),
    };
  }
}
