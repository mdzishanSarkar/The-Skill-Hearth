import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { resetPassword } from '../../services/auth.service';
import { getApiError } from '../../types/api.types';
import { PASSWORD_RULES, PASSWORD_HINT, isPasswordPolicyCompliant } from '../../utils/password';
import Button from '../../components/ui/Button';
import PasswordInput from '../../components/ui/PasswordInput';
import AuthShell from '../../components/auth/AuthShell';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!isPasswordPolicyCompliant(password)) {
      setError(PASSWORD_HINT);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token || '', password);
      toast.success('Password reset');
      setDone(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card animate-fade-in-up w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <FiCheckCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">Password reset</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button>Go to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Your password must be at least 8 characters."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <PasswordInput
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          required
          minLength={8}
          icon={<FiLock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
        />
        {password.length > 0 && passwordFocused && (
          <div className="space-y-1.5 animate-fade-in">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <p
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  {passed ? <FiCheck className="h-3.5 w-3.5" /> : <FiAlertCircle className="h-3.5 w-3.5" />}
                  {rule.label}
                </p>
              );
            })}
          </div>
        )}
        <PasswordInput
          id="reset-confirm"
          label="Confirm new password"
          autoComplete="new-password"
          required
          icon={<FiLock className="h-4 w-4" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">{error}</div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
