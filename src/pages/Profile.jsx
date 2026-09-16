import { useState } from 'react';
import { UserRound, KeyRound, Check, MailWarning } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormField, Input, Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';

const card = {
  background: '#fff',
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
  padding: 24,
};

const PLAN_LABEL = { active: 'Active', trial: 'Free trial', unpaid: 'Not subscribed' };

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    farm: user?.farm || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
  });
  const [enterprises, setEnterprises] = useState(
    () => (user?.enterprises?.length ? user.enterprises : ['livestock']));
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const [verify, setVerify] = useState({ busy: false, sent: '', error: '' });

  const sendVerification = async () => {
    setVerify({ busy: true, sent: '', error: '' });
    try {
      const res = await fetch('/.netlify/functions/auth-send-verification', {
        method: 'POST', credentials: 'same-origin',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setVerify({ busy: false, sent: '', error: data?.error || 'Could not send the email.' }); return; }
      setVerify({ busy: false, error: '', sent: `Confirmation sent to ${data?.sentTo || user.email}. The link expires in 24 hours.` });
    } catch {
      setVerify({ busy: false, sent: '', error: 'You need to be online to send the confirmation email.' });
    }
  };

  const set = (k) => (e) => { setError(''); setSaved(''); setForm(p => ({ ...p, [k]: e.target.value })); };
  const setP = (k) => (e) => { setPwError(''); setPwMsg(''); setPw(p => ({ ...p, [k]: e.target.value })); };

  if (!user) return null;

  const current = user.enterprises?.length ? user.enterprises : ['livestock'];
  const entChanged =
    enterprises.length !== current.length || enterprises.some(e => !current.includes(e));

  const dirty =
    form.name !== user.name || form.farm !== user.farm ||
    form.email !== user.email || form.avatar !== user.avatar || entChanged;

  const handleSave = async () => {
    setError(''); setSaved('');
    const res = await updateProfile({ ...form, enterprises });
    if (!res.ok) { setError(res.error); return; }
    setSaved(res.emailChanged
      ? 'Profile updated. Your email changed, so it needs confirming again.'
      : 'Profile updated.');
  };

  const handlePassword = async () => {
    setPwError(''); setPwMsg('');
    if (pw.next !== pw.confirm) { setPwError('The new passwords do not match.'); return; }
    setPwBusy(true);
    const res = await changePassword(pw.current, pw.next);
    setPwBusy(false);
    if (!res.ok) { setPwError(res.error); return; }
    setPw({ current: '', next: '', confirm: '' });
    setPwMsg('Password changed.');
  };

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Profile</h2>
        <p className="text-sm text-slate-400 mt-0.5">Your account and sign-in details</p>
      </div>

      {/* Identity summary */}
      <div style={card} className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>
          {user.avatar}
        </div>
        <div className="flex-1">
          <div className="text-lg font-extrabold text-slate-900">{user.name}</div>
          <div className="text-sm text-slate-500">{user.farm}</div>
          <div className="text-xs text-slate-400 mt-1">{user.email}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
            {user.role}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={user.plan === 'active'
              ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
              : user.plan === 'trial'
                ? { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }
                : { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
            {PLAN_LABEL[user.plan] || user.plan}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={user.emailVerified
              ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
              : { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
            {user.emailVerified ? '✓ Email confirmed' : 'Email not confirmed'}
          </span>
        </div>
      </div>

      {/* Email confirmation — required before subscribing, since receipts and
          billing notices go to this address. */}
      {!user.emailVerified && (
        <div style={card} className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <MailWarning size={20} style={{ color: '#b45309' }} />
          </div>
          <div className="flex-1">
            <div className="font-bold text-slate-900">Confirm your email address</div>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              We sent a link to <strong className="text-slate-700">{user.email}</strong> when you signed up.
              You'll need to confirm it before you can subscribe — receipts and billing notices go there.
            </p>
            {verify.sent  && <p className="text-sm font-medium text-green-700 mt-2">{verify.sent}</p>}
            {verify.error && <p className="text-sm font-medium text-red-600 mt-2">{verify.error}</p>}
          </div>
          <Btn variant="secondary" onClick={sendVerification} disabled={verify.busy}>
            {verify.busy ? 'Sending…' : 'Resend email'}
          </Btn>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Details */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserRound size={15} /> Account details
          </h3>
          <div className="flex flex-col gap-4">
            <FormField label="Full name">
              <Input value={form.name} onChange={set('name')} />
            </FormField>
            <FormField label="Farm name">
              <Input value={form.farm} onChange={set('farm')} />
            </FormField>
            <FormField label="Email address"
              hint="Changing this means your email needs confirming again">
              <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </FormField>
            <FormField label="Initials" hint="Shown on your avatar — leave blank to derive from your name">
              <Input maxLength={2} value={form.avatar} onChange={set('avatar')} className="w-24" />
            </FormField>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">What you farm</label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'livestock', emoji: '🐄', label: 'Livestock' },
                  { key: 'crops',     emoji: '🌱', label: 'Crops' },
                ].map(opt => {
                  const on = enterprises.includes(opt.key);
                  return (
                    <button key={opt.key} type="button"
                      onClick={() => { setError(''); setSaved(''); setEnterprises(prev =>
                        prev.includes(opt.key) ? prev.filter(x => x !== opt.key) : [...prev, opt.key]); }}
                      className="text-left rounded-xl px-3.5 py-3 border-2 transition-all"
                      style={on
                        ? { borderColor: '#16a34a', background: '#f0fdf4' }
                        : { borderColor: '#e2e8f0', background: '#fff' }}>
                      <span className="mr-1.5">{opt.emoji}</span>
                      <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                Changes which sections appear. Nothing you've recorded is deleted.
              </p>
            </div>

            {error && <AlertBox color="red">{error}</AlertBox>}
            {saved && (
              <AlertBox color="green">
                <span className="inline-flex items-center gap-1.5"><Check size={14} />{saved}</span>
              </AlertBox>
            )}

            <div className="flex gap-2">
              <Btn onClick={handleSave} disabled={!dirty}>Save changes</Btn>
              {dirty && (
                <Btn variant="secondary"
                  onClick={() => {
                    setForm({ name: user.name, farm: user.farm, email: user.email, avatar: user.avatar });
                    setEnterprises(current);
                    setError(''); setSaved('');
                  }}>
                  Cancel
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* Password */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <KeyRound size={15} /> Change password
          </h3>
          <div className="flex flex-col gap-4">
            <FormField label="Current password">
              <Input type="password" value={pw.current} onChange={setP('current')} autoComplete="current-password" />
            </FormField>
            <FormField label="New password" hint="At least 8 characters">
              <Input type="password" value={pw.next} onChange={setP('next')} autoComplete="new-password" />
            </FormField>
            <FormField label="Confirm new password">
              <Input type="password" value={pw.confirm} onChange={setP('confirm')} autoComplete="new-password" />
            </FormField>

            {pwError && <AlertBox color="red">{pwError}</AlertBox>}
            {pwMsg && (
              <AlertBox color="green">
                <span className="inline-flex items-center gap-1.5"><Check size={14} />{pwMsg}</span>
              </AlertBox>
            )}

            <Btn onClick={handlePassword} disabled={pwBusy || !pw.current || !pw.next}>
              {pwBusy ? 'Saving…' : 'Change password'}
            </Btn>
          </div>

          <p className="text-xs text-slate-400 mt-5 leading-relaxed">
            Need a hand with your account or billing? Email{' '}
            <a href="mailto:support@smartpick.co.za" className="font-semibold hover:underline"
              style={{ color: '#16a34a' }}>support@smartpick.co.za</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
