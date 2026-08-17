import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourse, enrollInCourse } from '../../services/course.service';
import type { Course } from '../../types/course.types';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toast';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/courses');
      return;
    }
    loadCourse();
  }, [id, navigate]);

  async function loadCourse() {
    try {
      const data = await getCourse(id!);
      setCourse(data);
    } catch (err) {
      showError(getApiError(err));
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!id) return;
    setEnrolling(true);
    try {
      await enrollInCourse(id);
      showSuccess('Enrolled successfully!');
      loadCourse();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-shell py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course not found</h1>
          <Link to="/courses" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <button
        onClick={() => navigate('/courses')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to courses
      </button>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{course.title}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            by {typeof course.teacherId === 'object' ? course.teacherId.displayName : 'Unknown'}
          </p>
        </div>

        {course.description && (
          <p className="mb-6 text-gray-700 dark:text-gray-300">{course.description}</p>
        )}

        <div className="mb-8 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">SESSIONS</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{course.sessions.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">CATEGORY</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              {typeof course.skillId === 'object' ? course.skillId.categoryName : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">ENROLLED</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              {course.enrollmentCount}/{course.maxEnrollments}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Course Sessions</h2>
          <div className="space-y-3">
            {course.sessions.map((session, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{session.title}</h3>
                    {session.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{session.description}</p>
                    )}
                    {session.estimatedMinutes && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <FiCalendar className="h-3 w-3" />
                        {session.estimatedMinutes} minutes
                      </p>
                    )}
                    {session.objectives && session.objectives.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Learning objectives:</p>
                        <ul className="mt-1 space-y-1">
                          {session.objectives.map((obj, i) => (
                            <li key={i} className="text-xs text-gray-600 dark:text-gray-400">• {obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {user && user._id !== (typeof course.teacherId === 'object' ? course.teacherId._id : course.teacherId) && course.status === 'published' && (
          <Button
            onClick={handleEnroll}
            loading={enrolling}
            disabled={course.enrollmentCount >= course.maxEnrollments}
            size="lg"
          >
            {course.enrollmentCount >= course.maxEnrollments ? 'Course Full' : 'Enroll Now'}
          </Button>
        )}
      </div>
    </div>
  );
}
