import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../pages/LoginPage';
import { authService } from '../services/auth.service';
import { useAuth } from '../utils/useAuth';

const mockNavigate = vi.fn();
let mockLocationState: unknown = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', state: mockLocationState }),
  };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockLocationState = null;
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isAuthenticated: false,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

function fillForm(email: string, password: string) {
  fireEvent.change(screen.getByLabelText(/Email ou nom d'utilisateur/), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/Mot de passe/), { target: { value: password } });
}

describe('LoginPage - rendering', () => {
  it('renders the login form fields', () => {
    renderPage();

    expect(screen.getByLabelText(/Email ou nom d'utilisateur/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('shows the warning message carried in location.state', () => {
    mockLocationState = { message: 'Votre session a expiré' };
    renderPage();

    expect(screen.getByText('Votre session a expiré')).toBeInTheDocument();
  });

  it('shows a success alert after a successful registration redirect', () => {
    mockLocationState = { registered: true };
    renderPage();

    expect(
      screen.getByText('Inscription réussie. Connectez-vous avec vos identifiants.'),
    ).toBeInTheDocument();
  });

  it('links to the registration page', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Inscrivez-vous' })).toHaveAttribute('href', '/register');
  });
});

describe('LoginPage - successful login', () => {
  const user = { id: 'u1', username: 'alice', email: 'alice@example.com', role: 'USER' };

  it('logs in, updates the auth context and redirects to /dashboard by default', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      user,
      accessToken: 'a',
      refreshToken: 'r',
    });
    const setUser = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isSessionReady: true,
      setUser,
      logout: vi.fn(),
    });

    renderPage();
    fillForm('alice@example.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() =>
      expect(authService.login).toHaveBeenCalledWith({
        email: 'alice@example.com',
        password: 'password123',
      }),
    );
    expect(setUser).toHaveBeenCalledWith(user);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('redirects to the original page when location.state.from is set', async () => {
    mockLocationState = { from: '/events/42' };
    vi.mocked(authService.login).mockResolvedValue({ user, accessToken: 'a', refreshToken: 'r' });

    renderPage();
    fillForm('alice@example.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/events/42', { replace: true }),
    );
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveLogin: (value: unknown) => void = () => {};
    vi.mocked(authService.login).mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));

    renderPage();
    fillForm('alice@example.com', 'password123');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('button', { name: 'Connexion...' })).toBeDisabled();

    resolveLogin({ user, accessToken: 'a', refreshToken: 'r' });
  });
});

describe('LoginPage - failed login', () => {
  it('shows the backend error message', async () => {
    vi.mocked(authService.login).mockRejectedValue({
      response: { data: { message: 'Compte désactivé' } },
    });

    renderPage();
    fillForm('alice@example.com', 'wrong-password');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Compte désactivé')).toBeInTheDocument();
  });

  it('falls back to the backend "error" field when there is no message', async () => {
    vi.mocked(authService.login).mockRejectedValue({
      response: { data: { error: 'Unauthorized' } },
    });

    renderPage();
    fillForm('alice@example.com', 'wrong-password');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Unauthorized')).toBeInTheDocument();
  });

  it('falls back to a default message when the error has no usable data', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('network down'));

    renderPage();
    fillForm('alice@example.com', 'wrong-password');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(
      await screen.findByText('Identifiant ou mot de passe incorrect'),
    ).toBeInTheDocument();
  });

  it('does not navigate or update the auth context on failure', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('boom'));
    const setUser = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isSessionReady: true,
      setUser,
      logout: vi.fn(),
    });

    renderPage();
    fillForm('alice@example.com', 'wrong-password');
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(setUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
