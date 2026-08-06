import { useState, useEffect } from 'react';
import { FiBan, FiCheck } from 'react-icons/fi';
import { blockUser, unblockUser, getBlockedUsers } from '../../services/block.service';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface BlockButtonProps {
  targetUserId: string;
}

export default function BlockButton({ targetUserId }: BlockButtonProps) {
  const { user } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isOwnProfile = user && user._id === targetUserId;

  useEffect(() => {
    if (!user) return;
    async function checkBlocked() {
      try {
        const result = await getBlockedUsers();
        setIsBlocked(result.users.some((u) => u._id === targetUserId));
      } catch {
        // ignore
      }
    }
    checkBlocked();
  }, [user, targetUserId]);

  if (isOwnProfile || !user) return null;

  async function handleBlock() {
    setIsLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(targetUserId);
        setIsBlocked(false);
        toast.success('User unblocked');
      } else {
        await blockUser(targetUserId);
        setIsBlocked(true);
        toast.success('User blocked');
      }
      setShowConfirm(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Action failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConfirm(!showConfirm)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isBlocked
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'text-gray-500 hover:bg-gray-100 hover:text-red-600'
        }`}
      >
        {isBlocked ? (
          <>
            <FiCheck className="h-4 w-4" />
            Blocked
          </>
        ) : (
          <>
            <FiBan className="h-4 w-4" />
            Block
          </>
        )}
      </button>

      {showConfirm && (
        <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm text-gray-700 mb-2">
            {isBlocked
              ? `Unblock this user? They will be able to see your profile and send you requests.`
              : `Block this user? They won't be able to view your profile or send you requests.`}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={isLoading}
              className={`rounded px-3 py-1 text-sm font-medium text-white disabled:opacity-50 ${
                isBlocked
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? '...' : isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
