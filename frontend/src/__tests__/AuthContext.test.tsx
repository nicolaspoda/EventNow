import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useContext } from 'react';
import { AuthProvider } from '../utils/AuthContext';
import { AuthContext } from '../utils/AuthContextInstance';
import { authService } from '../services/auth.service';
import { api } from '../services/api';
import type { User } from '../types/auth';

vi.mock('../services/auth.service', () => ({
  authService: {
    getUser: vi.fn(),
    saveAuthData: vi.fn(),
    clearSession: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

const user: User = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'USER',
};

function Consumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) return null;
  return (
    <div>
      <span data-testid="ready">{String(ctx.isSessionReady)}</span>
      <span data-testid="authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="username">{ctx.user?.username ?? 'none'}</span>
      <button onClick={() => ctx.setUser(user)}>login</button>
      <button onClick={() => void ctx.logout()}>logout</button>
    </div>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AuthProvider', () => {
  it('renders children immediately when there is no stored user', async () => {
    vi.mocked(authService.getUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    await waitFor(() => expect(api.post).not.toHaveBeenCalled());
  });

  it('shows a loading state then renders children once the initial refresh succeeds', async () => {
    vi.mocked(authService.getUser).mockReturnValue(user);
    sessionStorage.setItem('refreshToken', 'refresh-token');
    vi.mocked(api.post).mockResolvedValue({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    expect(screen.queryByTestId('ready')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-token' });
    expect(authService.saveAuthData).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      user,
    });
    expect(screen.getByTestId('username')).toHaveTextContent('alice');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('clears the session and logs the user out when the initial refresh fails', async () => {
    vi.mocked(authService.getUser).mockReturnValue(user);
    sessionStorage.setItem('refreshToken', 'refresh-token');
    vi.mocked(api.post).mockRejectedValue(new Error('expired'));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    expect(authService.clearSession).toHaveBeenCalled();
    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('becomes ready without calling the api when a user exists but there is no refresh token', async () => {
    vi.mocked(authService.getUser).mockReturnValue(user);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('updates the context user when setUser is called (login)', async () => {
    vi.mocked(authService.getUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    screen.getByText('login').click();

    expect(await screen.findByTestId('username')).toHaveTextContent('alice');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('logs out: calls authService.logout and clears the context user', async () => {
    vi.mocked(authService.getUser).mockReturnValue(null);
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    screen.getByText('login').click();
    expect(await screen.findByTestId('username')).toHaveTextContent('alice');

    screen.getByText('logout').click();

    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('none'));
    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('silently refreshes the access token on a 14-minute interval while logged in', async () => {
    vi.mocked(authService.getUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    // Fake timers must be installed before the login-triggered effect calls
    // setInterval, otherwise that interval keeps running on the real clock.
    vi.useFakeTimers();
    sessionStorage.setItem('refreshToken', 'refresh-token');
    vi.mocked(api.post).mockResolvedValue({
      data: { accessToken: 'rotated-access', refreshToken: 'rotated-refresh' },
    });

    act(() => {
      screen.getByText('login').click();
    });
    expect(screen.getByTestId('username')).toHaveTextContent('alice');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });
    vi.useRealTimers();

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-token' });
    expect(authService.saveAuthData).toHaveBeenCalledWith({
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
      user,
    });
  });

  it('logs the user out when the periodic refresh fails', async () => {
    vi.mocked(authService.getUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    vi.useFakeTimers();
    sessionStorage.setItem('refreshToken', 'refresh-token');
    vi.mocked(api.post).mockRejectedValue(new Error('expired'));

    act(() => {
      screen.getByText('login').click();
    });
    expect(screen.getByTestId('username')).toHaveTextContent('alice');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 1000);
    });
    vi.useRealTimers();

    expect(screen.getByTestId('username')).toHaveTextContent('none');
    expect(authService.clearSession).toHaveBeenCalled();
  });

  it('refreshes on tab focus, throttled to once every 2 minutes', async () => {
    vi.mocked(authService.getUser).mockReturnValue(null);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    screen.getByText('login').click();
    expect(await screen.findByTestId('username')).toHaveTextContent('alice');

    sessionStorage.setItem('refreshToken', 'refresh-token');
    vi.mocked(api.post).mockResolvedValue({
      data: { accessToken: 'rotated-access', refreshToken: 'rotated-refresh' },
    });

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));

    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(api.post).toHaveBeenCalledTimes(1);
  });
});
