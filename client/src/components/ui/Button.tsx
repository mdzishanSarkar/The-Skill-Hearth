import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-orange-500/30 hover:from-amber-600 hover:to-orange-700 hover:shadow-orange-500/40 focus-visible:ring-orange-500 disabled:from-amber-300 disabled:to-orange-300 disabled:shadow-none',
  secondary:
    'bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus-visible:ring-gray-400 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:border-gray-600 dark:focus-visible:ring-gray-500 dark:disabled:text-gray-500 dark:disabled:border-gray-800',
  ghost:
    'bg-transparent text-orange-700 hover:bg-orange-50 focus-visible:ring-orange-500 disabled:text-orange-300 dark:text-orange-400 dark:hover:bg-orange-950/40 dark:disabled:text-orange-800',
  danger:
    'bg-red-600 text-white shadow-sm shadow-red-500/30 hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300 disabled:shadow-none',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
