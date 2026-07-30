import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessagesPage } from '../pages/messages/MessagesPage';
import messageService, { ConversationType } from '../services/messageService';
import { useAuth } from '../utils/useAuth';
import type { Conversation } from '../services/messageService';

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
      getUserConversations: vi.fn(),
      createConversation: vi.fn(),
    },
  };
});

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/messages/ConversationList', () => ({
  ConversationList: ({ conversations }: { conversations: Conversation[] }) => (
    <div data-testid="conversation-list">{conversations.length} conversation(s)</div>
  ),
}));

vi.mock('../components/messages/CreateConversationModal', () => ({
  CreateConversationModal: ({
    isOpen,
    onCreateDirect,
    onCreateGroup,
  }: {
    isOpen: boolean;
    onCreateDirect: (userId: string) => void;
    onCreateGroup: (name: string, memberIds: string[]) => void;
  }) =>
    isOpen ? (
      <div data-testid="create-conversation-modal">
        <button type="button" onClick={() => onCreateDirect('u9')}>
          Créer conversation directe
        </button>
        <button type="button" onClick={() => onCreateGroup('Équipe', ['u9', 'u10'])}>
          Créer groupe
        </button>
      </div>
    ) : null,
}));

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    type: ConversationType.DIRECT,
    createdBy: 'me',
    createdAt: '',
    updatedAt: '',
    members: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: { id: 'me', username: 'me', email: 'me@example.com', role: 'USER' },
    isAuthenticated: true,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MessagesPage />
    </MemoryRouter>,
  );
}

describe('MessagesPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(messageService.getUserConversations).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement des conversations...')).toBeInTheDocument();
  });

  it('shows an error message and allows retrying', async () => {
    vi.mocked(messageService.getUserConversations)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([]);

    renderPage();

    expect(await screen.findByText('Erreur lors du chargement')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() =>
      expect(messageService.getUserConversations).toHaveBeenCalledTimes(2),
    );
  });

  it('lists the conversations once loaded', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([
      makeConversation(),
      makeConversation({ id: 'c2' }),
    ]);

    renderPage();

    expect(await screen.findByTestId('conversation-list')).toHaveTextContent(
      '2 conversation(s)',
    );
  });

  it('opens the create-conversation modal and creates a direct conversation', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([]);
    vi.mocked(messageService.createConversation).mockResolvedValue(
      makeConversation({ id: 'new-direct' }),
    );

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Nouvelle conversation' }));
    fireEvent.click(screen.getByText('Créer conversation directe'));

    await waitFor(() =>
      expect(messageService.createConversation).toHaveBeenCalledWith({
        type: ConversationType.DIRECT,
        memberIds: ['u9'],
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/messages/new-direct'));
  });

  it('creates a group conversation', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([]);
    vi.mocked(messageService.createConversation).mockResolvedValue(
      makeConversation({ id: 'new-group', type: ConversationType.GROUP }),
    );

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Nouvelle conversation' }));
    fireEvent.click(screen.getByText('Créer groupe'));

    await waitFor(() =>
      expect(messageService.createConversation).toHaveBeenCalledWith({
        type: ConversationType.GROUP,
        name: 'Équipe',
        memberIds: ['u9', 'u10'],
      }),
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/messages/new-group'));
  });

  it('shows an alert when creating a conversation fails', async () => {
    vi.mocked(messageService.getUserConversations).mockResolvedValue([]);
    vi.mocked(messageService.createConversation).mockRejectedValue({
      response: { data: { message: 'Utilisateur introuvable' } },
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Nouvelle conversation' }));
    fireEvent.click(screen.getByText('Créer conversation directe'));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Utilisateur introuvable'),
    );
  });
});
