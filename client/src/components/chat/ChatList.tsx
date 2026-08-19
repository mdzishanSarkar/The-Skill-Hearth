import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import type { Connection } from '../../types/connection.types';

interface ChatListProps {
  connections: Connection[];
  currentUserId: string;
}

export default function ChatList({ connections, currentUserId }: ChatListProps) {
  if (connections.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        No active conversations.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      {connections.map((conn) => {
        const other =
          (typeof conn.requesterId === 'object' && conn.requesterId._id !== currentUserId
            ? conn.requesterId
            : typeof conn.teacherId === 'object'
              ? conn.teacherId
              : null);
        const skill = typeof conn.skillId === 'object' ? conn.skillId : null;
        const lastSeen = conn.updatedAt ? new Date(conn.updatedAt) : new Date();
        const isToday = lastSeen.toDateString() === new Date().toDateString();

        return (
          <Link
            key={conn._id}
            to={`/messages?conversationId=${encodeURIComponent(conn._id)}&type=skill`}
            className="group flex items-center gap-3 rounded-2xl border border-transparent bg-white/80 p-3 transition-all duration-200 hover:border-indigo-100 hover:bg-indigo-50/70 hover:shadow-sm dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-800/80"
          >
            <div className="relative shrink-0">
              <Avatar
                src={other?.avatar || undefined}
                name={other?.displayName || 'User'}
                size="sm"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {other?.displayName || 'Unknown'}
                </p>
                <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                  {isToday
                    ? lastSeen.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                    : lastSeen.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {skill?.skillName || 'Chat'}
                </p>
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  2
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
