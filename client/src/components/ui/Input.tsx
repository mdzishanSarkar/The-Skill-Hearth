import type { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  dark?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export default function Input({ label, error, className, id, dark = false, icon, trailing, ...rest }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={`mb-1 block text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className={clsx('pointer-events-none absolute inset-y-0 left-3.5 flex items-center', dark ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500')}>
            {icon}
          </span>
        )}
        <input
          id={id}
          className={clsx(
            dark
              ? 'w-full rounded-xl border border-gray-600 bg-gray-800 px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30'
              : 'input-base w-full',
            icon && 'pl-10',
            trailing && 'pr-11',
            error && 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500/25',
            className
          )}
          {...rest}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-1.5 flex items-center">
            {trailing}
          </span>
        )}
      </div>
      {error && <p className={`mt-1 text-sm ${dark ? 'text-red-400' : 'text-red-600 dark:text-red-400'}`}>{error}</p>}
    </div>
  );
}
