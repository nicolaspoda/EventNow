import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
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
        ],
      }).compile();
      const ctrl = app.get<AppController>(AppController);
      expect(ctrl.getHello()).toBe('Custom message');
    });
  });
});
