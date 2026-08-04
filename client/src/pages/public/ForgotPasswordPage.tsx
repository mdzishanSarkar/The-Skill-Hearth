import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/auth.service';
import { getApiError } from '../../types/api.types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="mt-3 text-sm text-gray-600">
          If an account exists for <span className="font-medium">{email}</span>, we've sent a
          link to reset your password.
        </p>
        <Link
          to="/login"
          className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reset your password</h1>
      <p className="mt-2 text-sm text-gray-600">
        Enter your account email and we'll send you a reset link.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
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
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Remembered it?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </div>
  );
}
