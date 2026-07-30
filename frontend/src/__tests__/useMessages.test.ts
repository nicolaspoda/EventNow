import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMessages } from '../hooks/useMessages';
import messageService from '../services/messageService';
import type { Conversation, Message } from '../services/messageService';

vi.mock('../services/messageService', () => ({
  default: {
    getUserConversations: vi.fn(),
    getConversation: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
  },
}));

const conversation: Conversation = {
  id: 'c1',
  type: 'DIRECT',
  members: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as Conversation;

const message: Message = {
  id: 'm1',
  conversationId: 'c1',
  content: 'hello',
  createdAt: '2026-01-01T00:00:00.000Z',
} as unknown as Message;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useMessages', () => {
  it('loads the conversation list when no conversationId is provided', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([conversation]);

    const { result } = renderHook(() => useMessages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.conversations).toEqual([conversation]);
    expect(messageService.getConversation).not.toHaveBeenCalled();
  });

  it('loads the conversation and its messages when a conversationId is provided', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(conversation);
    vi.mocked(messageService.getMessages).mockResolvedValue([message]);

    const { result } = renderHook(() => useMessages('c1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentConversation).toEqual(conversation);
    expect(result.current.messages).toEqual([message]);
    expect(messageService.getMessages).toHaveBeenCalledWith('c1', 50, undefined);
  });

  it('prepends older messages when loadMessages is called with a before cursor', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(conversation);
    vi.mocked(messageService.getMessages).mockResolvedValue([message]);

    const { result } = renderHook(() => useMessages('c1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const olderMessage: Message = { ...message, id: 'm0' };
    vi.mocked(messageService.getMessages).mockResolvedValue([olderMessage]);

    await act(async () => {
      await result.current.loadMessages('c1', 'm1');
    });

    expect(result.current.messages).toEqual([olderMessage, message]);
  });

  it('sets an error message when loading conversations fails', async () => {
    vi.mocked(messageService.getUserConversations).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useMessages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Erreur lors du chargement');
    expect(result.current.conversations).toEqual([]);
  });

  it('sendMessage appends the new message and returns it', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([]);
    vi.mocked(messageService.sendMessage).mockResolvedValue(message);

    const { result } = renderHook(() => useMessages());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let sent: Message | undefined;
    await act(async () => {
      sent = await result.current.sendMessage('c1', 'hello');
    });

    expect(sent).toEqual(message);
    expect(messageService.sendMessage).toHaveBeenCalledWith('c1', { content: 'hello' });
    expect(result.current.messages).toEqual([message]);
  });

  it('markAsRead delegates to messageService', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([]);
    vi.mocked(messageService.markAsRead).mockResolvedValue(undefined);

    const { result } = renderHook(() => useMessages());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAsRead('c1');
    });

    expect(messageService.markAsRead).toHaveBeenCalledWith('c1');
  });
});
