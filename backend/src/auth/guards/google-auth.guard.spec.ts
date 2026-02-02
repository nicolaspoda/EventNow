import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthGuard } from './google-auth.guard';
import {
  ExecutionContext,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleAuthGuard],
    }).compile();

    guard = module.get<GoogleAuthGuard>(GoogleAuthGuard);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  const createMockContext = (): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
        getResponse: jest.fn(),
      }),
    } as any;
  };

  describe('canActivate', () => {
    it('should throw ServiceUnavailableException if GOOGLE_CLIENT_ID missing', async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_SECRET = 'secret';

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Google OAuth non configuré',
      );
    });

    it('should throw ServiceUnavailableException if GOOGLE_CLIENT_SECRET missing', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      delete process.env.GOOGLE_CLIENT_SECRET;

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should call super.canActivate if credentials configured', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      jest
        .spyOn(Object.getPrototypeOf(guard), 'canActivate')
        .mockResolvedValue(true);

      const context = createMockContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw InternalServerErrorException when super.canActivate throws', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      const parentProto = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
        canActivate: (ctx: ExecutionContext) => Promise<boolean>;
      };
      jest
        .spyOn(parentProto, 'canActivate')
        .mockRejectedValue(new Error('OAuth error'));

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Google OAuth a échoué',
      );
    });

    it('should use generic message when thrown value is not Error', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      const parentProto = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
        canActivate: (ctx: ExecutionContext) => Promise<boolean>;
      };
      jest.spyOn(parentProto, 'canActivate').mockRejectedValue('string error');

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Erreur inconnue (Google OAuth)',
      );
    });
  });
});
