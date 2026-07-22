import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { CustomLoggerService } from '../logger/logger.service';

describe('MessagesController', () => {
  let controller: MessagesController;

  const mockMessagesService = {
    createConversation: jest.fn(),
    getUserConversations: jest.fn(),
    getConversation: jest.fn(),
    updateConversation: jest.fn(),
    deleteConversation: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    addMembers: jest.fn(),
    removeMember: jest.fn(),
    markAsRead: jest.fn(),
    getEventConversation: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: CustomLoggerService, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    jest.clearAllMocks();
  });

  it('should create conversation', async () => {
    mockMessagesService.createConversation.mockResolvedValue({ id: 'conv-1' });
    await controller.createConversation('user-1', { type: 'GROUP', name: 'Test' } as any);
    expect(mockMessagesService.createConversation).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('should get user conversations', async () => {
    mockMessagesService.getUserConversations.mockResolvedValue([]);
    const result = await controller.getUserConversations('user-1');
    expect(result).toEqual([]);
  });

  it('should return empty array when P2021 error occurs', async () => {
    mockMessagesService.getUserConversations.mockRejectedValue({ code: 'P2021', message: 'relation does not exist' });
    const result = await controller.getUserConversations('user-1');
    expect(result).toEqual([]);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should return empty array when P2021 error occurs without a message', async () => {
    mockMessagesService.getUserConversations.mockRejectedValue({ code: 'P2021' });
    const result = await controller.getUserConversations('user-1');
    expect(result).toEqual([]);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should return empty array when "does not exist" message', async () => {
    mockMessagesService.getUserConversations.mockRejectedValue({ message: 'relation does not exist' });
    const result = await controller.getUserConversations('user-1');
    expect(result).toEqual([]);
  });

  it('should rethrow unknown errors from getUserConversations', async () => {
    mockMessagesService.getUserConversations.mockRejectedValue(new Error('DB error'));
    await expect(controller.getUserConversations('user-1')).rejects.toThrow('DB error');
  });

  it('should get conversation', async () => {
    mockMessagesService.getConversation.mockResolvedValue({ id: 'conv-1' });
    await controller.getConversation('conv-1', 'user-1');
    expect(mockMessagesService.getConversation).toHaveBeenCalledWith('conv-1', 'user-1');
  });

  it('should update conversation', async () => {
    mockMessagesService.updateConversation.mockResolvedValue({ id: 'conv-1' });
    await controller.updateConversation('conv-1', 'user-1', { name: 'New Name' });
    expect(mockMessagesService.updateConversation).toHaveBeenCalledWith('conv-1', 'user-1', { name: 'New Name' });
  });

  it('should delete conversation', async () => {
    mockMessagesService.deleteConversation.mockResolvedValue({ success: true });
    await controller.deleteConversation('conv-1', 'user-1');
    expect(mockMessagesService.deleteConversation).toHaveBeenCalledWith('conv-1', 'user-1');
  });

  it('should get messages with default limit', async () => {
    mockMessagesService.getMessages.mockResolvedValue({ messages: [] });
    await controller.getMessages('conv-1', 'user-1');
    expect(mockMessagesService.getMessages).toHaveBeenCalledWith('conv-1', 'user-1', 50, undefined);
  });

  it('should get messages with custom limit', async () => {
    mockMessagesService.getMessages.mockResolvedValue({ messages: [] });
    await controller.getMessages('conv-1', 'user-1', '25', 'cursor-123');
    expect(mockMessagesService.getMessages).toHaveBeenCalledWith('conv-1', 'user-1', 25, 'cursor-123');
  });

  it('should send message', async () => {
    mockMessagesService.sendMessage.mockResolvedValue({ id: 'msg-1' });
    await controller.sendMessage('conv-1', 'user-1', { content: 'Hello' } as any);
    expect(mockMessagesService.sendMessage).toHaveBeenCalledWith('conv-1', 'user-1', { content: 'Hello' });
  });

  it('should add members', async () => {
    mockMessagesService.addMembers.mockResolvedValue({ id: 'conv-1' });
    await controller.addMembers('conv-1', 'user-1', { memberIds: ['user-2'] });
    expect(mockMessagesService.addMembers).toHaveBeenCalledWith('conv-1', 'user-1', { memberIds: ['user-2'] });
  });

  it('should remove member', async () => {
    mockMessagesService.removeMember.mockResolvedValue({ id: 'conv-1' });
    await controller.removeMember('conv-1', 'user-2', 'user-1');
    expect(mockMessagesService.removeMember).toHaveBeenCalledWith('conv-1', 'user-1', 'user-2');
  });

  it('should mark as read', async () => {
    mockMessagesService.markAsRead.mockResolvedValue({ success: true });
    await controller.markAsRead('conv-1', 'user-1');
    expect(mockMessagesService.markAsRead).toHaveBeenCalledWith('conv-1', 'user-1');
  });

  it('should get event conversation', async () => {
    mockMessagesService.getEventConversation.mockResolvedValue({ id: 'conv-1' });
    await controller.getEventConversation('event-1', 'user-1');
    expect(mockMessagesService.getEventConversation).toHaveBeenCalledWith('event-1', 'user-1');
  });
});
