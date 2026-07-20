import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocket } from '../hooks/useSocket';
import { socketService } from '../services/socketService';
import { useAuth } from '../utils/useAuth';
import type { User } from '../types/auth';

vi.mock('../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
  },
}));

vi.mock('../utils/useAuth', () => ({
  useAuth: vi.fn(),
}));

const user: User = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'USER',
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('useSocket', () => {
  it('does nothing while the session is not ready yet', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isSessionReady: false,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useSocket());

    expect(socketService.connect).not.toHaveBeenCalled();
    expect(socketService.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects when the session is ready but there is no authenticated user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useSocket());

    expect(socketService.disconnect).toHaveBeenCalledTimes(1);
    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it('connects using the stored access token when a user is authenticated', async () => {
    sessionStorage.setItem('accessToken', 'token-123');
    vi.mocked(socketService.connect).mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useSocket());

    await waitFor(() => expect(socketService.connect).toHaveBeenCalledWith('token-123'));
    expect(socketService.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects instead of connecting when there is a user but no stored token', () => {
    vi.mocked(useAuth).mockReturnValue({
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    renderHook(() => useSocket());

    expect(socketService.disconnect).toHaveBeenCalledTimes(1);
    expect(socketService.connect).not.toHaveBeenCalled();
  });

  it('exposes the current connection status from socketService', () => {
    vi.mocked(socketService.isConnected).mockReturnValue(true);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isSessionReady: false,
      setUser: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useSocket());

    expect(result.current.isConnected).toBe(true);
  });
});
