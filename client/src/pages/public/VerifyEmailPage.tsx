import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
        <p className="text-sm text-gray-600">Verifying your email…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 text-center">
      {status === 'success' ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
          <p className="mt-3 text-sm text-gray-600">
            Your email has been verified. You can now sign in.
          </p>
          <Link to="/login" className="mt-6">
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-900">Verification failed</h1>
          <p className="mt-3 text-sm text-gray-600">{error}</p>
          <Link to="/login" className="mt-6">
            <Button variant="secondary" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
