import api from './api';
import type { User } from '../types/user.types';
import type { Report, ReportListResult, ReportListParams } from '../types/report.types';

export interface AdminUserList {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface ModerationStats {
  totalUsers: number;
  totalSkills: number;
  totalSessions: number;
  reportsThisWeek: number;
  openReports: number;
  suspendedUsers: number;
  bannedUsers: number;
}

export async function listUsers(params: AdminListParams): Promise<AdminUserList> {
  const { data } = await api.get('/admin/users', { params });
  return data.data as AdminUserList;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await api.get(`/admin/users/${id}`);
  return (data.data as { user: User }).user;
}

export async function updateUserStatus(
  id: string,
  status: string,
  suspensionExpiresAt?: string
): Promise<User> {
  const { data } = await api.patch(`/admin/users/${id}/status`, {
    status,
    suspensionExpiresAt,
  });
  return (data.data as { user: User }).user;
}

export async function updateUserRole(id: string, role: string): Promise<User> {
  const { data } = await api.patch(`/admin/users/${id}/role`, { role });
  return (data.data as { user: User }).user;
}

export async function warnUser(id: string, reason?: string, reportId?: string): Promise<User> {
  const { data } = await api.post(`/admin/users/${id}/warn`, { reason, reportId });
  return (data.data as { user: User }).user;
}

export async function suspendUser(
  id: string,
  durationDays: number,
  reason?: string,
  reportId?: string,
): Promise<User> {
  const { data } = await api.post(`/admin/users/${id}/suspend`, {
    durationDays,
    reason,
    reportId,
  });
  return (data.data as { user: User }).user;
}

export async function banUser(id: string, reason?: string, reportId?: string): Promise<User> {
  const { data } = await api.post(`/admin/users/${id}/ban`, { reason, reportId });
  return (data.data as { user: User }).user;
}

export async function reactivateUser(id: string): Promise<User> {
  const { data } = await api.post(`/admin/users/${id}/reactivate`);
  return (data.data as { user: User }).user;
}

export async function getModerationStats(): Promise<ModerationStats> {
  const { data } = await api.get('/admin/stats');
  return data.data as ModerationStats;
}

export async function listReports(params: ReportListParams = {}): Promise<ReportListResult> {
  const { data } = await api.get('/reports', { params });
  return data.data as ReportListResult;
}

export async function getReport(id: string): Promise<Report> {
  const { data } = await api.get(`/reports/${id}`);
  return (data.data as { report: Report }).report;
}

export async function assignReport(id: string): Promise<Report> {
  const { data } = await api.patch(`/reports/${id}/assign`);
  return (data.data as { report: Report }).report;
}

export async function resolveReport(
  id: string,
  input: { status: 'resolved' | 'dismissed'; action?: string; resolution?: string },
): Promise<Report> {
  const { data } = await api.patch(`/reports/${id}/resolve`, input);
  return (data.data as { report: Report }).report;
}

export async function removeSkill(id: string, reason?: string, reportId?: string): Promise<void> {
  await api.post(`/admin/skills/${id}/remove`, { reason, reportId });
}

export async function removeReview(id: string, reason?: string, reportId?: string): Promise<void> {
  await api.post(`/admin/reviews/${id}/remove`, { reason, reportId });
}

export async function deleteMessage(id: string, reason?: string, reportId?: string): Promise<void> {
  await api.post(`/admin/messages/${id}/remove`, { reason, reportId });
}
