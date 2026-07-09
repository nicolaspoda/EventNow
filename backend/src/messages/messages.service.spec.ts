import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesGateway } from './messages.gateway';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConversationType as PrismaConversationType } from '@prisma/client';
import { ConversationType } from './dto';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockPrismaService = {
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    conversationMember: {
      createMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    participationRequest: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  const mockMessagesGateway = {
    notifyMemberAdded: jest.fn(),
    notifyNewMessage: jest.fn(),
  };

  const mockUser = { id: 'user-1', username: 'alice', email: 'alice@test.com', avatarUrl: null };
  const mockMember = { userId: 'user-1', lastReadAt: new Date(0), user: mockUser };
  const mockMember2 = { userId: 'user-2', lastReadAt: new Date(0), user: { id: 'user-2', username: 'bob', email: 'bob@test.com', avatarUrl: null } };

  const mockDirectConversation = {
    id: 'conv-1',
    type: PrismaConversationType.DIRECT,
    name: null,
    imageUrl: null,
    eventId: null,
    createdBy: 'user-1',
    members: [mockMember, mockMember2],
    messages: [],
    updatedAt: new Date(),
  };

  const mockGroupConversation = {
    id: 'conv-2',
    type: PrismaConversationType.GROUP,
    name: 'My Group',
    imageUrl: null,
    eventId: null,
    createdBy: 'user-1',
    members: [mockMember, mockMember2],
    messages: [],
    updatedAt: new Date(),
  };

  const mockEventConversation = {
    id: 'conv-3',
    type: PrismaConversationType.EVENT,
    name: 'Event Group',
    imageUrl: null,
    eventId: 'event-1',
    createdBy: 'organizer-1',
    members: [mockMember],
    messages: [],
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should throw if DIRECT type has wrong member count', async () => {
      await expect(
        service.createConversation('user-1', {
          type: ConversationType.DIRECT,
          memberIds: ['user-2', 'user-3'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if GROUP type has no name', async () => {
      await expect(
        service.createConversation('user-1', {
          type: ConversationType.GROUP,
          memberIds: ['user-2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if EVENT type has no eventId', async () => {
      await expect(
        service.createConversation('user-1', {
          type: ConversationType.EVENT,
          memberIds: ['user-2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if EVENT eventId not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(
        service.createConversation('user-1', {
          type: ConversationType.EVENT,
          memberIds: ['user-2'],
          eventId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return existing direct conversation if one exists', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([mockDirectConversation]);
      const result = await service.createConversation('user-1', {
        type: ConversationType.DIRECT,
        memberIds: ['user-2'],
      });
      expect(result).toEqual(mockDirectConversation);
    });

    it('should create a new direct conversation if none exists', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([]);
      mockPrismaService.conversation.create.mockResolvedValue(mockDirectConversation);
      const result = await service.createConversation('user-1', {
        type: ConversationType.DIRECT,
        memberIds: ['user-2'],
      });
      expect(result).toEqual(mockDirectConversation);
      expect(mockPrismaService.conversation.create).toHaveBeenCalled();
    });

    it('should create a GROUP conversation', async () => {
      mockPrismaService.conversation.create.mockResolvedValue(mockGroupConversation);
      const result = await service.createConversation('user-1', {
        type: ConversationType.GROUP,
        memberIds: ['user-2'],
        name: 'My Group',
      });
      expect(result).toEqual(mockGroupConversation);
    });

    it('should create an EVENT conversation after validating the event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({ id: 'event-1' });
      mockPrismaService.conversation.create.mockResolvedValue(mockEventConversation);
      const result = await service.createConversation('user-1', {
        type: ConversationType.EVENT,
        memberIds: ['user-2'],
        eventId: 'event-1',
      });
      expect(result).toEqual(mockEventConversation);
    });
  });

  describe('findDirectConversation', () => {
    it('should return matching direct conversation', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([mockDirectConversation]);
      const result = await service.findDirectConversation('user-1', 'user-2');
      expect(result).toEqual(mockDirectConversation);
    });

    it('should return undefined if no matching conversation', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([]);
      const result = await service.findDirectConversation('user-1', 'user-2');
      expect(result).toBeUndefined();
    });

    it('should return undefined if conversation has wrong member count', async () => {
      const threeMembers = {
        ...mockDirectConversation,
        members: [mockMember, mockMember2, { userId: 'user-3', lastReadAt: new Date(0), user: {} }],
      };
      mockPrismaService.conversation.findMany.mockResolvedValue([threeMembers]);
      const result = await service.findDirectConversation('user-1', 'user-2');
      expect(result).toBeUndefined();
    });
  });

  describe('getUserConversations', () => {
    it('should return conversations with unread counts', async () => {
      const now = new Date();
      const msgDate = new Date(now.getTime() + 1000);
      const conv = {
        ...mockDirectConversation,
        members: [{ ...mockMember, lastReadAt: new Date(0) }],
        messages: [{ createdAt: msgDate, senderId: 'user-2' }],
      };
      mockPrismaService.conversation.findMany.mockResolvedValue([conv]);
      const result = await service.getUserConversations('user-1');
      expect(result[0].unreadCount).toBe(1);
    });

    it('should return zero unread when no messages', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([mockDirectConversation]);
      const result = await service.getUserConversations('user-1');
      expect(result[0].unreadCount).toBe(0);
    });

    it('should return zero unread for own messages', async () => {
      const now = new Date();
      const msgDate = new Date(now.getTime() + 1000);
      const conv = {
        ...mockDirectConversation,
        members: [{ ...mockMember, lastReadAt: new Date(0) }],
        messages: [{ createdAt: msgDate, senderId: 'user-1' }],
      };
      mockPrismaService.conversation.findMany.mockResolvedValue([conv]);
      const result = await service.getUserConversations('user-1');
      expect(result[0].unreadCount).toBe(0);
    });
  });

  describe('getConversation', () => {
    it('should return conversation if member', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      const result = await service.getConversation('conv-1', 'user-1');
      expect(result).toEqual(mockDirectConversation);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);
      await expect(service.getConversation('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not a member', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        ...mockDirectConversation,
        members: [{ userId: 'user-3' }],
      });
      await expect(service.getConversation('conv-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMessages', () => {
    it('should return messages for a conversation member', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      const msg = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-2',
        content: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: mockUser,
      };
      mockPrismaService.message.findMany.mockResolvedValue([msg]);
      const result = await service.getMessages('conv-1', 'user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('msg-1');
    });

    it('should filter messages by before cursor', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      mockPrismaService.message.findMany.mockResolvedValue([]);
      await service.getMessages('conv-1', 'user-1', 20, new Date().toISOString());
      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        }),
      );
    });

    it('should serialize messages with ISO string dates', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      const msg = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-2',
        content: 'Hello',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        sender: mockUser,
      };
      mockPrismaService.message.findMany.mockResolvedValue([msg]);
      const result = await service.getMessages('conv-1', 'user-1');
      expect(typeof result[0].createdAt).toBe('string');
    });
  });

  describe('sendMessage', () => {
    it('should send a message and notify other members', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      const msg = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: { ...mockUser, username: 'alice' },
      };
      mockPrismaService.message.create.mockResolvedValue(msg);
      mockPrismaService.conversation.update.mockResolvedValue({});
      mockNotificationsService.createNotification.mockResolvedValue({});

      const result = await service.sendMessage('conv-1', 'user-1', { content: 'Hello' });
      expect(result.id).toBe('msg-1');
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    });

    it('should use Conversation name for GROUP type notification', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockGroupConversation);
      const msg = {
        id: 'msg-1',
        conversationId: 'conv-2',
        senderId: 'user-1',
        content: 'Hello',
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: { ...mockUser, username: 'alice' },
      };
      mockPrismaService.message.create.mockResolvedValue(msg);
      mockPrismaService.conversation.update.mockResolvedValue({});
      mockNotificationsService.createNotification.mockResolvedValue({});

      await service.sendMessage('conv-2', 'user-1', { content: 'Hello' });
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('My Group') }),
      );
    });

    it('should fallback to Quelqu\'un when sender username is null', async () => {
      const conv = {
        ...mockDirectConversation,
        type: PrismaConversationType.DIRECT,
      };
      mockPrismaService.conversation.findUnique.mockResolvedValue(conv);
      const msg = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hi',
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: { ...mockUser, username: null },
      };
      mockPrismaService.message.create.mockResolvedValue(msg);
      mockPrismaService.conversation.update.mockResolvedValue({});
      mockNotificationsService.createNotification.mockResolvedValue({});

      await service.sendMessage('conv-1', 'user-1', { content: 'Hi' });
      expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining("Quelqu'un") }),
      );
    });
  });

  describe('addMembers', () => {
    it('should throw BadRequestException for DIRECT conversation', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      await expect(
        service.addMembers('conv-1', 'user-1', { memberIds: ['user-3'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if all members already in conversation', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockGroupConversation);
      await expect(
        service.addMembers('conv-2', 'user-1', { memberIds: ['user-2'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should add new members and send notifications', async () => {
      mockPrismaService.conversation.findUnique
        .mockResolvedValueOnce(mockGroupConversation)
        .mockResolvedValueOnce(mockGroupConversation);
      mockPrismaService.conversationMember.createMany.mockResolvedValue({});
      mockNotificationsService.createNotification.mockResolvedValue({});

      await service.addMembers('conv-2', 'user-1', { memberIds: ['user-3'] });
      expect(mockPrismaService.conversationMember.createMany).toHaveBeenCalled();
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('should throw BadRequestException for DIRECT conversation', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      await expect(
        service.removeMember('conv-1', 'user-1', 'user-2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not creator removing others', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        ...mockGroupConversation,
        createdBy: 'other-user',
      });
      await expect(
        service.removeMember('conv-2', 'user-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow self-removal', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        ...mockGroupConversation,
        createdBy: 'other-user',
      });
      mockPrismaService.conversationMember.deleteMany.mockResolvedValue({});
      mockPrismaService.conversationMember.count.mockResolvedValue(1);

      const result = await service.removeMember('conv-2', 'user-1', 'user-1');
      expect(result).toEqual({ success: true });
    });

    it('should delete conversation if no members remain', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockGroupConversation);
      mockPrismaService.conversationMember.deleteMany.mockResolvedValue({});
      mockPrismaService.conversationMember.count.mockResolvedValue(0);
      mockPrismaService.conversation.delete.mockResolvedValue({});

      await service.removeMember('conv-2', 'user-1', 'user-2');
      expect(mockPrismaService.conversation.delete).toHaveBeenCalled();
    });
  });

  describe('updateConversation', () => {
    it('should throw BadRequestException for DIRECT conversation', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      await expect(
        service.updateConversation('conv-1', 'user-1', { name: 'New Name' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not creator', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        ...mockGroupConversation,
        createdBy: 'other-user',
      });
      await expect(
        service.updateConversation('conv-2', 'user-1', { name: 'New Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update conversation successfully', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockGroupConversation);
      mockPrismaService.conversation.update.mockResolvedValue({
        ...mockGroupConversation,
        name: 'Updated Name',
      });
      const result = await service.updateConversation('conv-2', 'user-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('markAsRead', () => {
    it('should mark conversation as read', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      mockPrismaService.conversationMember.updateMany.mockResolvedValue({});
      const result = await service.markAsRead('conv-1', 'user-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteConversation', () => {
    it('should throw BadRequestException for non-GROUP type', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockDirectConversation);
      await expect(
        service.deleteConversation('conv-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not creator', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        ...mockGroupConversation,
        createdBy: 'other-user',
      });
      await expect(
        service.deleteConversation('conv-2', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete group conversation', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(mockGroupConversation);
      mockPrismaService.conversation.delete.mockResolvedValue({});
      const result = await service.deleteConversation('conv-2', 'user-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getEventConversation', () => {
    const mockEvent = {
      id: 'event-1',
      title: 'Test Event',
      organizerId: 'user-1',
      participationRequests: [],
    };

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);
      await expect(service.getEventConversation('event-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not organizer or accepted participant', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
        participationRequests: [],
      });
      await expect(service.getEventConversation('event-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should return existing conversation for accepted participant', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
        participationRequests: [{ userId: 'user-1', status: 'ACCEPTED' }],
      });
      mockPrismaService.conversation.findFirst.mockResolvedValue({
        ...mockEventConversation,
        members: [{ userId: 'user-1' }],
      });
      const result = await service.getEventConversation('event-1', 'user-1');
      expect(result.id).toBe('conv-3');
    });

    it('should create conversation for organizer when none exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([
        { userId: 'user-2' },
      ]);
      const createdConv = {
        ...mockEventConversation,
        members: [{ userId: 'user-1' }],
      };
      mockPrismaService.conversation.create.mockResolvedValue(createdConv);
      const result = await service.getEventConversation('event-1', 'user-1');
      expect(result.id).toBe('conv-3');
    });

    it('should create conversation for accepted participant when none exists', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
        participationRequests: [{ userId: 'user-1', status: 'ACCEPTED' }],
      });
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);
      mockPrismaService.participationRequest.findMany.mockResolvedValue([
        { userId: 'user-1' },
      ]);
      const createdConv = {
        ...mockEventConversation,
        members: [{ userId: 'user-1' }],
      };
      mockPrismaService.conversation.create.mockResolvedValue(createdConv);
      const result = await service.getEventConversation('event-1', 'user-1');
      expect(result.id).toBe('conv-3');
    });

    it('should add user as member if they are not yet in the conversation', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        organizerId: 'other-user',
        participationRequests: [{ userId: 'user-1', status: 'ACCEPTED' }],
      });
      const convWithoutUser = {
        ...mockEventConversation,
        members: [{ userId: 'other-user' }],
      };
      const convWithUser = {
        ...mockEventConversation,
        members: [{ userId: 'other-user' }, { userId: 'user-1' }],
      };
      mockPrismaService.conversation.findFirst.mockResolvedValue(convWithoutUser);
      mockPrismaService.conversationMember.create.mockResolvedValue({});
      mockPrismaService.conversation.findUnique.mockResolvedValue(convWithUser);

      const result = await service.getEventConversation('event-1', 'user-1');
      expect(mockPrismaService.conversationMember.create).toHaveBeenCalled();
      expect(result).toEqual(convWithUser);
    });
  });
});
