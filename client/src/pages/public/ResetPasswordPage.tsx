import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../../services/auth.service';
import { getApiError } from '../../types/api.types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
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
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Password reset</h1>
        <p className="mt-3 text-sm text-gray-600">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <Link to="/login" className="mt-6">
          <Button className="w-full">Go to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Choose a new password</h1>
      <p className="mt-2 text-sm text-gray-600">Your password must be at least 8 characters.</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="reset-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          id="reset-confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
