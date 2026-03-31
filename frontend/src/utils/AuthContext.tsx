import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { User } from '../types/auth';
import { authService } from '../services/auth.service';
import { api } from '../services/api';
import { AuthContext } from './AuthContextInstance';

const ACCESS_TOKEN_TTL_MS = 14 * 60 * 1000; // 14 min (token backend = 15 min)
const REFRESH_ON_VISIBILITY_THROTTLE_MS = 2 * 60 * 1000; // max 1 refresh toutes les 2 min au focus

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [isSessionReady, setIsSessionReady] = useState<boolean>(() => !authService.getUser());
  const lastVisibilityRefreshRef = useRef<number>(0);
  const initialRefreshDoneRef = useRef(false);

  useEffect(() => {
    if (initialRefreshDoneRef.current) return;
    
    const initialUser = authService.getUser();
    const refreshToken = sessionStorage.getItem('refreshToken');
    
    if (!initialUser || !refreshToken) {
      queueMicrotask(() => setIsSessionReady(true));
      initialRefreshDoneRef.current = true;
      return;
    }
    
    api
      .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
      .then((res) => res.data)
      .then((data) => {
        authService.saveAuthData({ ...data, user: initialUser });
        setIsSessionReady(true);
        initialRefreshDoneRef.current = true;
      })
      .catch(() => {
        authService.clearSession();
        setUser(null);
        setIsSessionReady(true);
        initialRefreshDoneRef.current = true;
      });
  }, []);

  useEffect(() => {
    if (!user || !isSessionReady) return;

    const doRefresh = () => {
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (!refreshToken) return;
      api
        .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
        .then((res) => res.data)
        .then((data) => authService.saveAuthData({ ...data, user }))
        .catch(() => {
          authService.clearSession();
          setUser(null);
        });
    };

    const intervalId = setInterval(doRefresh, ACCESS_TOKEN_TTL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastVisibilityRefreshRef.current < REFRESH_ON_VISIBILITY_THROTTLE_MS) return;
      lastVisibilityRefreshRef.current = now;
      doRefresh();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, isSessionReady]);

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSessionReady,
        setUser,
        logout,
      }}
    >
      {!isSessionReady ? (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" aria-hidden />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
