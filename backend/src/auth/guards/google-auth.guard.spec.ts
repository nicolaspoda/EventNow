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

    it('should throw ServiceUnavailableException if GOOGLE_CLIENT_ID is the .env.example placeholder', async () => {
      process.env.GOOGLE_CLIENT_ID = 'your-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'secret';

      const context = createMockContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException if GOOGLE_CLIENT_SECRET is the .env.example placeholder', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'your-google-client-secret';

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

    it('should format TokenError with code and message', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      const tokenError = {
        name: 'TokenError',
        message: 'invalid_grant',
        code: 'invalid_grant',
      };
      const parentProto = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
        canActivate: (ctx: ExecutionContext) => Promise<boolean>;
      };
      jest.spyOn(parentProto, 'canActivate').mockRejectedValue(tokenError);

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow('invalid_grant');
    });

    it('should format Error with oauthError JSON data', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      const oauthErr = Object.assign(new Error('exchange failed'), {
        oauthError: {
          data: JSON.stringify({
            error: 'access_denied',
            error_description: 'User denied',
          }),
          statusCode: 400,
        },
      });
      const parentProto = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
        canActivate: (ctx: ExecutionContext) => Promise<boolean>;
      };
      jest.spyOn(parentProto, 'canActivate').mockRejectedValue(oauthErr);

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow('access_denied');
    });

    it('should format Error with oauthError non-JSON data', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      const oauthErr = Object.assign(new Error('exchange failed'), {
        oauthError: { data: 'plain text error', statusCode: 500 },
      });
      const parentProto = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
        canActivate: (ctx: ExecutionContext) => Promise<boolean>;
      };
      jest.spyOn(parentProto, 'canActivate').mockRejectedValue(oauthErr);

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow(
        'plain text error',
      );
    });

    it('should format object with data string using JSON', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      const errObj = {
        data: JSON.stringify({ error: 'invalid_client' }),
        statusCode: 401,
      };
      const parentProto = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
        canActivate: (ctx: ExecutionContext) => Promise<boolean>;
      };
      jest.spyOn(parentProto, 'canActivate').mockRejectedValue(errObj);

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow(
        'invalid_client',
      );
    });

    it('should format object with data string using plain text fallback', async () => {
      process.env.GOOGLE_CLIENT_ID = 'client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'client-secret';

      const errObj = { data: 'raw error text', statusCode: 503 };
      const parentProto = Object.getPrototypeOf(GoogleAuthGuard.prototype) as {
        canActivate: (ctx: ExecutionContext) => Promise<boolean>;
      };
      jest.spyOn(parentProto, 'canActivate').mockRejectedValue(errObj);

      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow(
        'raw error text',
      );
    });
  });
});
