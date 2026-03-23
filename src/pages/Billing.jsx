import { useState } from 'react';
import { CreditCard, CheckCircle, Calendar, Download, RefreshCw, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';
import { Badge } from '../components/Badge';

const INVOICES = [
  { id: 'INV-2024-003', date: '2024-03-01', amount: '$500.00', status: 'Paid' },
  { id: 'INV-2024-002', date: '2024-02-01', amount: '$500.00', status: 'Paid' },
  { id: 'INV-2024-001', date: '2024-01-01', amount: '$500.00', status: 'Paid' },
];

const FEATURES = [
  'Unlimited livestock records',
  'All species (11+ types)',
  'Real-time IoT sensor dashboard',
  'Health & vet record tracking',
  'Feed & nutrition management',
  'Regulatory compliance guide',
  'Advanced reports & analytics',
  'Email & chat support',
];

const card = {
  background: '#ffffff',
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
  padding: 24,
};

export default function Billing() {
  const { user } = useAuth();
  const [cancelled, setCancelled] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const isPaid = user?.plan === 'active';

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 fade-in">

      {/* Plan card */}
      <div style={card}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Plan</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-slate-900">$500</span>
              <span className="text-slate-400 text-sm mb-1">/month</span>
              <div className="mb-1">
                <Badge status={isPaid ? 'active' : 'unpaid'} dot>{isPaid ? 'Active' : 'Unpaid'}</Badge>
              </div>
            </div>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0' }}
          >
            🐄
          </div>
        </div>

        {isPaid && !cancelled && (
          <AlertBox color="green" className="mb-5">
            Your subscription is active. Next billing date: <strong>April 1, 2024</strong>.
          </AlertBox>
        )}
        {cancelled && (
          <AlertBox color="amber" className="mb-5">
            Your subscription has been cancelled. Access continues until <strong>April 1, 2024</strong>.
          </AlertBox>
        )}
        {!isPaid && (
          <AlertBox color="red" className="mb-5">
            Your subscription is inactive. Activate to access all features.
          </AlertBox>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
          {[
            { label: 'Plan', value: 'FarmTrack Pro' },
            { label: 'Billing cycle', value: 'Monthly' },
            { label: 'Member since', value: user?.joinedAt || '—' },
            { label: 'Next billing', value: 'Apr 1, 2024' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</div>
              <div className="text-sm font-bold text-slate-800">{value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          {!isPaid && (
            <Btn onClick={() => window.location.href = '/payment'}>
              <CreditCard size={15} /> Activate subscription
            </Btn>
          )}
          {isPaid && !cancelled && (
            <>
              <Btn variant="secondary">
                <RefreshCw size={14} /> Update payment method
              </Btn>
              <Btn variant="danger" onClick={() => setShowCancel(true)}>
                Cancel subscription
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* Features included */}
      <div style={card}>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">What's included</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#dcfce7' }}>
                <CheckCircle size={12} style={{ color: '#16a34a' }} />
              </div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Payment method */}
      <div style={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Payment method</h3>
          <Btn variant="secondary" size="sm">Update</Btn>
        </div>
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-10 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1e40af,#1d4ed8)' }}>
            <CreditCard size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">Visa ending in 4242</div>
            <div className="text-xs text-slate-400 mt-0.5">Expires 12/26</div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: '#15803d' }}>
            <Shield size={12} /> Secured
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div style={card}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Billing history</h3>
          <Btn variant="secondary" size="sm"><Calendar size={13} /> View all</Btn>
        </div>
        <div className="flex flex-col gap-1">
          {INVOICES.map(inv => (
            <div key={inv.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-bold text-slate-800">{inv.id}</div>
                <div className="text-xs text-slate-400 mt-0.5">{inv.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">{inv.amount}</span>
                <Badge color="green" dot>Paid</Badge>
                <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full fade-in"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,.2)', border: '1px solid #e2e8f0' }}>
            <div className="text-4xl text-center mb-4">😟</div>
            <h3 className="text-lg font-extrabold text-slate-800 text-center mb-2">Cancel subscription?</h3>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              You'll lose access to FarmTrack at the end of your billing period. Your data will be kept for 30 days.
            </p>
            <div className="flex flex-col gap-3">
              <Btn variant="danger" className="w-full" onClick={() => { setCancelled(true); setShowCancel(false); }}>
                Yes, cancel subscription
              </Btn>
              <Btn variant="secondary" className="w-full" onClick={() => setShowCancel(false)}>
                Keep my subscription
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
