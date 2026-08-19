import clsx from 'clsx';
import type { MessengerMessage } from '../../types/messenger.types';

interface ReactionBarProps {
  reactions: MessengerMessage['reactions'];
  currentUserId: string | null;
  onReact: (emoji: MessengerMessage['reactions'][number]['emoji']) => void;
  isMine: boolean;
}

function countByEmoji(reactions: MessengerMessage['reactions'], currentUserId: string) {
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (r.userId === currentUserId) entry.mine = true;
    map.set(r.emoji, entry);
  }
  return [...map.entries()];
}

export function ReactionBar({ reactions, currentUserId, onReact, isMine }: ReactionBarProps) {
  if (!currentUserId) return null;
  const grouped = countByEmoji(reactions, currentUserId);
  if (grouped.length === 0) return null;

  return (
    <div
      className={clsx(
        'mt-1 flex flex-wrap items-center gap-1',
        isMine ? 'justify-end' : 'justify-start',
      )}
    >
      {grouped.map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji as MessengerMessage['reactions'][number]['emoji'])}
          title={mine ? 'Click to remove reaction' : `React with ${emoji}`}
          aria-label={`Reaction ${emoji}${mine ? ' (yours)' : ''}`}
          className={clsx(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:shadow-sm',
            mine
              ? 'border-[color-mix(in_srgb,var(--bubble-accent-from)_40%,transparent)] bg-[color-mix(in_srgb,var(--bubble-accent-from)_12%,transparent)] text-[var(--bubble-accent-from)] hover:bg-[color-mix(in_srgb,var(--bubble-accent-from)_18%,transparent)]'
              : 'border-white/8 bg-[rgba(255,255,255,0.05)] text-slate-300 hover:bg-white/10',
          )}
        >
          <span className="text-sm leading-none">{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
}
