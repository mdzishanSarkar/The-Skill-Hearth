import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../../services/auth.service';
import { getApiError } from '../../types/api.types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    if (adminMode && !adminCode.trim()) {
      setError('Enter the admin signup code');
      return;
    }

    setLoading(true);
    try {
      await register({
        email,
        password,
        displayName,
        adminCode: adminMode ? adminCode.trim() : undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="mt-3 text-sm text-gray-600">
          We sent a verification link to <span className="font-medium">{email}</span>. Click it
          to activate your {adminMode ? 'admin' : ''} account, then sign in.
        </p>
        <Link
          to="/login"
          className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Join the Hearth</h1>
      <p className="mt-2 text-sm text-gray-600">
        Connection as a byproduct of learning together.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          id="register-name"
          label="Display name"
          required
          minLength={2}
          maxLength={50}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Input
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          id="register-confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="rounded-md border border-gray-200 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={adminMode}
              onChange={(e) => setAdminMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Register as administrator
          </label>
          {adminMode && (
            <div className="mt-3">
              <Input
                id="register-admin-code"
                label="Admin signup code"
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Provided by the site owner"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {adminMode ? 'Create admin account' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </div>
  );
}
