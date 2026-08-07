import { useState, useEffect } from 'react';
import { FiZap, FiExternalLink, FiClock, FiBarChart2, FiShield } from 'react-icons/fi';
import { getSubscriptionStatus, createCheckoutSession, createPortalSession } from '../../services/billing.service';
import toast from 'react-hot-toast';
import type { SubscriptionStatus } from '../../types/billing.types';

export default function UpgradePage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'annual' | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const result = await getSubscriptionStatus();
      setStatus(result);
    } catch {
      // user not logged in or error
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(plan: 'monthly' | 'annual') {
    setCheckoutLoading(plan);
    try {
      const result = await createCheckoutSession(plan);
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.success('Checkout session created');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to create checkout session';
      toast.error(msg);
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageSubscription() {
    try {
      const result = await createPortalSession();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      toast.error('Failed to open billing portal');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const proBenefits = [
    { icon: FiZap, title: 'Boosted in Discovery', desc: 'Appear higher in search results with a "Pro" badge' },
    { icon: FiBarChart2, title: 'Session Analytics', desc: 'See who viewed your profile and skill view counts' },
    { icon: FiClock, title: 'Unlimited Saved Searches', desc: 'Save unlimited search filters and get alerts' },
    { icon: FiShield, title: 'Priority Support', desc: 'Get faster response from our team' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Upgrade to <span className="text-amber-500">Pro</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Support the platform and get premium features to grow your skill-sharing community.
        </p>
      </div>

      {status?.isPro ? (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-8 text-center mb-12">
          <FiZap className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're a Pro member!</h2>
          <p className="text-gray-600 mb-4">
            Your {status.plan} subscription is active.
            {status.expiresAt && (
              <> Renews on {new Date(status.expiresAt).toLocaleDateString()}.</>
            )}
          </p>
          {status.cancelAtPeriodEnd && (
            <p className="text-amber-700 font-medium mb-4">
              Your subscription will not renew. It remains active until {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : 'the end of the billing period'}.
            </p>
          )}
          <button
            onClick={handleManageSubscription}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Manage Subscription
            <FiExternalLink className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 relative">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Monthly</h3>
            <p className="text-gray-500 text-sm mb-4">Billed monthly</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$4.99</span>
              <span className="text-gray-500">/month</span>
            </div>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={checkoutLoading !== null}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            >
              {checkoutLoading === 'monthly' ? 'Loading...' : 'Get Pro Monthly'}
            </button>
          </div>

          <div className="rounded-2xl border-2 border-amber-400 bg-white p-8 relative">
            <span className="absolute -top-3 right-4 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
              Save 35%
            </span>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Annual</h3>
            <p className="text-gray-500 text-sm mb-4">Billed annually</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$39</span>
              <span className="text-gray-500">/year</span>
            </div>
            <button
              onClick={() => handleCheckout('annual')}
              disabled={checkoutLoading !== null}
              className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {checkoutLoading === 'annual' ? 'Loading...' : 'Get Pro Annual'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Pro Benefits</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {proBenefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-4 rounded-xl bg-gray-50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
                <benefit.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-gray-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Every subscription supports free skill-sharing
        </h3>
        <p className="text-gray-600 max-w-lg mx-auto">
          100% of subscription revenue goes toward keeping the platform running and expanding
          to new neighborhoods. Your Pro membership directly funds community connections.
        </p>
      </div>
    </div>
  );
}
