import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AuthShell from '../../components/auth/AuthShell';
import Button from '../../components/ui/Button';
import { submitIdentity } from '../../services/auth.service';
import { getApiError } from '../../types/api.types';

export default function IdentityVerificationPage() {
  const navigate = useNavigate();
  const [idType, setIdType] = useState<'nid' | 'student_id' | 'passport'>('nid');
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!identityFile) {
      setError('Upload your identity document');
      return;
    }
    setLoading(true);
    try {
      await submitIdentity(idType, identityFile);
      toast.success('Identity submitted for review');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Submit your identity" subtitle="Your document is reviewed privately by our team.">
      <div className="card animate-fade-in-up p-6 sm:p-8">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <FiShield className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Choose one government or institutional ID. Your uploaded document is visible only to authorized reviewers.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identity-type" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Identity document</label>
            <select id="identity-type" value={idType} onChange={(event) => setIdType(event.target.value as typeof idType)} className="block h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
              <option value="nid">National ID (NID)</option>
              <option value="student_id">Student ID</option>
              <option value="passport">Passport Number</option>
            </select>
          </div>
          <div>
            <label htmlFor="identity-file" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Upload document</label>
            <label htmlFor="identity-file" className="flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"><FiUpload className="h-4 w-4" /><span className="truncate">{identityFile?.name || 'PDF, JPEG, or PNG (max 10MB)'}</span></label>
            <input id="identity-file" className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" required onChange={(event) => setIdentityFile(event.target.files?.[0] || null)} />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Submit for review</Button>
        </form>
      </div>
    </AuthShell>
  );
}
