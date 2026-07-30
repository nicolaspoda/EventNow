import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateConversationModal } from '../components/messages/CreateConversationModal';
import type { SearchUserResult } from '../types/auth';

let currentOnSelect: ((u: SearchUserResult) => void) | undefined;

vi.mock('../components/user/UserSearchAutocomplete', () => ({
  UserSearchAutocomplete: ({ onSelect }: { onSelect?: (u: SearchUserResult) => void }) => {
    currentOnSelect = onSelect;
    return (
      <button onClick={() => onSelect?.({ id: 'u2', username: 'carol', avatarUrl: null })}>
        Sélectionner carol
      </button>
    );
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  currentOnSelect = undefined;
});

describe('CreateConversationModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CreateConversationModal
        isOpen={false}
        onClose={vi.fn()}
        onCreateDirect={vi.fn()}
        onCreateGroup={vi.fn()}
        currentUserId="me"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('defaults to direct message mode with the create button disabled', () => {
    render(
      <CreateConversationModal
        isOpen
        onClose={vi.fn()}
        onCreateDirect={vi.fn()}
        onCreateGroup={vi.fn()}
        currentUserId="me"
      />,
    );

    expect(screen.queryByLabelText('Nom du groupe')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer' })).toBeDisabled();
  });

  it('selects a user for a direct conversation and creates it', async () => {
    const onCreateDirect = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <CreateConversationModal
        isOpen
        onClose={onClose}
        onCreateDirect={onCreateDirect}
        onCreateGroup={vi.fn()}
        currentUserId="me"
      />,
    );

    fireEvent.click(screen.getByText('Sélectionner carol'));
    expect(screen.getByText('@carol')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() => expect(onCreateDirect).toHaveBeenCalledWith('u2'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes the selected direct user', () => {
    render(
      <CreateConversationModal
        isOpen
        onClose={vi.fn()}
        onCreateDirect={vi.fn()}
        onCreateGroup={vi.fn()}
        currentUserId="me"
      />,
    );

    fireEvent.click(screen.getByText('Sélectionner carol'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }));

    expect(screen.queryByText('@carol')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer' })).toBeDisabled();
  });

  it('switches to group mode, requiring a name and at least one member', async () => {
    const onCreateGroup = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateConversationModal
        isOpen
        onClose={vi.fn()}
        onCreateDirect={vi.fn()}
        onCreateGroup={onCreateGroup}
        currentUserId="me"
      />,
    );

    fireEvent.click(screen.getByText('Groupe'));
    expect(screen.getByLabelText('Nom du groupe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nom du groupe'), { target: { value: 'Amis' } });
    expect(screen.getByRole('button', { name: 'Créer' })).toBeDisabled();

    fireEvent.click(screen.getByText('Sélectionner carol'));
    expect(screen.getByRole('button', { name: 'Créer' })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Créer' }));

    await waitFor(() => expect(onCreateGroup).toHaveBeenCalledWith('Amis', ['u2']));
  });

  it('allows multiple members to be selected for a group and removed individually', () => {
    render(
      <CreateConversationModal
        isOpen
        onClose={vi.fn()}
        onCreateDirect={vi.fn()}
        onCreateGroup={vi.fn()}
        currentUserId="me"
      />,
    );

    fireEvent.click(screen.getByText('Groupe'));
    fireEvent.click(screen.getByText('Sélectionner carol'));
    act(() => {
      currentOnSelect?.({ id: 'u3', username: 'dan', avatarUrl: null });
    });

    expect(screen.getByText('2 membre(s) sélectionné(s)')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Retirer' })[0]);
    expect(screen.getByText('1 membre(s) sélectionné(s)')).toBeInTheDocument();
  });

  it('resets state and calls onClose when cancelled', () => {
    const onClose = vi.fn();
    render(
      <CreateConversationModal
        isOpen
        onClose={onClose}
        onCreateDirect={vi.fn()}
        onCreateGroup={vi.fn()}
        currentUserId="me"
      />,
    );

    fireEvent.click(screen.getByText('Groupe'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
