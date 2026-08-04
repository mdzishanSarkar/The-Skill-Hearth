import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      className={clsx(
        'inline-block animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600',
        sizes[size],
        className
      )}
      aria-label="Loading"
      role="status"
    />
  );
}
