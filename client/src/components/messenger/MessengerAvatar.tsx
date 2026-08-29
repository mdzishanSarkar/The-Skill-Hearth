import { useState } from 'react';
import clsx from 'clsx';
import { resolveMediaUrl } from '../../utils/media';

const DEFAULT_AVATAR_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">' +
      '<rect width="96" height="96" fill="#475569"/>' +
      '<path d="M26 84c3-18 12-26 22-26s19 8 22 26v2H26z" fill="#94a3b8"/>' +
      '<circle cx="48" cy="36" r="15" fill="#94a3b8"/>' +
      '</svg>',
  );

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const DOT_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3 w-3',
};

interface MessengerAvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  ring?: boolean;
  className?: string;
}

export function MessengerAvatar({
  src,
  name = 'User',
  size = 'sm',
  online = false,
  ring = false,
  className,
}: MessengerAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const safeSrc = src?.trim() ? resolveMediaUrl(src.trim()) : null;
  const showImage = Boolean(safeSrc) && !imageFailed;

  return (
    <span className="relative inline-flex shrink-0">
      {showImage ? (
        <img
          src={safeSrc as string}
          alt={name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className={clsx('rounded-full object-cover', SIZE_CLASSES[size], ring && 'ring-2 ring-white/12', className)}
        />
      ) : (
        <img
          src={DEFAULT_AVATAR_SRC}
          alt={name}
          className={clsx('rounded-full object-cover', SIZE_CLASSES[size], ring && 'ring-2 ring-white/12', className)}
        />
      )}
      {online && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full border-2 border-[#12161e] bg-emerald-400',
            DOT_CLASSES[size],
          )}
          aria-label="Online"
        />
      )}
    </span>
  );
}