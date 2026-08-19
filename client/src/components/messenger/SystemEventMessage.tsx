import { FiCheckCircle, FiCalendar, FiCheck, FiRefreshCw, FiUsers, FiStar } from 'react-icons/fi';
import type { MessengerMessage } from '../../types/messenger.types';

const EVENT_LABELS: Partial<Record<NonNullable<MessengerMessage['systemEvent']>, string>> = {
  connection_accepted: 'The skill connection was accepted.',
  connection_completed: 'The session was marked as completed.',
  safe_meeting_reminder: 'A safe meeting reminder was sent.',
  review_prompt: 'You can now leave a review for this session.',
  friend_accepted: 'You are now connected as friends.',
  skill_swap_matched: 'You matched a skill swap.',
  session_scheduled: 'A session was scheduled.',
};

function eventIcon(event: MessengerMessage['systemEvent']) {
  switch (event) {
    case 'connection_accepted':
      return <FiCheck />;
    case 'connection_completed':
      return <FiCheckCircle />;
    case 'safe_meeting_reminder':
      return <FiStar />;
    case 'review_prompt':
      return <FiStar />;
    case 'friend_accepted':
      return <FiUsers />;
    case 'skill_swap_matched':
      return <FiRefreshCw />;
    case 'session_scheduled':
      return <FiCalendar />;
    default:
      return <FiCheck />;
  }
}

export function SystemEventMessage({ message }: { message: MessengerMessage }) {
  const label = EVENT_LABELS[message.systemEvent ?? 'connection_accepted'] ?? message.content ?? '';

  return (
    <div className="flex justify-center py-3">
      <span className="inline-flex max-w-[85%] items-center gap-2 rounded-full border border-white/8 bg-[rgba(26,31,39,0.7)] px-3.5 py-1.5 text-center text-xs font-medium text-slate-400 backdrop-blur-sm">
        {eventIcon(message.systemEvent)}
        <span>{label}</span>
      </span>
    </div>
  );
}
