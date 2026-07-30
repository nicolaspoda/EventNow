import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AddMembersModal } from '../components/messages/AddMembersModal';
import type { SearchUserResult } from '../types/auth';

vi.mock('../components/user/UserSearchAutocomplete', () => ({
  UserSearchAutocomplete: ({ onSelect }: { onSelect?: (u: SearchUserResult) => void }) => (
    <button onClick={() => onSelect?.({ id: 'u2', username: 'carol', avatarUrl: null })}>
      Sélectionner carol
    </button>
  ),
}));

describe('AddMembersModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AddMembersModal isOpen={false} onClose={vi.fn()} onAddMembers={vi.fn()} currentMemberIds={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a placeholder message when no member is selected', () => {
    render(
      <AddMembersModal isOpen onClose={vi.fn()} onAddMembers={vi.fn()} currentMemberIds={[]} />,
    );

    expect(
      screen.getByText("Tapez un nom d'utilisateur ci-dessus pour trouver et ajouter des membres"),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
  });

  it('adds a selected user to the pending list and enables the submit button', () => {
    render(
      <AddMembersModal isOpen onClose={vi.fn()} onAddMembers={vi.fn()} currentMemberIds={[]} />,
    );

    fireEvent.click(screen.getByText('Sélectionner carol'));

    expect(screen.getByText('@carol')).toBeInTheDocument();
    expect(screen.getByText('1 membre(s) sélectionné(s)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter' })).not.toBeDisabled();
  });

  it('does not add the same user twice', () => {
    render(
      <AddMembersModal isOpen onClose={vi.fn()} onAddMembers={vi.fn()} currentMemberIds={[]} />,
    );

    fireEvent.click(screen.getByText('Sélectionner carol'));
    fireEvent.click(screen.getByText('Sélectionner carol'));

    expect(screen.getByText('1 membre(s) sélectionné(s)')).toBeInTheDocument();
  });

  it('removes a selected member', () => {
    render(
      <AddMembersModal isOpen onClose={vi.fn()} onAddMembers={vi.fn()} currentMemberIds={[]} />,
    );

    fireEvent.click(screen.getByText('Sélectionner carol'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer' }));

    expect(screen.queryByText('@carol')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeDisabled();
  });

  it('submits the selected member ids and closes on success', async () => {
    const onAddMembers = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <AddMembersModal isOpen onClose={onClose} onAddMembers={onAddMembers} currentMemberIds={[]} />,
    );

    fireEvent.click(screen.getByText('Sélectionner carol'));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));

    await waitFor(() => expect(onAddMembers).toHaveBeenCalledWith(['u2']));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose and resets selection when cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <AddMembersModal isOpen onClose={onClose} onAddMembers={vi.fn()} currentMemberIds={[]} />,
    );

    fireEvent.click(screen.getByText('Sélectionner carol'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
