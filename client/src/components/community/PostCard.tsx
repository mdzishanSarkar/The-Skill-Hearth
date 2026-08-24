import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FiArrowUp, FiArrowDown, FiFlag, FiTrash2 } from 'react-icons/fi';
import { votePost, deletePost, reportPost } from '../../services/community.service';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import type { CommunityPost } from '../../types/community.types';
import ConfirmDialog from '../ui/ConfirmDialog';
import ReportDialog from '../ui/ReportDialog';

interface PostCardProps {
  post: CommunityPost;
  onDelete?: (postId: string) => void;
  onVote?: (postId: string, voteScore: number, userVote: 'up' | 'down' | null) => void;
}

export default function PostCard({ post, onDelete, onVote }: PostCardProps) {
  const { user } = useAuth();
  const [voteScore, setVoteScore] = useState(post.voteScore);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(post.userVote);
  const [isVoting, setIsVoting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const isAuthor = user && String(post.authorId?._id) === user._id;

  async function handleVote(vote: 'up' | 'down') {
    if (!user || isVoting) return;
    setIsVoting(true);
    try {
      const newVote = userVote === vote ? 'remove' : vote;
      const result = await votePost(post._id, newVote);
      setVoteScore(result.voteScore);
      setUserVote(result.userVote);
      onVote?.(post._id, result.voteScore, result.userVote);
    } catch {
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  }

  async function handleDelete() {
    setShowDeleteConfirm(false);
    try {
      await deletePost(post._id);
      toast.success('Post deleted');
      onDelete?.(post._id);
    } catch {
      toast.error('Failed to delete post');
    }
  }

  async function handleReport(reason: string) {
    setShowReportDialog(false);
    try {
      await reportPost(post._id, reason);
      toast.success('Report submitted');
    } catch {
      toast.error('Failed to submit report');
    }
  }

  const author = post.authorId;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => handleVote('up')}
            disabled={!user || isVoting}
            aria-label="Upvote post"
            aria-pressed={userVote === 'up'}
            className={`rounded p-1 transition-colors ${
              userVote === 'up'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                : 'text-gray-400 dark:text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
            } disabled:opacity-50`}
          >
            <FiArrowUp className="h-5 w-5" />
          </button>
          <span className={`text-sm font-semibold ${voteScore > 0 ? 'text-emerald-600 dark:text-emerald-400' : voteScore < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {voteScore}
          </span>
          <button
            onClick={() => handleVote('down')}
            disabled={!user || isVoting}
            aria-label="Downvote post"
            aria-pressed={userVote === 'down'}
            className={`rounded p-1 transition-colors ${
              userVote === 'down'
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                : 'text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50'
            } disabled:opacity-50`}
          >
            <FiArrowDown className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {author && (
              <Link
                to={`/profile/${author._id}`}
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600"
              >
                {author.avatar ? (
                  <img
                    src={author.avatar}
                    alt={author.displayName}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    {author.displayName[0]}
                  </div>
                )}
                {author.displayName}
              </Link>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>

          <div className="mt-3 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {post.neighborhood && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {post.neighborhood}
              </span>
            )}
            <div className="flex-1" />
            {user && !isAuthor && (
              <button
                onClick={() => setShowReportDialog(true)}
                className="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-colors"
              >
                <FiFlag className="h-3.5 w-3.5" />
                <span className="text-xs">Report</span>
              </button>
            )}
            {isAuthor && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                <span className="text-xs">Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this post?"
        message="This action cannot be undone. The post will be permanently removed."
        confirmLabel="Delete post"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />

      <ReportDialog
        open={showReportDialog}
        title="Report Post"
        targetName="this post"
        onSubmit={handleReport}
        onClose={() => setShowReportDialog(false)}
      />
    </div>
  );
}
