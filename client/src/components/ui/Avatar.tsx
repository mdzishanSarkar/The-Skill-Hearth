import { useState } from 'react';
import clsx from 'clsx';
import { resolveMediaUrl } from '../../utils/media';
import { getAvatarDisplayMode } from '../../utils/avatar';

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
  const { mode, src: safeSrc, fallbackLabel } = getAvatarDisplayMode(src, name);
  const [imageFailed, setImageFailed] = useState(false);

  if (mode === 'image' && safeSrc && !imageFailed) {
    return (
      <img
        src={resolveMediaUrl(safeSrc)}
        alt={name}
        onError={() => setImageFailed(true)}
        className={clsx('rounded-full object-cover ring-2 ring-white dark:ring-gray-800', sizes[size], className)}
      />
    );
  }

  return (
    <div
      title={name}
      aria-label={name}
      className={clsx(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-amber-100 text-indigo-500 ring-2 ring-white dark:from-indigo-900/60 dark:to-amber-900/40 dark:text-indigo-300 dark:ring-gray-800 font-semibold select-none',
        sizes[size],
        className
      )}
    >
      {fallbackLabel}
    </div>
  );
}
