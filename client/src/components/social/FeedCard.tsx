import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import Avatar from '../ui/Avatar';
import type { FeedEvent } from '../../types/feed.types';
import { FEED_REACTION_EMOJIS } from '../../types/feed.types';
import { reactToEvent } from '../../services/feed.service';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import { resolveMediaUrl } from '../../utils/media';
import { FiGlobe, FiUsers, FiHeart, FiLock, FiMessageSquare, FiUser } from 'react-icons/fi';

interface FeedCardProps {
  event: FeedEvent;
  onChanged?: (event: FeedEvent) => void;
}

const EVENT_META: Record<string, { label: string; classes: string }> = {
  skill_added: { label: 'New skill', classes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' },
  skill_completed: { label: 'Skill done', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  session_completed: { label: 'Session', classes: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' },
  session_taught: { label: 'Taught', classes: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  session_learned: { label: 'Learned', classes: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300' },
  badge_earned: { label: 'Badge', classes: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' },
  streak_milestone: { label: 'Streak', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300' },
  skill_swap_accepted: { label: 'Swap', classes: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300' },
  joined_group_session: { label: 'Group session', classes: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300' },
  review_received: { label: 'Review', classes: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' },
  friend_joined: { label: 'New friend', classes: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' },
  friend_request_accepted: { label: 'Connected', classes: 'bg-lime-100 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300' },
  level_up: { label: 'Level up', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300' },
  journal_highlight: { label: 'Journal', classes: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300' },
  challenge_completed: { label: 'Challenge', classes: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' },
};

const VISIBILITY_ICONS: Record<string, { icon: typeof FiGlobe; label: string }> = {
  public: { icon: FiGlobe, label: 'Public' },
  friends: { icon: FiUsers, label: 'Friends' },
  close_friends: { icon: FiHeart, label: 'Close friends' },
  private: { icon: FiLock, label: 'Private' },
};

export default function FeedCard({ event, onChanged }: FeedCardProps) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const isSelf = user?._id === event.actor._id;
  const meta = EVENT_META[event.eventType] ?? {
    label: 'Update',
    classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };
  const visibility = VISIBILITY_ICONS[event.visibility] ?? VISIBILITY_ICONS.public;
  const VisIcon = visibility.icon;

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
    <article className="animate-fade-in-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700/80 dark:bg-gray-900 sm:p-5">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${event.actor._id}`} className="shrink-0">
          <Avatar src={event.actor.avatar || undefined} name={event.actor.displayName} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/profile/${event.actor._id}`}
              className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
            >
              {event.actor.displayName}
            </Link>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              Lv {event.actor.level}
            </span>
            <span className={clsx('ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.classes)}>
              {meta.label}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
            <span className="inline-flex items-center gap-1" title={`Visibility: ${visibility.label}`}>
              <VisIcon className="h-3 w-3" />
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
        {event.preview.emoji && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-amber-500/15 text-xl">
            {event.preview.emoji}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-200">{event.preview.title}</p>
          {event.preview.subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{event.preview.subtitle}</p>}
        </div>
      </div>

      {event.preview.imageUrl && (
        <img
          src={resolveMediaUrl(event.preview.imageUrl)}
          alt=""
          loading="lazy"
          className="mt-3 h-48 w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {FEED_REACTION_EMOJIS.map((emoji) => {
          const count = event.reactionCounts[emoji] ?? 0;
          const active = event.myReaction === emoji;
          return (
            <button
              key={emoji}
              type="button"
              disabled={isSelf || busy}
              title={isSelf ? "You can't react to your own activity" : `React with ${emoji}`}
              onClick={() => toggleReaction(emoji)}
              className={clsx(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all active:scale-90 disabled:cursor-not-allowed disabled:opacity-60',
                active
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800'
              )}
            >
              <span className="text-sm leading-none">{emoji}</span>
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-1">
          {!isSelf && (
            <Link
              to={`/messages?conversationId=${encodeURIComponent(event.actor._id)}&type=friend`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
            >
              <FiMessageSquare className="h-3.5 w-3.5" /> Message
            </Link>
          )}
          <Link
            to={`/profile/${event.actor._id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-indigo-400"
          >
            <FiUser className="h-3.5 w-3.5" /> View
          </Link>
        </div>
      </div>

      {isSelf && totalReactions > 0 && (
        <p className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500">
          {totalReactions} reaction{totalReactions === 1 ? '' : 's'}
        </p>
      )}
    </article>
  );
}