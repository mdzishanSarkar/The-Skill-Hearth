import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { createSession } from '../../services/groupSession.service';
import toast from 'react-hot-toast';

interface CreateGroupSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  skills: Array<{ _id: string; skillName: string; categoryName: string }>;
}

export default function CreateGroupSessionModal({
  isOpen,
  onClose,
  onCreated,
  skills,
}: CreateGroupSessionModalProps) {
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(5);
  const [format, setFormat] = useState<'in-person' | 'online' | 'either'>('in-person');
  const [location, setLocation] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [sessionType, setSessionType] = useState<'regular' | 'workshop'>('regular');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!skillId || !title.trim()) {
      toast.error('Skill and title are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await createSession({
        skillId,
        title: title.trim(),
        description: description.trim() || undefined,
        maxParticipants,
        format,
        location: location.trim() || undefined,
        scheduledAt: scheduledAt || undefined,
        sessionType,
      });
      toast.success('Group session created!');
      onClose();
      onCreated?.();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to create session';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Group Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSessionType('regular')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  sessionType === 'regular'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Regular Session
              </button>
              <button
                type="button"
                onClick={() => setSessionType('workshop')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  sessionType === 'workshop'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Workshop
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skill *</label>
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select a skill</option>
              {skills.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.categoryName} / {s.skillName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g., Weekly bread baking workshop"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What will you cover? What should participants bring?"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format *</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as typeof format)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="in-person">In-person</option>
                <option value="online">Online</option>
                <option value="either">Either</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Math.min(20, Math.max(2, Number(e.target.value))))}
                min={2}
                max={20}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {format !== 'online' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Community Center, Main St"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date/Time (optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
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
              disabled={isSubmitting || !skillId || !title.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
