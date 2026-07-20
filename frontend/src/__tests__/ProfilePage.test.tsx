import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilePage } from '../pages/ProfilePage';
import { profileService } from '../services/profile.service';
import { socketService } from '../services/socketService';
import { useAuth } from '../utils/useAuth';
import type { UserProfile } from '../types/auth';
import type { PublicUserProfile } from '../services/profile.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/profile.service', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getUserPublicProfile: vi.fn(),
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

vi.mock('../components/upload/AvatarUpload', () => ({
  AvatarUpload: ({
    onUploadSuccess,
    onDelete,
  }: {
    onUploadSuccess: (url: string) => void;
    onDelete?: () => void;
  }) => (
    <div data-testid="avatar-upload">
      <button type="button" onClick={() => onUploadSuccess('https://cdn.example.com/avatar.png')}>
        Uploader
      </button>
      <button type="button" onClick={() => onDelete?.()}>
        Supprimer l&apos;avatar
      </button>
    </div>
  ),
}));

vi.mock('../components/profile/ProfileViewMode', () => ({
  ProfileViewMode: ({
    profile,
    userId,
  }: {
    profile: { username?: string | null };
    userId: string;
  }) => (
    <div data-testid="profile-view-mode">
      Vue publique de {profile.username} ({userId})
    </div>
  ),
}));

vi.mock('../components/profile/ProfileStatsRow', () => ({
  ProfileStatsRow: () => <div data-testid="profile-stats-row" />,
}));

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'me',
    username: 'alice',
    email: 'alice@example.com',
    role: 'USER',
    avatarUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    stats: {
      ordersCount: 3,
      reviewsCount: 1,
      eventsOrganized: 0,
    },
    ...overrides,
  };
}

function makePublicProfile(overrides: Partial<PublicUserProfile> = {}): PublicUserProfile {
  return {
    id: 'other-1',
    username: 'bob',
    email: 'bob@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    participatedEvents: [],
    participantReviews: [],
    stats: { averageRating: null, totalReviews: 0, participatedEventsCount: 0 },
    ...overrides,
  };
}

function mockAuthUser(id: string | null, extra: Partial<{ logout: () => Promise<void> }> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: id ? { id, username: 'me', email: 'me@example.com', role: 'USER' } : null,
    isAuthenticated: !!id,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: extra.logout ?? vi.fn().mockResolvedValue(undefined),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

function renderPage(path = '/profile') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProfilePage - own profile: loading and errors', () => {
  it('shows a loading state initially', () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an error message when loading the profile fails', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText('Impossible de charger le profil')).toBeInTheDocument();
  });
});

describe('ProfilePage - own profile: content', () => {
  it('shows the display name, email, role and stats', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());

    renderPage();

    expect(await screen.findByRole('heading', { name: 'alice' })).toBeInTheDocument();
    expect(screen.getAllByText('alice@example.com').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Utilisateur').length).toBeGreaterThan(0);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the stats row when follower/following/friend counts are present', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(
      makeProfile({ followersCount: 5, followingCount: 2, friendsCount: 1 }),
    );

    renderPage();

    expect(await screen.findByTestId('profile-stats-row')).toBeInTheDocument();
  });

  it('does not render the stats row when no follow counts are present', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());

    renderPage();

    await screen.findByRole('heading', { name: 'alice' });
    expect(screen.queryByTestId('profile-stats-row')).not.toBeInTheDocument();
  });

  it('uploads a new avatar and shows a success message', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());
    vi.mocked(profileService.updateProfile).mockResolvedValue({
      id: 'me',
      username: 'alice',
      email: 'alice@example.com',
      role: 'USER',
    });
    sessionStorage.setItem('user', JSON.stringify({ id: 'me', username: 'alice' }));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Uploader' }));

    await waitFor(() =>
      expect(profileService.updateProfile).toHaveBeenCalledWith({
        avatarUrl: 'https://cdn.example.com/avatar.png',
      }),
    );
    expect(await screen.findByText('Photo de profil mise à jour')).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem('user')!).avatarUrl).toBe(
      'https://cdn.example.com/avatar.png',
    );
  });

  it('shows an error message when the avatar upload fails', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());
    vi.mocked(profileService.updateProfile).mockRejectedValue(new Error('boom'));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Uploader' }));

    expect(
      await screen.findByText('Erreur lors de la mise à jour de la photo'),
    ).toBeInTheDocument();
  });

  it('deletes the avatar and shows a success message', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile({ avatarUrl: 'https://cdn.example.com/old.png' }));
    vi.mocked(profileService.updateProfile).mockResolvedValue({
      id: 'me',
      username: 'alice',
      email: 'alice@example.com',
      role: 'USER',
    });

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Supprimer l'avatar" }));

    await waitFor(() =>
      expect(profileService.updateProfile).toHaveBeenCalledWith({ avatarUrl: '' }),
    );
    expect(await screen.findByText('Photo de profil supprimée')).toBeInTheDocument();
  });

  it('navigates to quick-access destinations', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Mes billets' }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-tickets');

    fireEvent.click(screen.getByRole('button', { name: 'Commandes' }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-orders');

    fireEvent.click(screen.getByRole('button', { name: 'À venir' }));
    expect(mockNavigate).toHaveBeenCalledWith('/my-upcoming-events');

    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('logs out after confirming the logout dialog', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    mockAuthUser('me', { logout });
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Se déconnecter' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Oui' }));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
  });

  it('cancels the logout confirmation without logging out', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    mockAuthUser('me', { logout });
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Se déconnecter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('refetches the profile when a followsChanged socket event fires', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());

    renderPage();
    await screen.findByRole('heading', { name: 'alice' });

    const handler = vi
      .mocked(socketService.on)
      .mock.calls.find(([event]) => event === 'followsChanged')?.[1] as () => void;
    expect(handler).toBeInstanceOf(Function);

    const callsBeforeEvent = vi.mocked(profileService.getProfile).mock.calls.length;
    handler();

    await waitFor(() =>
      expect(profileService.getProfile).toHaveBeenCalledTimes(callsBeforeEvent + 1),
    );
  });
});

describe('ProfilePage - viewing another user profile', () => {
  it('fetches and renders the public profile for a different user id', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());
    vi.mocked(profileService.getUserPublicProfile).mockResolvedValue(makePublicProfile());

    renderPage('/profile/other-1');

    expect(await screen.findByTestId('profile-view-mode')).toBeInTheDocument();
    expect(screen.getByText(/Vue publique de bob \(other-1\)/)).toBeInTheDocument();
  });

  it('shows an error when the public profile fails to load', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());
    vi.mocked(profileService.getUserPublicProfile).mockRejectedValue(new Error('boom'));

    renderPage('/profile/other-1');

    expect(await screen.findByText('Profil introuvable')).toBeInTheDocument();
  });

  it('redirects to /profile when the route id matches the logged-in user', async () => {
    mockAuthUser('me');
    vi.mocked(profileService.getProfile).mockResolvedValue(makeProfile());

    renderPage('/profile/me');

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true }),
    );
  });
});
