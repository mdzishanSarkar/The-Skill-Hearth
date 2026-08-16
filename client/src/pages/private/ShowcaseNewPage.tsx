import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createShowcase } from '../../services/showcase.service';
import { listMySkills } from '../../services/skills';
import { getApiError } from '../../types/api.types';
import type { SkillWithTeacher } from '../../types/skill.types';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import { FiZap, FiPlus, FiX, FiLink } from 'react-icons/fi';

const MAX_MEDIA = 5;

interface MediaEntry {
  url: string;
  caption: string;
}

export default function ShowcaseNewPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<SkillWithTeacher[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listMySkills({ type: 'teach', limit: 100 })
      .then((result) => setSkills(result.skills))
      .catch(() => setSkills([]))
      .finally(() => setLoadingSkills(false));
  }, []);

  function addMedia() {
    const url = mediaUrl.trim();
    if (!url) return;
    if (media.length >= MAX_MEDIA) {
      toast.error(`Maximum ${MAX_MEDIA} media items per showcase`);
      return;
    }
    setMedia((prev) => [...prev, { url, caption: mediaCaption.trim() }]);
    setMediaUrl('');
    setMediaCaption('');
  }

  function removeMedia(index: number) {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSubmitting(true);
    try {
      await createShowcase({
        skillId: skillId || undefined,
        title: title.trim(),
        description: description.trim(),
        media: media.map((m) => ({
          url: m.url,
          publicId: m.url.split('/').pop() || m.url,
          caption: m.caption || undefined,
        })),
      });
      toast.success('Showcase published!');
      navigate('/showcase');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 focus:outline-none';

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiZap />}
        title="Share a Project"
        subtitle="Show off a skill project or achievement you're proud of."
      />

      <div className="mt-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder="e.g. My first hand-thrown pottery bowl"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              required
              placeholder="What did you make, learn, or achieve? Tell the community your story."
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description.length}/2000</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Related skill
            </label>
            {loadingSkills ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                <Spinner size="sm" /> Loading your skills…
              </div>
            ) : (
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className={inputClass}
              >
                <option value="">No specific skill</option>
                {skills.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.skillName} {skill.categoryName ? `(${skill.categoryName})` : ''}
                  </option>
                ))}
              </select>
            )}
            {!loadingSkills && skills.length === 0 && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                You don't have any teaching skills listed yet.{' '}
                <Link to="/my-skills" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                  Add a skill
                </Link>{' '}
                to link it to your showcase.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Media (optional) <span className="font-normal text-gray-400">— {media.length}/{MAX_MEDIA}</span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <FiLink className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Caption (optional)"
                className={inputClass}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addMedia}
                disabled={!mediaUrl.trim() || media.length >= MAX_MEDIA}
                className="sm:w-auto"
              >
                <FiPlus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {media.length > 0 && (
              <ul className="mt-3 space-y-2">
                {media.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs text-gray-700 dark:text-gray-300">{item.url}</p>
                      {item.caption && (
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">{item.caption}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      aria-label="Remove media"
                      className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-5">
            <Link to="/showcase">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              loading={submitting}
              disabled={!title.trim() || !description.trim()}
            >
              {submitting ? 'Publishing…' : 'Publish showcase'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
