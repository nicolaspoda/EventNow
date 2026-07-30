import { describe, it, expect, vi, beforeEach } from 'vitest';
import messageService, { MESSAGES_READ_EVENT } from '../services/messageService';
import { api } from '../services/api';
import type { Conversation, Message, CreateConversationDto } from '../services/messageService';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const conversation: Conversation = {
  id: 'c1',
  type: 'DIRECT',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [],
};

const message: Message = {
  id: 'm1',
  conversationId: 'c1',
  senderId: 'u1',
  content: 'hello',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  sender: { id: 'u1', email: 'u1@example.com' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('messageService', () => {
  it('createConversation posts the dto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: conversation });
    const dto: CreateConversationDto = { type: 'DIRECT', memberIds: ['u2'] };

    const result = await messageService.createConversation(dto);

    expect(api.post).toHaveBeenCalledWith('/messages/conversations', dto);
    expect(result).toEqual(conversation);
  });

  it('getUserConversations fetches the conversation list', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [conversation] });

    const result = await messageService.getUserConversations();

    expect(api.get).toHaveBeenCalledWith('/messages/conversations');
    expect(result).toEqual([conversation]);
  });

  it('getConversation fetches a single conversation', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: conversation });

    const result = await messageService.getConversation('c1');

    expect(api.get).toHaveBeenCalledWith('/messages/conversations/c1');
    expect(result).toEqual(conversation);
  });

  it('updateConversation puts the update dto', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: conversation });

    const result = await messageService.updateConversation('c1', { name: 'New name' });

    expect(api.put).toHaveBeenCalledWith('/messages/conversations/c1', { name: 'New name' });
    expect(result).toEqual(conversation);
  });

  it('deleteConversation deletes the conversation by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await messageService.deleteConversation('c1');

    expect(api.delete).toHaveBeenCalledWith('/messages/conversations/c1');
  });

  it('getMessages uses the default limit and omits "before" when not given', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [message] });

    const result = await messageService.getMessages('c1');

    expect(api.get).toHaveBeenCalledWith('/messages/conversations/c1/messages?limit=50');
    expect(result).toEqual([message]);
  });

  it('getMessages includes "before" and a custom limit when given', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await messageService.getMessages('c1', 20, 'm0');

    expect(api.get).toHaveBeenCalledWith('/messages/conversations/c1/messages?limit=20&before=m0');
  });

  it('sendMessage posts the message content', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: message });

    const result = await messageService.sendMessage('c1', { content: 'hello' });

    expect(api.post).toHaveBeenCalledWith('/messages/conversations/c1/messages', { content: 'hello' });
    expect(result).toEqual(message);
  });

  it('addMembers posts the member ids', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: conversation });

    const result = await messageService.addMembers('c1', { memberIds: ['u2', 'u3'] });

    expect(api.post).toHaveBeenCalledWith('/messages/conversations/c1/members', { memberIds: ['u2', 'u3'] });
    expect(result).toEqual(conversation);
  });

  it('removeMember deletes a member from a conversation', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await messageService.removeMember('c1', 'u2');

    expect(api.delete).toHaveBeenCalledWith('/messages/conversations/c1/members/u2');
  });

  it('markAsRead posts to the read endpoint and dispatches a MESSAGES_READ_EVENT', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: undefined });
    const handler = vi.fn();
    window.addEventListener(MESSAGES_READ_EVENT, handler);

    await messageService.markAsRead('c1');

    expect(api.post).toHaveBeenCalledWith('/messages/conversations/c1/read');
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ conversationId: 'c1' });

    window.removeEventListener(MESSAGES_READ_EVENT, handler);
  });

  it('getEventConversation fetches the conversation for an event', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: conversation });

    const result = await messageService.getEventConversation('e1');

    expect(api.get).toHaveBeenCalledWith('/messages/events/e1/conversation');
    expect(result).toEqual(conversation);
  });
});
