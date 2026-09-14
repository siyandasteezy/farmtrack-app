import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio, HeartPulse, Wheat, ShieldCheck, BarChart3, MapPin,
  Tractor, Map, LayoutDashboard, ArrowRight, Check, Sparkles, Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormField, Input, Textarea, Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';

export const SUPPORT_EMAIL = 'support@smartpick.co.za';

/* License-free photography — Unsplash (https://unsplash.com/license) */
const IMG = {
  hero:   'https://images.unsplash.com/photo-1549488235-42996ae3b650?auto=format&fit=crop&w=1400&q=80',
  barn:   'https://images.unsplash.com/photo-1636998980792-63f27ddea4e3?auto=format&fit=crop&w=1100&q=80',
  field:  'https://images.unsplash.com/photo-1615909495126-3554c248bf33?auto=format&fit=crop&w=1100&q=80',
  ctaBg:  'https://images.unsplash.com/photo-1594987057733-1fb3fe5707c9?auto=format&fit=crop&w=1800&q=80',
};

const FEATURES = [
  { icon: LayoutDashboard, title: 'Livestock records', desc: 'Track every animal across 11+ species with full profiles, breeding and lifecycle histories.' },
  { icon: Radio, title: 'Real-time IoT sensors', desc: 'Live temperature, humidity, water and air-quality readings streamed straight to your dashboard.' },
  { icon: HeartPulse, title: 'Health & vet records', desc: 'Vaccinations, treatments and vet visits captured in one clear, searchable timeline.' },
  { icon: Wheat, title: 'Feed & nutrition', desc: 'Plan rations, track consumption and keep feed costs under control across every herd.' },
  { icon: MapPin, title: 'GPS tracking', desc: 'Locate animals in real time with assigned trackers and live map positions.' },
  { icon: Map, title: 'Farm planning', desc: 'Map your boundaries, paddocks and grazing zones to plan the whole operation.' },
  { icon: Tractor, title: 'Equipment', desc: 'Log machinery, maintenance and service schedules so nothing slips through.' },
  { icon: ShieldCheck, title: 'Compliance', desc: 'Stay ahead of livestock regulations with a built-in, always-current guide.' },
  { icon: BarChart3, title: 'Reports & analytics', desc: 'Turn your data into actionable insights across the entire farm.' },
];

const PLAN_FEATURES = [
  'Unlimited livestock records',
  'All species management (11+ types)',
  'Real-time IoT sensor dashboard',
  'Health & vet record tracking',
  'Feed & nutrition management',
  'GPS tracking & farm planning',
  'Regulatory compliance guide',
  'Advanced reports & analytics',
  'Email support & software updates',
];

const bgTint = { background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 45%, #d1fae5 100%)' };

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-green-700">
      <span className="w-6 h-px bg-green-500" />{children}
    </span>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [state, setState] = useState({ busy: false, sent: false, error: '' });
  const set = (k) => (e) => {
    setState(s => ({ ...s, error: '' }));
    setForm(p => ({ ...p, [k]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, sent: false, error: '' });
    try {
      const res = await fetch('/.netlify/functions/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setState({ busy: false, sent: false, error: data?.error || 'Could not send your message.' }); return; }
      setState({ busy: false, sent: true, error: '' });
      setForm({ name: '', email: '', subject: '', message: '', website: '' });
    } catch {
      setState({ busy: false, sent: false, error: `You appear to be offline. Email ${SUPPORT_EMAIL} directly.` });
    }
  };

  if (state.sent) {
    return (
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center"
        style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)', minHeight: 320 }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
          <Check size={26} style={{ color: '#15803d' }} strokeWidth={3} />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Message sent</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs">
          Thanks — we'll reply to the address you gave us. Most enquiries get an answer within a working day.
        </p>
        <button onClick={() => setState({ busy: false, sent: false, error: '' })}
          className="mt-6 text-sm font-semibold hover:underline" style={{ color: '#16a34a' }}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl p-8 flex flex-col gap-4"
      style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)' }}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Your name">
          <Input required value={form.name} onChange={set('name')} placeholder="Thandi Mokoena" autoComplete="name" />
        </FormField>
        <FormField label="Email address">
          <Input required type="email" value={form.email} onChange={set('email')}
            placeholder="you@farm.co.za" autoComplete="email" />
        </FormField>
      </div>
      <FormField label="Subject" hint="Optional">
        <Input value={form.subject} onChange={set('subject')} placeholder="e.g. Managing hives across two sites" />
      </FormField>
      <FormField label="Message">
        <Textarea required rows={5} value={form.message} onChange={set('message')}
          placeholder="Tell us about your farm and what you're trying to do…" />
      </FormField>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <input type="text" name="website" value={form.website} onChange={set('website')}
        tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

      {state.error && <AlertBox color="red">{state.error}</AlertBox>}

      <Btn type="submit" size="lg" className="w-full mt-1" disabled={state.busy}>
        {state.busy ? 'Sending…' : <>Send message <ArrowRight size={16} /></>}
      </Btn>
      <p className="text-xs text-slate-400 text-center">
        We'll only use your details to answer you.
      </p>
    </form>
  );
}

export default function Home() {
  const { user } = useAuth();
  const primaryTo = user ? (user.plan === 'unpaid' ? '/payment' : '/dashboard') : '/register';
  const primaryLabel = user ? 'Go to dashboard' : 'Start free trial';

  return (
    <div className="min-h-screen text-slate-800 bg-white">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 glass border-b border-slate-200/60">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>🐄</div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">isibaya</span>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/login"><Btn variant="ghost" size="md">Sign in</Btn></Link>
            )}
            <Link to={primaryTo}><Btn size="md">{primaryLabel}</Btn></Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={bgTint}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-24 w-[30rem] h-[30rem] rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #86efac, transparent 70%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <div className="fade-in text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-5">
              <Eyebrow>Livestock management for modern farms</Eyebrow>
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.07]">
              Run your whole farm from <span style={{ color: '#15803d' }}>one dashboard</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              isibaya brings every animal, sensor, health record and feed plan together in a single
              platform — so you spend less time on paperwork and more time farming.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
              <Link to={primaryTo} className="w-full sm:w-auto">
                <Btn size="lg" className="w-full sm:w-auto px-8">
                  {primaryLabel} <ArrowRight size={17} />
                </Btn>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Btn variant="secondary" size="lg" className="w-full sm:w-auto px-8">Sign in</Btn>
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-center lg:justify-start gap-x-5 gap-y-2 flex-wrap text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-green-600" strokeWidth={3} />14-day free trial</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-green-600" strokeWidth={3} />No card charged upfront</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-green-600" strokeWidth={3} />Cancel anytime</span>
            </div>
          </div>

          {/* Hero image + floating card */}
          <div className="relative fade-in">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 aspect-[4/3]">
              <img src={IMG.hero} alt="Herd of cattle grazing on a green pasture"
                className="w-full h-full object-cover" loading="eager" />
            </div>
            <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,.12)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                <Radio size={17} style={{ color: '#15803d' }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-green-500 pulse" /> Barn 3 · 21.4°C
                </div>
                <div className="text-[11px] text-slate-400">Live sensor · optimal range</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────── */}
      <section className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          {[
            ['11+', 'Species supported'],
            ['Real-time', 'IoT sensor data'],
            ['9', 'Modules in one place'],
            ['24/7', 'Access anywhere'],
          ].map(([big, small]) => (
            <div key={small} className="px-4 text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{big}</div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">{small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Eyebrow>Everything in one place</Eyebrow>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Nine modules, one login
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            isibaya replaces the spreadsheets, notebooks and guesswork with a single connected platform built for working farms.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title}
              className="group bg-white rounded-2xl p-7 border border-slate-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-green-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                <Icon size={21} style={{ color: '#15803d' }} />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Showcase rows ───────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col gap-24">

          {/* Row 1 — image left */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-1">
              <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 aspect-[5/4]">
                <img src={IMG.barn} alt="Cattle in a modern monitored barn"
                  className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
            <div className="order-2">
              <Eyebrow>Know your herd</Eyebrow>
              <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Every animal, tracked from birth to sale
              </h3>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Give each animal a living profile — breed, weight history, offspring, treatments and location — then
                let real-time sensors flag issues in the barn before they become problems.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {['Full lifecycle & breeding histories', 'Live temperature, humidity & air-quality alerts', 'Health timelines shared with your vet'].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
                      <Check size={12} style={{ color: '#15803d' }} strokeWidth={3} />
                    </span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Row 2 — image right */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Eyebrow>Run the whole operation</Eyebrow>
              <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Feed, fields, equipment and compliance — covered
              </h3>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Plan rations and grazing, map your paddocks, keep machinery serviced and stay ahead of regulations.
                Then turn all of it into reports that actually help you make decisions.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {['Ration planning & feed-cost control', 'Paddock & boundary mapping with GPS', 'One-click reports across every module'].map(t => (
                  <li key={t} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
                      <Check size={12} style={{ color: '#15803d' }} strokeWidth={3} />
                    </span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="rounded-3xl overflow-hidden shadow-xl ring-1 ring-black/5 aspect-[5/4]">
                <img src={IMG.field} alt="Farmer walking across a green pasture"
                  className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={bgTint}>
        <div className="relative max-w-3xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <Eyebrow>Simple pricing</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">One plan, everything included</h2>
            <p className="mt-4 text-slate-600">No tiers, no add-ons, no surprises.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10"
            style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 30px 70px rgba(0,0,0,.10)' }}>
            <div className="flex items-center gap-2 text-green-700 mb-4">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Built for working farms</span>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-5xl font-extrabold text-slate-900">R1,800</span>
              <span className="text-slate-500 mb-1.5">/ month</span>
            </div>
            <p className="text-sm text-green-700 font-semibold mt-2">Starts with a 14-day free trial</p>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5 mt-8">
              {PLAN_FEATURES.map(f => (
                <div key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
                    <Check size={12} style={{ color: '#15803d' }} strokeWidth={3} />
                  </span>
                  <span className="text-sm text-slate-600">{f}</span>
                </div>
              ))}
            </div>

            <Link to={primaryTo} className="block mt-9">
              <Btn size="lg" className="w-full">{primaryLabel} <ArrowRight size={17} /></Btn>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <section id="contact" className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-14">
          <div>
            <Eyebrow>Talk to us</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Questions about your farm?
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Whether you run cattle, sheep or hives, tell us what you need and we'll come back to you.
              Happy to talk through whether isibaya fits before you sign up.
            </p>

            <a href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-8 inline-flex items-center gap-3 rounded-2xl px-5 py-4 transition-colors hover:bg-green-50"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                <Mail size={19} style={{ color: '#15803d' }} />
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email us</span>
                <span className="block text-sm font-bold text-slate-800">{SUPPORT_EMAIL}</span>
              </span>
            </a>
          </div>

          <ContactForm />
        </div>
      </section>

      {/* ── Final CTA (full-bleed image) ────────────────────── */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={IMG.ctaBg} alt="" aria-hidden="true" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(20,83,45,.92), rgba(21,128,61,.82))' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 py-28 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Ready to modernise your farm?
          </h2>
          <p className="mt-4 text-green-50/90 max-w-xl mx-auto leading-relaxed">
            Bring every animal, sensor and record into one place — and start your 14-day free trial today.
          </p>
          <Link to={primaryTo} className="inline-block mt-8">
            <Btn variant="secondary" size="lg" className="px-10 bg-white hover:bg-green-50 text-green-800 border-0">
              {primaryLabel} <ArrowRight size={17} />
            </Btn>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>🐄</div>
            <span className="font-bold text-white">isibaya</span>
          </div>
          <p className="text-xs text-slate-400 order-last sm:order-none text-center">
            © {new Date().getFullYear()} isibaya. Livestock management for modern farms.
          </p>
          <div className="flex items-center gap-5 text-sm flex-wrap justify-center">
            <a href="#contact" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-300 hover:text-white transition-colors">
              {SUPPORT_EMAIL}
            </a>
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Sign in</Link>
            <Link to="/register" className="font-semibold text-green-400 hover:text-green-300 transition-colors">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
