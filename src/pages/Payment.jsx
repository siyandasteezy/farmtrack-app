import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, ChevronRight, Shield, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';

const PRICE = 'R1,800';
const FN = '/.netlify/functions';
const PENDING_KEY = 'insimi_yoco_checkout';

const FEATURES = [
  'Unlimited livestock records',
  'All species management (11+ types)',
  'Real-time IoT sensor dashboard',
  'Health & vet record tracking',
  'Feed & nutrition management',
  'Regulatory compliance guide',
  'Advanced reports & analytics',
  'Email support & software updates',
];

const bgStyle = { background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' };

const blobsEl = (
  <div className="pointer-events-none fixed inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30"
      style={{ background: 'radial-gradient(circle, #86efac, transparent)' }} />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
      style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />
  </div>
);

export default function Payment() {
  const { user, activatePlan, activateTrial, logout } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const yocoResult = params.get('yoco'); // success | cancelled | failed

  const [step, setStep] = useState('plan');          // plan | verifying | success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Handle the return from Yoco's hosted checkout ──────────────
  const verify = useCallback(async () => {
    const checkoutId = localStorage.getItem(PENDING_KEY);
    if (!checkoutId) { setStep('plan'); setError('We could not find your checkout — please try again.'); return; }
    setStep('verifying');
    try {
      const res = await fetch(`${FN}/yoco-verify-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutId }),
      });
      const data = await res.json().catch(() => null);
      if (data?.status === 'completed') {
        localStorage.removeItem(PENDING_KEY);
        activatePlan();
        setStep('success');
      } else {
        setStep('plan');
        setError('Your payment has not been confirmed yet. If you were charged, please refresh in a moment.');
      }
    } catch {
      setStep('plan');
      setError('Could not confirm your payment — check your connection and try again.');
    }
  }, [activatePlan]);

  useEffect(() => {
    if (!yocoResult) return;
    if (yocoResult === 'success') {
      verify();
    } else if (yocoResult === 'cancelled') {
      setError('Payment cancelled — no charge was made.');
    } else if (yocoResult === 'failed') {
      setError("The payment didn't go through. No charge was made — please try again.");
    }
    // Clean the query string so a refresh doesn't re-trigger.
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start a Yoco checkout ──────────────────────────────────────
  const subscribe = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${FN}/yoco-create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.email || user?.id || 'guest' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.redirectUrl) {
        setError(data?.error || 'Could not start the payment — please try again.');
        setLoading(false);
        return;
      }
      if (data.id) localStorage.setItem(PENDING_KEY, data.id);
      window.location.href = data.redirectUrl; // off to Yoco's hosted page
    } catch {
      setError('You need to be online to pay — try again when connected.');
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
        {blobsEl}
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center fade-in relative"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            <CheckCircle size={44} style={{ color: '#16a34a' }} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Payment successful!</h2>
          <p className="text-slate-500 mb-1">Welcome to insimi, <strong>{user?.name}</strong>.</p>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Your subscription is now active. You'll be billed <strong className="text-slate-600">{PRICE}/month</strong>.
          </p>
          <Btn size="lg" className="w-full" onClick={() => nav('/dashboard', { replace: true })}>
            Go to Dashboard <ChevronRight size={17} />
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
      {blobsEl}
      <div className="w-full max-w-4xl relative">

        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #14532d, #166534, #15803d)', boxShadow: '0 8px 24px rgba(21,128,61,.3)' }}>
            🐄
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">insimi Pro</h1>
          <p className="text-slate-500 mt-1 text-sm">Complete livestock management for your farm</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Plan summary */}
          <div className="lg:col-span-2 fade-in">
            <div className="bg-white rounded-3xl p-6 h-full"
              style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)' }}>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-5"
                style={{ background: '#dcfce7', color: '#15803d' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Pro Plan
              </div>
              <div className="mb-1">
                <span className="text-5xl font-extrabold text-slate-900">{PRICE}</span>
                <span className="text-slate-400 text-sm ml-1">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">Billed monthly in ZAR. Cancel anytime.</p>

              <ul className="flex flex-col gap-2.5">
                {FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#dcfce7' }}>
                      <CheckCircle size={10} style={{ color: '#16a34a' }} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
                <Shield size={13} />
                Card details are entered on Yoco's secure page
              </div>
            </div>
          </div>

          {/* Action panel */}
          <div className="lg:col-span-3 fade-in">
            <div className="bg-white rounded-3xl p-8"
              style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)' }}>

              {step === 'verifying' ? (
                <div className="text-center py-6">
                  <Loader2 size={32} className="animate-spin mx-auto mb-4" style={{ color: '#16a34a' }} />
                  <h2 className="text-lg font-extrabold text-slate-800 mb-1">Confirming your payment…</h2>
                  <p className="text-sm text-slate-500">This only takes a few seconds. Please don't close this page.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-extrabold text-slate-800 mb-1">Activate your subscription</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    {user?.plan === 'unpaid'
                      ? 'Complete your payment to access insimi.'
                      : 'Manage your current subscription.'}
                  </p>

                  {error && <AlertBox color="red" className="mb-5">{error}</AlertBox>}

                  <AlertBox color="green" className="mb-6">
                    Prefer to try first? Start a 14-day free trial — you won't be charged until it ends.
                  </AlertBox>

                  {/* Order summary */}
                  <div className="rounded-xl p-4 border border-slate-100 mb-5" style={{ background: '#f8fafc' }}>
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span>insimi Pro (monthly)</span>
                      <span className="font-semibold">{PRICE}.00</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2.5 flex justify-between font-extrabold text-slate-800">
                      <span>Total</span>
                      <span>{PRICE}.00 / month</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Btn size="lg" className="w-full" onClick={subscribe} disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> Redirecting to Yoco…
                        </span>
                      ) : (
                        <><Lock size={15} /> Pay {PRICE} with Yoco</>
                      )}
                    </Btn>
                    <Btn variant="secondary" size="lg" className="w-full"
                      onClick={() => { activateTrial(); nav('/dashboard', { replace: true }); }}>
                      Start free trial first
                    </Btn>
                  </div>

                  <button
                    onClick={() => { logout(); nav('/login', { replace: true }); }}
                    className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors">
                    <X size={12} /> Sign out
                  </button>

                  <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <Lock size={12} />
                    Payments secured by Yoco · You'll enter card details on their page
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
