import { Test, TestingModule } from '@nestjs/testing';
import { MessagesGateway } from './messages.gateway';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockPrismaService = {
    conversation: {
      findMany: jest.fn(),
    },
  };

  const mockMessagesService = {
    sendMessage: jest.fn(),
    getConversation: jest.fn(),
  };

  const mockServerSocket = {
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      sockets: new Map(),
    },
  };

  const makeClient = (overrides: Record<string, unknown> = {}) => ({
    id: 'socket-1',
    userId: undefined as string | undefined,
    handshake: {
      auth: { token: 'valid-token' },
      headers: {},
    },
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MessagesService, useValue: mockMessagesService },
      ],
    }).compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    (gateway as any).server = mockServerSocket;
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate and join rooms on valid token', async () => {
      const client = makeClient() as any;
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.conversation.findMany.mockResolvedValue([
        { id: 'conv-1' },
      ]);

      await gateway.handleConnection(client);

      expect(client.userId).toBe('user-1');
      expect(client.join).toHaveBeenCalledWith('user:user-1');
      expect(client.join).toHaveBeenCalledWith('conversation:conv-1');
    });

    it('should disconnect if no token provided', async () => {
      const client = makeClient({
        handshake: { auth: {}, headers: {} },
      }) as any;

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should use authorization header as fallback', async () => {
      const client = makeClient({
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer header-token' },
        },
      }) as any;
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.conversation.findMany.mockResolvedValue([]);

      await gateway.handleConnection(client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('header-token');
      expect(client.userId).toBe('user-1');
    });

    it('should disconnect if jwt verify throws', async () => {
      const client = makeClient() as any;
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if payload has no userId', async () => {
      const client = makeClient() as any;
      mockJwtService.verify.mockReturnValue({ sub: undefined });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should track multiple sockets for same user', async () => {
      const client1 = makeClient({ id: 'socket-1' }) as any;
      const client2 = makeClient({ id: 'socket-2' }) as any;
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.conversation.findMany.mockResolvedValue([]);

      await gateway.handleConnection(client1);
      await gateway.handleConnection(client2);

      const sockets = (gateway as any).userSockets.get('user-1');
      expect(sockets.size).toBe(2);
    });
  });

  describe('handleDisconnect', () => {
    it('should remove socket from tracking when user disconnects', async () => {
      const client = makeClient() as any;
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.conversation.findMany.mockResolvedValue([]);

      await gateway.handleConnection(client);
      gateway.handleDisconnect(client);

      expect((gateway as any).userSockets.has('user-1')).toBe(false);
    });

    it('should keep user in map if they have other sockets', async () => {
      const client1 = makeClient({ id: 'socket-1' }) as any;
      const client2 = makeClient({ id: 'socket-2' }) as any;
      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrismaService.conversation.findMany.mockResolvedValue([]);

      await gateway.handleConnection(client1);
      await gateway.handleConnection(client2);
      gateway.handleDisconnect(client1);

      expect((gateway as any).userSockets.get('user-1').size).toBe(1);
    });

    it('should handle disconnect for unauthenticated client', () => {
      const client = makeClient({ userId: undefined }) as any;
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  describe('handleJoinEventRoom', () => {
    it('should return error if client not authenticated', async () => {
      const client = makeClient({ userId: undefined }) as any;
      const result = await gateway.handleJoinEventRoom(client, { eventId: 'event-1' });
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should join event room', async () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      const result = await gateway.handleJoinEventRoom(client, { eventId: 'event-1' });
      expect(client.join).toHaveBeenCalledWith('event-event-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleLeaveEventRoom', () => {
    it('should leave event room', () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      const result = gateway.handleLeaveEventRoom(client, { eventId: 'event-1' });
      expect(client.leave).toHaveBeenCalledWith('event-event-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleJoinConversation', () => {
    it('should return error if client not authenticated', async () => {
      const client = makeClient({ userId: undefined }) as any;
      const result = await gateway.handleJoinConversation(client, { conversationId: 'conv-1' });
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should join conversation room on success', async () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      mockMessagesService.getConversation.mockResolvedValue({ id: 'conv-1', members: [] });
      const result = await gateway.handleJoinConversation(client, { conversationId: 'conv-1' });
      expect(client.join).toHaveBeenCalledWith('conversation:conv-1');
      expect(result).toEqual({ success: true });
    });

    it('should return error if getConversation returns null', async () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      mockMessagesService.getConversation.mockResolvedValue(null);
      const result = await gateway.handleJoinConversation(client, { conversationId: 'conv-1' });
      expect(result).toEqual({ error: 'Conversation not found or access denied' });
    });

    it('should return error on exception', async () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      mockMessagesService.getConversation.mockRejectedValue(new Error('forbidden'));
      const result = await gateway.handleJoinConversation(client, { conversationId: 'conv-1' });
      expect(result).toEqual({ error: 'forbidden' });
    });
  });

  describe('handleLeaveConversation', () => {
    it('should leave conversation room', () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      const result = gateway.handleLeaveConversation(client, { conversationId: 'conv-1' });
      expect(client.leave).toHaveBeenCalledWith('conversation:conv-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('handleSendMessage', () => {
    it('should return error if not authenticated', async () => {
      const client = makeClient({ userId: undefined }) as any;
      const result = await gateway.handleSendMessage(client, { conversationId: 'conv-1', content: 'hi' });
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should send message and emit to conversation', async () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      const mockMsg = { id: 'msg-1', content: 'hi' };
      mockMessagesService.sendMessage.mockResolvedValue(mockMsg);

      const result = await gateway.handleSendMessage(client, { conversationId: 'conv-1', content: 'hi' });
      expect(mockServerSocket.to).toHaveBeenCalledWith('conversation:conv-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('newMessage', expect.any(Object));
      expect(result).toEqual({ success: true, message: mockMsg });
    });

    it('should return error on exception', async () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      mockMessagesService.sendMessage.mockRejectedValue(new Error('not allowed'));
      const result = await gateway.handleSendMessage(client, { conversationId: 'conv-1', content: 'hi' });
      expect(result).toEqual({ error: 'not allowed' });
    });
  });

  describe('handleTyping', () => {
    it('should return error if not authenticated', () => {
      const client = makeClient({ userId: undefined }) as any;
      const result = gateway.handleTyping(client, { conversationId: 'conv-1', isTyping: true });
      expect(result).toEqual({ error: 'Unauthorized' });
    });

    it('should emit typing event to conversation', () => {
      const client = makeClient({ userId: 'user-1' }) as any;
      const result = gateway.handleTyping(client, { conversationId: 'conv-1', isTyping: true });
      expect(client.to).toHaveBeenCalledWith('conversation:conv-1');
      expect(client.emit).toHaveBeenCalledWith('userTyping', expect.any(Object));
      expect(result).toEqual({ success: true });
    });
  });

  describe('notify methods', () => {
    it('notifyNewMessage should emit to conversation', async () => {
      await gateway.notifyNewMessage('conv-1', { id: 'msg-1' });
      expect(mockServerSocket.to).toHaveBeenCalledWith('conversation:conv-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('newMessage', expect.any(Object));
    });

    it('notifyConversationUpdate should emit to conversation', async () => {
      await gateway.notifyConversationUpdate('conv-1', { id: 'conv-1' });
      expect(mockServerSocket.emit).toHaveBeenCalledWith('conversationUpdated', expect.any(Object));
    });

    it('notifyMemberAdded should emit memberAdded', async () => {
      await gateway.notifyMemberAdded('conv-1', 'user-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('memberAdded', expect.any(Object));
    });

    it('notifyMemberAdded should join socket to conversation if socket found', async () => {
      const mockSocket = { join: jest.fn() };
      mockServerSocket.sockets.sockets.set('socket-1', mockSocket);
      (gateway as any).userSockets.set('user-1', new Set(['socket-1']));

      await gateway.notifyMemberAdded('conv-1', 'user-1');
      expect(mockSocket.join).toHaveBeenCalledWith('conversation:conv-1');
      mockServerSocket.sockets.sockets.delete('socket-1');
    });

    it('notifyMemberRemoved should emit memberRemoved', async () => {
      await gateway.notifyMemberRemoved('conv-1', 'user-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('memberRemoved', expect.any(Object));
    });

    it('notifyMemberRemoved should leave socket from conversation if socket found', async () => {
      const mockSocket = { leave: jest.fn() };
      mockServerSocket.sockets.sockets.set('socket-2', mockSocket);
      (gateway as any).userSockets.set('user-2', new Set(['socket-2']));

      await gateway.notifyMemberRemoved('conv-1', 'user-2');
      expect(mockSocket.leave).toHaveBeenCalledWith('conversation:conv-1');
      mockServerSocket.sockets.sockets.delete('socket-2');
    });

    it('emitNewNotificationToUser should emit to user room', () => {
      gateway.emitNewNotificationToUser('user-1');
      expect(mockServerSocket.to).toHaveBeenCalledWith('user:user-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('newNotification', {});
    });

    it('notifyPollCreated should emit to event room', () => {
      gateway.notifyPollCreated('event-1', { id: 'poll-1' });
      expect(mockServerSocket.to).toHaveBeenCalledWith('event-event-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('pollCreated', expect.any(Object));
    });

    it('notifyPollUpdated should emit to event room', () => {
      gateway.notifyPollUpdated('event-1', { id: 'poll-1' });
      expect(mockServerSocket.to).toHaveBeenCalledWith('event-event-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('pollUpdated', expect.any(Object));
    });

    it('notifyPollDeleted should emit to event room', () => {
      gateway.notifyPollDeleted('event-1', 'poll-1');
      expect(mockServerSocket.to).toHaveBeenCalledWith('event-event-1');
      expect(mockServerSocket.emit).toHaveBeenCalledWith('pollDeleted', { pollId: 'poll-1' });
    });
  });
});
