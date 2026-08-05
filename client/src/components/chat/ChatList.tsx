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
      <p className="p-4 text-center text-sm text-gray-500">No active conversations.</p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {connections.map((conn) => {
        const other =
          (typeof conn.requesterId === 'object' && conn.requesterId._id !== currentUserId
            ? conn.requesterId
            : typeof conn.teacherId === 'object'
              ? conn.teacherId
              : null);
        const skill = typeof conn.skillId === 'object' ? conn.skillId : null;

        return (
          <Link
            key={conn._id}
            to={`/chat/${conn._id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <Avatar
              src={other?.avatar || undefined}
              name={other?.displayName || 'User'}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {other?.displayName || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {skill?.skillName || 'Chat'}
              </p>
            </div>
            <span className="text-xs text-gray-400">
              {new Date(conn.updatedAt).toLocaleDateString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
