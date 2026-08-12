import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { verifyEmail } from '../../services/auth.service';
import { getApiError } from '../../types/api.types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await verifyEmail(token || '');
        if (!cancelled) setStatus('success');
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(getApiError(err));
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Verifying your email…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="card animate-fade-in-up w-full max-w-md p-8 text-center">
        {status === 'success' ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <FiCheckCircle className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">Email verified</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Your email has been verified. You can now sign in.
            </p>
            <Link to="/login" className="mt-6 inline-block">
              <Button>Go to sign in</Button>
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
              <FiAlertCircle className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">Verification failed</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{error}</p>
            <Link to="/login" className="mt-6 inline-block">
              <Button variant="secondary">Back to sign in</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
