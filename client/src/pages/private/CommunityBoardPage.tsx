import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import { listPosts } from '../../services/community.service';
import { useAuth } from '../../hooks/useAuth';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import Spinner from '../../components/ui/Spinner';
import type { CommunityPost } from '../../types/community.types';

export default function CommunityBoardPage() {
  const { city: paramCity, neighborhood: paramNeighborhood } = useParams<{
    city: string;
    neighborhood?: string;
  }>();
  const { user } = useAuth();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'new' | 'top'>('new');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const city = paramCity || user?.location?.city || 'london';
  const neighborhood = paramNeighborhood || user?.location?.neighborhood;

  async function fetchPosts() {
    setLoading(true);
    try {
      const result = await listPosts(city, neighborhood, sort, page);
      setPosts(result.posts);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [city, neighborhood, sort, page]);

  function handlePostCreated() {
    setPage(1);
    fetchPosts();
  }

  function handlePostDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  }

  function handleVote(postId: string, voteScore: number, userVote: 'up' | 'down' | null) {
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, voteScore, userVote } : p))
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Community Board
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {neighborhood
              ? `${neighborhood}, ${city}`
              : city.charAt(0).toUpperCase() + city.slice(1)}
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <FiPlus className="h-4 w-4" />
            New Post
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => { setSort('new'); setPage(1); }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            sort === 'new'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          New
        </button>
        <button
          onClick={() => { setSort('top'); setPage(1); }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            sort === 'top'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Top
        </button>
        <div className="flex-1" />
        <button
          onClick={fetchPosts}
          aria-label="Refresh posts"
          className="text-gray-400 hover:text-gray-600"
        >
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No posts yet in this neighborhood.</p>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Be the first to post
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handlePostDeleted}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <CreatePostModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handlePostCreated}
        defaultCity={city}
        defaultNeighborhood={neighborhood}
      />
    </div>
  );
}
