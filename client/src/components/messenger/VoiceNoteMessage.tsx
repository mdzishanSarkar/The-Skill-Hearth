import { useState } from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';

export function VoiceNoteMessage({
  url,
  durationSeconds,
  waveform,
}: {
  url?: string;
  durationSeconds?: number;
  waveform?: number[];
}) {
  const [playing, setPlaying] = useState(false);
  const bars = waveform && waveform.length > 0 ? waveform : Array.from({ length: 24 }, () => 0.4);

  const toggle = () => {
    if (!url) return;
    setPlaying((prev) => !prev);
  };

  return (
    <div className="flex min-w-40 items-center gap-3 py-1">
      <button
        type="button"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--bubble-accent-from),var(--bubble-accent-to))] text-white transition hover:scale-105 disabled:opacity-50"
      >
        {playing ? <FiPause className="h-4 w-4" /> : <FiPlay className="ml-0.5 h-4 w-4" />}
      </button>
      <div className="flex h-8 flex-1 items-center gap-[2px]" aria-hidden="true">
        {bars.map((value, index) => (
          <span
            key={index}
            className={`w-[3px] rounded-full transition ${
              playing ? 'bg-[linear-gradient(135deg,var(--bubble-accent-from),var(--bubble-accent-to))]' : 'bg-slate-500'
            }`}
            style={{ height: `${Math.max(15, Math.min(100, value * 100))}%` }}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs text-slate-500 font-medium">
        {durationSeconds ? `${Math.max(1, Math.round(durationSeconds))}s` : 'voice'}
      </span>
    </div>
  );
}
