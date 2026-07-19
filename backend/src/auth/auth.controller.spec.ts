import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import { CustomLoggerService } from '../logger/logger.service';
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
    getFullProfile: jest.fn(),
    getUserPublicProfile: jest.fn(),
    searchUsersByUsername: jest.fn(),
    getAllUsers: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockRedisService = {
    setOAuthCode: jest.fn(),
    getAndDeleteOAuthCode: jest.fn(),
  };

  const mockSecurityLogger = {
    logSecurityEvent: jest.fn(),
  };

  const mockRequest = { ip: '127.0.0.1', url: '/auth/login' } as any;

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
        {
          provide: CustomLoggerService,
          useValue: mockSecurityLogger,
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
          role: Role.USER,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result.user.role).toBe(Role.USER);
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
          role: Role.USER,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should log an AUTH_FAILED security event and rethrow on invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };
      const authError = new UnauthorizedException(
        'Email ou mot de passe incorrect',
      );
      mockAuthService.login.mockRejectedValue(authError);

      await expect(
        controller.login(loginDto, mockRequest),
      ).rejects.toThrow(authError);

      expect(mockSecurityLogger.logSecurityEvent).toHaveBeenCalledWith({
        type: 'AUTH_FAILED',
        ip: mockRequest.ip,
        details: { email: loginDto.email, path: mockRequest.url },
      });
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
        role: Role.USER,
        username: 'testuser',
        createdAt: new Date(),
      };

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('googleAuthCallback', () => {
    it('should fallback to localhost in non-production when FRONTEND_URL is unset', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
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
      const origNodeEnv = process.env.NODE_ENV;
      delete process.env.FRONTEND_URL;
      process.env.NODE_ENV = 'test';

      await controller.googleAuthCallback(mockReq, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/localhost:5173\/auth\/callback\?code=/,
        ),
      );
      if (origFrontend !== undefined) process.env.FRONTEND_URL = origFrontend;
      if (origNodeEnv !== undefined) process.env.NODE_ENV = origNodeEnv;
    });

    it('should use FRONTEND_URL when set', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
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

    it('should throw in production when FRONTEND_URL is unset', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: Role.USER,
      };
      const mockReq = { user: mockUser } as any;
      const mockRes = { redirect: jest.fn() } as any;
      const origFrontend = process.env.FRONTEND_URL;
      const origNodeEnv = process.env.NODE_ENV;
      delete process.env.FRONTEND_URL;
      process.env.NODE_ENV = 'production';

      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
      });
      mockRedisService.setOAuthCode.mockResolvedValue(undefined);

      await expect(
        controller.googleAuthCallback(mockReq, mockRes),
      ).rejects.toThrow('FRONTEND_URL must be configured in production');

      expect(mockRes.redirect).not.toHaveBeenCalled();
      if (origFrontend !== undefined) process.env.FRONTEND_URL = origFrontend;
      if (origNodeEnv !== undefined) process.env.NODE_ENV = origNodeEnv;
    });
  });

  describe('googleExchange', () => {
    it('should return tokens and user when code is valid', async () => {
      const validData = {
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: '1', email: 'u@e.com', role: Role.USER },
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

  describe('getFullProfile', () => {
    it('should return full profile for authenticated user', async () => {
      const mockUser = { id: 'user-1', email: 'u@e.com', role: Role.USER } as any;
      const profile = { id: 'user-1', followersCount: 5, followingCount: 2 };
      mockAuthService.getFullProfile.mockResolvedValue(profile);
      const result = await controller.getFullProfile(mockUser);
      expect(result).toEqual(profile);
      expect(authService.getFullProfile).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUserPublicProfile', () => {
    it('should return public profile', async () => {
      const mockUser = { id: 'viewer-1' } as any;
      const profile = { id: 'user-1', username: 'alice' };
      mockAuthService.getUserPublicProfile.mockResolvedValue(profile);
      const result = await controller.getUserPublicProfile('user-1', mockUser);
      expect(result).toEqual(profile);
      expect(authService.getUserPublicProfile).toHaveBeenCalledWith('user-1', 'viewer-1');
    });
  });

  describe('searchUsers', () => {
    it('should search users with query and default limit', async () => {
      const users = [{ id: 'u-1', username: 'alice' }];
      mockAuthService.searchUsersByUsername.mockResolvedValue(users);
      const mockReq = { query: { q: 'ali' } } as any;
      const result = await controller.searchUsers(mockReq);
      expect(result).toEqual(users);
      expect(authService.searchUsersByUsername).toHaveBeenCalledWith('ali', 15);
    });

    it('should use custom limit clamped to max 20', async () => {
      mockAuthService.searchUsersByUsername.mockResolvedValue([]);
      const mockReq = { query: { q: 'ali', limit: '50' } } as any;
      await controller.searchUsers(mockReq);
      expect(authService.searchUsersByUsername).toHaveBeenCalledWith('ali', 20);
    });

    it('should default to empty string when query is not a string', async () => {
      mockAuthService.searchUsersByUsername.mockResolvedValue([]);
      const mockReq = { query: {} } as any;
      await controller.searchUsers(mockReq);
      expect(authService.searchUsersByUsername).toHaveBeenCalledWith('', 15);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [{ id: 'u-1' }];
      mockAuthService.getAllUsers.mockResolvedValue(users);
      const result = await controller.getAllUsers();
      expect(result).toEqual(users);
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return result', async () => {
      const mockUser = { id: 'user-1', email: 'u@e.com', role: Role.USER } as any;
      const dto = { avatarUrl: 'https://cdn.example.com/avatar.jpg' } as any;
      const updated = { id: 'user-1', avatarUrl: 'https://cdn.example.com/avatar.jpg' };
      mockAuthService.updateProfile.mockResolvedValue(updated);
      const result = await controller.updateProfile(mockUser, dto);
      expect(result).toEqual(updated);
      expect(authService.updateProfile).toHaveBeenCalledWith('user-1', dto);
    });
  });
});
