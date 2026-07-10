import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockMessagesGateway = {
    emitNewNotificationToUser: jest.fn(),
  };

  const mockNotif = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'NEW_EVENT',
    title: 'Test',
    body: 'Body',
    read: false,
    relatedId: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('getForUser', () => {
    it('should return all notifications for user', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([mockNotif]);
      const result = await service.getForUser('user-1');
      expect(result).toHaveLength(1);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
      );
    });

    it('should filter unread notifications when unreadOnly=true', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      await service.getForUser('user-1', true);
      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ read: false }),
        }),
      );
    });

    it('should not filter by read when unreadOnly=false', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      await service.getForUser('user-1', false);
      const callArg = mockPrismaService.notification.findMany.mock.calls[0][0];
      expect(callArg.where.read).toBeUndefined();
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification not found', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);
      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if notification belongs to another user', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({ ...mockNotif, userId: 'user-2' });
      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should mark notification as read', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(mockNotif);
      mockPrismaService.notification.update.mockResolvedValue({ ...mockNotif, read: true });
      await service.markAsRead('notif-1', 'user-1');
      expect(mockPrismaService.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { read: true } }),
      );
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if notification not found', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);
      await expect(service.delete('notif-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if notification belongs to another user', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({ ...mockNotif, userId: 'user-2' });
      await expect(service.delete('notif-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete notification and return success', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(mockNotif);
      mockPrismaService.notification.delete.mockResolvedValue({});
      const result = await service.delete('notif-1', 'user-1');
      expect(result).toEqual({ success: true });
      expect(mockPrismaService.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });
      const result = await service.markAllAsRead('user-1');
      expect(result).toEqual({ success: true });
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' }, data: { read: true } }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count excluding message types', async () => {
      mockPrismaService.notification.count.mockResolvedValue(3);
      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(3);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            read: false,
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should create notification with relatedId', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotif);
      const data = { userId: 'user-1', type: 'NEW_EVENT', title: 'Test', body: 'Body', relatedId: 'event-1' };
      await service.create(data);
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ relatedId: 'event-1' }) }),
      );
      expect(mockMessagesGateway.emitNewNotificationToUser).toHaveBeenCalledWith('user-1');
    });

    it('should create notification with null relatedId when not provided', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotif);
      await service.create({ userId: 'user-1', type: 'TEST', title: 'T', body: 'B' });
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ relatedId: null }) }),
      );
    });
  });

  describe('createNotification', () => {
    it('should delegate to create', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotif);
      await service.createNotification({ userId: 'user-1', type: 'TEST', title: 'T', body: 'B' });
      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });
  });

  describe('createForManyUsers', () => {
    it('should return empty array for empty userIds', async () => {
      const result = await service.createForManyUsers([], { type: 'T', title: 'T', body: 'B' });
      expect(result).toEqual([]);
      expect(mockPrismaService.notification.createMany).not.toHaveBeenCalled();
    });

    it('should create notifications for multiple users', async () => {
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 2 });
      await service.createForManyUsers(['user-1', 'user-2'], { type: 'T', title: 'T', body: 'B' });
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ userId: 'user-1' }),
            expect.objectContaining({ userId: 'user-2' }),
          ]),
        }),
      );
      expect(mockMessagesGateway.emitNewNotificationToUser).toHaveBeenCalledWith('user-1');
      expect(mockMessagesGateway.emitNewNotificationToUser).toHaveBeenCalledWith('user-2');
    });

    it('should pass relatedId when provided', async () => {
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 1 });
      await service.createForManyUsers(['user-1'], { type: 'T', title: 'T', body: 'B', relatedId: 'rel-1' });
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ relatedId: 'rel-1' }),
          ]),
        }),
      );
    });
  });

  describe('deleteByTypeAndRelatedId', () => {
    it('should delete and return count', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 2 });
      const result = await service.deleteByTypeAndRelatedId('user-1', 'STAFF_INVITATION', 'token-1');
      expect(result).toBe(2);
      expect(mockPrismaService.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1', type: 'STAFF_INVITATION', relatedId: 'token-1' } }),
      );
    });
  });

  describe('deleteByTypeAndRelatedIds', () => {
    it('should return 0 for empty relatedIds', async () => {
      const result = await service.deleteByTypeAndRelatedIds('STAFF_INVITATION', []);
      expect(result).toBe(0);
      expect(mockPrismaService.notification.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete by type and multiple relatedIds', async () => {
      mockPrismaService.notification.deleteMany.mockResolvedValue({ count: 3 });
      const result = await service.deleteByTypeAndRelatedIds('STAFF_INVITATION', ['id-1', 'id-2']);
      expect(result).toBe(3);
      expect(mockPrismaService.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'STAFF_INVITATION', relatedId: { in: ['id-1', 'id-2'] } },
        }),
      );
    });
  });
});
