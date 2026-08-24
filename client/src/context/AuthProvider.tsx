import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
  // Guards against StrictMode's double effect invocation so the session is
  // restored exactly once per page load.
  const restoreStartedRef = useRef(false);

  useEffect(() => {
    // Refresh tokens rotate on every use, so restoring more than once per
    // page load would race against ourselves. The OAuth callback page is
    // excluded: it completes sign-in and establishes the session itself.
    if (restoreStartedRef.current || window.location.pathname === '/auth/callback') {
      return;
    }
    restoreStartedRef.current = true;

    async function restoreSession() {
      try {
        const result = await authService.refreshSession();
        setUser(result.user);
        setStatus('authenticated');
      } catch {
        setUser(null);
        setStatus('unauthenticated');
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
      setStatus('unauthenticated');
    }

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

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
