import { Types } from 'mongoose';
import { Course, CourseEnrollment, Skill, User, Notification } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface CreateCourseInput {
  teacherId: string;
  skillId: string;
  title: string;
  description?: string;
  sessions: Array<{
    title: string;
    description?: string;
    objectives?: string[];
    order: number;
    estimatedMinutes?: number;
  }>;
  maxEnrollments?: number;
}

export async function createCourse(input: CreateCourseInput) {
  const skill = await Skill.findOne({
    _id: toObjectId(input.skillId),
    userId: toObjectId(input.teacherId),
    isDeleted: false,
  });
  if (!skill) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found or does not belong to you');
  }

  if (input.sessions.length < 3 || input.sessions.length > 6) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Course must have 3 to 6 sessions');
  }

  const totalMinutes = input.sessions.reduce((sum, s) => sum + (s.estimatedMinutes || 60), 0);

  const course = await Course.create({
    teacherId: toObjectId(input.teacherId),
    skillId: toObjectId(input.skillId),
    title: input.title.trim(),
    description: input.description?.trim() || '',
    sessions: input.sessions.map((s, i) => ({
      title: s.title.trim(),
      description: s.description?.trim() || '',
      objectives: s.objectives || [],
      order: s.order ?? i,
      estimatedMinutes: s.estimatedMinutes || 60,
    })),
    maxEnrollments: input.maxEnrollments || 20,
    totalEstimatedMinutes: totalMinutes,
  });

  return course.toJSON();
}

export async function listCourses(query: {
  teacherId?: string;
  skillId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.teacherId) filter.teacherId = toObjectId(query.teacherId);
  if (query.skillId) filter.skillId = toObjectId(query.skillId);
  if (query.status) filter.status = query.status;
  else filter.status = 'published';

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'displayName avatar')
      .populate('skillId', 'skillName categoryName')
      .lean(),
    Course.countDocuments(filter),
  ]);

  return { courses, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getCourse(courseId: string) {
  const course = await Course.findOne({ _id: toObjectId(courseId) })
    .populate('teacherId', 'displayName avatar stats')
    .populate('skillId', 'skillName categoryName description')
    .lean();
  if (!course) throw new HttpError(404, 'COURSE_NOT_FOUND', 'Course not found');
  return course;
}

export async function enrollInCourse(courseId: string, learnerId: string) {
  const course = await Course.findById(toObjectId(courseId));
  if (!course) throw new HttpError(404, 'COURSE_NOT_FOUND', 'Course not found');
  if (course.status !== 'published') {
    throw new HttpError(400, 'COURSE_NOT_PUBLISHED', 'Course is not available for enrollment');
  }
  if (String(course.teacherId) === learnerId) {
    throw new HttpError(400, 'CANNOT_ENROLL_OWN', 'You cannot enroll in your own course');
  }
  if (course.enrollmentCount >= course.maxEnrollments) {
    throw new HttpError(400, 'COURSE_FULL', 'Course is full');
  }

  const existing = await CourseEnrollment.findOne({
    courseId: toObjectId(courseId),
    learnerId: toObjectId(learnerId),
  });
  if (existing) {
    throw new HttpError(409, 'ALREADY_ENROLLED', 'You are already enrolled in this course');
  }

  const enrollment = await CourseEnrollment.create({
    courseId: toObjectId(courseId),
    learnerId: toObjectId(learnerId),
    progress: course.sessions.map((_, i) => ({ sessionIndex: i, completed: false })),
  });

  course.enrollmentCount += 1;
  await course.save();

  await Notification.create({
    userId: course.teacherId,
    type: 'system_warning',
    referenceId: course._id,
    referenceModel: 'Course',
    message: `Someone enrolled in your course "${course.title}"`,
  });

  return enrollment.toJSON();
}

export async function completeSession(
  courseId: string,
  learnerId: string,
  sessionIndex: number,
  notes?: string
) {
  const enrollment = await CourseEnrollment.findOne({
    courseId: toObjectId(courseId),
    learnerId: toObjectId(learnerId),
  });
  if (!enrollment) {
    throw new HttpError(404, 'NOT_ENROLLED', 'You are not enrolled in this course');
  }

  const session = enrollment.progress[sessionIndex];
  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Session not found');
  }
  if (session.completed) {
    throw new HttpError(400, 'ALREADY_COMPLETED', 'Session already completed');
  }

  session.completed = true;
  session.completedAt = new Date();
  if (notes) session.notes = notes.slice(0, 500);

  enrollment.status = 'in_progress';

  const allCompleted = enrollment.progress.every((p) => p.completed);
  if (allCompleted) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
    enrollment.certificateId = `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  await enrollment.save();
  return enrollment.toJSON();
}

export async function getMyEnrollments(learnerId: string, status?: string) {
  const filter: Record<string, unknown> = { learnerId: toObjectId(learnerId) };
  if (status) filter.status = status;

  return CourseEnrollment.find(filter)
    .populate({
      path: 'courseId',
      populate: [
        { path: 'teacherId', select: 'displayName avatar' },
        { path: 'skillId', select: 'skillName categoryName' },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();
}

export async function updateCourse(
  courseId: string,
  teacherId: string,
  input: { title?: string; description?: string; status?: string }
) {
  const course = await Course.findOne({ _id: toObjectId(courseId), teacherId: toObjectId(teacherId) });
  if (!course) throw new HttpError(404, 'COURSE_NOT_FOUND', 'Course not found');

  if (input.title) course.title = input.title.trim();
  if (input.description !== undefined) course.description = input.description.trim();
  if (input.status) course.status = input.status as any;

  await course.save();
  return course.toJSON();
}
