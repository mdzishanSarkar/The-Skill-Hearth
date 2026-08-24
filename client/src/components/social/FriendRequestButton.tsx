import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import {
  getFriendStatus,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from '../../services/friends.service';
import type { FriendStatus } from '../../types/friends.types';
import { getApiError } from '../../types/api.types';

interface FriendRequestButtonProps {
  userId: string;
  onChanged?: () => void;
}

export default function FriendRequestButton({ userId, onChanged }: FriendRequestButtonProps) {
  const [status, setStatus] = useState<FriendStatus>({ status: 'none' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getFriendStatus(userId));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await refresh();
      onChanged?.();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <Button variant="secondary" size="sm" disabled>…</Button>;
  }

  switch (status.status) {
    case 'none':
      return (
        <Button variant="primary" size="sm" loading={busy} onClick={() => run(() => sendFriendRequest(userId), 'Friend request sent')}>
          Add friend
        </Button>
      );
    case 'pending_sent':
      return (
        <Button
          variant="secondary"
          size="sm"
          loading={busy}
          onClick={() => run(() => cancelFriendRequest(status.friendshipId), 'Request cancelled')}
        >
          Cancel Request
        </Button>
      );
    case 'pending_received':
      return (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={busy}
            onClick={() => run(() => acceptFriendRequest(status.friendshipId), 'You are now friends!')}
          >
            Accept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => run(() => declineFriendRequest(status.friendshipId), 'Request declined')}
          >
            Decline
          </Button>
        </div>
      );
    case 'friends':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
          ✓ Friends{status.tier === 'close_friend' ? ' ⭐' : ''}
        </span>
      );
    default:
      return null;
  }
}
