import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../utils/useAuth';
import type { User } from '../types/auth';

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

function renderAt(path: string, roles?: string[]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/private"
          element={
            <ProtectedRoute roles={roles}>
              <div>Contenu protégé</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Page de connexion</div>} />
        <Route path="/dashboard" element={<div>Tableau de bord</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated user to /login', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/private');

    expect(screen.getByText('Page de connexion')).toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('renders the protected content for an authenticated user', () => {
    const user: User = { id: 'u1', username: 'alice', email: 'a@a.com', role: 'USER' };
    vi.mocked(useAuth).mockReturnValue({
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/private');

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('redirects to /dashboard when the user role is not in the allowed list', () => {
    const user: User = { id: 'u1', username: 'alice', email: 'a@a.com', role: 'USER' };
    vi.mocked(useAuth).mockReturnValue({
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/private', ['ADMIN']);

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('renders the protected content when the user role is allowed', () => {
    const user: User = { id: 'u1', username: 'alice', email: 'a@a.com', role: 'ADMIN' };
    vi.mocked(useAuth).mockReturnValue({
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/private', ['ADMIN']);

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('renders the protected content when no roles are required, regardless of role', () => {
    const user: User = { id: 'u1', username: 'alice', email: 'a@a.com', role: 'USER' };
    vi.mocked(useAuth).mockReturnValue({
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/private', []);

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });
});
