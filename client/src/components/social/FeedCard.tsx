import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import Avatar from '../ui/Avatar';
import type { FeedEvent } from '../../types/feed.types';
import { FEED_REACTION_EMOJIS } from '../../types/feed.types';
import { reactToEvent } from '../../services/feed.service';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';

interface FeedCardProps {
  event: FeedEvent;
  onChanged?: (event: FeedEvent) => void;
}

export default function FeedCard({ event, onChanged }: FeedCardProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const isSelf = user?._id === event.actor._id;

  async function toggleReaction(emoji: string) {
    if (isSelf) return;
    setBusy(true);
    try {
      const updated = await reactToEvent(event._id, emoji);
      onChanged?.(updated);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusy(false);
    }
  }

  const totalReactions = event.reactions.length;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${event.actor._id}`}>
          <Avatar src={event.actor.avatar || undefined} name={event.actor.displayName} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${event.actor._id}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600">
              {event.actor.displayName}
            </Link>
            <span className="text-xs text-gray-400 dark:text-gray-500">Lv {event.actor.level}</span>
          </div>
          <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
            {event.preview.emoji && <span className="mr-1">{event.preview.emoji}</span>}
            {event.preview.title}
          </p>
          {event.preview.subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{event.preview.subtitle}</p>}
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {FEED_REACTION_EMOJIS.map((emoji) => {
              const count = event.reactionCounts[emoji] ?? 0;
              const active = event.myReaction === emoji;
              return (
                <button
                  key={emoji}
                  disabled={isSelf || busy}
                  onClick={() => toggleReaction(emoji)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors disabled:cursor-not-allowed ${
                    active
                      ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span>{count}</span>}
                </button>
              );
            })}
            {totalReactions > 0 && (
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{totalReactions} reaction{totalReactions === 1 ? '' : 's'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
