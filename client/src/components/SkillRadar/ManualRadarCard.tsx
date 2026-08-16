import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import { deleteManualRadar } from '../../services/skillRadar.service';
import type { ManualRadar } from '../../types/radar.types';
import { getApiError } from '../../types/api.types';

function filterSummary(m: ManualRadar): string {
  const f = m.filters ?? {};
  const parts: string[] = [];
  if (f.category) parts.push(f.category);
  if (f.type) parts.push(f.type);
  if (f.format) parts.push(f.format);
  if (f.proficiencyLevel) parts.push(f.proficiencyLevel);
  if (f.radius) parts.push(`${f.radius} km`);
  return parts.length ? parts.join(' · ') : 'All skills';
}

interface ManualRadarCardProps {
  radar: ManualRadar;
  onDeleted: (id: string) => void;
}

export default function ManualRadarCard({ radar, onDeleted }: ManualRadarCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${radar.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteManualRadar(radar._id);
      onDeleted(radar._id);
      toast.success('Radar deleted');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{radar.name}</h3>
          {radar.alertedSkillIds.length > 0 && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              {radar.alertedSkillIds.length} alerted
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{filterSummary(radar)}</p>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
      >
        <FiTrash2 /> Delete
      </button>
    </div>
  );
}
