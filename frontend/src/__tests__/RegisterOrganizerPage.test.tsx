import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterOrganizerPage } from '../pages/RegisterOrganizerPage';
import { authService } from '../services/auth.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/auth.service', () => ({
  authService: {
    registerOrganizer: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterOrganizerPage />
    </MemoryRouter>,
  );
}

function fillForm({
  username = 'alice',
  email = 'alice@example.com',
  password = 'password123',
  confirmPassword = password,
  organizationName,
  confirmOrganizer = true,
}: {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  organizationName?: string;
  confirmOrganizer?: boolean;
} = {}) {
  fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/), { target: { value: username } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: email } });
  if (organizationName !== undefined) {
    fireEvent.change(screen.getByLabelText(/Nom de votre organisation/), {
      target: { value: organizationName },
    });
  }
  fireEvent.change(screen.getByLabelText(/^Mot de passe/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/), {
    target: { value: confirmPassword },
  });
  if (confirmOrganizer) {
    fireEvent.click(screen.getByLabelText(/Je confirme être un organisateur/));
  }
}

describe('RegisterOrganizerPage - rendering', () => {
  it('renders all fields including the organizer confirmation checkbox', () => {
    renderPage();

    expect(screen.getByLabelText(/Nom d'utilisateur/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom de votre organisation/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Je confirme être un organisateur/)).not.toBeChecked();
    expect(
      screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }),
    ).toBeInTheDocument();
  });

  it('links to the user registration page for people who only want to buy tickets', () => {
    renderPage();

    expect(
      screen.getAllByRole('link', { name: /compte utilisateur|Créer un compte utilisateur/ })[0],
    ).toHaveAttribute('href', '/register');
  });
});

describe('RegisterOrganizerPage - client-side validation', () => {
  it('rejects mismatched passwords', () => {
    renderPage();
    fillForm({ password: 'password123', confirmPassword: 'other12345' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
    expect(authService.registerOrganizer).not.toHaveBeenCalled();
  });

  it('rejects a short password', () => {
    renderPage();
    fillForm({ password: 'short1', confirmPassword: 'short1' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    expect(
      screen.getByText('Le mot de passe doit contenir au moins 8 caractères'),
    ).toBeInTheDocument();
  });

  it('rejects an invalid username', () => {
    renderPage();
    fillForm({ username: 'ab' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    expect(
      screen.getByText("Le nom d'utilisateur doit contenir au moins 3 caractères"),
    ).toBeInTheDocument();
  });

  it('requires confirming organizer status even with otherwise valid data', () => {
    renderPage();
    fillForm({ confirmOrganizer: false });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    expect(
      screen.getByText("Vous devez confirmer être un organisateur d'événement"),
    ).toBeInTheDocument();
    expect(authService.registerOrganizer).not.toHaveBeenCalled();
  });
});

describe('RegisterOrganizerPage - submission', () => {
  it('registers as an organizer with the trimmed username/org name and redirects to /login', async () => {
    vi.mocked(authService.registerOrganizer).mockResolvedValue({
      user: { id: 'u1', username: 'alice', email: 'alice@example.com', role: 'ORGANIZER' },
      accessToken: 'a',
      refreshToken: 'r',
    });

    renderPage();
    fillForm({ organizationName: '  Mon Asso  ' });
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    await waitFor(() =>
      expect(authService.registerOrganizer).toHaveBeenCalledWith({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        organizationName: 'Mon Asso',
        confirmOrganizer: true,
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { registered: true } });
  });

  it('sends undefined organizationName when left blank', async () => {
    vi.mocked(authService.registerOrganizer).mockResolvedValue({
      user: { id: 'u1', username: 'alice', email: 'alice@example.com', role: 'ORGANIZER' },
      accessToken: 'a',
      refreshToken: 'r',
    });

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    await waitFor(() =>
      expect(authService.registerOrganizer).toHaveBeenCalledWith(
        expect.objectContaining({ organizationName: undefined }),
      ),
    );
  });

  it('shows the backend error message on failure', async () => {
    vi.mocked(authService.registerOrganizer).mockRejectedValue({
      response: { data: { message: 'Cet email est déjà utilisé' } },
    });

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    expect(await screen.findByText('Cet email est déjà utilisé')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a default error message', async () => {
    vi.mocked(authService.registerOrganizer).mockRejectedValue(new Error('boom'));

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    expect(await screen.findByText("Erreur lors de l'inscription")).toBeInTheDocument();
  });

  it('shows a loading state while the request is in flight', async () => {
    let resolveRegister: (value: unknown) => void = () => {};
    vi.mocked(authService.registerOrganizer).mockReturnValue(
      new Promise((resolve) => { resolveRegister = resolve; }),
    );

    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire en tant qu'organisateur" }));

    expect(await screen.findByRole('button', { name: 'Inscription...' })).toBeDisabled();

    resolveRegister({ user: {}, accessToken: 'a', refreshToken: 'r' });
  });
});
