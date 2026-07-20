import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ConversationList } from '../components/messages/ConversationList';
import { ConversationType } from '../services/messageService';
import type { Conversation } from '../services/messageService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function makeDirectConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    type: ConversationType.DIRECT,
    members: [
      {
        id: 'm1',
        conversationId: 'c1',
        userId: 'other-1',
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastReadAt: '2026-01-01T00:00:00.000Z',
        user: { id: 'other-1', username: 'bob', email: 'bob@example.com' },
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderList(conversations: Conversation[]) {
  return render(
    <MemoryRouter>
      <ConversationList conversations={conversations} currentUserId="me" />
    </MemoryRouter>,
  );
}

describe('ConversationList', () => {
  it('shows an empty state when there are no conversations', () => {
    renderList([]);

    expect(screen.getByText('Aucune conversation')).toBeInTheDocument();
  });

  it('shows the other member name and "Aucun message" for a direct conversation without messages', () => {
    renderList([makeDirectConversation()]);

    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('Aucun message')).toBeInTheDocument();
  });

  it('falls back to "Utilisateur inconnu" when the other member is missing', () => {
    renderList([makeDirectConversation({ members: [] })]);

    expect(screen.getByText('Utilisateur inconnu')).toBeInTheDocument();
  });

  it('shows the group name and an "Événement" badge for event conversations', () => {
    renderList([
      makeDirectConversation({ type: ConversationType.EVENT, name: 'Concert crew' }),
    ]);

    expect(screen.getByText('Concert crew')).toBeInTheDocument();
    expect(screen.getByText('Événement')).toBeInTheDocument();
  });

  it('falls back to "Conversation de groupe" when a group has no name', () => {
    renderList([makeDirectConversation({ type: ConversationType.GROUP, name: undefined })]);

    expect(screen.getByText('Conversation de groupe')).toBeInTheDocument();
  });

  it('truncates a long last message', () => {
    const longContent = 'x'.repeat(60);
    renderList([
      makeDirectConversation({
        messages: [
          {
            id: 'msg1',
            conversationId: 'c1',
            senderId: 'other-1',
            content: longContent,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            sender: { id: 'other-1', username: 'bob', email: 'bob@example.com' },
          },
        ],
      }),
    ]);

    expect(screen.getByText(`${'x'.repeat(50)}...`)).toBeInTheDocument();
  });

  it('shows the unread count badge only when there are unread messages', () => {
    const { rerender } = renderList([makeDirectConversation({ unreadCount: 0 })]);
    expect(screen.queryByText('3')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ConversationList
          conversations={[makeDirectConversation({ unreadCount: 3 })]}
          currentUserId="me"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('navigates to the conversation when clicked', () => {
    renderList([makeDirectConversation()]);

    fireEvent.click(screen.getByText('bob'));

    expect(mockNavigate).toHaveBeenCalledWith('/messages/c1');
  });
});
