import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  listFriends,
  getIncomingRequests,
  getOutgoingRequests,
  getFriendSuggestions,
  getFriendsOnline,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
  setFriendTier,
} from '../../services/friends.service';
import { getFriendsStreaks } from '../../services/gamification.service';
import type {
  FriendSummary,
  FriendRequest,
  FriendSuggestion,
  OnlineFriend,
} from '../../types/friends.types';
import { getApiError } from '../../types/api.types';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiUsers } from 'react-icons/fi';
import FriendRequestButton from '../../components/social/FriendRequestButton';

type Tab = 'friends' | 'requests' | 'suggestions';

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>('friends');
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [online, setOnline] = useState<OnlineFriend[]>([]);
  const [streaks, setStreaks] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const loadFriends = useCallback(async () => {
    try {
      const [f, inc, out, sug, onl, friendStreaks] = await Promise.all([
        listFriends(query || undefined),
        getIncomingRequests(),
        getOutgoingRequests(),
        getFriendSuggestions(),
        getFriendsOnline(),
        getFriendsStreaks(),
      ]);
      setFriends(f);
      setIncoming(inc);
      setOutgoing(out);
      setSuggestions(sug);
      setOnline(onl);
      const bestStreaks = new Map<string, number>();
      for (const entry of friendStreaks) {
        const best = Math.max(entry.currentStreak, bestStreaks.get(entry.userId) ?? 0);
        if (best > 0) bestStreaks.set(entry.userId, best);
      }
      setStreaks(bestStreaks);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  async function run(id: string, action: () => Promise<void>, success: string) {
    setBusy(id);
    try {
      await action();
      toast.success(success);
      loadFriends();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusy('');
    }
  }

  const incomingCount = incoming.length;
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'friends', label: `Friends (${friends.length})` },
    { key: 'requests', label: `Requests${incomingCount > 0 ? ` (${incomingCount})` : ''}` },
    { key: 'suggestions', label: 'Suggestions' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiUsers />}
        title="Friends"
        subtitle="Grow your circle at the hearth: teach together, learn together."
      />

      <div className="mt-6 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        <div className="mt-6">
          {online.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Online now</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {online.map((f) => (
                  <Link
                    key={f._id}
                    to={`/profile/${f._id}`}
                    className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {f.displayName}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends…"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
          />

          {friends.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={<FiUsers />}
              title="No friends yet"
              description="Check the suggestions tab to find people near you."
            />
          ) : (
            <ul className="card mt-4 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {friends.map((friend) => (
                <li key={friend._id} className="flex items-center gap-3 px-4 py-3">
                  <Link to={`/profile/${friend._id}`}>
                    <Avatar src={friend.avatar || undefined} name={friend.displayName} size="md" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${friend._id}`} className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600">
                        {friend.displayName}
                      </Link>
                      {friend.isCloseFriend && <Badge color="amber">⭐ Close</Badge>}
                      <Badge color="gray">Lv {friend.level}</Badge>
                      {streaks.get(friend._id) != null && (
                        <span
                          className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                          title={`${streaks.get(friend._id)}-day streak`}
                        >
                          🔥 {streaks.get(friend._id)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {friend.city}
                      {friend.neighborhood ? ` · ${friend.neighborhood}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busy === `tier-${friend._id}`}
                      onClick={() =>
                        run(
                          `tier-${friend._id}`,
                          () => setFriendTier(friend._id, friend.isCloseFriend ? 'friend' : 'close_friend'),
                          friend.isCloseFriend ? 'Moved to regular friends' : 'Added as a close friend ⭐',
                        )
                      }
                    >
                      {friend.isCloseFriend ? 'Unstar' : 'Star'}
                    </Button>
                    <Link to={`/messages?conversationId=${encodeURIComponent(friend._id)}&type=friend`}>
                      <Button variant="secondary" size="sm">Message</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busy === `unfriend-${friend._id}`}
                      onClick={() =>
                        run(`unfriend-${friend._id}`, () => unfriend(friend._id), 'Removed friend')
                      }
                    >
                      Unfriend
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="mt-6 space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Incoming</h2>
            {incoming.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No incoming requests.</p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                {incoming.map((request) => (
                  <li key={request._id} className="flex items-center gap-3 px-4 py-3">
                    <Link to={`/profile/${request.requester._id}`}>
                      <Avatar src={request.requester.avatar || undefined} name={request.requester.displayName} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${request.requester._id}`} className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600">
                        {request.requester.displayName}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{request.requester.city || ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={busy === `accept-${request._id}`}
                        onClick={() =>
                          run(`accept-${request._id}`, () => acceptFriendRequest(request._id), 'You are now friends!')
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy === `accept-${request._id}`}
                        onClick={() =>
                          run(`decline-${request._id}`, () => declineFriendRequest(request._id), 'Request declined')
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sent</h2>
            {outgoing.length === 0 ? (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No outgoing requests.</p>
            ) : (
              <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                {outgoing.map((request) => (
                  <li key={request._id} className="flex items-center gap-3 px-4 py-3">
                    <Link to={`/profile/${request.addressee._id}`}>
                      <Avatar src={request.addressee.avatar || undefined} name={request.addressee.displayName} size="md" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{request.addressee.displayName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Waiting for a response…</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={busy === `cancel-${request._id}`}
                      onClick={() =>
                        run(`cancel-${request._id}`, () => cancelFriendRequest(request._id), 'Request cancelled')
                      }
                    >
                      Cancel
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'suggestions' && (
        <div className="mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Suggestions are ranked by mutual friends, skill overlap, proximity, and shared sessions.
          </p>
          {suggestions.length === 0 ? (
            <EmptyState
              className="mt-8"
              icon={<FiUsers />}
              title="No suggestions right now"
              description="Check back soon for new people near you."
            />
          ) : (
            <ul className="mt-4 divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
              {suggestions.map((suggestion) => (
                <li key={suggestion.user._id} className="flex items-center gap-3 px-4 py-3">
                  <Link to={`/profile/${suggestion.user._id}`}>
                    <Avatar src={suggestion.user.avatar || undefined} name={suggestion.user.displayName} size="md" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${suggestion.user._id}`} className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600">
                        {suggestion.user.displayName}
                      </Link>
                      <Badge color="gray">Lv {suggestion.user.level}</Badge>
                    </div>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.user.city}
                      {suggestion.user.neighborhood ? ` · ${suggestion.user.neighborhood}` : ''}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {suggestion.reasons.map((reason) => (
                        <span key={reason} className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                          {reason}
                        </span>
                      ))}
                    </p>
                  </div>
                  <FriendRequestButton userId={suggestion.user._id} onChanged={loadFriends} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
