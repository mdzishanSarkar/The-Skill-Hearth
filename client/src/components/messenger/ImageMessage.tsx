import { useState } from 'react';

export interface ChatImage {
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  alt: string;
}

function aspectClass(width: number | undefined, height: number | undefined): string {
  if (!width || !height) return 'max-h-72';
  const ratio = width / height;
  if (ratio > 1.6) return 'max-h-56 w-full';
  if (ratio < 0.6) return 'max-h-[24rem]';
  return 'max-h-72';
}

export function ImageMessage({ image, onClick }: { image: ChatImage; onClick?: () => void }) {
  const [error, setError] = useState(false);
  const src = image.thumbnailUrl ?? image.url;
  if (!src || error) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="block overflow-hidden rounded-xl border border-white/8 shadow-[0_2px_8px_rgba(0,0,0,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 transition"
      aria-label="Open image"
    >
      <img
        src={src}
        alt={image.alt}
        loading="lazy"
        onError={() => setError(true)}
        className={`${aspectClass(image.width, image.height)} w-auto min-w-16 rounded-xl object-cover`}
      />
    </button>
  );
}
