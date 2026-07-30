import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationHeader } from '../components/messages/ConversationHeader';
import { ConversationType } from '../types/message.types';
import type { Conversation } from '../types/message.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    type: ConversationType.GROUP,
    name: 'Équipe projet',
    createdBy: 'owner-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    members: [
      {
        id: 'm1',
        conversationId: 'c1',
        userId: 'owner-1',
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastReadAt: '2026-01-01T00:00:00.000Z',
        user: { id: 'owner-1', username: 'alice', email: 'alice@example.com' },
      },
      {
        id: 'm2',
        conversationId: 'c1',
        userId: 'user-1',
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastReadAt: '2026-01-01T00:00:00.000Z',
        user: { id: 'user-1', username: 'bob', email: 'bob@example.com' },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderHeader(props: Partial<React.ComponentProps<typeof ConversationHeader>> = {}) {
  return render(
    <MemoryRouter>
      <ConversationHeader
        conversation={makeConversation()}
        currentUserId="owner-1"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('ConversationHeader', () => {
  it('shows the group name and member count', () => {
    renderHeader();

    expect(screen.getByRole('heading', { name: 'Équipe projet' })).toBeInTheDocument();
    expect(screen.getByText('2 participants')).toBeInTheDocument();
  });

  it('navigates back to the messages list', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Retour aux messages' }));

    expect(mockNavigate).toHaveBeenCalledWith('/messages');
  });

  it('shows the other member name for a direct conversation without a menu button', () => {
    renderHeader({
      conversation: makeConversation({
        type: ConversationType.DIRECT,
        name: undefined,
      }),
      currentUserId: 'user-1',
    });

    expect(screen.getByRole('heading', { name: 'alice' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('opens the menu and navigates to the members page', () => {
    renderHeader();

    const menuButtons = screen.getAllByRole('button');
    fireEvent.click(menuButtons[1]);
    fireEvent.click(screen.getByText('Voir les membres'));

    expect(mockNavigate).toHaveBeenCalledWith('/messages/c1/members');
  });

  it('shows manage actions (add/edit/delete) only for the group creator', () => {
    renderHeader({ currentUserId: 'owner-1' });

    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(screen.getByText('Ajouter des membres')).toBeInTheDocument();
    expect(screen.getByText('Modifier le groupe')).toBeInTheDocument();
    expect(screen.getByText('Supprimer le groupe')).toBeInTheDocument();
  });

  it('hides edit/delete for a non-creator group member, but still allows adding members', () => {
    renderHeader({ currentUserId: 'user-1' });

    fireEvent.click(screen.getAllByRole('button')[1]);

    expect(screen.getByText('Ajouter des membres')).toBeInTheDocument();
    expect(screen.queryByText('Modifier le groupe')).not.toBeInTheDocument();
    expect(screen.queryByText('Supprimer le groupe')).not.toBeInTheDocument();
  });

  it('calls onAddMembers, onEditConversation and onDeleteConversation callbacks', () => {
    const onAddMembers = vi.fn();
    const onEditConversation = vi.fn();
    const onDeleteConversation = vi.fn();
    renderHeader({ onAddMembers, onEditConversation, onDeleteConversation });

    fireEvent.click(screen.getAllByRole('button')[1]);
    fireEvent.click(screen.getByText('Ajouter des membres'));
    expect(onAddMembers).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button')[1]);
    fireEvent.click(screen.getByText('Modifier le groupe'));
    expect(onEditConversation).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole('button')[1]);
    fireEvent.click(screen.getByText('Supprimer le groupe'));
    expect(onDeleteConversation).toHaveBeenCalledTimes(1);
  });
});
