import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listCourses, enrollInCourse } from '../../services/course.service';
import type { Course, CourseListResult } from '../../types/course.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
      <p className="mt-1 text-sm text-gray-500">
        Structured multi-session courses from community teachers.
      </p>

      {data && data.courses.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No courses yet.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {data?.courses.map((course) => (
            <div
              key={course._id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900">{course.title}</h3>
              {course.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{course.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                <span>{course.sessions.length} sessions</span>
                <span>·</span>
                <span>{course.skillId.categoryName}</span>
                <span>·</span>
                <span>{course.enrollmentCount}/{course.maxEnrollments} enrolled</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                by {course.teacherId.displayName}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/courses/${course._id}`}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
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
          <span className="py-2 text-sm text-gray-600">Page {page} of {data.totalPages}</span>
          <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
