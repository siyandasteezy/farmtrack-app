import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Printer, Lightbulb, TriangleAlert } from 'lucide-react';
import { GUIDES, GUIDE_ORDER } from '../data/guides';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/FormField';
import clsx from 'clsx';

const card = {
  background: '#fff',
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
};

function Step({ index, step }) {
  return (
    <div className="flex gap-4">
      {/* Number and the line joining it to the next step */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
          {index + 1}
        </div>
        <div className="w-px flex-1 mt-2" style={{ background: '#e2e8f0' }} />
      </div>

      <div className="flex-1 pb-8">
        <h3 className="font-extrabold text-slate-800 text-base leading-snug">{step.title}</h3>

        {step.where && (
          <Link to={step.to || '/dashboard'}
            className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
            {step.where} <ArrowRight size={12} />
          </Link>
        )}

        <p className="text-sm text-slate-600 leading-relaxed mt-3">{step.body}</p>

        {step.note && (
          <div className="flex gap-2.5 mt-3 px-3.5 py-3 rounded-xl"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Lightbulb size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#64748b' }} />
            <p className="text-sm text-slate-600 leading-relaxed">{step.note}</p>
          </div>
        )}

        {step.warn && (
          <div className="flex gap-2.5 mt-3 px-3.5 py-3 rounded-xl"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <TriangleAlert size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#b45309' }} />
            <p className="text-sm leading-relaxed" style={{ color: '#92400e' }}>{step.warn}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Guides() {
  const { user } = useAuth();
  const enterprises = user?.enterprises?.length ? user.enterprises : ['livestock'];

  /* Show the guide for what this farm actually runs. A farm doing both gets
     both tabs; one doing neither is impossible, but fall back rather than
     render an empty page. */
  const available = GUIDE_ORDER.filter(k => enterprises.includes(k));
  const keys = available.length ? available : ['livestock'];

  const [tab, setTab] = useState(keys[0]);
  const guide = GUIDES[keys.includes(tab) ? tab : keys[0]];

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">How to use isibaya</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            The order things are meant to be done in, and why
          </p>
        </div>
        <Btn variant="secondary" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </Btn>
      </div>

      {/* Only shown when the farm runs both — one enterprise needs no chooser. */}
      {keys.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {keys.map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={clsx(
                'px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all',
                tab === k ? 'text-white border-green-600' : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
              )}
              style={tab === k ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
              {GUIDES[k].emoji} {GUIDES[k].label}
            </button>
          ))}
        </div>
      )}

      <div style={card} className="p-6">
        <div className="flex items-start gap-4 pb-6 mb-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            {guide.emoji}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900">{guide.label}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{guide.blurb}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-7">{guide.intro}</p>

        <div className="flex flex-col">
          {guide.steps.map((step, i) => (
            <Step key={step.title} index={i} step={step} />
          ))}
        </div>

        <div className="flex gap-2.5 px-4 py-3.5 rounded-xl"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <p className="text-sm text-slate-500 leading-relaxed">
            Stuck on something this doesn't cover? Email{' '}
            <a href="mailto:support@smartpick.co.za" className="font-semibold hover:underline"
              style={{ color: '#16a34a' }}>support@smartpick.co.za</a>{' '}
            and tell us what you were trying to do.
          </p>
        </div>
      </div>
    </div>
  );
}
