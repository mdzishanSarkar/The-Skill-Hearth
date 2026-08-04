import api from './api';
import type {
  Report,
  ReportListParams,
  ReportListResult,
  SubmitReportInput,
} from '../types/report.types';

export async function submitReport(input: SubmitReportInput): Promise<Report> {
  const { data } = await api.post('/reports', input);
  return (data.data as { report: Report }).report;
}

export async function listReports(params: ReportListParams = {}): Promise<ReportListResult> {
  const { data } = await api.get('/admin/reports', { params });
  return data.data as ReportListResult;
}

export async function getReport(id: string): Promise<Report> {
  const { data } = await api.get(`/admin/reports/${id}`);
  return (data.data as { report: Report }).report;
}

export async function assignReportToSelf(id: string): Promise<Report> {
  const { data } = await api.patch(`/admin/reports/${id}/assign`);
  return (data.data as { report: Report }).report;
}

export async function resolveReport(
  id: string,
  input: { status: 'resolved' | 'dismissed'; action?: string; resolution?: string }
): Promise<Report> {
  const { data } = await api.patch(`/admin/reports/${id}/resolve`, input);
  return (data.data as { report: Report }).report;
}
