import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUser, FiAtSign, FiMail, FiLock, FiKey, FiShield, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { register } from '../../services/auth.service';
import { getGoogleAuthUrl } from '../../services/social.service';
import { getApiError } from '../../types/api.types';
import { PASSWORD_RULES, PASSWORD_HINT, isPasswordPolicyCompliant } from '../../utils/password';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import AuthShell from '../../components/auth/AuthShell';
import GoogleButton from '../../components/auth/GoogleButton';

const USERNAME_REGEX = /^[a-z][a-z0-9][a-z0-9._]{1,18}$/;

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = confirmTouched && confirmPassword === password;

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
    if (!USERNAME_REGEX.test(username.trim())) {
      setError('Username must start with a lowercase letter, be 3-20 characters, and use only letters, numbers, dots and underscores');
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
        username: username.trim(),
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

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      toast.error('Failed to initiate Google sign-in');
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="card animate-fade-in-up w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl text-white shadow-soft">
            🎉
          </div>
          <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">Check your inbox</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            We sent a verification link to <span className="font-medium">{email}</span>. Click it to
            activate your account, then sign in.
          </p>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Didn't get it? Check your spam folder or try again in a few minutes.
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
      title="Create your account"
      subtitle="A few details to light your spark."
      footer={
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="card animate-fade-in-up p-6 sm:p-8">
        <GoogleButton onClick={handleGoogleSignup} loading={googleLoading} />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 uppercase tracking-wider text-gray-400 dark:bg-gray-900 dark:text-gray-500">
              or sign up with email
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-700 dark:bg-gray-800/60">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Creating an account with us?</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {adminMode ? "You're signing up as a community admin." : 'Most people sign up as a member.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={adminMode}
            onClick={() => setAdminMode((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
              adminMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                adminMode ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            id="register-displayName"
            label="Display name"
            type="text"
            autoComplete="name"
            required
            icon={<FiUser className="h-4 w-4" />}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <div>
            <Input
              id="register-username"
              label="Username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              required
              icon={<FiAtSign className="h-4 w-4" />}
              trailing={
                username.length > 0 &&
                (USERNAME_REGEX.test(username.trim()) ? (
                  <span className="mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <FiCheck className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <FiAlertCircle className="h-3.5 w-3.5" />
                  </span>
                ))
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Your unique handle. Starts with a lowercase letter, 3-20 characters — letters, numbers, dots and underscores. Cannot be changed later.
            </p>
          </div>
          <Input
            id="register-email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            icon={<FiMail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div>
            <PasswordInput
              id="register-password"
              label="Password"
              autoComplete="new-password"
              required
              icon={<FiLock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            {password.length > 0 && passwordFocused && (
              <div className="mt-2 animate-fade-in space-y-1.5">
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
          </div>
          <div>
            <PasswordInput
              id="register-confirmPassword"
              label="Confirm password"
              autoComplete="new-password"
              required
              icon={<FiLock className="h-4 w-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmTouched && (
              <p
                className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                  passwordsMatch
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {passwordsMatch ? (
                  <FiCheck className="h-3.5 w-3.5" />
                ) : (
                  <FiAlertCircle className="h-3.5 w-3.5" />
                )}
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {adminMode && (
            <div className="animate-fade-in rounded-xl border border-indigo-200 bg-indigo-50 p-3.5 dark:border-indigo-900 dark:bg-indigo-950/40">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Admin registration
              </p>
              <p className="mt-0.5 text-xs text-indigo-600/80 dark:text-indigo-400/80">
                Enter the admin signup code provided by the team.
              </p>
              <div className="mt-3">
                <Input
                  id="register-adminCode"
                  label="Admin signup code"
                  type="text"
                  required
                  icon={<FiKey className="h-4 w-4" />}
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <FiShield className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Create account
          </Button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
