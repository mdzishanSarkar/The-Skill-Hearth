import clsx from 'clsx';
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

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (src) {
    return (
      <img
        src={resolveMediaUrl(src)}
        alt={name}
        className={clsx('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700',
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  );
}
