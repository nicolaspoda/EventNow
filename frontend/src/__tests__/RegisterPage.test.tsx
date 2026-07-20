import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterPage } from '../pages/RegisterPage';
import { authService } from '../services/auth.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

function fillForm({
  username = 'alice',
  email = 'alice@example.com',
  password = 'password123',
  confirmPassword = password,
}: { username?: string; email?: string; password?: string; confirmPassword?: string } = {}) {
  fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/), { target: { value: username } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^Mot de passe/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/), {
    target: { value: confirmPassword },
  });
}

describe('RegisterPage - rendering', () => {
  it('renders all form fields', () => {
    renderPage();

    expect(screen.getByLabelText(/Nom d'utilisateur/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmer le mot de passe/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "S'inscrire" })).toBeInTheDocument();
  });

  it('strips invalid characters from the username as the user types', () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/), {
      target: { value: 'alice!! 123' },
    });

    expect(screen.getByLabelText(/Nom d'utilisateur/)).toHaveValue('alice123');
  });

  it('links to the organizer registration and login pages', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'Créer un compte organisateur' })).toHaveAttribute(
      'href',
      '/register-organizer',
    );
    expect(screen.getByRole('link', { name: 'Connectez-vous' })).toHaveAttribute('href', '/login');
  });
});

describe('RegisterPage - client-side validation', () => {
  it('rejects mismatched passwords without calling the service', () => {
    renderPage();
    fillForm({ password: 'password123', confirmPassword: 'different123' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than 8 characters', () => {
    renderPage();
    fillForm({ password: 'short1', confirmPassword: 'short1' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(
      screen.getByText('Le mot de passe doit contenir au moins 8 caractères'),
    ).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('rejects a username shorter than 3 characters', () => {
    renderPage();
    fillForm({ username: 'ab' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(
      screen.getByText("Le nom d'utilisateur doit contenir au moins 3 caractères"),
    ).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('rejects an empty username', () => {
    renderPage();
    fillForm({ username: '' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(screen.getByText("Le nom d'utilisateur est obligatoire")).toBeInTheDocument();
  });
});

describe('RegisterPage - submission', () => {
  it('registers with the trimmed username and redirects to /login with the registered flag', async () => {
    vi.mocked(authService.register).mockResolvedValue({
      user: { id: 'u1', username: 'alice', email: 'alice@example.com', role: 'USER' },
      accessToken: 'a',
      refreshToken: 'r',
    });

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    await waitFor(() =>
      expect(authService.register).toHaveBeenCalledWith({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { registered: true } });
  });

  it('shows the backend error message on failure', async () => {
    vi.mocked(authService.register).mockRejectedValue({
      response: { data: { message: 'Cet email est déjà utilisé' } },
    });

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText('Cet email est déjà utilisé')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a default error message', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error('network down'));

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByText("Erreur lors de l'inscription")).toBeInTheDocument();
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveRegister: (value: unknown) => void = () => {};
    vi.mocked(authService.register).mockReturnValue(
      new Promise((resolve) => { resolveRegister = resolve; }),
    );

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(await screen.findByRole('button', { name: 'Inscription...' })).toBeDisabled();

    resolveRegister({ user: {}, accessToken: 'a', refreshToken: 'r' });
  });
});
