import { useState } from 'react';
import { useInboxNotifications } from '../../hooks/useInboxNotifications';
import { FiMessageSquare, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

/**
 * Display a badge showing unread inbox notifications.
 * Integrates with real-time socket.io events.
 */
export default function InboxNotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for inbox notifications
  useInboxNotifications({
    showToast: false, // We'll show our own UI
    onNotification: () => {
      setUnreadCount((prev) => prev + 1);
    },
  });

  if (unreadCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
      <div className="rounded-lg shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <FiMessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              New message{unreadCount > 1 ? 's' : ''}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              You have {unreadCount} new message{unreadCount > 1 ? 's' : ''}
            </p>
            <Link
              to="/messages"
              className="mt-3 inline-flex text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              View messages →
            </Link>
          </div>
          <button
            onClick={() => setUnreadCount(0)}
            className="flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
