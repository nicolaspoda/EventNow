import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileViewMode } from '../components/profile/ProfileViewMode';
import { followService } from '../services/followService';
import { useAuth } from '../utils/useAuth';
import type { PublicUserProfile } from '../services/profile.service';

vi.mock('../services/followService', () => ({
  followService: {
    follow: vi.fn(),
    unfollow: vi.fn(),
    setNotifications: vi.fn(),
    getFollowers: vi.fn().mockResolvedValue([]),
    getFollowing: vi.fn().mockResolvedValue([]),
    getFriends: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/ReportModal', () => ({
  default: ({ isOpen, onSuccess, onAlreadyReported, onClose }: {
    isOpen: boolean;
    onSuccess: (msg: string) => void;
    onAlreadyReported: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="report-modal">
        <button onClick={() => onSuccess('Signalement envoyé.')}>Confirmer signalement</button>
        <button onClick={onAlreadyReported}>Déjà signalé</button>
        <button onClick={onClose}>Fermer signalement</button>
      </div>
    ) : null,
}));

function makeProfile(overrides: Partial<PublicUserProfile> = {}): PublicUserProfile {
  return {
    id: 'other-1',
    username: 'bob',
    email: 'bob@example.com',
    role: 'USER',
    createdAt: '2026-01-01T00:00:00.000Z',
    isFollowing: false,
    isFriend: false,
    followersCount: 3,
    followingCount: 2,
    friendsCount: 1,
    notificationsEnabled: true,
    participatedEvents: [],
    participantReviews: [],
    stats: { averageRating: null, totalReviews: 0, participatedEventsCount: 5 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(followService.getFollowers).mockResolvedValue([]);
  vi.mocked(followService.getFollowing).mockResolvedValue([]);
  vi.mocked(followService.getFriends).mockResolvedValue([]);
});

function mockAuthUser(id: string | null) {
  vi.mocked(useAuth).mockReturnValue({
    user: id ? { id, username: 'me', email: 'me@example.com', role: 'USER' } : null,
    isAuthenticated: !!id,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
}

function renderProfile(profile: PublicUserProfile, userId = 'other-1', onProfileUpdate = vi.fn()) {
  return render(
    <MemoryRouter>
      <ProfileViewMode profile={profile} userId={userId} onProfileUpdate={onProfileUpdate} />
    </MemoryRouter>,
  );
}

describe('ProfileViewMode - identity and stats', () => {
  it('renders the display name, email and role badge', () => {
    mockAuthUser('me');
    renderProfile(makeProfile());

    expect(screen.getByRole('heading', { name: 'bob' })).toBeInTheDocument();
    expect(screen.getAllByText('bob@example.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Utilisateur').length).toBeGreaterThan(0);
  });

  it('falls back to the email prefix when there is no username', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ username: null }));

    expect(screen.getByRole('heading', { name: 'bob' })).toBeInTheDocument();
  });

  it('shows the participated events count and hides rating rows when there are no reviews', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ stats: { averageRating: null, totalReviews: 0, participatedEventsCount: 7 } }));

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.queryByText('Note reçue (participant)')).not.toBeInTheDocument();
  });

  it('shows the average rating when there are reviews', () => {
    mockAuthUser('me');
    renderProfile(
      makeProfile({ stats: { averageRating: 4.5, totalReviews: 3, participatedEventsCount: 1 } }),
    );

    expect(screen.getByText('4.5/5 (3 avis)')).toBeInTheDocument();
  });
});

describe('ProfileViewMode - own profile', () => {
  it('does not show a follow or report button for your own profile', () => {
    mockAuthUser('other-1');
    renderProfile(makeProfile(), 'other-1');

    expect(screen.queryByRole('button', { name: 'Suivre' })).not.toBeInTheDocument();
    expect(screen.queryByText('Signaler')).not.toBeInTheDocument();
  });
});

describe('ProfileViewMode - following someone else', () => {
  it('shows a follow button for a logged-in visitor not yet following', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ isFollowing: false }));

    expect(screen.getByRole('button', { name: 'Suivre' })).toBeInTheDocument();
  });

  it('calls follow and onProfileUpdate when the follow button is clicked', async () => {
    mockAuthUser('me');
    vi.mocked(followService.follow).mockResolvedValue(undefined as never);
    const onProfileUpdate = vi.fn().mockResolvedValue(undefined);
    renderProfile(makeProfile({ isFollowing: false }), 'other-1', onProfileUpdate);

    fireEvent.click(screen.getByRole('button', { name: 'Suivre' }));

    await waitFor(() => expect(followService.follow).toHaveBeenCalledWith('other-1'));
    expect(onProfileUpdate).toHaveBeenCalledTimes(1);
  });

  it('shows no follow button for a logged-out visitor', () => {
    mockAuthUser(null);
    renderProfile(makeProfile({ isFollowing: false }));

    expect(screen.queryByRole('button', { name: 'Suivre' })).not.toBeInTheDocument();
  });

  it('shows "Suivi(e)" and a "Ne plus suivre" button when already following (not a friend)', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ isFollowing: true, isFriend: false }));

    expect(screen.getByText('Suivi(e)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ne plus suivre' })).toBeInTheDocument();
  });

  it('shows "Amis" instead of "Suivi(e)" for a friend', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ isFollowing: true, isFriend: true }));

    expect(screen.getByText('Amis')).toBeInTheDocument();
  });

  it('confirms unfollowing with the friend-specific message and calls unfollow', async () => {
    mockAuthUser('me');
    vi.mocked(followService.unfollow).mockResolvedValue(undefined as never);
    const onProfileUpdate = vi.fn().mockResolvedValue(undefined);
    renderProfile(makeProfile({ isFollowing: true, isFriend: true }), 'other-1', onProfileUpdate);

    fireEvent.click(screen.getByRole('button', { name: /Ne plus suivre/ }));
    expect(screen.getByText('Se désabonner ? Vous ne serez plus amis.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Se désabonner' }));

    await waitFor(() => expect(followService.unfollow).toHaveBeenCalledWith('other-1'));
    expect(onProfileUpdate).toHaveBeenCalledTimes(1);
  });

  it('shows the non-friend confirmation message when unfollowing a non-friend', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ isFollowing: true, isFriend: false }));

    fireEvent.click(screen.getByRole('button', { name: 'Ne plus suivre' }));

    expect(
      screen.getByText('Se désabonner ? Vous ne verrez plus les publications de cette personne.'),
    ).toBeInTheDocument();
  });

  it('cancels the unfollow confirmation without calling the service', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ isFollowing: true }));

    fireEvent.click(screen.getByRole('button', { name: 'Ne plus suivre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(followService.unfollow).not.toHaveBeenCalled();
  });

  it('toggles notifications off then on', async () => {
    mockAuthUser('me');
    vi.mocked(followService.setNotifications).mockResolvedValue(undefined as never);
    renderProfile(makeProfile({ isFollowing: true, notificationsEnabled: true }));

    fireEvent.click(screen.getByRole('button', { name: 'Désactiver les notifications' }));

    await waitFor(() =>
      expect(followService.setNotifications).toHaveBeenCalledWith('other-1', false),
    );
    expect(await screen.findByRole('button', { name: 'Activer les notifications' })).toBeInTheDocument();
  });
});

describe('ProfileViewMode - reporting', () => {
  it('shows a "Signaler" button for a visitor viewing someone else’s profile', () => {
    mockAuthUser('me');
    renderProfile(makeProfile());

    expect(screen.getByText('Signaler')).toBeInTheDocument();
  });

  it('opens the report modal, and shows a success toast on success', async () => {
    mockAuthUser('me');
    renderProfile(makeProfile());

    fireEvent.click(screen.getByText('Signaler'));
    expect(screen.getByTestId('report-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirmer signalement'));

    expect(await screen.findByRole('status')).toHaveTextContent('Signalement envoyé.');
    expect(screen.getByText('Signalé')).toBeInTheDocument();
    expect(localStorage.getItem('reported:user:other-1')).toBe('true');
  });

  it('marks as already reported without a toast when onAlreadyReported fires', async () => {
    mockAuthUser('me');
    renderProfile(makeProfile());

    fireEvent.click(screen.getByText('Signaler'));
    fireEvent.click(screen.getByText('Déjà signalé'));

    expect(await screen.findByText('Signalé')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(localStorage.getItem('reported:user:other-1')).toBe('true');
  });

  it('disables the report button when the user was already reported (persisted in localStorage)', () => {
    localStorage.setItem('reported:user:other-1', 'true');
    mockAuthUser('me');
    renderProfile(makeProfile());

    expect(screen.getByRole('button', { name: 'Signalé' })).toBeDisabled();
  });
});

describe('ProfileViewMode - content sections', () => {
  it('renders participant reviews when present', () => {
    mockAuthUser('me');
    renderProfile(
      makeProfile({
        participantReviews: [
          { id: 'r1', rating: 5, comment: 'Sympa', createdAt: '2026-01-01T00:00:00.000Z', reviewerName: 'carol' },
        ],
      }),
    );

    expect(screen.getByText('Avis reçus (1)')).toBeInTheDocument();
    expect(screen.getByText('Par carol')).toBeInTheDocument();
    expect(screen.getByText('Sympa')).toBeInTheDocument();
  });

  it('does not render the reviews section when there are none', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ participantReviews: [] }));

    expect(screen.queryByText(/Avis reçus/)).not.toBeInTheDocument();
  });

  it('renders participated events as links', () => {
    mockAuthUser('me');
    renderProfile(
      makeProfile({
        participatedEvents: [
          { id: 'e1', title: 'Concert de jazz', eventDate: '2026-05-01T00:00:00.000Z', location: 'Paris', type: 'PROFESSIONAL', category: 'MUSIC' },
        ],
      }),
    );

    expect(screen.getByRole('link', { name: /Concert de jazz/ })).toHaveAttribute(
      'href',
      '/events/e1',
    );
  });

  it('formats an invalid or missing createdAt date as N/A', () => {
    mockAuthUser('me');
    renderProfile(makeProfile({ createdAt: 'not-a-date' }));

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
