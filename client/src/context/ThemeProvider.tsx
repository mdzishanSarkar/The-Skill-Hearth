import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './theme-context';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    window.localStorage.removeItem('skill-hearth:theme');
  }, []);

  const value = useMemo(() => ({ resolvedTheme: 'dark' as const, isDark: true }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
