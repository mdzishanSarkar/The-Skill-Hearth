import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { createPost } from '../../services/community.service';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  defaultCity?: string;
  defaultNeighborhood?: string;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onCreated,
  defaultCity = '',
  defaultNeighborhood = '',
}: CreatePostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [city, setCity] = useState(defaultCity || user?.location?.city || '');
  const [neighborhood, setNeighborhood] = useState(defaultNeighborhood || user?.location?.neighborhood || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !city.trim()) {
      toast.error('Content and city are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await createPost({
        content: content.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim() || undefined,
      });
      toast.success('Post created!');
      setContent('');
      onClose();
      onCreated?.();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to create post';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create a Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What's on your mind?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Looking for a bread-baking buddy in your neighborhood..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">{content.length}/1000</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="London"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Shoreditch"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || !city.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
