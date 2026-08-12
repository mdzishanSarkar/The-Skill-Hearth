import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { endorseSkill, removeEndorsement, checkEndorsed } from '../../services/endorsement.service';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';

interface EndorsementButtonProps {
  endorseeId: string;
  skillId: string;
  connectionId: string;
  onEndorsed?: () => void;
}

export default function EndorsementButton({ endorseeId, skillId, connectionId, onEndorsed }: EndorsementButtonProps) {
  const [endorsed, setEndorsed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkEndorsed(endorseeId, skillId).then(setEndorsed).catch(() => {});
  }, [endorseeId, skillId]);

  async function handleToggle() {
    setLoading(true);
    try {
      if (endorsed) {
        await removeEndorsement(connectionId);
        setEndorsed(false);
        toast.success('Endorsement removed');
      } else {
        await endorseSkill(endorseeId, skillId, connectionId);
        setEndorsed(true);
        toast.success('Skill endorsed!');
        onEndorsed?.();
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={endorsed ? 'secondary' : 'secondary'}
      size="sm"
      loading={loading}
      onClick={handleToggle}
      className={endorsed ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : ''}
    >
      {endorsed ? 'Endorsed' : 'Endorse'}
    </Button>
  );
}
