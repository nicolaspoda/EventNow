import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../services/auth.service';
import { api } from '../services/api';
import type { AuthResponse, LoginData, RegisterData, RegisterOrganizerData, User } from '../types/auth';

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const user: User = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'USER',
};

const authResponse: AuthResponse = {
  user,
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('authService.register', () => {
  it('posts the registration payload and saves the session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: authResponse });
    const data: RegisterData = { username: 'alice', email: 'alice@example.com', password: 'pw' };

    const result = await authService.register(data);

    expect(api.post).toHaveBeenCalledWith('/auth/register', data);
    expect(result).toEqual(authResponse);
    expect(sessionStorage.getItem('accessToken')).toBe('access-token');
    expect(sessionStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(sessionStorage.getItem('user')).toBe(JSON.stringify(user));
  });
});

describe('authService.registerOrganizer', () => {
  it('posts the organizer registration payload and saves the session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: authResponse });
    const data: RegisterOrganizerData = {
      username: 'alice',
      email: 'alice@example.com',
      password: 'pw',
      confirmOrganizer: true,
    };

    const result = await authService.registerOrganizer(data);

    expect(api.post).toHaveBeenCalledWith('/auth/register-organizer', data);
    expect(result).toEqual(authResponse);
    expect(sessionStorage.getItem('accessToken')).toBe('access-token');
  });
});

describe('authService.searchUsersByUsername', () => {
  it('returns an empty array without calling the api for a blank query', async () => {
    const result = await authService.searchUsersByUsername('   ');

    expect(result).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('trims and encodes the query, using the default limit', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await authService.searchUsersByUsername('  ali ce  ');

    expect(api.get).toHaveBeenCalledWith('/auth/users/search?q=ali%20ce&limit=15');
  });

  it('passes a custom limit through', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await authService.searchUsersByUsername('ali', 5);

    expect(api.get).toHaveBeenCalledWith('/auth/users/search?q=ali&limit=5');
  });
});

describe('authService.login', () => {
  it('posts credentials and saves the session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: authResponse });
    const data: LoginData = { email: 'alice@example.com', password: 'pw' };

    const result = await authService.login(data);

    expect(api.post).toHaveBeenCalledWith('/auth/login', data);
    expect(result).toEqual(authResponse);
    expect(sessionStorage.getItem('accessToken')).toBe('access-token');
  });
});

describe('authService.getProfile', () => {
  it('fetches the current user profile', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: user });

    const result = await authService.getProfile();

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(user);
  });
});

describe('authService.logout', () => {
  it('posts the refresh token and clears the session when one exists', async () => {
    sessionStorage.setItem('refreshToken', 'refresh-token');
    sessionStorage.setItem('accessToken', 'access-token');
    sessionStorage.setItem('user', JSON.stringify(user));
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await authService.logout();

    expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-token' });
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  it('clears the session without calling the api when there is no refresh token', async () => {
    await authService.logout();

    expect(api.post).not.toHaveBeenCalled();
  });

  it('clears the session even if the logout request fails', async () => {
    sessionStorage.setItem('refreshToken', 'refresh-token');
    vi.mocked(api.post).mockRejectedValue(new Error('network error'));

    await authService.logout();

    expect(sessionStorage.getItem('refreshToken')).toBeNull();
  });
});

describe('authService session helpers', () => {
  it('clearSession removes all session keys', () => {
    sessionStorage.setItem('accessToken', 'a');
    sessionStorage.setItem('refreshToken', 'r');
    sessionStorage.setItem('user', '{}');

    authService.clearSession();

    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('refreshToken')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });

  it('saveAuthData stores tokens and the serialized user', () => {
    authService.saveAuthData(authResponse);

    expect(sessionStorage.getItem('accessToken')).toBe('access-token');
    expect(sessionStorage.getItem('refreshToken')).toBe('refresh-token');
    expect(sessionStorage.getItem('user')).toBe(JSON.stringify(user));
  });

  it('getUser returns the parsed user or null', () => {
    expect(authService.getUser()).toBeNull();

    sessionStorage.setItem('user', JSON.stringify(user));
    expect(authService.getUser()).toEqual(user);
  });

  it('getAccessToken returns the stored token or null', () => {
    expect(authService.getAccessToken()).toBeNull();

    sessionStorage.setItem('accessToken', 'a');
    expect(authService.getAccessToken()).toBe('a');
  });

  it('isAuthenticated reflects the presence of an access token', () => {
    expect(authService.isAuthenticated()).toBe(false);

    sessionStorage.setItem('accessToken', 'a');
    expect(authService.isAuthenticated()).toBe(true);
  });
});
