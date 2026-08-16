import type { ReactNode } from 'react';
import clsx from 'clsx';

interface PageHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  onIconClick?: () => void;
}

export default function PageHeader({ icon, title, subtitle, actions, className, onIconClick }: PageHeaderProps) {
  return (
    <div className={clsx('animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-start gap-3.5">
        {icon &&
          (onIconClick ? (
            <button
              type="button"
              onClick={onIconClick}
              title="Refresh"
              aria-label="Refresh"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              {icon}
            </button>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
              {icon}
            </div>
          ))}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
