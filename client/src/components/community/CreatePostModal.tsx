import { useState } from 'react';
import { createPost } from '../../services/community.service';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

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
    <Modal open={isOpen} onClose={onClose} title="Create a Post">
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What's on your mind?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Looking for a bread-baking buddy in your neighborhood..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{content.length}/1000</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="London"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Neighborhood</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Shoreditch"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!content.trim() || !city.trim()}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
