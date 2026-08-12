import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getLinkedProviders, unlinkProvider, getGoogleAuthUrl, getAppleAuthUrl } from '../../services/social.service';
import type { OAuthProviderInfo } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';

export default function LinkedAccounts() {
  const [providers, setProviders] = useState<OAuthProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const data = await getLinkedProviders();
      setProviders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkGoogle() {
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      toast.error('Failed to initiate Google linking');
    }
  }

  async function handleLinkApple() {
    try {
      const url = await getAppleAuthUrl();
      window.location.href = url;
    } catch (err) {
      toast.error('Failed to initiate Apple linking');
    }
  }

  async function handleUnlink(provider: 'google' | 'apple') {
    if (!window.confirm(`Unlink ${provider}? You may lose access if it's your only login method.`)) return;
    try {
      await unlinkProvider(provider);
      toast.success(`${provider} unlinked`);
      loadProviders();
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  if (loading) return <Spinner size="sm" />;

  const linked = providers.map((p) => p.provider);
  const hasGoogle = linked.includes('google');
  const hasApple = linked.includes('apple');

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Linked Accounts</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Link external accounts for easier sign-in.
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Google</p>
              {hasGoogle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Linked as {providers.find((p) => p.provider === 'google')?.email}
                </p>
              )}
            </div>
          </div>
          {hasGoogle ? (
            <Button variant="secondary" size="sm" onClick={() => handleUnlink('google')}>
              Unlink
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleLinkGoogle}>
              Link
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Apple</p>
              {hasApple && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Linked as {providers.find((p) => p.provider === 'apple')?.email}
                </p>
              )}
            </div>
          </div>
          {hasApple ? (
            <Button variant="secondary" size="sm" onClick={() => handleUnlink('apple')}>
              Unlink
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={handleLinkApple}>
              Link
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
