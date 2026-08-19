import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markAsRead, markAsUnread, markAllAsRead } from '../../services/notifications';
import { getApiError } from '../../types/api.types';
import type { AppNotification } from '../../types/notification.types';
import { NOTIFICATION_ICONS } from '../../types/notification.types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBell, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getNotifications(page);
      setNotifications(result.notifications);
      setTotalPages(result.totalPages);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error('Failed to mark as read');
    }
  }

  async function handleMarkUnread(id: string) {
    try {
      await markAsUnread(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((c) => c + 1);
      toast.success('Marked as unread');
    } catch {
      toast.error('Failed to mark as unread');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  }

  function getNotificationLink(n: AppNotification): string | null {
    if (n.referenceModel === 'Connection' && n.referenceId) {
      if (n.type === 'new_message') return `/messages?conversationId=${encodeURIComponent(n.referenceId)}&type=skill`;
      return `/connection/${n.referenceId}`;
    }
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiBell />}
        title={
          <>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({unreadCount} unread)
              </span>
            )}
          </>
        }
        subtitle="Stay up to date."
        actions={
          unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiBell />}
          title="No notifications yet"
          description="When something happens, it'll show up here."
        />
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {notifications.map((n) => {
            const link = getNotificationLink(n);
            const content = (
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                  n.isRead
                    ? 'border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800/50'
                    : 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-950/30'
                }`}
              >
                <span className="text-xl">{NOTIFICATION_ICONS[n.type] || '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.isRead ? 'text-gray-600 dark:text-gray-400' : 'font-medium text-gray-900 dark:text-gray-50'}`}>
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n._id);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                      title="Mark as read"
                    >
                      <FiEye className="h-4 w-4" />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>
                  )}
                  {n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkUnread(n._id);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Mark as unread"
                    >
                      <FiEyeOff className="h-4 w-4" />
                      <span className="hidden sm:inline">Mark unread</span>
                    </button>
                  )}
                </div>
              </div>
            );

            return link ? (
              <Link key={n._id} to={link} className="block hover:opacity-80">
                {content}
              </Link>
            ) : (
              <div key={n._id}>{content}</div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="self-center text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
