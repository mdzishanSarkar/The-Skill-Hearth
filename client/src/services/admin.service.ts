import api from './api';
import type { User } from '../types/user.types';

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
