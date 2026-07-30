import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserPublicProfilePage from '../pages/UserPublicProfilePage';
import { profileService } from '../services/profile.service';
import { followService } from '../services/followService';
import { useAuth } from '../utils/useAuth';
import type { PublicUserProfile } from '../services/profile.service';

vi.mock('../services/profile.service', () => ({
  profileService: {
    getUserPublicProfile: vi.fn(),
  },
}));

vi.mock('../services/followService', () => ({
  followService: {
    follow: vi.fn(),
    unfollow: vi.fn(),
    getFollowers: vi.fn().mockResolvedValue([]),
    getFollowing: vi.fn().mockResolvedValue([]),
    getFriends: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/socketService', () => ({
  socketService: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../components/ReportModal', () => ({
  default: ({
    isOpen,
    onSuccess,
    onAlreadyReported,
  }: {
    isOpen: boolean;
    onSuccess: (msg: string) => void;
    onAlreadyReported: () => void;
  }) =>
    isOpen ? (
      <div data-testid="report-modal">
        <button onClick={() => onSuccess('Signalement envoyé.')}>Confirmer signalement</button>
        <button onClick={onAlreadyReported}>Déjà signalé</button>
      </div>
    ) : null,
}));

function makeProfile(overrides: Partial<PublicUserProfile> = {}): PublicUserProfile {
  return {
    id: 'other-1',
    username: 'bob',
    email: 'bob@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    isFollowing: false,
    isFriend: false,
    followersCount: 3,
    followingCount: 2,
    friendsCount: 1,
    participatedEvents: [],
    participantReviews: [],
    stats: { averageRating: null, totalReviews: 0, participatedEventsCount: 5 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
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

function renderPage(userId = 'other-1') {
  return render(
    <MemoryRouter initialEntries={[`/user/${userId}/profile`]}>
      <Routes>
        <Route path="/user/:userId/profile" element={<UserPublicProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UserPublicProfilePage - loading and errors', () => {
  it('shows a loading state initially', () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the backend error message on failure', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockRejectedValue({
      response: { data: { message: 'Profil privé' } },
    });

    renderPage();

    expect(await screen.findByText('Profil privé')).toBeInTheDocument();
  });

  it('falls back to a default error message', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText('Erreur lors du chargement du profil')).toBeInTheDocument();
  });
});

describe('UserPublicProfilePage - content', () => {
  it('shows the display name, member-since date and stats', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(makeProfile());

    renderPage();

    expect(await screen.findByRole('heading', { name: 'bob' })).toBeInTheDocument();
    expect(screen.getByText(/Membre depuis/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not show follow/report actions on your own profile', async () => {
    mockAuthUser('other-1');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(makeProfile());

    renderPage('other-1');

    await screen.findByRole('heading', { name: 'bob' });
    expect(screen.queryByRole('button', { name: 'Suivre' })).not.toBeInTheDocument();
    expect(screen.queryByText('Signaler')).not.toBeInTheDocument();
  });

  it('follows the profile owner and refreshes the profile', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(
      makeProfile({ isFollowing: false }),
    );
    vi.mocked(followService.follow).mockResolvedValue(undefined as never);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Suivre' }));

    await waitFor(() => expect(followService.follow).toHaveBeenCalledWith('other-1'));
    await waitFor(() => expect(profileService.getUserPublicProfile).toHaveBeenCalledTimes(2));
  });

  it('confirms and unfollows the profile owner', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(
      makeProfile({ isFollowing: true, isFriend: false }),
    );
    vi.mocked(followService.unfollow).mockResolvedValue(undefined as never);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Ne plus suivre' }));
    expect(
      screen.getByText('Se désabonner ? Vous ne verrez plus les publications de cette personne.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Se désabonner' }));

    await waitFor(() => expect(followService.unfollow).toHaveBeenCalledWith('other-1'));
  });

  it('shows "Amis" for a mutual friend', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(
      makeProfile({ isFollowing: true, isFriend: true }),
    );

    renderPage();

    expect(await screen.findByText('Amis')).toBeInTheDocument();
  });

  it('opens the report modal and shows a success toast', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(makeProfile());

    renderPage();
    fireEvent.click(await screen.findByText('Signaler'));
    fireEvent.click(screen.getByText('Confirmer signalement'));

    expect(await screen.findByText('Signalement envoyé.')).toBeInTheDocument();
    expect(screen.getByText('Signalé')).toBeInTheDocument();
    expect(localStorage.getItem('reported:user:other-1')).toBe('true');
  });

  it('renders participant reviews and participated events when present', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(
      makeProfile({
        participantReviews: [
          { id: 'r1', rating: 5, comment: 'Sympa', createdAt: '2026-01-01T00:00:00.000Z', reviewerName: 'carol' },
        ],
        participatedEvents: [
          { id: 'e1', title: 'Concert de jazz', eventDate: '2026-05-01T00:00:00.000Z', location: 'Paris', type: 'PROFESSIONAL', category: 'MUSIC' },
        ],
      }),
    );

    renderPage();

    expect(await screen.findByText('Avis reçus (1)')).toBeInTheDocument();
    expect(screen.getByText('Par carol')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Concert de jazz/ })).toHaveAttribute(
      'href',
      '/events/e1',
    );
  });

  it('shows an empty-activity message when there is nothing to show', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(makeProfile());

    renderPage();

    expect(await screen.findByText('Aucune activité pour le moment')).toBeInTheDocument();
  });
});
