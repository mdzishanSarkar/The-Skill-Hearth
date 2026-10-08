import { createContext } from 'react';

export interface ThemeContextValue {
  resolvedTheme: 'dark';
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
