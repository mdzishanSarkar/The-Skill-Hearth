import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCourses, enrollInCourse } from '../../services/course.service';
import type { CourseListResult } from '../../types/course.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBookOpen } from 'react-icons/fi';

export default function CoursesPage() {
  const [data, setData] = useState<CourseListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [enrollingId, setEnrollingId] = useState('');

  useEffect(() => {
    loadCourses();
  }, [page]);

  async function loadCourses() {
    try {
      const result = await listCourses({ page, limit: 12 });
      setData(result);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll(courseId: string) {
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      toast.success('Enrolled successfully!');
      loadCourses();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setEnrollingId('');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiBookOpen />}
        title="Courses"
        subtitle="Structured multi-session courses from community teachers."
      />

      {data && data.courses.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiBookOpen />}
          title="No courses yet"
          description="Structured courses will appear here once teachers publish them."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {data?.courses.map((course) => (
            <div
              key={course._id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{course.title}</h3>
              {course.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{course.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{course.sessions.length} sessions</span>
                <span>·</span>
                <span>{course.skillId.categoryName}</span>
                <span>·</span>
                <span>{course.enrollmentCount}/{course.maxEnrollments} enrolled</span>
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                by {course.teacherId.displayName}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/courses/${course._id}`}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  View details
                </Link>
                {course.status === 'published' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={enrollingId === course._id}
                    onClick={() => handleEnroll(course._id)}
                  >
                    Enroll
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="py-2 text-sm text-gray-600 dark:text-gray-400">Page {page} of {data.totalPages}</span>
          <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
