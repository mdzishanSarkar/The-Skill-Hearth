import { useState } from 'react';
import toast from 'react-hot-toast';
import { createManualRadar } from '../../services/skillRadar.service';
import type { ManualRadar } from '../../types/radar.types';
import { getApiError } from '../../types/api.types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const SELECTS = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'teach', label: 'Teach' },
      { value: 'learn', label: 'Learn' },
    ],
  },
  {
    key: 'format',
    label: 'Format',
    options: [
      { value: 'in-person', label: 'In person' },
      { value: 'online', label: 'Online' },
      { value: 'either', label: 'Either' },
    ],
  },
  {
    key: 'proficiencyLevel',
    label: 'Level',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
] as const;

const selectClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none';

interface CreateManualRadarModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (radar: ManualRadar) => void;
}

export default function CreateManualRadarModal({ open, onClose, onCreated }: CreateManualRadarModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [format, setFormat] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [radius, setRadius] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setCategory('');
    setType('');
    setFormat('');
    setProficiencyLevel('');
    setRadius('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const filters: ManualRadar['filters'] = {};
      if (category.trim()) filters.category = category.trim();
      if (type) filters.type = type as ManualRadar['filters']['type'];
      if (format) filters.format = format;
      if (proficiencyLevel) filters.proficiencyLevel = proficiencyLevel;
      if (radius) filters.radius = Number(radius);
      const created = await createManualRadar(name.trim(), filters);
      onCreated(created);
      toast.success('Manual radar created');
      handleClose();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Custom Radar">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Knitting teachers nearby"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Food & Cooking"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Radius (km)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
            />
          </div>
          {SELECTS.map((s) => (
            <div key={s.key}>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{s.label}</label>
              <select
                value={s.key === 'type' ? type : s.key === 'format' ? format : proficiencyLevel}
                onChange={(e) => {
                  const value = e.target.value;
                  if (s.key === 'type') setType(value);
                  else if (s.key === 'format') setFormat(value);
                  else setProficiencyLevel(value);
                }}
                className={selectClass}
              >
                <option value="">Any</option>
                {s.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" loading={saving}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
