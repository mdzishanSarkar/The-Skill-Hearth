import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import * as adminService from '../../services/admin.service';
import { getApiError } from '../../types/api.types';
import type { Report, ReportStatus } from '../../types/report.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import PageHeader from '../../components/ui/PageHeader';
import { FiFlag } from 'react-icons/fi';

const STATUS_OPTIONS: (ReportStatus | 'all')[] = ['all', 'open', 'under_review', 'resolved', 'dismissed'];
const TARGET_OPTIONS = ['all', 'user', 'skill', 'message', 'review', 'post'] as const;

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
  under_review: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
  resolved: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
  dismissed: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

const reasonLabels: Record<string, string> = {
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  spam: 'Spam',
  fake: 'Fake',
  'no-show': 'No-show',
  misleading: 'Misleading',
  other: 'Other',
};

export default function AdminReportsPage() {
  const { user: me, status } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveAction, setResolveAction] = useState('');
  const [resolveResolution, setResolveResolution] = useState('');

  const isModerator = me && (me.role === 'admin' || me.role === 'moderator');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: adminService.AdminListParams & { status?: string; targetType?: string } = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (targetFilter !== 'all') params.targetType = targetFilter;
      const result = await adminService.listReports(params);
      setReports(result.reports);
      setTotal(result.totalPages);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, targetFilter]);

  useEffect(() => {
    if (!isModerator) return;
    loadReports();
  }, [isModerator, loadReports]);

  if (status === 'loading') return <Spinner />;
  if (!isModerator) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleAssign(id: string) {
    try {
      await adminService.assignReport(id);
      toast.success('Report assigned to you');
      loadReports();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleResolve(id: string) {
    if (!resolveAction) {
      toast.error('Please select an action.');
      return;
    }
    setResolving(true);
    try {
      await adminService.resolveReport(id, {
        status: 'resolved',
        action: resolveAction,
        resolution: resolveResolution.trim() || undefined,
      });
      toast.success('Report resolved');
      setSelectedReport(null);
      setResolveAction('');
      setResolveResolution('');
      loadReports();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setResolving(false);
    }
  }

  async function handleDismiss(id: string) {
    try {
      await adminService.resolveReport(id, { status: 'dismissed' });
      toast.success('Report dismissed');
      setSelectedReport(null);
      loadReports();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiFlag />}
        title="Reports Queue"
        subtitle={`${total} total reports`}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as ReportStatus | 'all'); setPage(1); }}
          className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={targetFilter}
          onChange={(e) => { setTargetFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
        >
          {TARGET_OPTIONS.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'All targets' : t}</option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading && reports.length === 0 && (
          <div className="py-12 text-center"><Spinner /></div>
        )}

        {!loading && reports.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No reports found.</p>
        )}

        {reports.map((report) => (
          <div
            key={report._id}
            role="button"
            tabIndex={0}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm cursor-pointer hover:border-indigo-200"
            onClick={() => setSelectedReport(report)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedReport(report);
              }
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[report.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{report.targetType}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{reasonLabels[report.reason] || report.reason}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {report.description || 'No description provided.'}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                  {report.reporter && <span>by {report.reporter.displayName}</span>}
                  {report.assignedTo && <span>Assigned</span>}
                </div>
              </div>
              <Button
                variant="secondary"
                className="shrink-0 text-xs"
                onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}
              >
                Review
              </Button>
            </div>
          </div>
        ))}
      </div>

      {total > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="py-2 text-sm text-gray-600 dark:text-gray-400">Page {page} of {total}</span>
          <Button variant="secondary" disabled={page >= total} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-gray-950/70" onClick={() => setSelectedReport(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Report Detail</h2>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                aria-label="Close"
                className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Target</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedReport.targetType}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Reason</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{reasonLabels[selectedReport.reason] || selectedReport.reason}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <p className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[selectedReport.status]}`}>
                    {selectedReport.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedReport.reporter && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Reporter</span>
                  <div className="mt-1 flex items-center gap-2">
                    <Avatar src={selectedReport.reporter.avatar} name={selectedReport.reporter.displayName} size="sm" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedReport.reporter.displayName}</span>
                  </div>
                </div>
              )}

              {selectedReport.description && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.contextMessages && selectedReport.contextMessages.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Context messages</span>
                  <div className="mt-1 space-y-1">
                    {selectedReport.contextMessages.map((msg, i) => (
                      <p key={i} className="rounded bg-gray-50 dark:bg-gray-900 p-2 text-xs text-gray-600 dark:text-gray-400">{msg}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.resolution && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Resolution</span>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedReport.resolution}</p>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resolve</span>
                <div className="mt-2 space-y-2">
                  <select
                    value={resolveAction}
                    onChange={(e) => setResolveAction(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="">Select action...</option>
                    <option value="warn_user">Warn user</option>
                    <option value="suspend_user">Suspend user</option>
                    <option value="ban_user">Ban user</option>
                    <option value="remove_content">Remove content</option>
                    <option value="no_action">No action needed</option>
                  </select>
                  <textarea
                    value={resolveResolution}
                    onChange={(e) => setResolveResolution(e.target.value)}
                    rows={2}
                    placeholder="Resolution notes (optional)"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                {!selectedReport.assignedTo && me.role === 'admin' && (
                  <Button variant="secondary" onClick={() => handleAssign(selectedReport._id)}>
                    Assign to me
                  </Button>
                )}
                <Button variant="secondary" onClick={() => handleDismiss(selectedReport._id)}>
                  Dismiss
                </Button>
                <Button loading={resolving} onClick={() => handleResolve(selectedReport._id)}>
                  Resolve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
