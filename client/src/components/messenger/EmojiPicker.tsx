import { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import { init, Picker } from 'emoji-mart';
import { useTheme } from '../../hooks/useTheme';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let picker: HTMLElement | null = null;
    let cancelled = false;

    init({ data }).then(() => {
      if (cancelled || !container.isConnected) return;
      picker = new Picker({
        data,
        onEmojiSelect: (emoji: { native: string }) => onSelectRef.current(emoji.native),
        theme: isDark ? 'dark' : 'light',
        previewPosition: 'none',
        skinTonePosition: 'none',
        navPosition: 'bottom',
      }) as unknown as HTMLElement;
      container.appendChild(picker);
    });

    return () => {
      cancelled = true;
      picker?.remove();
    };
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      className="messenger-emoji-picker rounded-2xl border border-white/10 bg-[rgba(13,17,23,0.96)] p-2 shadow-[0_20px_40px_rgba(2,6,23,0.45)] ring-1 ring-white/5"
      role="dialog"
      aria-label="Emoji picker"
    />
  );
}