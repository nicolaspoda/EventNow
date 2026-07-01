import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockNotificationsService = {
    getForUser: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockUser = { id: 'user-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockNotificationsService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  it('should get notifications for user', () => {
    mockNotificationsService.getForUser.mockResolvedValue([]);
    controller.getForUser(mockUser, undefined);
    expect(mockNotificationsService.getForUser).toHaveBeenCalledWith('user-1', false);
  });

  it('should get notifications with unreadOnly=true', () => {
    mockNotificationsService.getForUser.mockResolvedValue([]);
    controller.getForUser(mockUser, 'true');
    expect(mockNotificationsService.getForUser).toHaveBeenCalledWith('user-1', true);
  });

  it('should get unread count', () => {
    mockNotificationsService.getUnreadCount.mockResolvedValue(3);
    controller.getUnreadCount(mockUser);
    expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith('user-1');
  });

  it('should mark notification as read', () => {
    mockNotificationsService.markAsRead.mockResolvedValue({});
    controller.markAsRead('notif-1', mockUser);
    expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  it('should mark all notifications as read', () => {
    mockNotificationsService.markAllAsRead.mockResolvedValue({ success: true });
    controller.markAllAsRead(mockUser);
    expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith('user-1');
  });

  it('should delete notification', () => {
    mockNotificationsService.delete.mockResolvedValue({ success: true });
    controller.delete('notif-1', mockUser);
    expect(mockNotificationsService.delete).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  it('should create test notifications in non-production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    mockNotificationsService.create.mockResolvedValue({});
    const result = await controller.createTestNotifications(mockUser);
    expect(result.count).toBe(4);
    expect(mockNotificationsService.create).toHaveBeenCalledTimes(4);
    process.env.NODE_ENV = originalEnv;
  });

  it('should return error in production for createTestNotifications', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const result = await controller.createTestNotifications(mockUser);
    expect(result).toHaveProperty('error');
    expect(mockNotificationsService.create).not.toHaveBeenCalled();
    process.env.NODE_ENV = originalEnv;
  });
});
