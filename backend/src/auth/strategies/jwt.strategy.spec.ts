import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user if payload valid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@test.com',
        role: 'USER',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const payload = {
        sub: 'user-123',
        email: 'test@test.com',
        role: 'USER',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@test.com',
        role: 'USER',
        username: undefined,
        createdAt: mockUser.createdAt,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@test.com',
        role: 'USER',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if payload is missing sub', async () => {
      await expect(
        strategy.validate({
          sub: '',
          email: 'test@test.com',
          role: 'USER',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if payload is missing email', async () => {
      await expect(
        strategy.validate({
          sub: 'user-123',
          email: '',
          role: 'USER',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is banned', async () => {
      const bannedUser = {
        id: 'user-123',
        email: 'test@test.com',
        role: 'USER',
        isBanned: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(bannedUser);

      await expect(
        strategy.validate({
          sub: 'user-123',
          email: 'test@test.com',
          role: 'USER',
        }),
      ).rejects.toThrow('Votre compte a été suspendu');
    });

    it('should handle different user roles', async () => {
      const mockOrganizer = {
        id: 'organizer-123',
        email: 'organizer@test.com',
        role: 'ORGANIZER',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockOrganizer);

      const result = await strategy.validate({
        sub: 'organizer-123',
        email: 'organizer@test.com',
        role: 'ORGANIZER',
      });

      expect(result.role).toBe('ORGANIZER');
    });
  });
});
