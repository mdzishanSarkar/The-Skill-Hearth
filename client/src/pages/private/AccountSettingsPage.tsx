import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { exportAccountData, deleteAccount } from '../../services/social.service';
import { getApiError } from '../../types/api.types';
import Button from '../../components/ui/Button';
import LinkedAccounts from '../../components/social/LinkedAccounts';
import TwoFactorSetup from '../../components/social/TwoFactorSetup';
import type { TwoFactorStatus } from '../../types/social.types';
import { getTwoFactorStatus } from '../../services/social.service';
import QuietHoursSettings from '../../components/settings/QuietHoursSettings';
import PageHeader from '../../components/ui/PageHeader';
import { FiSettings } from 'react-icons/fi';
import { useEffect } from 'react';

export default function AccountSettingsPage() {
  const { logout } = useAuth();
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFactorStatus>({ enabled: false, lastUsedAt: null });
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getTwoFactorStatus().then(setTwoFAStatus).catch(() => {});
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportAccountData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'skill-hearth-data.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    if (!window.confirm('This will permanently delete all your data. Are you absolutely sure?')) return;

    setDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted');
      logout();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiSettings />}
        title="Account Settings"
        subtitle="Manage your account security and data."
      />

      <div className="mt-8 space-y-6">
        <LinkedAccounts />

        <TwoFactorSetup status={twoFAStatus} onStatusChange={setTwoFAStatus} />

        <QuietHoursSettings />

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export Your Data</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Download a copy of all your data including skills, connections, messages, and reviews.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            loading={exporting}
            onClick={handleExport}
          >
            Download data export
          </Button>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-5 dark:bg-red-950/40">
          <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            loading={deleting}
            onClick={handleDelete}
          >
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}
