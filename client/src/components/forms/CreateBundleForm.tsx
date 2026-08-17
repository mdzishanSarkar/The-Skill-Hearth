import { useEffect, useState } from 'react';
import { listMySkills } from '../../services/skills';
import { createBundle } from '../../services/bundle.service';
import type { SkillWithTeacher } from '../../types/skill.types';
import { showError, showSuccess } from '../../utils/toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

interface CreateBundleFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const MAX_SELECTABLE = 10;

export default function CreateBundleForm({ open, onClose, onCreated }: CreateBundleFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<SkillWithTeacher[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    listMySkills({ type: 'teach', limit: 50 })
      .then((result) => setSkills(result.skills))
      .catch(() => {
        showError('Could not load your skills');
        setSkills([]);
      })
      .finally(() => setLoadingSkills(false));
  }, [open]);

  if (!open) return null;

  function toggleSkill(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTABLE) {
        next.add(id);
      } else {
        showError(`A bundle can contain up to ${MAX_SELECTABLE} skills`);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showError('Bundle name is required');
      return;
    }
    if (selected.size < 2) {
      showError('Select at least 2 skills for your bundle');
      return;
    }
    setSubmitting(true);
    try {
      await createBundle(name.trim(), description.trim(), Array.from(selected));
      showSuccess('Bundle created!');
      setName('');
      setDescription('');
      setSelected(new Set());
      onClose();
      onCreated?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create bundle';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a skill bundle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bundle name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="e.g., Urban gardening starter"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={2}
            maxLength={500}
            placeholder="Why these skills together? Who is this path for?"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Skills to include (2–{MAX_SELECTABLE}) *
          </label>
          {loadingSkills ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : skills.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              You have no teach skills yet. Add some from "My skills" first.
            </p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              {skills.map((skill) => {
                const checked = selected.has(skill._id);
                return (
                  <label
                    key={skill._id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSkill(skill._id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-900 dark:text-gray-100">{skill.skillName}</span>
                    <span className="ml-auto text-xs text-gray-400">{skill.categoryName}</span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">{selected.size}/{MAX_SELECTABLE} selected</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create bundle
          </Button>
        </div>
      </form>
    </Modal>
  );
}
