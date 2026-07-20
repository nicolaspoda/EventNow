import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConversationMembersModal } from '../components/messages/ConversationMembersModal';
import type { ConversationMember } from '../services/messageService';

function makeMember(overrides: Partial<ConversationMember> = {}): ConversationMember {
  return {
    id: 'm1',
    conversationId: 'c1',
    userId: 'user-1',
    joinedAt: '2026-01-01T00:00:00.000Z',
    lastReadAt: '2026-01-01T00:00:00.000Z',
    user: { id: 'user-1', username: 'bob', email: 'bob@example.com' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConversationMembersModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConversationMembersModal isOpen={false} onClose={vi.fn()} members={[]} currentUserId="me" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the member count and each member’s name/email', () => {
    render(
      <ConversationMembersModal
        isOpen
        onClose={vi.fn()}
        members={[makeMember(), makeMember({ id: 'm2', userId: 'user-2', user: { id: 'user-2', username: 'carol', email: 'carol@example.com' } })]}
        currentUserId="me"
      />,
    );

    expect(screen.getByText('Membres (2)')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol@example.com')).toBeInTheDocument();
  });

  it('labels the current user and the group creator', () => {
    render(
      <ConversationMembersModal
        isOpen
        onClose={vi.fn()}
        members={[makeMember({ userId: 'me', user: { id: 'me', username: 'me-user', email: 'me@example.com' } })]}
        currentUserId="me"
        createdBy="me"
      />,
    );

    expect(screen.getByText('(Vous)')).toBeInTheDocument();
    expect(screen.getByText('Créateur')).toBeInTheDocument();
  });

  it('does not show remove actions when onRemoveMember is not provided', () => {
    render(
      <ConversationMembersModal isOpen onClose={vi.fn()} members={[makeMember()]} currentUserId="creator" createdBy="creator" />,
    );

    expect(screen.queryByRole('button', { name: 'Retirer' })).not.toBeInTheDocument();
  });

  it('lets the creator remove another member after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onRemoveMember = vi.fn().mockResolvedValue(undefined);
    render(
      <ConversationMembersModal
        isOpen
        onClose={vi.fn()}
        members={[makeMember()]}
        currentUserId="creator"
        createdBy="creator"
        onRemoveMember={onRemoveMember}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }));

    expect(window.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir retirer ce membre ?');
    await waitFor(() => expect(onRemoveMember).toHaveBeenCalledWith('user-1'));
  });

  it('lets the current user leave and closes the modal', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onRemoveMember = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <ConversationMembersModal
        isOpen
        onClose={onClose}
        members={[makeMember({ userId: 'me', user: { id: 'me', username: 'me-user', email: 'me@example.com' } })]}
        currentUserId="me"
        createdBy="someone-else"
        onRemoveMember={onRemoveMember}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Quitter' }));

    expect(window.confirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir quitter cette conversation ?');
    await waitFor(() => expect(onRemoveMember).toHaveBeenCalledWith('me'));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('does not remove when the confirmation dialog is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const onRemoveMember = vi.fn();
    render(
      <ConversationMembersModal
        isOpen
        onClose={vi.fn()}
        members={[makeMember()]}
        currentUserId="creator"
        createdBy="creator"
        onRemoveMember={onRemoveMember}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }));

    expect(onRemoveMember).not.toHaveBeenCalled();
  });

  it('does not allow a non-creator to remove other members', () => {
    render(
      <ConversationMembersModal
        isOpen
        onClose={vi.fn()}
        members={[makeMember({ userId: 'someone-else', user: { id: 'someone-else', username: 'dan', email: 'dan@example.com' } })]}
        currentUserId="me"
        createdBy="creator"
        onRemoveMember={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Retirer' })).not.toBeInTheDocument();
  });

  it('calls onClose when the footer close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ConversationMembersModal isOpen onClose={onClose} members={[]} currentUserId="me" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
