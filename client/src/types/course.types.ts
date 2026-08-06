export interface CourseTeacher {
  _id: string;
  displayName: string;
  avatar: string;
}

export interface CourseSkill {
  _id: string;
  skillName: string;
  categoryName: string;
  description?: string;
}

export interface CourseSession {
  title: string;
  description: string;
  objectives: string[];
  order: number;
  estimatedMinutes: number;
}

export interface Course {
  _id: string;
  teacherId: CourseTeacher;
  skillId: CourseSkill;
  title: string;
  description: string;
  sessions: CourseSession[];
  maxEnrollments: number;
  enrollmentCount: number;
  status: 'draft' | 'published' | 'archived';
  totalEstimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListResult {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCourseInput {
  skillId: string;
  title: string;
  description?: string;
  sessions: Array<{
    title: string;
    description?: string;
    objectives?: string[];
    order?: number;
    estimatedMinutes?: number;
  }>;
  maxEnrollments?: number;
}

export interface SessionProgress {
  sessionIndex: number;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface CourseEnrollment {
  _id: string;
  courseId: Course;
  learnerId: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progress: SessionProgress[];
  startedAt: string;
  completedAt?: string;
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
}
