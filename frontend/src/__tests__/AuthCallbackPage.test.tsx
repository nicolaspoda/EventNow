import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import { api } from '../services/api';
import { useAuth } from '../utils/useAuth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isAuthenticated: false,
    isSessionReady: true,
    setUser: vi.fn(),
    logout: vi.fn(),
  });
});

function renderPage(search = '?code=abc123') {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <AuthCallbackPage />
    </MemoryRouter>,
  );
}

describe('AuthCallbackPage', () => {
  it('redirects to /login when there is no code in the URL', async () => {
    renderPage('');

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }),
    );
    expect(api.post).not.toHaveBeenCalled();
  });

  it('exchanges the code, stores the session and navigates to /dashboard', async () => {
    const setUser = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isSessionReady: true,
      setUser,
      logout: vi.fn(),
    });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        user: { id: 'u1', email: 'me@example.com', role: 'USER', username: 'me' },
      },
    });

    renderPage();

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/google/exchange', { code: 'abc123' }),
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }),
    );
    expect(sessionStorage.getItem('accessToken')).toBe('access-1');
    expect(sessionStorage.getItem('refreshToken')).toBe('refresh-1');
    expect(JSON.parse(sessionStorage.getItem('user')!)).toEqual({
      id: 'u1',
      email: 'me@example.com',
      role: 'USER',
      username: 'me',
    });
    expect(setUser).toHaveBeenCalledWith({
      id: 'u1',
      email: 'me@example.com',
      role: 'USER',
      username: 'me',
    });
  });

  it('redirects to /login when the exchange fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'));

    renderPage();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }),
    );
    expect(sessionStorage.getItem('accessToken')).toBeNull();
  });
});
