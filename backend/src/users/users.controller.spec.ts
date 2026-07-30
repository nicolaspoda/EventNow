import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    getBannedUsers: jest.fn(),
    banUser: jest.fn(),
  };

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should call usersService.getBannedUsers and return its result', async () => {
    const bannedUsers = [{ id: 'user-2', username: 'banned', email: 'banned@test.com', bannedAt: new Date() }];
    mockUsersService.getBannedUsers.mockResolvedValue(bannedUsers);

    const result = await controller.getBannedUsers();

    expect(mockUsersService.getBannedUsers).toHaveBeenCalled();
    expect(result).toEqual(bannedUsers);
  });

  it('should call usersService.banUser with the target id and current user id', async () => {
    mockUsersService.banUser.mockResolvedValue({ id: 'user-2', isBanned: true });

    await controller.banUser('user-2', mockUser);

    expect(mockUsersService.banUser).toHaveBeenCalledWith('user-2', 'user-1');
  });
});
