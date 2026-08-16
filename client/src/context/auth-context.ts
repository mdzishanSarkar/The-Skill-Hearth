import { createContext } from 'react';
import type { User } from '../types/user.types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
