import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createSkill, deleteSkill, listMySkills, toggleSkill, updateSkill } from '../../services/skills';
import { getApiError } from '../../types/api.types';
import type { SkillInput, SkillType, SkillWithTeacher } from '../../types/skill.types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import SkillCard from '../../components/shared/SkillCard';
import SkillFormModal from '../../components/shared/SkillFormModal';

const LIMIT = 20;

export default function MySkillsPage() {
  const [tab, setTab] = useState<SkillType>('teach');
  const [skills, setSkills] = useState<SkillWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SkillWithTeacher | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listMySkills({ type: tab, page: 1, limit: LIMIT });
      setSkills(result.skills);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(input: SkillInput) {
    await createSkill(input);
    toast.success('Skill added');
    await load();
  }

  async function handleUpdate(input: SkillInput) {
    if (!editing) return;
    await updateSkill(editing._id, input);
    toast.success('Skill updated');
    setEditing(null);
    await load();
  }

  async function handleToggle(skill: SkillWithTeacher) {
    try {
      await toggleSkill(skill._id, !skill.isActive);
      toast.success(skill.isActive ? 'Skill paused' : 'Skill activated');
      await load();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDelete(skill: SkillWithTeacher) {
    if (!window.confirm(`Delete "${skill.skillName}"? This can be restored by an admin.`)) return;
    try {
      await deleteSkill(skill._id);
      toast.success('Skill deleted');
      await load();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My skills</h1>
          <p className="mt-1 text-sm text-gray-600">
            Share what you can teach and what you want to learn.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>Add skill</Button>
      </div>

      <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {(['teach', 'learn'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTab(type)}
            className={
              tab === type
                ? 'flex-1 rounded-md bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm'
                : 'flex-1 rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900'
            }
          >
            {type === 'teach' ? 'I can teach' : 'I want to learn'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : skills.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-600">
            {tab === 'teach'
              ? 'You have not listed any skills you can teach yet.'
              : 'You have not added any skills you want to learn yet.'}
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => { setEditing(null); setFormOpen(true); }}
          >
            Add your first skill
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillCard
              key={skill._id}
              skill={skill}
              isOwner
              onEdit={(s) => { setEditing(s); setFormOpen(true); }}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <SkillFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        skill={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </div>
  );
}
