import { FiMaximize2 } from 'react-icons/fi';

export function GifMessage({
  url,
  alt,
  width,
  height,
  onOpen,
}: {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  onOpen?: () => void;
}) {
  return (
    <div className="group relative max-w-[19rem] overflow-hidden rounded-xl border border-white/8 shadow-[0_2px_8px_rgba(0,0,0,0.16)]">
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={`w-full object-cover ${width && height && width / height > 1.5 ? 'max-h-52' : 'max-h-72'}`}
      />
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open GIF in viewer"
          className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/75 backdrop-blur-sm"
        >
          <FiMaximize2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
