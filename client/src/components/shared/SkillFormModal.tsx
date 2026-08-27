import { useEffect, useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { getCategories } from '../../services/skills';
import { getApiError } from '../../types/api.types';
import { getCategoryVisual } from '../../data/skillVisuals';
import type { Category } from '../../types/skill.types';
import type {
  ProficiencyLevel,
  SessionFormat,
  SessionLength,
  SkillInput,
  SkillType,
  SkillWithTeacher,
} from '../../types/skill.types';

interface SkillFormModalProps {
  open: boolean;
  onClose: () => void;
  skill?: SkillWithTeacher | null;
  onSubmit: (input: SkillInput) => Promise<void>;
}

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function SkillFormModal({ open, onClose, skill, onSubmit }: SkillFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<SkillType>('teach');
  const [categoryId, setCategoryId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel>('beginner');
  const [format, setFormat] = useState<SessionFormat>('either');
  const [sessionLength, setSessionLength] = useState<SessionLength>('1hr');
  const [showOnMap, setShowOnMap] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    setType(skill?.type ?? 'teach');
    setCategoryId(skill?.categoryId ?? '');
    setSkillName(skill?.skillName ?? '');
    setDescription(skill?.description ?? '');
    setProficiencyLevel(skill?.proficiencyLevel ?? 'beginner');
    setFormat(skill?.format ?? 'either');
    setSessionLength(skill?.sessionLength ?? '1hr');
    setShowOnMap(skill?.showOnMap ?? true);
    setError('');
  }, [open, skill]);

  const suggestedNames = useMemo(
    () => categories.find((c) => c._id === categoryId)?.skills.map((s) => s.name) ?? [],
    [categories, categoryId]
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!categoryId) {
      setError('Please choose a category');
      return;
    }
    if (!skillName.trim()) {
      setError('Please enter a skill name');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        categoryId,
        skillName: skillName.trim(),
        description: description.trim(),
        proficiencyLevel,
        format,
        sessionLength,
        showOnMap,
      });
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={skill ? 'Edit skill' : 'Add a skill'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">This skill is</span>
          <div className="flex gap-3">
            {(['teach', 'learn'] as const).map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="skillType"
                  checked={type === option}
                  onChange={() => setType(option)}
                  className="h-4 w-4 accent-indigo-600"
                />
                {option === 'teach' ? 'I can teach it' : 'I want to learn it'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {getCategoryVisual(category.name).emoji} {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Skill name</label>
          <Input
            list="skill-suggestions"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            placeholder={type === 'teach' ? 'e.g. Sourdough Baking' : 'e.g. Vegetable Gardening'}
            maxLength={100}
          />
          {suggestedNames.length > 0 && (
            <datalist id="skill-suggestions">
              {suggestedNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {type === 'teach' ? 'My story with this skill' : 'What you would like to learn'}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            className={inputClass}
            placeholder={type === 'teach' ? 'Max 500 characters' : 'Optional (max 500 characters)'}
          />
          <p className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">{description.length}/500</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Experience</label>
            <select
              value={proficiencyLevel}
              onChange={(e) => setProficiencyLevel(e.target.value as ProficiencyLevel)}
              className={inputClass}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as SessionFormat)}
              className={inputClass}
            >
              <option value="in-person">In-person</option>
              <option value="online">Online</option>
              <option value="either">Either</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Session length</label>
            <select
              value={sessionLength}
              onChange={(e) => setSessionLength(e.target.value as SessionLength)}
              className={inputClass}
            >
              <option value="30min">30 min</option>
              <option value="1hr">1 hr</option>
              <option value="2hr+">2 hr+</option>
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={showOnMap}
            onChange={(event) => setShowOnMap(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
          />
          Show in map
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {skill ? 'Save changes' : 'Add skill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
