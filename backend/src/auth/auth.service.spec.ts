import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Role } from '@prisma/client';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockRedisService = {
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    module.get<JwtService>(JwtService);
    redis = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new client user', async () => {
      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: '1',
        username: registerDto.username,
        email: registerDto.email,
        passwordHash: hashedPassword,
        role: Role.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          username: { equals: registerDto.username, mode: 'insensitive' },
        },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        role: Role.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: loginDto.email,
        passwordHash: 'hashedPassword',
        role: Role.CLIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should successfully refresh tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
      };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedisService.isTokenBlacklisted.mockResolvedValue(false);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValueOnce('new-access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('new-refresh-token');

      const result = await service.refreshTokens(refreshToken);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(redis.isTokenBlacklisted).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException if token is blacklisted', async () => {
      const refreshToken = 'blacklisted-token';
      mockRedisService.isTokenBlacklisted.mockResolvedValue(true);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const refreshToken = 'invalid-token';
      mockRedisService.isTokenBlacklisted.mockResolvedValue(false);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const refreshToken = 'valid-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
      };

      mockRedisService.isTokenBlacklisted.mockResolvedValue(false);
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should blacklist the refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockRedisService.blacklistToken.mockResolvedValue(undefined);

      await service.logout(refreshToken);

      expect(redis.blacklistToken).toHaveBeenCalledWith(
        refreshToken,
        expect.any(Number),
      );
    });

    it('should not throw if token is invalid', async () => {
      const refreshToken = 'invalid-token';
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid'));

      await expect(service.logout(refreshToken)).resolves.not.toThrow();
    });

    it('should use default ttl 604800 when payload has no exp', async () => {
      const refreshToken = 'valid-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
        // no exp
      };

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);
      mockRedisService.blacklistToken.mockResolvedValue(undefined);

      await service.logout(refreshToken);

      expect(redis.blacklistToken).toHaveBeenCalledWith(refreshToken, 604800);
    });

    it('should not blacklist when token exp is already in the past', async () => {
      const refreshToken = 'expired-token';
      const mockPayload = {
        sub: '1',
        email: 'test@example.com',
        role: Role.CLIENT,
        exp: Math.floor(Date.now() / 1000) - 3600, // 1h in the past
      };

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      await service.logout(refreshToken);

      expect(redis.blacklistToken).not.toHaveBeenCalled();
    });
  });

  describe('validateGoogleUser', () => {
    it('should return existing user if googleId matches', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@gmail.com',
        googleId: 'google-123',
        role: Role.CLIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.validateGoogleUser({
        googleId: 'google-123',
        email: 'test@gmail.com',
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
    });

    it('should update existing user with googleId if email matches', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@gmail.com',
        googleId: null,
        role: Role.CLIENT,
      };

      const updatedUser = {
        ...existingUser,
        googleId: 'google-456',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.validateGoogleUser({
        googleId: 'google-456',
        email: 'test@gmail.com',
      });

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          googleId: 'google-456',
        },
      });
    });

    it('should create new user if no match found', async () => {
      const newUser = {
        id: 'user-789',
        email: 'new@gmail.com',
        googleId: 'google-789',
        username: 'newuser',
        role: Role.CLIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await service.validateGoogleUser({
        googleId: 'google-789',
        email: 'new@gmail.com',
      });

      expect(result).toEqual(newUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@gmail.com',
          googleId: 'google-789',
          role: 'CLIENT',
          username: expect.any(String),
        }),
      });
    });

    it('should create new user with generated username when no match found', async () => {
      const newUser = {
        id: 'user-999',
        email: 'test3@gmail.com',
        googleId: 'google-999',
        username: 'test3',
        role: Role.CLIENT,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await service.validateGoogleUser({
        googleId: 'google-999',
        email: 'test3@gmail.com',
      });

      expect(result).toEqual(newUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test3@gmail.com',
          googleId: 'google-999',
          role: 'CLIENT',
          username: expect.any(String),
        }),
      });
    });
  });
});
