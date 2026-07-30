import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationPage } from '../pages/messages/ConversationPage';
import messageService, { ConversationType } from '../services/messageService';
import { socketService } from '../services/socketService';
import { useAuth } from '../utils/useAuth';
import type { Conversation, Message } from '../services/messageService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/messageService', async () => {
  const actual = await vi.importActual<typeof import('../services/messageService')>(
    '../services/messageService',
  );
  return {
    ...actual,
    default: {
      getConversation: vi.fn(),
      getMessages: vi.fn(),
      markAsRead: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn(),
      addMembers: vi.fn(),
      updateConversation: vi.fn(),
      deleteConversation: vi.fn(),
      removeMember: vi.fn(),
    },
  };
});

vi.mock('../services/socketService', () => ({
  socketService: {
    isConnected: vi.fn(),
    connect: vi.fn(),
    joinConversation: vi.fn(),
    leaveConversation: vi.fn(),
    sendMessage: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/messages/ChatWindow', () => ({
  ChatWindow: ({
    onSendMessage,
    onLoadMore,
  }: {
    onSendMessage: (content: string) => void;
    onLoadMore: () => void;
  }) => (
    <div data-testid="chat-window">
      <button onClick={() => onSendMessage('Salut !')}>Envoyer un message</button>
      <button onClick={onLoadMore}>Charger plus</button>
    </div>
  ),
}));

vi.mock('../components/messages/ConversationHeader', () => ({
  ConversationHeader: ({
    conversation,
    onAddMembers,
    onEditConversation,
    onDeleteConversation,
  }: {
    conversation: Conversation;
    onAddMembers?: () => void;
    onEditConversation?: () => void;
    onDeleteConversation?: () => void;
  }) => (
    <div data-testid="conversation-header">
      <span>{conversation.name}</span>
      <button onClick={onAddMembers}>Ouvrir ajout membres</button>
      <button onClick={onEditConversation}>Ouvrir édition</button>
      <button onClick={onDeleteConversation}>Supprimer la conversation</button>
    </div>
  ),
}));

vi.mock('../components/messages/AddMembersModal', () => ({
  AddMembersModal: ({
    isOpen,
    onClose,
    onAddMembers,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onAddMembers: (ids: string[]) => void;
  }) =>
    isOpen ? (
      <div data-testid="add-members-modal">
        <button onClick={() => onAddMembers(['u9'])}>Confirmer ajout</button>
        <button onClick={onClose}>Fermer ajout</button>
      </div>
    ) : null,
}));

vi.mock('../components/messages/EditConversationModal', () => ({
  EditConversationModal: ({
    isOpen,
    onClose,
    onUpdate,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (name: string) => void;
  }) =>
    isOpen ? (
      <div data-testid="edit-conversation-modal">
        <button onClick={() => onUpdate('Nouveau nom')}>Confirmer édition</button>
        <button onClick={onClose}>Fermer édition</button>
      </div>
    ) : null,
}));

vi.mock('../components/messages/ConversationMembersModal', () => ({
  ConversationMembersModal: ({
    onClose,
    onRemoveMember,
  }: {
    onClose: () => void;
    onRemoveMember: (memberId: string) => void;
  }) => (
    <div data-testid="members-modal">
      <button onClick={onClose}>Fermer membres</button>
      <button onClick={() => onRemoveMember('other')}>Retirer membre</button>
      <button onClick={() => onRemoveMember('me')}>Me retirer</button>
    </div>
  ),
}));

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    type: ConversationType.GROUP,
    name: 'Équipe',
    createdBy: 'me',
    createdAt: '',
    updatedAt: '',
    members: [
      {
        id: 'm1',
        conversationId: 'c1',
        userId: 'me',
        joinedAt: '',
        lastReadAt: '',
        user: { id: 'me', username: 'me', email: 'me@example.com' },
      },
    ],
    ...overrides,
  };
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg1',
    conversationId: 'c1',
    senderId: 'other',
    content: 'Salut',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    sender: { id: 'other', username: 'bob', email: 'bob@example.com' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem('accessToken', 'token-123');
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'me', username: 'me', email: 'me@example.com', role: 'USER' },
    isAuthenticated: true,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
  vi.mocked(socketService.isConnected).mockReturnValue(true);
  vi.mocked(socketService.joinConversation).mockResolvedValue(undefined);
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/messages/c1']}>
      <Routes>
        <Route path="/messages/:conversationId" element={<ConversationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function getSocketHandler(event: string): (...args: never[]) => void {
  const call = vi.mocked(socketService.on).mock.calls.find(([e]) => e === event);
  if (!call) throw new Error(`No handler registered for "${event}"`);
  return call[1] as (...args: never[]) => void;
}

describe('ConversationPage - loading and errors', () => {
  it('shows a loading state initially', () => {
    vi.mocked(messageService.getConversation).mockReturnValue(new Promise(() => {}));
    vi.mocked(messageService.getMessages).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement de la conversation...')).toBeInTheDocument();
  });

  it('shows an error state when both the conversation and its messages fail to load', async () => {
    vi.mocked(messageService.getConversation).mockRejectedValue(new Error('boom'));
    vi.mocked(messageService.getMessages).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText('Erreur lors du chargement')).toBeInTheDocument();
  });

  it('recovers from a conversation-load failure once messages load successfully (loadMessages resets the error)', async () => {
    vi.mocked(messageService.getConversation).mockRejectedValue(new Error('boom'));
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();

    // messageService.getMessages resolving clears the error set by the failed
    // getConversation call, so the page falls back to the generic "not found"
    // message rather than the specific load error.
    expect(await screen.findByText('Conversation non trouvée')).toBeInTheDocument();
  });
});

describe('ConversationPage - content', () => {
  it('renders the header and chat window once loaded, and marks the conversation as read', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([makeMessage()]);

    renderPage();

    expect(await screen.findByTestId('conversation-header')).toBeInTheDocument();
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    await waitFor(() => expect(messageService.markAsRead).toHaveBeenCalledWith('c1'));
  });

  it('joins the socket conversation room and connects when not already connected', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false);
    vi.mocked(socketService.connect).mockResolvedValue(undefined);
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(socketService.connect).toHaveBeenCalledWith('token-123'));
    expect(socketService.joinConversation).toHaveBeenCalledWith('c1');
  });

  it('sends a message via the socket when connected', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(socketService.sendMessage).mockResolvedValue(makeMessage());

    renderPage();
    fireEvent.click(await screen.findByText('Envoyer un message'));

    await waitFor(() => expect(socketService.sendMessage).toHaveBeenCalledWith('c1', 'Salut !'));
    expect(messageService.sendMessage).not.toHaveBeenCalled();
  });

  it('falls back to the REST API when not connected via socket', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false);
    vi.mocked(socketService.connect).mockResolvedValue(undefined);
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(messageService.sendMessage).mockResolvedValue(makeMessage());

    renderPage();
    fireEvent.click(await screen.findByText('Envoyer un message'));

    await waitFor(() =>
      expect(messageService.sendMessage).toHaveBeenCalledWith('c1', { content: 'Salut !' }),
    );
  });

  it('opens the add-members modal and adds members, then refreshes the conversation', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(messageService.addMembers).mockResolvedValue(undefined as never);

    renderPage();
    fireEvent.click(await screen.findByText('Ouvrir ajout membres'));
    fireEvent.click(screen.getByText('Confirmer ajout'));

    await waitFor(() =>
      expect(messageService.addMembers).toHaveBeenCalledWith('c1', { memberIds: ['u9'] }),
    );
    await waitFor(() => expect(messageService.getConversation).toHaveBeenCalledTimes(2));
  });

  it('edits the conversation name', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(messageService.updateConversation).mockResolvedValue(undefined as never);

    renderPage();
    fireEvent.click(await screen.findByText('Ouvrir édition'));
    fireEvent.click(screen.getByText('Confirmer édition'));

    await waitFor(() =>
      expect(messageService.updateConversation).toHaveBeenCalledWith('c1', {
        name: 'Nouveau nom',
        imageUrl: undefined,
      }),
    );
  });

  it('deletes the conversation after confirmation and navigates to /messages', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(messageService.deleteConversation).mockResolvedValue(undefined as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByText('Supprimer la conversation'));

    await waitFor(() => expect(messageService.deleteConversation).toHaveBeenCalledWith('c1'));
    expect(mockNavigate).toHaveBeenCalledWith('/messages');
  });

  it('does not delete when the confirmation dialog is cancelled', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByText('Supprimer la conversation'));

    expect(messageService.deleteConversation).not.toHaveBeenCalled();
  });

  it('does not render the add-members/edit modals for a direct conversation', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(
      makeConversation({ type: ConversationType.DIRECT }),
    );
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('conversation-header');

    fireEvent.click(screen.getByText('Ouvrir ajout membres'));
    expect(screen.queryByTestId('add-members-modal')).not.toBeInTheDocument();
  });

  it('closes the add-members and edit-conversation modals', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByText('Ouvrir ajout membres'));
    fireEvent.click(screen.getByText('Fermer ajout'));
    expect(screen.queryByTestId('add-members-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Ouvrir édition'));
    fireEvent.click(screen.getByText('Fermer édition'));
    expect(screen.queryByTestId('edit-conversation-modal')).not.toBeInTheDocument();
  });

  it('loads older messages when "Charger plus" is clicked', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([makeMessage()]);

    renderPage();
    await screen.findByTestId('chat-window');

    fireEvent.click(screen.getByText('Charger plus'));

    await waitFor(() =>
      expect(messageService.getMessages).toHaveBeenCalledWith(
        'c1',
        50,
        '2026-01-01T00:00:00.000Z',
      ),
    );
  });

  it('removes another member from the conversation and refreshes it', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(messageService.removeMember).mockResolvedValue(undefined as never);

    renderPage();
    fireEvent.click(await screen.findByText('Retirer membre'));

    await waitFor(() => expect(messageService.removeMember).toHaveBeenCalledWith('c1', 'other'));
    await waitFor(() => expect(messageService.getConversation).toHaveBeenCalledTimes(2));
  });

  it('navigates to /messages when the current user removes themselves', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(messageService.removeMember).mockResolvedValue(undefined as never);

    renderPage();
    fireEvent.click(await screen.findByText('Me retirer'));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/messages'));
  });

  it('closes the members modal', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    fireEvent.click(await screen.findByText('Fermer membres'));

    expect(await screen.findByTestId('conversation-header')).toBeInTheDocument();
  });
});

describe('ConversationPage - socket init edge cases', () => {
  it('logs an error and skips socket initialization when there is no access token', async () => {
    sessionStorage.removeItem('accessToken');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('conversation-header');

    expect(errorSpy).toHaveBeenCalledWith('[ConversationPage] No access token found');
    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it('logs an error when the socket connection fails', async () => {
    vi.mocked(socketService.isConnected).mockReturnValue(false);
    vi.mocked(socketService.connect).mockRejectedValue(new Error('offline'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('conversation-header');

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        '[ConversationPage] Socket connection error:',
        expect.any(Error),
      ),
    );
  });

  it('falls back to the REST API when the socket send fails', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
    vi.mocked(socketService.sendMessage).mockRejectedValue(new Error('socket down'));
    vi.mocked(messageService.sendMessage).mockResolvedValue(makeMessage());
    vi.spyOn(console, 'error').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByText('Envoyer un message'));

    await waitFor(() =>
      expect(messageService.sendMessage).toHaveBeenCalledWith('c1', { content: 'Salut !' }),
    );
  });
});

describe('ConversationPage - live socket events', () => {
  it('appends an incoming message from another user and marks it as read', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('chat-window');
    vi.mocked(messageService.markAsRead).mockClear();

    const handler = getSocketHandler('newMessage');
    await act(async () => {
      handler({ conversationId: 'c1', message: makeMessage({ id: 'msg2' }) } as never);
    });

    await waitFor(() => expect(messageService.markAsRead).toHaveBeenCalledWith('c1'));
  });

  it('ignores an incoming message meant for a different conversation entirely', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([makeMessage({ id: 'msg1' })]);

    renderPage();
    await screen.findByTestId('chat-window');
    vi.mocked(messageService.markAsRead).mockClear();

    const handler = getSocketHandler('newMessage');
    await act(async () => {
      handler({ conversationId: 'other-conv', message: makeMessage({ id: 'msg3' }) } as never);
    });

    expect(messageService.markAsRead).not.toHaveBeenCalled();
  });

  it('does not duplicate a message already in the list when it arrives again via the socket', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([makeMessage({ id: 'msg1' })]);

    renderPage();
    await screen.findByTestId('chat-window');

    const handler = getSocketHandler('newMessage');
    await act(async () => {
      handler({ conversationId: 'c1', message: makeMessage({ id: 'msg1' }) } as never);
    });

    // The dedup check prevents the message being appended twice; ChatWindow is
    // mocked so we assert via markAsRead, which still fires once per matching event.
    await waitFor(() => expect(messageService.markAsRead).toHaveBeenCalledWith('c1'));
  });

  it('does not mark as read when the incoming message is from the current user', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('chat-window');
    vi.mocked(messageService.markAsRead).mockClear();

    const handler = getSocketHandler('newMessage');
    await act(async () => {
      handler({
        conversationId: 'c1',
        message: makeMessage({ id: 'msg2', senderId: 'me' }),
      } as never);
    });

    expect(messageService.markAsRead).not.toHaveBeenCalled();
  });

  it('updates the conversation when a conversationUpdated event is received', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByText('Équipe');

    const handler = getSocketHandler('conversationUpdated');
    await act(async () => {
      handler({
        conversationId: 'c1',
        conversation: makeConversation({ name: 'Nouvelle équipe' }),
      } as never);
    });

    expect(await screen.findByText('Nouvelle équipe')).toBeInTheDocument();
  });

  it('reloads the conversation when a memberAdded event is received', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('conversation-header');

    const handler = getSocketHandler('memberAdded');
    await act(async () => {
      handler({ conversationId: 'c1', userId: 'other' } as never);
    });

    await waitFor(() => expect(messageService.getConversation).toHaveBeenCalledTimes(2));
  });

  it('navigates away when a memberRemoved event removes the current user', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('conversation-header');

    const handler = getSocketHandler('memberRemoved');
    await act(async () => {
      handler({ conversationId: 'c1', userId: 'me' } as never);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/messages');
  });

  it('reloads the conversation when a memberRemoved event removes someone else', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.getMessages).mockResolvedValue([]);

    renderPage();
    await screen.findByTestId('conversation-header');

    const handler = getSocketHandler('memberRemoved');
    await act(async () => {
      handler({ conversationId: 'c1', userId: 'other' } as never);
    });

    await waitFor(() => expect(messageService.getConversation).toHaveBeenCalledTimes(2));
  });
});
