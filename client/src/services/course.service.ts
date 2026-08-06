import api from './api';
import type {
  Course,
  CourseListResult,
  CreateCourseInput,
  CourseEnrollment,
} from '../types/course.types';

export async function createCourse(input: CreateCourseInput): Promise<Course> {
  const { data } = await api.post('/courses', input);
  return data.data.course;
}

export async function listCourses(
  params: { teacherId?: string; skillId?: string; status?: string; page?: number; limit?: number } = {}
): Promise<CourseListResult> {
  const { data } = await api.get('/courses', { params });
  return data.data;
}

export async function getCourse(id: string): Promise<Course> {
  const { data } = await api.get(`/courses/${id}`);
  return data.data.course;
}

export async function enrollInCourse(id: string): Promise<CourseEnrollment> {
  const { data } = await api.post(`/courses/${id}/enroll`);
  return data.data.enrollment;
}

export async function completeSession(
  id: string,
  sessionIndex: number,
  notes?: string
): Promise<CourseEnrollment> {
  const { data } = await api.post(`/courses/${id}/complete-session`, { sessionIndex, notes });
  return data.data.enrollment;
}

export async function getMyEnrollments(status?: string): Promise<CourseEnrollment[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const { data } = await api.get('/courses/my-enrollments', { params });
  return data.data.enrollments;
}

export async function updateCourse(
  id: string,
  input: { title?: string; description?: string; status?: string }
): Promise<Course> {
  const { data } = await api.patch(`/courses/${id}`, input);
  return data.data.course;
}
