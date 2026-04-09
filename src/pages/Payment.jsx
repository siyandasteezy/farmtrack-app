import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, ChevronRight, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormField, Input, Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';

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

export default function Payment() {
  const { user, activatePlan, activateTrial, logout } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState('plan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' });

  const setC = (k) => (e) => {
    let v = e.target.value;
    if (k === 'number') v = v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (k === 'expiry') {
      v = v.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    }
    if (k === 'cvc') v = v.replace(/\D/g, '').slice(0, 4);
    setCard(p => ({ ...p, [k]: v }));
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    if (!card.name) { setError('Cardholder name is required.'); return; }
    const raw = card.number.replace(/\s/g, '');
    if (raw.length < 13) { setError('Enter a valid card number.'); return; }
    if (card.expiry.length < 5) { setError('Enter a valid expiry date.'); return; }
    if (card.cvc.length < 3) { setError('Enter a valid CVC.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    activatePlan();
    setLoading(false);
    setStep('success');
  };

  const bgStyle = {
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)',
  };

  const blobsEl = (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, #86efac, transparent)' }} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />
    </div>
  );

  // ── Success screen ─────────────────────────────────────────
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
          <p className="text-slate-500 mb-1">Welcome to FarmTrack, <strong>{user?.name}</strong>.</p>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            Your subscription is now active. You'll be billed <strong className="text-slate-600">$500/month</strong> on the same date each month.
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
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #14532d, #166534, #15803d)', boxShadow: '0 8px 24px rgba(21,128,61,.3)' }}
          >
            🐄
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FarmTrack Pro</h1>
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
                <span className="text-5xl font-extrabold text-slate-900">$500</span>
                <span className="text-slate-400 text-sm ml-1">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">Billed monthly. Cancel anytime.</p>

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
                256-bit SSL encryption · Secure payment
              </div>
            </div>
          </div>

          {/* Card form */}
          <div className="lg:col-span-3 fade-in">
            <div className="bg-white rounded-3xl p-8"
              style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)' }}>

              {step === 'plan' && (
                <>
                  <h2 className="text-xl font-extrabold text-slate-800 mb-1">Activate your subscription</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    {user?.plan === 'unpaid'
                      ? 'Complete your payment to access FarmTrack.'
                      : 'Manage your current subscription.'}
                  </p>

                  <AlertBox color="green" className="mb-6">
                    Your 14-day free trial is included — you won't be charged until the trial ends.
                  </AlertBox>

                  <div className="flex flex-col gap-3">
                    <Btn size="lg" className="w-full" onClick={() => setStep('card')}>
                      <CreditCard size={17} /> Continue to payment
                    </Btn>
                    <Btn variant="secondary" size="lg" className="w-full" onClick={() => { activateTrial(); nav('/dashboard', { replace: true }); }}>
                      Start free trial first
                    </Btn>
                  </div>

                  <button
                    onClick={() => { logout(); nav('/login', { replace: true }); }}
                    className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-colors"
                  >
                    <X size={12} /> Sign out
                  </button>
                </>
              )}

              {step === 'card' && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-800">Payment details</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Your information is protected</p>
                    </div>
                    <div className="flex gap-1.5">
                      {['💳 Visa', '💳 MC', '💳 Amex'].map(c => (
                        <span key={c} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-medium">{c}</span>
                      ))}
                    </div>
                  </div>

                  {error && <AlertBox color="red" className="mb-4">{error}</AlertBox>}

                  <form onSubmit={handlePay} className="flex flex-col gap-4">
                    <FormField label="Cardholder name">
                      <Input placeholder="John Doe" value={card.name} onChange={setC('name')} autoComplete="cc-name" />
                    </FormField>

                    <FormField label="Card number">
                      <div className="relative">
                        <Input
                          placeholder="1234 5678 9012 3456"
                          value={card.number}
                          onChange={setC('number')}
                          autoComplete="cc-number"
                          inputMode="numeric"
                          className="pr-10"
                        />
                        <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      </div>
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Expiry date">
                        <Input placeholder="MM/YY" value={card.expiry} onChange={setC('expiry')} autoComplete="cc-exp" inputMode="numeric" />
                      </FormField>
                      <FormField label="CVC">
                        <Input placeholder="123" value={card.cvc} onChange={setC('cvc')} autoComplete="cc-csc" inputMode="numeric" />
                      </FormField>
                    </div>

                    {/* Order summary */}
                    <div className="rounded-xl p-4 border border-slate-100 mt-1" style={{ background: '#f8fafc' }}>
                      <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>FarmTrack Pro (monthly)</span>
                        <span className="font-semibold">$500.00</span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600 mb-3 font-medium">
                        <span>14-day trial discount</span>
                        <span>$0.00 today</span>
                      </div>
                      <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-slate-800">
                        <span>Due today</span>
                        <span>$0.00</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        You'll be charged $500/month starting after your trial.
                      </p>
                    </div>

                    <Btn type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Processing payment…
                        </span>
                      ) : (
                        <><Lock size={15} /> Activate subscription · $500/mo</>
                      )}
                    </Btn>

                    <button type="button" onClick={() => setStep('plan')}
                      className="text-sm text-slate-400 hover:text-slate-600 text-center transition-colors">
                      ← Back
                    </button>
                  </form>

                  <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <Lock size={12} />
                    Payments secured by Stripe · 256-bit encryption
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
