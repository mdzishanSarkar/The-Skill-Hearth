import { useState } from 'react';
import { useInboxNotifications, type InboxNotificationEvent } from '../../hooks/useInboxNotifications';
import { FiMessageSquare, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

/**
 * Display a badge showing unread inbox notifications.
 * Integrates with real-time socket.io events.
 */
export default function InboxNotificationBadge() {
  const [lastNotification, setLastNotification] = useState<InboxNotificationEvent | null>(null);

  // Listen for inbox notifications
  useInboxNotifications({
    showToast: false, // We'll show our own UI
    onNotification: (event) => {
      setLastNotification(event);
    },
  });

  if (!lastNotification) {
    return null;
  }

  const conversationUrl = `/messages?conversationId=${encodeURIComponent(lastNotification.conversationId)}&type=${lastNotification.conversationType}`;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in">
      <div className="rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4 max-w-sm backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40">
              <FiMessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {lastNotification.senderName}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {lastNotification.conversationType === 'skill' ? 'Skill chat' : 'Direct message'}
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
              {lastNotification.preview}
            </p>
            <Link
              to={conversationUrl}
              className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              View message →
            </Link>
          </div>
          <button
            onClick={() => setLastNotification(null)}
            className="flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
  }
