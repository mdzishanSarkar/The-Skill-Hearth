import { useState } from 'react';
import clsx from 'clsx';
import { FiCheck, FiDroplet } from 'react-icons/fi';
import { BUBBLE_ACCENTS, useChatSettingsStore } from '../../stores/chatSettingsStore';

export function AccentColorPicker() {
  const [open, setOpen] = useState(false);
  const bubbleAccentId = useChatSettingsStore((state) => state.bubbleAccentId);
  const setBubbleAccentId = useChatSettingsStore((state) => state.setBubbleAccentId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Customize chat colors"
        aria-expanded={open}
        title="Customize chat colors"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8 hover:text-white"
      >
        <FiDroplet className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-2xl border border-white/10 bg-[rgba(18,22,31,0.98)] p-3 shadow-[0_18px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Bubble color</p>
            <div className="grid grid-cols-4 gap-2">
              {BUBBLE_ACCENTS.map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  onClick={() => setBubbleAccentId(accent.id)}
                  aria-label={accent.label}
                  aria-pressed={bubbleAccentId === accent.id}
                  title={accent.label}
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full transition hover:scale-110',
                    bubbleAccentId === accent.id && 'ring-2 ring-white/90',
                  )}
                  style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
                >
                  {bubbleAccentId === accent.id && <FiCheck className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}