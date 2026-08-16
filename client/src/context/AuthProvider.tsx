import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './auth-context';
import type { AuthStatus } from './auth-context';
import * as authService from '../services/auth.service';
import type { User } from '../types/user.types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    if (location.pathname === '/auth/callback') {
      return;
    }

    async function restoreSession() {
      try {
        const result = await authService.refreshSession();
        if (cancelled) return;
        setUser(result.user);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      }
    }

    restoreSession();

    function onUnauthorized() {
      setUser(null);
      setStatus('unauthenticated');
    }

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:unauthorized', onUnauthorized);
    };
  }, [location.pathname]);

  const login = async (email: string, password: string): Promise<User> => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setStatus('authenticated');
    return result.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      setUser,
      setStatus,
    }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
