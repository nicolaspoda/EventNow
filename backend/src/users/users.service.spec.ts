import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockBannedUser = {
    id: 'user-2',
    username: 'banneduser',
    email: 'banned@test.com',
    bannedAt: new Date(),
  };

  const mockUser = {
    id: 'user-2',
    username: 'user2',
    email: 'user2@test.com',
    role: 'USER',
    isBanned: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('getBannedUsers', () => {
    it('should return banned users with the right filter, select and order', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([mockBannedUser]);
      const result = await service.getBannedUsers();

      expect(result).toEqual([mockBannedUser]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { isBanned: true },
        select: { id: true, username: true, email: true, bannedAt: true },
        orderBy: { bannedAt: 'desc' },
      });
    });
  });

  describe('banUser', () => {
    it('should throw BadRequestException when banning yourself', async () => {
      await expect(service.banUser('user-1', 'user-1')).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.banUser('user-2', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if target user is an admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, role: 'ADMIN' });
      await expect(service.banUser('user-2', 'user-1')).rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should ban a non-banned user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, isBanned: false });
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, isBanned: true });

      const result = await service.banUser('user-2', 'user-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isBanned: true, bannedAt: expect.any(Date) },
        select: { id: true, username: true, email: true, isBanned: true },
      });
      expect(result.isBanned).toBe(true);
    });

    it('should unban an already banned user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, isBanned: true });
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, isBanned: false });

      const result = await service.banUser('user-2', 'user-1');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isBanned: false, bannedAt: null },
        select: { id: true, username: true, email: true, isBanned: true },
      });
      expect(result.isBanned).toBe(false);
    });
  });
});
