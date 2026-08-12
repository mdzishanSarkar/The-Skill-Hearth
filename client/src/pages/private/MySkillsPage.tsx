import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createSkill, deleteSkill, listMySkills, toggleSkill, updateSkill } from '../../services/skills';
import { getApiError } from '../../types/api.types';
import type { SkillInput, SkillType, SkillWithTeacher } from '../../types/skill.types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiAward } from 'react-icons/fi';
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
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiAward />}
        title="My skills"
        subtitle="Share what you can teach and what you want to learn."
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>Add skill</Button>}
      />

      <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {(['teach', 'learn'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTab(type)}
            className={
              tab === type
                ? 'flex-1 rounded-md bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'flex-1 rounded-md px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
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
        <EmptyState
          className="mt-8"
          icon={<FiAward />}
          title={tab === 'teach' ? 'No teaching skills yet' : 'No learning goals yet'}
          description={
            tab === 'teach'
              ? 'You have not listed any skills you can teach yet.'
              : 'You have not added any skills you want to learn yet.'
          }
          action={
            <Button variant="secondary" onClick={() => { setEditing(null); setFormOpen(true); }}>
              Add your first skill
            </Button>
          }
        />
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
