import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../types/api.types';
import { resendVerification } from '../../services/auth.service';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setShowResend(false);
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in');
      navigate(from, { replace: true });
    } catch (err) {
      const message = getApiError(err);
      setError(message);
      if (message.toLowerCase().includes('verify your email')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email sent');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
      <p className="mt-2 text-sm text-gray-600">Sign in to continue to The Skill Hearth.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {showResend && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Didn't get the email?{' '}
            <button
              type="button"
              className="font-medium underline hover:text-amber-900 disabled:text-amber-400"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Create an account
        </Link>
        <Link to="/forgot-password" className="font-medium text-gray-500 hover:text-gray-700">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
