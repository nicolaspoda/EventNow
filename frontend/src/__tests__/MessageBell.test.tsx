import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageBell } from '../components/MessageBell';
import messageService, { ConversationType } from '../services/messageService';
import { socketService } from '../services/socketService';
import { useAuth } from '../utils/useAuth';
import type { Conversation } from '../services/messageService';

vi.mock('../services/messageService', async () => {
  const actual = await vi.importActual<typeof import('../services/messageService')>(
    '../services/messageService',
  );
  return {
    ...actual,
    default: {
      getUserConversations: vi.fn(),
    },
  };
});

vi.mock('../services/socketService', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

const unreadConversation: Conversation = {
  id: 'c1',
  type: ConversationType.DIRECT,
  members: [
    {
      id: 'm1',
      conversationId: 'c1',
      userId: 'bob-id',
      joinedAt: new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      user: { id: 'bob-id', username: 'bob', email: 'bob@example.com' },
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  unreadCount: 2,
  messages: [
    {
      id: 'msg1',
      conversationId: 'c1',
      senderId: 'bob-id',
      content: 'Salut, ça va ?',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: { id: 'bob-id', username: 'bob', email: 'bob@example.com' },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'u1', username: 'alice', email: 'a@a.com', role: 'USER' },
    isAuthenticated: true,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
  vi.mocked(messageService.getUserConversations).mockResolvedValue([]);
});

function renderBell() {
  return render(
    <MemoryRouter>
      <MessageBell />
    </MemoryRouter>,
  );
}

describe('MessageBell - unread count', () => {
  it('shows no badge when there are no unread messages', async () => {
    renderBell();
    await waitFor(() => expect(messageService.getUserConversations).toHaveBeenCalled());
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it('sums unread counts across conversations into the badge', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([unreadConversation]);
    renderBell();
    expect(await screen.findByText('2')).toBeInTheDocument();
  });
});

describe('MessageBell - dropdown menu', () => {
  it('is closed by default and opens on click, listing unread conversations', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([unreadConversation]);
    renderBell();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(await screen.findByText('bob')).toBeInTheDocument();
    expect(screen.getByText('Salut, ça va ?')).toBeInTheDocument();
  });

  it('shows an empty state when there is no unread conversation', async () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));

    expect(await screen.findByText('Aucun message non lu')).toBeInTheDocument();
  });

  it('shows an error message when fetching conversations fails', async () => {
    vi.mocked(messageService.getUserConversations).mockRejectedValue(new Error('network error'));
    renderBell();

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));

    expect(
      await screen.findByText('Impossible de charger les messages. Réessayez plus tard.'),
    ).toBeInTheDocument();
  });

  it('navigates to the conversation and closes the menu when a conversation is clicked', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([unreadConversation]);
    renderBell();

    fireEvent.click(screen.getByRole('button', { name: 'Messages' }));
    const conversationButton = await screen.findByText('bob');

    await act(async () => {
      fireEvent.click(conversationButton);
    });

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});

describe('MessageBell - socket subscription', () => {
  it('subscribes to message-related socket events on mount', () => {
    renderBell();

    expect(socketService.on).toHaveBeenCalledWith('newMessage', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('memberAdded', expect.any(Function));
  });

  it('unsubscribes from socket events on unmount', () => {
    const { unmount } = renderBell();
    unmount();

    expect(socketService.off).toHaveBeenCalledWith('newMessage', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('memberAdded', expect.any(Function));
  });
});
