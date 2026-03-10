import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    registerOrganizer: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    generateTokens: jest.fn(),
  };

  const mockRedisService = {
    setOAuthCode: jest.fn(),
    getAndDeleteOAuthCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new client user', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: {
          id: '1',
          username: 'testuser',
          email: registerDto.email,
          role: Role.CLIENT,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.user.role).toBe(Role.CLIENT);
    });
  });

  describe('registerOrganizer', () => {
    it('should register a new organizer', async () => {
      const registerDto = {
        username: 'organizer1',
        email: 'org@example.com',
        password: 'password123',
        confirmOrganizer: true,
      };
      const expectedResult = {
        user: {
          id: '2',
          username: 'organizer1',
          email: registerDto.email,
          role: Role.ORGANIZER,
        },
        accessToken: 'at',
        refreshToken: 'rt',
      };
      mockAuthService.registerOrganizer.mockResolvedValue(expectedResult);
      const result = await controller.registerOrganizer(registerDto);
      expect(result.user.role).toBe(Role.ORGANIZER);
      expect(authService.registerOrganizer).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: {
          id: '1',
          email: loginDto.email,
          role: Role.CLIENT,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshToken);

      expect(result).toEqual(expectedResult);
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('logout', () => {
    it('should call logout and return success message', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout('refresh-token');

      expect(result).toEqual({ message: 'Déconnexion réussie' });
      expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
      };

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('googleAuthCallback', () => {
    it('should generate tokens, store code in Redis and redirect', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: Role.CLIENT,
      };
      const mockReq = { user: mockUser } as any;
      const mockRes = {
        redirect: jest.fn(),
      } as any;
      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });
      mockRedisService.setOAuthCode.mockResolvedValue(undefined);
      const origFrontend = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      await controller.googleAuthCallback(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringMatching(
          /^http:\/\/localhost:5173\/auth\/callback\?code=/,
        ),
      );
      if (origFrontend !== undefined) process.env.FRONTEND_URL = origFrontend;
    });

    it('should use FRONTEND_URL when set', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: Role.CLIENT,
      };
      const mockReq = { user: mockUser } as any;
      const mockRes = { redirect: jest.fn() } as any;
      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });
      mockRedisService.setOAuthCode.mockResolvedValue(undefined);
      process.env.FRONTEND_URL = 'https://app.example.com';

      await controller.googleAuthCallback(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/app\.example\.com\/auth\/callback\?code=/,
        ),
      );
      delete process.env.FRONTEND_URL;
    });
  });

  describe('googleExchange', () => {
    it('should return tokens and user when code is valid', async () => {
      const validData = {
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: '1', email: 'u@e.com', role: Role.CLIENT },
      };
      mockRedisService.getAndDeleteOAuthCode.mockResolvedValue(validData);

      const result = await controller.googleExchange({ code: 'valid-code' });

      expect(result).toEqual(validData);
      expect(mockRedisService.getAndDeleteOAuthCode).toHaveBeenCalledWith(
        'valid-code',
      );
    });

    it('should throw UnauthorizedException when code is invalid or expired', async () => {
      mockRedisService.getAndDeleteOAuthCode.mockResolvedValue(null);

      await expect(
        controller.googleExchange({ code: 'invalid' }),
      ).rejects.toThrow(UnauthorizedException);

      mockRedisService.getAndDeleteOAuthCode.mockResolvedValue('string');

      await expect(
        controller.googleExchange({ code: 'invalid' }),
      ).rejects.toThrow(UnauthorizedException);

      mockRedisService.getAndDeleteOAuthCode.mockResolvedValue({});

      await expect(
        controller.googleExchange({ code: 'invalid' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
