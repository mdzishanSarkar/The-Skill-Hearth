import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { setAccessToken } from '../../services/tokenStore';
import * as authService from '../../services/auth.service';
import { getMe } from '../../services/users.service';
import Spinner from '../../components/ui/Spinner';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setStatus } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const newUser = searchParams.get('newUser');

    if (!token) {
      setError('No authentication token received');
      return;
    }

    setAccessToken(token);

    let cancelled = false;

    async function complete() {
      try {
        let user = null;
        try {
          const result = await authService.refreshSession();
          user = result.user;
        } catch {
          user = await getMe();
        }
        if (cancelled) return;
        setUser(user);
        setStatus('authenticated');
        if (newUser === '1') {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        if (cancelled) return;
        setError('Failed to complete authentication');
      }
    }

    complete();

    return () => {
      cancelled = true;
    };
  }, [searchParams, navigate, setUser, setStatus]);

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Authentication failed</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Completing sign-in...</p>
      </div>
    </div>
  );
}
