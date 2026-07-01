import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { FollowsService } from '../follows/follows.service';
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
      findMany: jest.fn(),
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

  const mockFollowsService = {
    getFollowersCount: jest.fn().mockResolvedValue(0),
    getFollowingCount: jest.fn().mockResolvedValue(0),
    getFriendsCount: jest.fn().mockResolvedValue(0),
    getFollowRecord: jest.fn().mockResolvedValue(null),
    isFriend: jest.fn().mockResolvedValue(false),
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
        {
          provide: FollowsService,
          useValue: mockFollowsService,
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
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
      };
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
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
        role: Role.USER,
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
          role: 'USER',
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
        role: Role.USER,
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
          role: 'USER',
          username: expect.any(String),
        }),
      });
    });

    it('should generate username with suffix when base username is taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // no googleId match
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // no email match
      mockPrismaService.user.findFirst
        .mockResolvedValueOnce({ id: 'existing-1' }) // 'test' taken
        .mockResolvedValueOnce(null); // 'test_1' available
      const newUser = { id: 'user-new', email: 'test@gmail.com', googleId: 'gid', username: 'test_1', role: Role.USER };
      mockPrismaService.user.create.mockResolvedValue(newUser);
      const result = await service.validateGoogleUser({ googleId: 'gid', email: 'test@gmail.com' });
      expect(result.username).toBe('test_1');
    });
  });

  describe('register (username conflict)', () => {
    it('should throw ConflictException if username already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null); // email available
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'other-user', username: 'testuser' }); // username taken
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      await expect(service.register({ username: 'testuser', email: 'new@test.com', password: 'pass' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('registerOrganizer', () => {
    const orgDto = {
      username: 'orguser',
      email: 'org@test.com',
      password: 'pass123',
      confirmOrganizer: true,
      organizationName: 'Test Org',
    };

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.registerOrganizer(orgDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if username taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'other', username: 'orguser' });
      await expect(service.registerOrganizer(orgDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if confirmOrganizer is false', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      await expect(service.registerOrganizer({ ...orgDto, confirmOrganizer: false }))
        .rejects.toThrow();
    });

    it('should register organizer successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const mockOrg = { id: 'org-1', username: 'orguser', email: 'org@test.com', role: 'ORGANIZER', organizationName: 'Test Org' };
      mockPrismaService.user.create.mockResolvedValue(mockOrg);
      mockJwtService.signAsync.mockResolvedValue('token');
      const result = await service.registerOrganizer(orgDto);
      expect(result.user.role).toBe('ORGANIZER');
    });
  });

  describe('getFullProfile', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      email: 'test@test.com',
      role: 'USER',
      avatarUrl: null,
      createdAt: new Date('2024-01-01'),
      _count: { orders: 2, reviews: 1, organizedEvents: 0 },
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getFullProfile('user-1')).rejects.toThrow(UnauthorizedException);
    });

    it('should return full profile with stats', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (prisma as any).participantReview = {
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: { rating: 3 } }),
      };
      (prisma as any).review = {
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }),
      };
      const result = await service.getFullProfile('user-1');
      expect(result.id).toBe('user-1');
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('getUserPublicProfile', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      email: 'test@test.com',
      role: 'USER',
      avatarUrl: null,
      createdAt: new Date('2024-01-01'),
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserPublicProfile('user-1')).rejects.toThrow(UnauthorizedException);
    });

    it('should return public profile without currentUserId', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (prisma as any).participationRequest = {
        findMany: jest.fn().mockResolvedValue([]),
      };
      (prisma as any).participantReview = {
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }),
      };
      (prisma as any).review = {
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }),
      };
      const result = await service.getUserPublicProfile('user-1');
      expect(result.id).toBe('user-1');
      expect(result).not.toHaveProperty('isFollowing');
    });

    it('should include follow info when currentUserId provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (prisma as any).participationRequest = {
        findMany: jest.fn().mockResolvedValue([]),
      };
      (prisma as any).participantReview = {
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }),
      };
      (prisma as any).review = {
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: { rating: 0 } }),
      };
      mockFollowsService.getFollowRecord.mockResolvedValue({ id: 'f-1', notificationsEnabled: true });
      mockFollowsService.isFriend.mockResolvedValue(true);
      const result = await service.getUserPublicProfile('user-1', 'other-user');
      expect(result).toHaveProperty('isFollowing');
      expect(result).toHaveProperty('isFriend');
    });
  });

  describe('updateProfile', () => {
    it('should update avatar url', async () => {
      const updated = { id: 'user-1', username: 'u', email: 'e@t.com', role: 'USER', avatarUrl: 'http://img', createdAt: new Date('2024-01-01') };
      mockPrismaService.user.update.mockResolvedValue(updated);
      const result = await service.updateProfile('user-1', { avatarUrl: 'http://img' });
      expect(result.avatarUrl).toBe('http://img');
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u-1', username: 'alice', email: 'alice@test.com', avatarUrl: null },
      ]);
      const result = await service.getAllUsers();
      expect(result).toHaveLength(1);
    });
  });

  describe('searchUsersByUsername', () => {
    it('should return empty array for empty query', async () => {
      const result = await service.searchUsersByUsername('');
      expect(result).toEqual([]);
    });

    it('should return users matching username prefix', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'u-1', username: 'alice', email: 'alice@test.com', avatarUrl: null },
      ]);
      const result = await service.searchUsersByUsername('ali');
      expect(result).toHaveLength(1);
    });
  });
});
