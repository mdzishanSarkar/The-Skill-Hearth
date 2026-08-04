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
    'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 disabled:bg-indigo-300',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400 disabled:text-gray-400 disabled:border-gray-200',
  ghost:
    'bg-transparent text-indigo-600 hover:bg-indigo-50 focus-visible:ring-indigo-500 disabled:text-indigo-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
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
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
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
