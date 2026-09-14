import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/FormField';

const bgStyle = { background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' };

/**
 * Landing page for the confirmation link. Works whether or not the visitor is
 * signed in — the link is often opened in a different browser from the one
 * that asked for it.
 */
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const token = params.get('token');

  // A missing token is knowable at first render — no effect needed.
  const [state, setState] = useState(() => token
    ? { status: 'checking', message: '' }
    : { status: 'error', message: 'This confirmation link is missing its token.' });
  const ran = useRef(false);

  useEffect(() => {
    if (!token) return;
    if (ran.current) return;      // StrictMode double-invoke would burn the single-use token
    ran.current = true;

    (async () => {
      try {
        const res = await fetch('/.netlify/functions/auth-verify-email', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setState({ status: 'error', message: data?.error || 'Could not confirm your email.' });
          return;
        }
        await refresh();          // pick up emailVerified for this session, if signed in
        setState({
          status: 'done',
          message: data?.already
            ? 'This address was already confirmed — nothing more to do.'
            : 'Your email address is confirmed.',
        });
      } catch {
        setState({ status: 'error', message: 'You appear to be offline. Try the link again once connected.' });
      }
    })();
  }, [token, refresh]);

  const Icon = state.status === 'done' ? CheckCircle : state.status === 'error' ? XCircle : Loader2;
  const tone = state.status === 'done' ? '#16a34a' : state.status === 'error' ? '#dc2626' : '#64748b';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #14532d, #166534, #15803d)' }}>🐄</div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">isibaya</h1>
        </div>

        <div className="bg-white rounded-3xl p-8 text-center"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)' }}>
          <Icon size={40} className={state.status === 'checking' ? 'animate-spin mx-auto mb-4' : 'mx-auto mb-4'}
            style={{ color: tone }} />

          <h2 className="text-lg font-extrabold text-slate-800 mb-2">
            {state.status === 'checking' ? 'Confirming your email…'
              : state.status === 'done' ? 'All set' : "That didn't work"}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-7">
            {state.status === 'checking' ? 'This only takes a moment.' : state.message}
          </p>

          {state.status === 'done' && (
            <Btn size="lg" className="w-full"
              onClick={() => nav(user ? '/dashboard' : '/login', { replace: true })}>
              {user ? 'Go to dashboard' : 'Sign in'} <ArrowRight size={16} />
            </Btn>
          )}

          {state.status === 'error' && (
            <div className="flex flex-col gap-3">
              {user
                ? <Link to="/profile"><Btn size="lg" className="w-full">Send a new link</Btn></Link>
                : <Link to="/login"><Btn size="lg" className="w-full">Sign in</Btn></Link>}
              <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
