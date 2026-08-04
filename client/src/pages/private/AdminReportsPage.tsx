import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import * as reportsService from '../../services/reports';
import * as adminService from '../../services/admin.service';
import { getApiError } from '../../types/api.types';
import type { Report, ReportStatus, ReportTargetType } from '../../types/report.types';
import {
  REPORT_ACTION_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
} from '../../types/report.types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

const FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const statusBadge: Record<ReportStatus, string> = {
  open: 'bg-red-100 text-red-800',
  under_review: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-700',
};

const targetBadge: Record<ReportTargetType, string> = {
  user: 'indigo',
  skill: 'green',
  message: 'blue',
  review: 'purple',
  post: 'teal',
};

export default function AdminReportsPage() {
  const { user: me, status } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await reportsService.listReports({ status: filter, page, limit: 20 });
      setReports(result.reports);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }
  if (me?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  async function refresh() {
    await load();
    if (selected) {
      try {
        const fresh = await reportsService.getReport(selected._id);
        setSelected(fresh);
      } catch {
        setSelected(null);
      }
    }
  }

  function openReport(report: Report) {
    setSelected(report);
    setDetailOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports queue</h1>
        <p className="mt-1 text-sm text-gray-600">
          {total} {total === 1 ? 'report' : 'reports'}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setFilter(item.value);
              setPage(1);
            }}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              filter === item.value
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">No reports in this view.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reports.map((report) => (
              <li key={report._id}>
                <button
                  type="button"
                  onClick={() => openReport(report)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <Badge color={targetBadge[report.targetType] as 'indigo'}>
                    {report.targetType}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {getTargetLabel(report)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {REPORT_REASON_LABELS[report.reason]}
                      {report.description ? ` · ${report.description}` : ''}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {report.reporter && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Avatar
                          src={report.reporter.avatar || undefined}
                          name={report.reporter.displayName}
                          size="sm"
                        />
                        {report.reporter.displayName}
                      </span>
                    )}
                    <span
                      className={clsx(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        statusBadge[report.status]
                      )}
                    >
                      {REPORT_STATUS_LABELS[report.status]}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatDate(report.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ReportDetailModal
        report={selected}
        meId={me._id}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onChanged={refresh}
      />
    </div>
  );
}

function getTargetLabel(report: Report): string {
  const target = report.target;
  if (!target) return 'Removed content';
  switch (report.targetType) {
    case 'user':
      return 'displayName' in target ? target.displayName : 'User';
    case 'skill':
      return 'skillName' in target ? target.skillName : 'Skill';
    case 'message':
      return 'content' in target && target.content ? String(target.content).slice(0, 60) : 'Message';
    case 'review':
      return 'rating' in target ? `Review (${target.rating}★)` : 'Review';
    case 'post':
      return 'content' in target ? String(target.content).slice(0, 60) : 'Post';
  }
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface ReportDetailModalProps {
  report: Report | null;
  meId: string;
  open: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

function ReportDetailModal({ report, meId, open, onClose, onChanged }: ReportDetailModalProps) {
  const [busy, setBusy] = useState(false);
  const [durationDays, setDurationDays] = useState(7);
  const [resolution, setResolution] = useState('');
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    if (open) {
      setDurationDays(7);
      setResolution('');
      setActionReason('');
    }
  }, [open]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      toast.success(successMessage);
      await onChanged();
      onClose();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (!report) return null;
  const current = report;

  const isOpen = current.status === 'open' || current.status === 'under_review';
  const assignedToMe = current.assignedTo === meId;

  function userAction(actionName: 'warn' | 'suspend' | 'ban') {
    if (actionName === 'suspend') {
      return run(
        () =>
          adminService.suspendUser(current.targetId, durationDays, {
            reportId: current._id,
            resolution: resolution.trim() || undefined,
            reason: actionReason.trim() || undefined,
          }),
        `Account suspended for ${durationDays} days`
      );
    }
    if (actionName === 'warn') {
      return run(
        () =>
          adminService.warnUser(current.targetId, {
            reportId: current._id,
            resolution: resolution.trim() || undefined,
            reason: actionReason.trim() || undefined,
          }),
        'Warning issued'
      );
    }
    return run(
      () =>
        adminService.banUser(current.targetId, {
          reportId: current._id,
          resolution: resolution.trim() || undefined,
          reason: actionReason.trim() || undefined,
        }),
      'Account banned'
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Report details" maxWidth="max-w-2xl">
      <div className="flex flex-wrap items-center gap-2">
        <Badge color={targetBadge[current.targetType] as 'indigo'}>{current.targetType}</Badge>
        <Badge color="amber">{REPORT_REASON_LABELS[current.reason]}</Badge>
        <span
          className={clsx(
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
            statusBadge[current.status]
          )}
        >
          {REPORT_STATUS_LABELS[current.status]}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
        <p>
          Reported by{' '}
          <span className="font-medium text-gray-900">{current.reporter?.displayName ?? 'Unknown'}</span>
        </p>
        <p>
          {current.assignedTo ? (
            assignedToMe ? (
              <span className="text-green-700">Assigned to you</span>
            ) : (
              'Assigned'
            )
          ) : (
            'Unassigned'
          )}
        </p>
        <p>{formatDate(current.createdAt)}</p>
      </div>

      {current.description && (
        <div className="mt-4 rounded-md bg-gray-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Reporter details
          </p>
          <p className="mt-1 text-sm text-gray-700">{current.description}</p>
        </div>
      )}

      <TargetContent report={current} />

      {isOpen && (
        <>
          {!assignedToMe && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                loading={busy}
                onClick={() =>
                  run(
                    () => reportsService.assignReportToSelf(current._id),
                    'Report assigned to you'
                  )
                }
              >
                Assign to me
              </Button>
            </div>
          )}

          <div className="mt-4 rounded-md border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900">Moderation action</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Taking an action resolves this report and notifies the affected user.
            </p>

            <div className="mt-3">
              <label htmlFor="action-reason" className="block text-sm font-medium text-gray-700">
                Reason given to the user <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="action-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="e.g. Repeated harassment in chat"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="resolution-note" className="block text-sm font-medium text-gray-700">
                Resolution note <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="resolution-note"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Internal note saved on the report"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {current.targetType === 'user' ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busy}
                    onClick={() => userAction('warn')}
                  >
                    Warn
                  </Button>
                  <div className="flex items-center gap-2">
                    <label htmlFor="suspend-days" className="text-sm text-gray-600">
                      Suspend
                    </label>
                    <input
                      id="suspend-days"
                      type="number"
                      min={1}
                      max={30}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value) || 7)}
                      className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">days</span>
                    <Button size="sm" loading={busy} onClick={() => userAction('suspend')}>
                      Suspend
                    </Button>
                  </div>
                  <Button size="sm" variant="danger" loading={busy} onClick={() => userAction('ban')}>
                    Ban
                  </Button>
                </>
              ) : current.targetType === 'skill' ? (
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy}
                  onClick={() =>
                    run(
                      () =>
                        adminService.removeSkill(current.targetId, {
                          reportId: current._id,
                          resolution: resolution.trim() || undefined,
                          reason: actionReason.trim() || undefined,
                        }),
                      'Listing removed'
                    )
                  }
                >
                  Remove listing
                </Button>
              ) : current.targetType === 'message' ? (
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy}
                  onClick={() =>
                    run(
                      () =>
                        adminService.deleteMessage(current.targetId, {
                          reportId: current._id,
                          resolution: resolution.trim() || undefined,
                          reason: actionReason.trim() || undefined,
                        }),
                      'Message removed'
                    )
                  }
                >
                  Remove message
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy}
                  onClick={() =>
                    run(
                      () =>
                        adminService.removeReview(current.targetId, {
                          reportId: current._id,
                          resolution: resolution.trim() || undefined,
                          reason: actionReason.trim() || undefined,
                        }),
                      'Review removed'
                    )
                  }
                >
                  Remove review
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                loading={busy}
                onClick={() =>
                  run(
                    () =>
                      reportsService.resolveReport(current._id, {
                        status: 'dismissed',
                        action: 'no_action',
                        resolution: resolution.trim() || 'No action taken',
                      }),
                    'Report dismissed'
                  )
                }
              >
                Dismiss — no action
              </Button>
            </div>
          </div>
        </>
      )}

      {!isOpen && (
        <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Outcome</p>
          <p className="mt-1">
            {current.action ? REPORT_ACTION_LABELS[current.action] : 'No action taken'}
            {current.resolution ? ` — ${current.resolution}` : ''}
          </p>
        </div>
      )}
    </Modal>
  );
}

function TargetContent({ report }: { report: Report }) {
  const target = report.target;

  if (report.targetType === 'message') {
    return (
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Message in context
        </p>
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          {report.contextMessages && report.contextMessages.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {report.contextMessages.map((item) => {
                const isTarget = item._id === report.targetId;
                return (
                  <p
                    key={item._id}
                    className={clsx(
                      'rounded-md px-2 py-1 text-sm',
                      isTarget ? 'bg-red-50 font-medium text-red-800' : 'text-gray-700'
                    )}
                  >
                    {item.content ?? '[removed]'}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No surrounding context captured.</p>
          )}
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm text-gray-500">
        The reported content has already been removed.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Reported {report.targetType}
      </p>
      {report.targetType === 'user' && 'displayName' in target && (
        <div className="mt-2 flex items-center gap-3">
          <Avatar src={target.avatar || undefined} name={target.displayName} size="md" />
          <div>
            <p className="text-sm font-medium text-gray-900">{target.displayName}</p>
            <p className="text-xs text-gray-500">{target.email}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Role: {target.role} · Status:{' '}
              <span className={target.status === 'active' ? 'text-green-700' : 'text-red-700'}>
                {target.status}
              </span>
            </p>
          </div>
        </div>
      )}
      {report.targetType === 'skill' && 'skillName' in target && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-900">{target.skillName}</p>
          <p className="text-xs text-gray-500">
            {target.categoryName} · {target.type}
            {target.isDeleted ? ' · removed' : ''}
          </p>
        </div>
      )}
      {report.targetType === 'review' && 'rating' in target && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-900">
            Rating: {'★'.repeat(target.rating)}
            {'☆'.repeat(5 - target.rating)}
          </p>
          <p className="mt-1 text-sm text-gray-700">{target.content || 'No written review'}</p>
        </div>
      )}
      {report.targetType === 'post' && 'content' in target && (
        <p className="mt-2 text-sm text-gray-700">{target.content}</p>
      )}
    </div>
  );
}
