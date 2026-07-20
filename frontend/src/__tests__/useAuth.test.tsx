import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useAuth } from '../utils/useAuth';
import { AuthContext } from '../utils/AuthContextInstance';
import type { AuthContextType } from '../utils/AuthContextInstance';
import type { User } from '../types/auth';

const user: User = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'USER',
};

describe('useAuth', () => {
  it('returns the current context value when used within an AuthProvider', () => {
    const value: AuthContextType = {
      user,
      isAuthenticated: true,
      isSessionReady: true,
      setUser: vi.fn(),
      logout: vi.fn(),
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('throws an explicit error when used outside of an AuthProvider', () => {
    const { result } = renderHook(() => {
      try {
        return { value: useAuth(), error: null };
      } catch (error) {
        return { value: null, error };
      }
    });

    expect(result.current.value).toBeNull();
    expect(result.current.error).toEqual(new Error('useAuth must be used within an AuthProvider'));
  });
});
