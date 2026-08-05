import api from './api';
import type {
  OnboardingInput,
  UpdateProfileInput,
  User,
} from '../types/user.types';

export async function getMe(): Promise<User> {
  const { data } = await api.get('/users/me');
  return (data.data as { user: User }).user;
}

export async function updateMe(input: UpdateProfileInput): Promise<User> {
  const { data } = await api.put('/users/me', input);
  return (data.data as { user: User }).user;
}

export async function completeOnboarding(input: OnboardingInput): Promise<User> {
  const { data } = await api.post('/users/me/onboarding', input);
  return (data.data as { user: User }).user;
}

export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await api.post('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return (data.data as { user: User }).user;
}

export async function getUserById(id: string): Promise<User> {
  const { data } = await api.get(`/users/${id}`);
  return (data.data as { user: User }).user;
}
