import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiKey } from 'react-icons/fi';
import { forgotPassword } from '../../services/auth.service';
import { getApiError } from '../../types/api.types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AuthShell from '../../components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card animate-fade-in-up w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <FiMail className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">Check your email</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            If an account exists for <span className="font-medium">{email}</span>, we've sent a
            link to reset your password.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button>Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="forgot-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">{error}</div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <FiKey className="mr-1.5 h-4 w-4" />
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
