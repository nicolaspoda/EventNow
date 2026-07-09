import { Test, TestingModule } from '@nestjs/testing';
import { FollowsService } from './follows.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

describe('FollowsService', () => {
  let service: FollowsService;

  const mockPrismaService = {
    user: { findUnique: jest.fn() },
    follow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockNotificationsService = {
    create: jest.fn(),
    notifyFollowsChanged: jest.fn(),
  };

  const mockFollow = {
    id: 'follow-1',
    followerId: 'user-1',
    followingId: 'user-2',
    notificationsEnabled: true,
    createdAt: new Date(),
  };

  const mockUser = { id: 'user-2', email: 'user2@test.com', username: 'user2', avatarUrl: null };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<FollowsService>(FollowsService);
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should throw BadRequestException when following yourself', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.follow('user-1', 'user-2')).rejects.toThrow(NotFoundException);
    });

    it('should return existing follow if already following', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.follow.findUnique.mockResolvedValue(mockFollow);
      const result = await service.follow('user-1', 'user-2');
      expect(result).toEqual(mockFollow);
      expect(mockPrismaService.follow.create).not.toHaveBeenCalled();
    });

    it('should create follow and send notification with username', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ username: 'user1', email: 'user1@test.com' });
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.follow.create.mockResolvedValue(mockFollow);
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.follow('user-1', 'user-2');
      expect(result).toEqual(mockFollow);
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-2', type: 'NEW_FOLLOWER' }),
      );
    });

    it('should use email split as follower name when username is null', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ username: null, email: 'user1@test.com' });
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.follow.create.mockResolvedValue(mockFollow);
      mockNotificationsService.create.mockResolvedValue({});

      await service.follow('user-1', 'user-2');
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining('user1') }),
      );
    });

    it('should use fallback name when user has no username or email', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      mockPrismaService.follow.create.mockResolvedValue(mockFollow);
      mockNotificationsService.create.mockResolvedValue({});

      await service.follow('user-1', 'user-2');
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.stringContaining("Quelqu'un") }),
      );
    });
  });

  describe('unfollow', () => {
    it('should return success if not following', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      const result = await service.unfollow('user-1', 'user-2');
      expect(result).toEqual({ success: true });
      expect(mockPrismaService.follow.delete).not.toHaveBeenCalled();
    });

    it('should delete follow and return success', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(mockFollow);
      mockPrismaService.follow.delete.mockResolvedValue({});
      const result = await service.unfollow('user-1', 'user-2');
      expect(result).toEqual({ success: true });
      expect(mockPrismaService.follow.delete).toHaveBeenCalledWith({
        where: { id: 'follow-1' },
      });
    });
  });

  describe('isFollowing', () => {
    it('should return true when following', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(mockFollow);
      expect(await service.isFollowing('user-1', 'user-2')).toBe(true);
    });

    it('should return false when not following', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      expect(await service.isFollowing('user-1', 'user-2')).toBe(false);
    });
  });

  describe('getFollowersCount', () => {
    it('should return count of followers', async () => {
      mockPrismaService.follow.count.mockResolvedValue(5);
      expect(await service.getFollowersCount('user-1')).toBe(5);
    });
  });

  describe('getFollowingCount', () => {
    it('should return count of following', async () => {
      mockPrismaService.follow.count.mockResolvedValue(3);
      expect(await service.getFollowingCount('user-1')).toBe(3);
    });
  });

  describe('getFollowers', () => {
    it('should return followers without follow flags when no currentUserId', async () => {
      mockPrismaService.follow.findMany.mockResolvedValue([
        { follower: mockUser, createdAt: new Date() },
      ]);
      const result = await service.getFollowers('user-2');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('user-2');
    });

    it('should return followers with follow flags when currentUserId provided', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([{ follower: mockUser, createdAt: new Date() }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const result = await service.getFollowers('user-2', 50, 'user-3');
      expect(result[0]).toHaveProperty('isFollowingByCurrentUser');
    });
  });

  describe('getFollowing', () => {
    it('should return following without flags when no currentUserId', async () => {
      mockPrismaService.follow.findMany.mockResolvedValue([
        { following: mockUser, createdAt: new Date() },
      ]);
      const result = await service.getFollowing('user-1');
      expect(result).toHaveLength(1);
    });

    it('should return following with flags when currentUserId provided', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([{ following: mockUser, createdAt: new Date() }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const result = await service.getFollowing('user-1', 50, 'user-3');
      expect(result[0]).toHaveProperty('isFriendWithCurrentUser');
    });
  });

  describe('getFollowingIds', () => {
    it('should return array of following IDs', async () => {
      mockPrismaService.follow.findMany.mockResolvedValue([
        { followingId: 'user-2' },
        { followingId: 'user-3' },
      ]);
      const result = await service.getFollowingIds('user-1');
      expect(result).toEqual(['user-2', 'user-3']);
    });
  });

  describe('getFriendIds', () => {
    it('should return mutual follow IDs', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([{ followingId: 'user-2' }, { followingId: 'user-3' }])
        .mockResolvedValueOnce([{ followerId: 'user-2' }, { followerId: 'user-4' }]);
      const result = await service.getFriendIds('user-1');
      expect(result).toEqual(['user-2']);
    });

    it('should return empty when no mutual follows', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([{ followingId: 'user-2' }])
        .mockResolvedValueOnce([{ followerId: 'user-3' }]);
      const result = await service.getFriendIds('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('getFriendsCount', () => {
    it('should return count of mutual friends', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([{ followingId: 'user-2' }])
        .mockResolvedValueOnce([{ followerId: 'user-2' }]);
      expect(await service.getFriendsCount('user-1')).toBe(1);
    });
  });

  describe('getFriends', () => {
    it('should return empty array when no friends', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const result = await service.getFriends('user-1');
      expect(result).toEqual([]);
    });

    it('should return friend list without flags when no currentUserId', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([{ followingId: 'user-2' }])
        .mockResolvedValueOnce([{ followerId: 'user-2' }])
        .mockResolvedValueOnce([{ following: mockUser, createdAt: new Date() }]);
      const result = await service.getFriends('user-1');
      expect(result).toHaveLength(1);
    });

    it('should return friend list with flags when currentUserId provided', async () => {
      mockPrismaService.follow.findMany
        .mockResolvedValueOnce([{ followingId: 'user-2' }])
        .mockResolvedValueOnce([{ followerId: 'user-2' }])
        .mockResolvedValueOnce([{ following: mockUser, createdAt: new Date() }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      const result = await service.getFriends('user-1', 50, 'user-3');
      expect(result[0]).toHaveProperty('isFollowingByCurrentUser');
    });
  });

  describe('isFriend', () => {
    it('should return false for same user', async () => {
      expect(await service.isFriend('user-1', 'user-1')).toBe(false);
    });

    it('should return true for mutual follows', async () => {
      mockPrismaService.follow.findUnique
        .mockResolvedValueOnce(mockFollow)
        .mockResolvedValueOnce(mockFollow);
      expect(await service.isFriend('user-1', 'user-2')).toBe(true);
    });

    it('should return false for one-way follow', async () => {
      mockPrismaService.follow.findUnique
        .mockResolvedValueOnce(mockFollow)
        .mockResolvedValueOnce(null);
      expect(await service.isFriend('user-1', 'user-2')).toBe(false);
    });
  });

  describe('getFollowerIds', () => {
    it('should return followers with notifications enabled', async () => {
      mockPrismaService.follow.findMany.mockResolvedValue([
        { followerId: 'user-3' },
      ]);
      const result = await service.getFollowerIds('user-2');
      expect(result).toEqual(['user-3']);
    });
  });

  describe('getFollowRecord', () => {
    it('should return the follow record', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(mockFollow);
      const result = await service.getFollowRecord('user-1', 'user-2');
      expect(result).toEqual(mockFollow);
    });

    it('should return null when no follow record', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      const result = await service.getFollowRecord('user-1', 'user-2');
      expect(result).toBeNull();
    });
  });

  describe('setNotificationsEnabled', () => {
    it('should throw NotFoundException if follow not found', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(null);
      await expect(service.setNotificationsEnabled('user-1', 'user-2', true)).rejects.toThrow(NotFoundException);
    });

    it('should update notifications enabled', async () => {
      mockPrismaService.follow.findUnique.mockResolvedValue(mockFollow);
      mockPrismaService.follow.update.mockResolvedValue({ ...mockFollow, notificationsEnabled: false });
      const result = await service.setNotificationsEnabled('user-1', 'user-2', false);
      expect(result.notificationsEnabled).toBe(false);
    });
  });
});
