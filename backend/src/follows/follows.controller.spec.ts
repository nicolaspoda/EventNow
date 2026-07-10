import { Test, TestingModule } from '@nestjs/testing';
import { FollowsController } from './follows.controller';
import { FollowsService } from './follows.service';

describe('FollowsController', () => {
  let controller: FollowsController;

  const mockFollowsService = {
    follow: jest.fn(),
    unfollow: jest.fn(),
    setNotificationsEnabled: jest.fn(),
    isFollowing: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    getFriends: jest.fn(),
  };

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FollowsController],
      providers: [{ provide: FollowsService, useValue: mockFollowsService }],
    }).compile();

    controller = module.get<FollowsController>(FollowsController);
    jest.clearAllMocks();
  });

  it('should call followsService.follow', async () => {
    mockFollowsService.follow.mockResolvedValue({ following: true });
    await controller.follow(mockUser, 'user-2');
    expect(mockFollowsService.follow).toHaveBeenCalledWith('user-1', 'user-2');
  });

  it('should call followsService.unfollow', async () => {
    mockFollowsService.unfollow.mockResolvedValue({ following: false });
    await controller.unfollow(mockUser, 'user-2');
    expect(mockFollowsService.unfollow).toHaveBeenCalledWith('user-1', 'user-2');
  });

  it('should call followsService.setNotificationsEnabled', async () => {
    mockFollowsService.setNotificationsEnabled.mockResolvedValue({});
    await controller.setNotifications(mockUser, 'user-2', { enabled: true });
    expect(mockFollowsService.setNotificationsEnabled).toHaveBeenCalledWith('user-1', 'user-2', true);
  });

  it('should return isFollowing result wrapped in { following }', async () => {
    mockFollowsService.isFollowing.mockResolvedValue(true);
    const result = await controller.isFollowing(mockUser, 'user-2');
    expect(result).toEqual({ following: true });
  });

  it('should call followsService.getFollowers', async () => {
    mockFollowsService.getFollowers.mockResolvedValue([]);
    await controller.getFollowers('user-2', mockUser);
    expect(mockFollowsService.getFollowers).toHaveBeenCalledWith('user-2', 50, 'user-1');
  });

  it('should call followsService.getFollowing', async () => {
    mockFollowsService.getFollowing.mockResolvedValue([]);
    await controller.getFollowing('user-2', mockUser);
    expect(mockFollowsService.getFollowing).toHaveBeenCalledWith('user-2', 50, 'user-1');
  });

  it('should call followsService.getFriends', async () => {
    mockFollowsService.getFriends.mockResolvedValue([]);
    await controller.getFriends('user-2', mockUser);
    expect(mockFollowsService.getFriends).toHaveBeenCalledWith('user-2', 50, 'user-1');
  });
});
