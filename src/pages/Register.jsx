import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormField, Input, Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', farm: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const res = register({ name: form.name, email: form.email, farm: form.farm, password: form.password });
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    nav('/payment', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' }}>

      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #86efac, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8 fade-in">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #14532d, #166534, #15803d)', boxShadow: '0 8px 32px rgba(21,128,61,.3)' }}
          >
            🐄
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FarmTrack</h1>
          <p className="text-slate-500 mt-1 text-sm">Start your 14-day free trial today</p>
        </div>

        <div className="bg-white rounded-3xl p-8 fade-in"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)', border: '1px solid rgba(255,255,255,.8)' }}>

          <h2 className="text-xl font-extrabold text-slate-800 mb-1">Create your account</h2>
          <p className="text-sm text-slate-400 mb-6">Get started with FarmTrack in minutes</p>

          {error && <AlertBox color="red" className="mb-5">{error}</AlertBox>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Full name">
                <Input placeholder="John Doe" value={form.name} onChange={set('name')} required />
              </FormField>
              <FormField label="Farm name">
                <Input placeholder="Green Meadows" value={form.farm} onChange={set('farm')} required />
              </FormField>
            </div>

            <FormField label="Email address">
              <Input type="email" placeholder="you@farm.com" value={form.email} onChange={set('email')} required autoComplete="email" />
            </FormField>

            <FormField label="Password">
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm password">
              <Input
                type="password" placeholder="Repeat password"
                value={form.confirm} onChange={set('confirm')} required
              />
            </FormField>

            <Btn type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account…
                </span>
              ) : (
                <><UserPlus size={17} />Create account &amp; continue</>
              )}
            </Btn>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold hover:underline" style={{ color: '#16a34a' }}>Sign in</Link>
          </div>

          <p className="mt-4 text-xs text-slate-400 text-center">
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
