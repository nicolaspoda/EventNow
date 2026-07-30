import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationMembersPage } from '../pages/messages/ConversationMembersPage';
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
      getConversation: vi.fn(),
      removeMember: vi.fn(),
    },
  };
});

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
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
      {
        id: 'm2',
        conversationId: 'c1',
        userId: 'other',
        joinedAt: '',
        lastReadAt: '',
        user: { id: 'other', username: 'bob', email: 'bob@example.com' },
      },
    ],
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
    <MemoryRouter initialEntries={['/messages/c1/members']}>
      <Routes>
        <Route path="/messages/:conversationId/members" element={<ConversationMembersPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ConversationMembersPage', () => {
  it('shows a loading state initially', () => {
    vi.mocked(messageService.getConversation).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByText('Chargement des membres...')).toBeInTheDocument();
  });

  it('shows an error message on failure', async () => {
    vi.mocked(messageService.getConversation).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText('Erreur lors du chargement')).toBeInTheDocument();
  });

  it('lists members with the creator badge and the current-user marker', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());

    renderPage();

    expect(await screen.findByText('2 participant(s)')).toBeInTheDocument();
    expect(screen.getByText('Créateur')).toBeInTheDocument();
    expect(screen.getByText('(Vous)')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('navigates back to the conversation', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /Retour à la conversation/ }));

    expect(mockNavigate).toHaveBeenCalledWith('/messages/c1');
  });

  it('the creator removes another member after confirmation', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.removeMember).mockResolvedValue(undefined as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retirer' }));

    await waitFor(() =>
      expect(messageService.removeMember).toHaveBeenCalledWith('c1', 'other'),
    );
    await waitFor(() => expect(messageService.getConversation).toHaveBeenCalledTimes(2));
  });

  it('lets the current user leave the conversation and navigates to /messages', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.removeMember).mockResolvedValue(undefined as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Quitter' }));

    await waitFor(() =>
      expect(messageService.removeMember).toHaveBeenCalledWith('c1', 'me'),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/messages');
  });

  it('does not remove when the confirmation dialog is cancelled', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retirer' }));

    expect(messageService.removeMember).not.toHaveBeenCalled();
  });

  it('shows an alert when removing a member fails', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(makeConversation());
    vi.mocked(messageService.removeMember).mockRejectedValue({
      response: { data: { message: 'Action non autorisée' } },
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Retirer' }));

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Action non autorisée'),
    );
  });

  it('does not show remove buttons for a direct conversation', async () => {
    vi.mocked(messageService.getConversation).mockResolvedValue(
      makeConversation({ type: ConversationType.DIRECT }),
    );

    renderPage();

    await screen.findByText('2 participant(s)');
    expect(screen.queryByRole('button', { name: 'Retirer' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitter' })).not.toBeInTheDocument();
  });
});
