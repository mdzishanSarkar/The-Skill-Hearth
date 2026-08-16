import { useEffect, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { FiCrosshair, FiPlus, FiAperture, FiSettings } from 'react-icons/fi';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { getRadar, getIntents } from '../../services/skillRadar.service';
import { getApiError } from '../../types/api.types';
import type { RadarIntent, ManualRadar, SkillRadarDoc } from '../../types/radar.types';
import IntentCard from './IntentCard';
import ManualRadarCard from './ManualRadarCard';
import CreateManualRadarModal from './CreateManualRadarModal';

export default function SkillRadarPage() {
  const [tab, setTab] = useState<'intents' | 'manual'>('intents');
  const [radar, setRadar] = useState<SkillRadarDoc | null>(null);
  const [intents, setIntents] = useState<RadarIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [radarData, intentData] = await Promise.all([getRadar(), getIntents()]);
      setRadar(radarData);
      setIntents(intentData);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleIntentChanged(updated: RadarIntent) {
    setIntents((prev) => prev.map((i) => (i.category === updated.category ? updated : i)));
  }

  function handleManualCreated(created: ManualRadar) {
    setRadar((prev) => (prev ? { ...prev, manualRadars: [...prev.manualRadars, created] } : prev));
  }

  function handleManualDeleted(id: string) {
    setRadar((prev) => (prev ? { ...prev, manualRadars: prev.manualRadars.filter((m) => m._id !== id) } : prev));
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiAperture />}
        title="My Radar"
        subtitle="The Skill Hearth silently learns what you're looking for from your activity, and keeps watch so you don't have to."
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setTab('intents')}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'intents'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
          >
            <FiCrosshair /> Auto-Detected Intents
          </button>
          <button
            type="button"
            onClick={() => setTab('manual')}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === 'manual'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            )}
          >
            <FiSettings /> My Custom Radars
            {radar && radar.manualRadars.length > 0 && (
              <span className="ml-0.5 rounded-full bg-black/10 px-1.5 text-xs dark:bg-white/10">
                {radar.manualRadars.length}
              </span>
            )}
          </button>
        </div>
        {tab === 'manual' && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <FiPlus className="mr-1" /> New Custom Radar
          </Button>
        )}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : tab === 'intents' ? (
          intents.length > 0 ? (
            <ul className="space-y-3">
              {intents.map((intent) => (
                <li key={intent.category}>
                  <IntentCard intent={intent} onChanged={handleIntentChanged} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<FiAperture />}
              title="No intents detected yet"
              description="Browse skills, search, and view profiles — your radar learns from your activity and builds intents automatically."
            />
          )
        ) : radar && radar.manualRadars.length > 0 ? (
          <ul className="space-y-2">
            {radar.manualRadars.map((m) => (
              <li key={m._id}>
                <ManualRadarCard radar={m} onDeleted={handleManualDeleted} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<FiSettings />}
            title="No custom radars"
            description="Create a custom radar to watch a specific combination of filters."
            action={
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <FiPlus className="mr-1" /> New Custom Radar
              </Button>
            }
          />
        )}
      </div>

      <CreateManualRadarModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleManualCreated} />
    </div>
  );
}
