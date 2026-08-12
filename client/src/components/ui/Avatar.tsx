import clsx from 'clsx';
import { FiUser } from 'react-icons/fi';
import { resolveMediaUrl } from '../../utils/media';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={resolveMediaUrl(src)}
        alt={name}
        className={clsx('rounded-full object-cover ring-2 ring-white dark:ring-gray-800', sizes[size], className)}
      />
    );
  }

  return (
    <div
      title={name}
      aria-label={name}
      className={clsx(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-amber-100 text-indigo-500 ring-2 ring-white dark:from-indigo-900/60 dark:to-amber-900/40 dark:text-indigo-300 dark:ring-gray-800',
        sizes[size],
        className
      )}
    >
      <FiUser className={iconSizes[size]} />
    </div>
  );
}
