import { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from '../../hooks/useTheme';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="messenger-emoji-picker rounded-2xl border border-white/10 bg-[rgba(13,17,23,0.96)] p-2 shadow-[0_20px_40px_rgba(2,6,23,0.45)] ring-1 ring-white/5"
      role="dialog"
      aria-label="Emoji picker"
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
        theme={isDark ? 'dark' : 'light'}
        previewPosition="none"
        skinTonePosition="none"
        navPosition="bottom"
      />
    </div>
  );
}
