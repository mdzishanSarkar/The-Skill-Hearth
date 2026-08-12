import { useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToaster() {
  const { isDark } = useTheme();

  const toastOptions = useMemo(
    () => ({
      style: isDark
        ? { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }
        : { background: '#ffffff', color: '#111827' },
      success: { iconTheme: { primary: '#4f46e5', secondary: isDark ? '#e0e7ff' : '#ffffff' } },
      error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
    }),
    [isDark]
  );

  return <Toaster position="top-right" toastOptions={toastOptions} />;
}
