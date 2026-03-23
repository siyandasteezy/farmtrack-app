import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormField, Input, Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const res = login(form.email, form.password);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    nav(res.user.plan === 'unpaid' ? '/payment' : '/dashboard', { replace: true });
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
        {/* Logo */}
        <div className="text-center mb-8 fade-in">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #14532d, #166534, #15803d)', boxShadow: '0 8px 32px rgba(21,128,61,.3)' }}
          >
            🐄
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FarmTrack</h1>
          <p className="text-slate-500 mt-1 text-sm">Livestock management for modern farms</p>
        </div>

        <div className="bg-white rounded-3xl p-8 fade-in"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)', border: '1px solid rgba(255,255,255,.8)' }}>

          <h2 className="text-xl font-extrabold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-6">Sign in to your account to continue</p>

          {error && <AlertBox color="red" className="mb-5">{error}</AlertBox>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormField label="Email address">
              <Input
                type="email"
                placeholder="you@farm.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password">
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <Btn type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : (
                <><LogIn size={17} />Sign in</>
              )}
            </Btn>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold hover:underline" style={{ color: '#16a34a' }}>Create one</Link>
          </div>

          {/* Demo hint */}
          <div className="mt-5 p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
            <p className="font-bold text-slate-600 mb-0.5">Demo credentials</p>
            john@greenmeadows.farm · farm1234
          </div>
        </div>
      </div>
    </div>
  );
}
