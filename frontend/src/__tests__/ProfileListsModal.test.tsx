import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileListsModal, type ProfileListUser } from '../components/profile/ProfileListsModal';
import { followService } from '../services/followService';

vi.mock('../services/followService', () => ({
  followService: {
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
    getFriends: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
  },
}));

function makeUser(overrides: Partial<ProfileListUser> = {}): ProfileListUser {
  return {
    id: 'u1',
    email: 'bob@example.com',
    username: 'bob',
    followedAt: '2026-01-01T00:00:00.000Z',
    isFollowingByCurrentUser: false,
    isFriendWithCurrentUser: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(followService.getFollowers).mockResolvedValue([]);
  vi.mocked(followService.getFollowing).mockResolvedValue([]);
  vi.mocked(followService.getFriends).mockResolvedValue([]);
});

function renderModal(props: Partial<React.ComponentProps<typeof ProfileListsModal>> = {}) {
  return render(
    <MemoryRouter>
      <ProfileListsModal
        isOpen
        onClose={vi.fn()}
        profileUserId="p1"
        currentUserId="me"
        initialTab="followers"
        followersCount={1}
        followingCount={2}
        friendsCount={3}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('ProfileListsModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false });

    expect(container).toBeEmptyDOMElement();
  });

  it('fetches the initial tab’s list on open', async () => {
    renderModal({ initialTab: 'friends' });

    await waitFor(() => expect(followService.getFriends).toHaveBeenCalledWith('p1'));
  });

  it('shows an empty-state message when the list has no users', async () => {
    renderModal();

    expect(await screen.findByText('Aucun utilisateur dans cette liste.')).toBeInTheDocument();
  });

  it('lists users with their display name, falling back to the email prefix', async () => {
    vi.mocked(followService.getFollowers).mockResolvedValue([
      makeUser({ id: 'u1', username: 'bob' }),
      makeUser({ id: 'u2', username: undefined, email: 'carol@example.com' }),
    ]);

    renderModal();

    expect(await screen.findByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
  });

  it('switches tabs and fetches the corresponding list', async () => {
    vi.mocked(followService.getFollowing).mockResolvedValue([makeUser({ username: 'dan' })]);

    renderModal();
    await waitFor(() => expect(followService.getFollowers).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Abonnements \(2\)/ }));

    await waitFor(() => expect(followService.getFollowing).toHaveBeenCalledWith('p1'));
    expect(await screen.findByText('dan')).toBeInTheDocument();
  });

  it('follows a user not yet followed', async () => {
    vi.mocked(followService.getFollowers).mockResolvedValue([
      makeUser({ id: 'u2', username: 'dan', isFollowingByCurrentUser: false }),
    ]);
    vi.mocked(followService.follow).mockResolvedValue(undefined as never);

    renderModal();
    await screen.findByText('dan');

    fireEvent.click(screen.getByRole('button', { name: 'Suivre' }));

    await waitFor(() => expect(followService.follow).toHaveBeenCalledWith('u2'));
  });

  it('shows a confirmation dialog before unfollowing, then unfollows', async () => {
    vi.mocked(followService.getFollowers).mockResolvedValue([
      makeUser({ id: 'u2', username: 'dan', isFollowingByCurrentUser: true, isFriendWithCurrentUser: false }),
    ]);
    vi.mocked(followService.unfollow).mockResolvedValue(undefined as never);

    renderModal();
    await screen.findByText('dan');

    fireEvent.click(screen.getByRole('button', { name: 'Abonné' }));
    expect(
      screen.getByText('Se désabonner ? Vous ne verrez plus les publications de cette personne.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Se désabonner' }));

    await waitFor(() => expect(followService.unfollow).toHaveBeenCalledWith('u2'));
  });

  it('shows the friend-specific confirmation message for a friend', async () => {
    vi.mocked(followService.getFollowers).mockResolvedValue([
      makeUser({ id: 'u2', username: 'dan', isFollowingByCurrentUser: true, isFriendWithCurrentUser: true }),
    ]);

    renderModal();
    await screen.findByText('dan');

    fireEvent.click(screen.getByRole('button', { name: 'Amis' }));

    expect(screen.getByText('Se désabonner ? Vous ne serez plus amis.')).toBeInTheDocument();
  });

  it('cancels the unfollow confirmation without calling the service', async () => {
    vi.mocked(followService.getFollowers).mockResolvedValue([
      makeUser({ id: 'u2', username: 'dan', isFollowingByCurrentUser: true }),
    ]);

    renderModal();
    await screen.findByText('dan');

    fireEvent.click(screen.getByRole('button', { name: 'Abonné' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(followService.unfollow).not.toHaveBeenCalled();
    expect(
      screen.queryByText('Se désabonner ? Vous ne verrez plus les publications de cette personne.'),
    ).not.toBeInTheDocument();
  });

  it('does not show a follow/unfollow action for the current user themselves', async () => {
    vi.mocked(followService.getFollowers).mockResolvedValue([
      makeUser({ id: 'me', username: 'me-user' }),
    ]);

    renderModal();

    expect(await screen.findByText('me-user')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Suivre' })).not.toBeInTheDocument();
  });

  it('closes when the close button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
