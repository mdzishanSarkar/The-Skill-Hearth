import { useState } from 'react';
import toast from 'react-hot-toast';
import { setupTwoFactor, verifyAndEnableTwoFactor, disableTwoFactor, getTwoFactorStatus } from '../../services/social.service';
import type { TwoFactorSetup as TwoFactorSetupType, TwoFactorStatus } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface TwoFactorSetupProps {
  status: TwoFactorStatus;
  onStatusChange: (status: TwoFactorStatus) => void;
}

export default function TwoFactorSetup({ status, onStatusChange }: TwoFactorSetupProps) {
  const [setupData, setSetupData] = useState<TwoFactorSetupType | null>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSetup() {
    setLoading(true);
    setError('');
    try {
      const data = await setupTwoFactor();
      setSetupData(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!token.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyAndEnableTwoFactor(token);
      setSetupData(null);
      setToken('');
      onStatusChange({ enabled: true, lastUsedAt: null });
      toast.success('Two-factor authentication enabled!');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!token.trim()) {
      setError('Please enter the verification code to disable');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await disableTwoFactor(token);
      setToken('');
      onStatusChange({ enabled: false, lastUsedAt: null });
      toast.success('Two-factor authentication disabled');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h3>
      <p className="mt-1 text-xs text-gray-500">
        Add an extra layer of security to your account using an authenticator app.
      </p>

      {status.enabled && (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Enabled
          </span>
          {status.lastUsedAt && (
            <span className="text-xs text-gray-400">
              Last used {new Date(status.lastUsedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {status.enabled && (
        <div className="mt-4 space-y-3">
          <Input
            id="2fa-disable-token"
            label="Enter code to disable"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="6-digit code"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button variant="danger" size="sm" loading={loading} onClick={handleDisable}>
            Disable 2FA
          </Button>
        </div>
      )}

      {!status.enabled && !setupData && (
        <div className="mt-4">
          <Button size="sm" loading={loading} onClick={handleSetup}>
            Set up 2FA
          </Button>
        </div>
      )}

      {setupData && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm text-gray-700">
              Scan this QR code with your authenticator app:
            </p>
            <img
              src={setupData.qrCodeDataUrl}
              alt="QR Code for 2FA setup"
              className="mt-2 h-48 w-48 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Or enter this secret manually:
            </p>
            <code className="mt-1 block rounded bg-gray-100 p-2 text-xs text-gray-800 break-all">
              {setupData.secret}
            </code>
          </div>
          <div>
            <Input
              id="2fa-verify-token"
              label="Enter verification code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="6-digit code"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" loading={loading} onClick={handleVerify}>
                Verify & Enable
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setSetupData(null); setToken(''); setError(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
