import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiShield } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../types/api.types';
import { resendVerification } from '../../services/auth.service';
import { getGoogleAuthUrl } from '../../services/social.service';
import { PASSWORD_HINT, isPasswordPolicyCompliant } from '../../utils/password';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import AuthShell from '../../components/auth/AuthShell';
import GoogleButton from '../../components/auth/GoogleButton';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setShowResend(false);
    if (!isPasswordPolicyCompliant(password)) {
      setError(PASSWORD_HINT);
      return;
    }
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

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      toast.error('Failed to initiate Google sign-in');
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to The Skill Hearth."
      footer={
        <div className="flex items-center justify-between text-sm">
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Create an account
          </Link>
          <Link
            to="/forgot-password"
            className="font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Forgot password?
          </Link>
        </div>
      }
    >
      <div className="card animate-fade-in-up p-6 sm:p-8">
        <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 uppercase tracking-wider text-gray-400 dark:bg-gray-900 dark:text-gray-500">
              or continue with email
            </span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            id="login-email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            icon={<FiMail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordInput
            id="login-password"
            label="Password"
            autoComplete="current-password"
            required
            icon={<FiLock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="-mt-1 text-xs text-gray-400 dark:text-gray-500">{PASSWORD_HINT}</p>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <FiShield className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {showResend && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
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

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-gray-500">
            <FiShield className="h-3.5 w-3.5" />
            Your details stay private — we never share your data.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
