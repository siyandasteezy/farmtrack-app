import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, ArrowLeftRight } from 'lucide-react';
import { HOW_IT_WORKS, MARKETING_IMG, primaryCta } from '../data/marketing';
import { MarketingNav, MarketingFooter } from '../components/MarketingChrome';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/FormField';

const bgTint = { background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #d1fae5 100%)' };

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase px-3 py-1.5 rounded-full"
      style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
      {children}
    </span>
  );
}

function Tick({ children }) {
  return (
    <li className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: '#dcfce7' }}>
        <Check size={12} style={{ color: '#15803d' }} strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}

export default function HowItWorks() {
  const { flow } = useParams();
  const page = HOW_IT_WORKS[flow];
  const { user } = useAuth();
  const { to, label } = primaryCta(user);

  /* Arriving from the other page's link would otherwise keep the previous
     scroll position and land the reader halfway down a page they have not read. */
  useEffect(() => { window.scrollTo(0, 0); }, [flow]);

  if (!page) return <Navigate to="/" replace />;

  const other = HOW_IT_WORKS[page.other];

  return (
    <div className="min-h-screen text-slate-800 bg-white">
      <MarketingNav />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={bgTint}>
        <div className="relative max-w-6xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="fade-in text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-5">
              <Eyebrow>{page.eyebrow}</Eyebrow>
            </div>
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              {page.title}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {page.lede}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
              <Link to={to} className="w-full sm:w-auto">
                <Btn size="lg" className="w-full sm:w-auto px-8">{label} <ArrowRight size={17} /></Btn>
              </Link>
              <Link to={`/how-it-works/${other.key}`} className="w-full sm:w-auto">
                <Btn variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                  <ArrowLeftRight size={16} /> {other.eyebrow.split(',')[0]}
                </Btn>
              </Link>
            </div>
          </div>

          <div className="relative fade-in">
            <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 aspect-[4/3]">
              <img src={MARKETING_IMG[page.image]} alt={page.imageAlt}
                className="w-full h-full object-cover" loading="eager" />
            </div>
          </div>
        </div>
      </section>

      {/* ── The flow, in order ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Four steps, in the order you'd actually do them
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {page.steps.map((step, i) => (
            <div key={step.n}
              className="bg-white rounded-2xl p-7 border border-slate-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-200">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white mb-4"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                {i + 1}
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{step.n}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The detail that matters ─────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-24 flex flex-col gap-20">
          {page.deepDives.map((dive, i) => (
            <div key={dive.title} className="grid lg:grid-cols-2 gap-12 items-center">
              <div className={dive.image ? (i % 2 === 0 ? 'order-2' : 'order-2 lg:order-1') : 'lg:col-span-2 max-w-3xl'}>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {dive.title}
                </h3>
                <p className="mt-4 text-slate-600 leading-relaxed">{dive.body}</p>
                <ul className="mt-6 flex flex-col gap-3">
                  {dive.points.map(p => <Tick key={p}>{p}</Tick>)}
                </ul>
              </div>
              {dive.image && (
                <div className={i % 2 === 0 ? 'order-1' : 'order-1 lg:order-2'}>
                  <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 aspect-[5/4]">
                    <img src={MARKETING_IMG[dive.image]} alt={dive.imageAlt}
                      className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Cross-link to the other flow ────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="rounded-3xl p-8 sm:p-12 text-center" style={bgTint}>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Farming both?
          </h2>
          <p className="mt-3 text-slate-600 leading-relaxed max-w-xl mx-auto">
            Plenty of farms do. Tick both and the menu simply shows more — one login, one
            subscription, and nothing hidden that you have recorded.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/how-it-works/${other.key}`}>
              <Btn variant="secondary" size="lg" className="px-8">
                Read about {other.eyebrow.split(',')[0].toLowerCase()} <ArrowRight size={16} />
              </Btn>
            </Link>
            <Link to={to}>
              <Btn size="lg" className="px-8">{label} <ArrowRight size={17} /></Btn>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
