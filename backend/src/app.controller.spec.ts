import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should return value from service', async () => {
      const app = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          {
            provide: AppService,
            useValue: { getHello: () => 'Custom message' },
          },
          {
            provide: ConfigService,
            useValue: { get: jest.fn() },
          },
        ],
      }).compile();
      const ctrl = app.get<AppController>(AppController);
      expect(ctrl.getHello()).toBe('Custom message');
    });
  });

  describe('getStripeConfig', () => {
    it('should return the Stripe publishable key from the ConfigService', async () => {
      const app = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          AppService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn().mockReturnValue('pk_test_123') },
          },
        ],
      }).compile();
      const ctrl = app.get<AppController>(AppController);
      expect(ctrl.getStripeConfig()).toEqual({ publishableKey: 'pk_test_123' });
    });
  });
});
