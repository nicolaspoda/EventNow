import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcceptStaffInvitationPage } from '../pages/AcceptStaffInvitationPage';
import { staffInvitationsService } from '../services/staffInvitationsService';
import { authService } from '../services/auth.service';
import { useAuth } from '../utils/useAuth';
import type { StaffInvitation } from '../services/staffInvitationsService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/staffInvitationsService', () => ({
  staffInvitationsService: {
    getByToken: vi.fn(),
    accept: vi.fn(),
    decline: vi.fn(),
  },
}));

vi.mock('../services/auth.service', () => ({
  authService: {
    saveAuthData: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

function makeInvitation(overrides: Partial<StaffInvitation> = {}): StaffInvitation {
  return {
    id: 'inv1',
    email: 'staff@example.com',
    token: 'tok-123',
    status: 'PENDING' as never,
    expiresAt: '2026-12-31T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    invitedBy: { id: 'org1', email: 'org@example.com', username: 'orga' } as never,
    event: { id: 'e1', title: 'Concert de jazz', eventDate: '2026-06-15T20:00:00.000Z' },
    ...overrides,
  };
}

function mockAuth(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isAuthenticated: false,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage(path = '/invite/staff/tok-123') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/invite/staff/:token" element={<AcceptStaffInvitationPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AcceptStaffInvitationPage - loading and errors', () => {
  it('shows a loading state before the invitation is fetched', () => {
    mockAuth();
    vi.mocked(staffInvitationsService.getByToken).mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByRole('status', { name: 'Chargement' })).toBeInTheDocument();
  });

  it('shows an error when the invitation cannot be found', async () => {
    mockAuth();
    vi.mocked(staffInvitationsService.getByToken).mockRejectedValue(new Error('boom'));

    renderPage();

    expect(await screen.findByText('Invitation introuvable ou expirée')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Retour à l'accueil" })).toHaveAttribute('href', '/');
  });
});

describe('AcceptStaffInvitationPage - logged out visitor', () => {
  it('shows login/register links carrying the invitation email', async () => {
    mockAuth();
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());

    renderPage();

    expect((await screen.findAllByText('staff@example.com')).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Créer un compte' })).toBeInTheDocument();
  });

  it('shows the inviter name and event title', async () => {
    mockAuth();
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());

    renderPage();

    expect(await screen.findByText('orga', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Concert de jazz')).toBeInTheDocument();
  });
});

describe('AcceptStaffInvitationPage - logged in with a different email', () => {
  it('shows a mismatch message instead of accept/decline buttons', async () => {
    mockAuth({
      isAuthenticated: true,
      user: { id: 'u2', email: 'someone-else@example.com', username: 'bob', role: 'USER' },
    });
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());

    renderPage();

    expect(await screen.findByText(/someone-else@example.com/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Accepter/ })).not.toBeInTheDocument();
  });
});

describe('AcceptStaffInvitationPage - logged in with the matching email', () => {
  const matchingUser = { id: 'u1', email: 'staff@example.com', username: 'staffuser', role: 'USER' };

  it('shows accept/decline buttons', async () => {
    mockAuth({ isAuthenticated: true, user: matchingUser });
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());

    renderPage();

    expect(await screen.findByRole('button', { name: "Accepter l'invitation" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeInTheDocument();
  });

  it('accepts the invitation, saves the session and navigates to /staff/scan', async () => {
    const setUser = vi.fn();
    mockAuth({ isAuthenticated: true, user: matchingUser, setUser });
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());
    vi.mocked(staffInvitationsService.accept).mockResolvedValue({
      message: 'ok',
      accessToken: 'a',
      refreshToken: 'r',
      user: matchingUser as never,
    });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Accepter l'invitation" }));

    await waitFor(() => expect(staffInvitationsService.accept).toHaveBeenCalledWith('tok-123'));
    expect(authService.saveAuthData).toHaveBeenCalledWith({
      accessToken: 'a',
      refreshToken: 'r',
      user: matchingUser,
    });
    expect(setUser).toHaveBeenCalledWith(matchingUser);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'staff-status-changed' }));
    expect(mockNavigate).toHaveBeenCalledWith('/staff/scan', { replace: true });
  });

  it('shows an error when accepting fails', async () => {
    mockAuth({ isAuthenticated: true, user: matchingUser });
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());
    vi.mocked(staffInvitationsService.accept).mockRejectedValue(new Error('boom'));

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: "Accepter l'invitation" }));

    expect(await screen.findByText("Impossible d'accepter l'invitation")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('declines the invitation after confirmation and navigates to /dashboard', async () => {
    mockAuth({ isAuthenticated: true, user: matchingUser });
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());
    vi.mocked(staffInvitationsService.decline).mockResolvedValue(undefined as never);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Refuser' }));

    await waitFor(() => expect(staffInvitationsService.decline).toHaveBeenCalledWith('tok-123'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('does not decline when the confirmation dialog is cancelled', async () => {
    mockAuth({ isAuthenticated: true, user: matchingUser });
    vi.mocked(staffInvitationsService.getByToken).mockResolvedValue(makeInvitation());
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Refuser' }));

    expect(staffInvitationsService.decline).not.toHaveBeenCalled();
  });
});
