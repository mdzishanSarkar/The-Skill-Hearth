import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import type { ThemePreference } from '../../context/theme-context';
import clsx from 'clsx';

const options: { value: ThemePreference; label: string; icon: typeof FiSun }[] = [
  { value: 'light', label: 'Light', icon: FiSun },
  { value: 'dark', label: 'Dark', icon: FiMoon },
  { value: 'system', label: 'System', icon: FiMonitor },
];

export default function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setPreference(value)}
            className={clsx(
              'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm transition-all',
              active
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
