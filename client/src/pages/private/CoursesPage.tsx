import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listCourses, enrollInCourse, getMyEnrollments } from '../../services/course.service';
import type { CourseListResult } from '../../types/course.types';
import { getApiError } from '../../types/api.types';
import { showError, showSuccess } from '../../utils/toast';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiBookOpen, FiChevronLeft, FiChevronRight, FiRefreshCw, FiCheck } from 'react-icons/fi';

export default function CoursesPage() {
  const [data, setData] = useState<CourseListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [enrollingId, setEnrollingId] = useState('');
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  const loadEnrollments = useCallback(async () => {
    try {
      const enrollments = await getMyEnrollments();
      setEnrolledIds(
        new Set(
          enrollments.map((e) => String((e.courseId as { _id: string })._id ?? e.courseId))
        )
      );
    } catch {
      setEnrolledIds(new Set());
    }
  }, []);

  useEffect(() => {
    void loadEnrollments();
  }, [loadEnrollments]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCourses({ page, limit: 12 })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) showError(getApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function handleEnroll(courseId: string) {
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      showSuccess('Enrolled successfully!');
      setEnrolledIds((prev) => new Set(prev).add(courseId));
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setEnrollingId('');
    }
  }

  const goToPage = (next: number) => {
    if (!data || next < 1 || next > data.totalPages || next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !data) {
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
        onIconClick={() => {
          setPage(1);
          setLoading(true);
          listCourses({ page: 1, limit: 12 })
            .then(setData)
            .catch((err) => showError(getApiError(err)))
            .finally(() => setLoading(false));
        }}
        title="Courses"
        subtitle="Structured multi-session courses from community teachers."
        actions={
          <Button variant="secondary" size="sm" onClick={() => {
            setPage(1);
            setLoading(true);
            listCourses({ page: 1, limit: 12 })
              .then(setData)
              .catch((err) => showError(getApiError(err)))
              .finally(() => setLoading(false));
          }}>
            <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      {data && data.courses.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiBookOpen />}
          title="No courses yet"
          description="Structured courses will appear here once teachers publish them."
        />
      ) : (
        <>
          {loading && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-xs font-medium text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Spinner size="sm" />
              Loading page {page}…
            </div>
          )}
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
                <span>{course.skillId?.categoryName}</span>
                <span>·</span>
                <span>{course.enrollmentCount}/{course.maxEnrollments} enrolled</span>
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                by {course.teacherId?.displayName ?? 'Unknown'}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/courses/${course._id}`}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  View details
                </Link>
                {course.status === 'published' &&
                  (enrolledIds.has(course._id) ? (
                    <Button variant="secondary" size="sm" disabled>
                      <FiCheck className="mr-1.5 h-3.5 w-3.5" /> Enrolled
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={enrollingId === course._id}
                      onClick={() => handleEnroll(course._id)}
                    >
                      Enroll
                    </Button>
                  ))}
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Courses pagination" className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            <FiChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-gray-100">{page}</span> of {data.totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)}>
            Next <FiChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
