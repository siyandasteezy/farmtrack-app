import { Link } from 'react-router-dom';
import {
  Radio, HeartPulse, Wheat, ShieldCheck, BarChart3, MapPin,
  Tractor, Map, LayoutDashboard, ArrowRight, Check, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Btn } from '../components/FormField';

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

const bgStyle = { background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' };

export default function Home() {
  const { user } = useAuth();
  const primaryTo = user ? (user.plan === 'unpaid' ? '/payment' : '/dashboard') : '/register';
  const primaryLabel = user ? 'Go to dashboard' : 'Start free trial';

  return (
    <div className="min-h-screen text-slate-800" style={{ background: '#f8fafc' }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 glass border-b border-slate-200/70">
        <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-sm"
              style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>🐄</div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">FarmTrack</span>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Link to="/login">
                <Btn variant="ghost" size="md">Sign in</Btn>
              </Link>
            )}
            <Link to={primaryTo}>
              <Btn size="md">{primaryLabel}</Btn>
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={bgStyle}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full opacity-40"
            style={{ background: 'radial-gradient(circle, #86efac, transparent)' }} />
          <div className="absolute -bottom-48 -left-40 w-[28rem] h-[28rem] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-green-200 text-xs font-bold text-green-700 mb-6 fade-in">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse" />
            Livestock management for modern farms
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08] max-w-3xl mx-auto fade-in">
            Run your whole farm from <span style={{ color: '#15803d' }}>one dashboard</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed fade-in">
            FarmTrack brings every animal, sensor, health record and feed plan together in a single
            platform — so you can spend less time on paperwork and more time farming.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 fade-in">
            <Link to={primaryTo}>
              <Btn size="lg" className="w-full sm:w-auto px-8">
                {primaryLabel} <ArrowRight size={17} />
              </Btn>
            </Link>
            <Link to="/login">
              <Btn variant="secondary" size="lg" className="w-full sm:w-auto px-8">Sign in</Btn>
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-500 fade-in">14-day free trial · No credit card charged upfront · Cancel anytime</p>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ['11+', 'Species supported'],
            ['Real-time', 'IoT sensor data'],
            ['9', 'Modules in one place'],
            ['24/7', 'Access from anywhere'],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{big}</div>
              <div className="text-xs md:text-sm text-slate-500 mt-1">{small}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Everything your farm needs</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Nine connected modules replace the spreadsheets, notebooks and guesswork — all under one login.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                <Icon size={20} style={{ color: '#15803d' }} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={bgStyle}>
        <div className="relative max-w-3xl mx-auto px-5 py-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">One simple plan</h2>
            <p className="mt-4 text-slate-600">Every feature included. No tiers, no add-ons, no surprises.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10"
            style={{ boxShadow: '0 4px 6px rgba(0,0,0,.04), 0 20px 60px rgba(0,0,0,.08)' }}>
            <div className="flex items-center gap-1.5 text-amber-500 mb-4">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              <span className="text-xs font-semibold text-slate-500 ml-1">Built for working farms</span>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-5xl font-extrabold text-slate-900">$500</span>
              <span className="text-slate-500 mb-1.5">/ month</span>
            </div>
            <p className="text-sm text-green-700 font-semibold mt-2">Starts with a 14-day free trial</p>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-7">
              {PLAN_FEATURES.map(f => (
                <div key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#dcfce7' }}>
                    <Check size={12} style={{ color: '#15803d' }} strokeWidth={3} />
                  </span>
                  <span className="text-sm text-slate-600">{f}</span>
                </div>
              ))}
            </div>

            <Link to={primaryTo} className="block mt-9">
              <Btn size="lg" className="w-full">
                {primaryLabel} <ArrowRight size={17} />
              </Btn>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Ready to modernise your farm?
          </h2>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto">
            Join farmers using FarmTrack to keep every animal healthy, every record straight and every decision informed.
          </p>
          <Link to={primaryTo} className="inline-block mt-8">
            <Btn size="lg" className="px-10">{primaryLabel} <ArrowRight size={17} /></Btn>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>🐄</div>
            <span className="font-bold text-slate-700">FarmTrack</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} FarmTrack. Livestock management for modern farms.</p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/login" className="text-slate-500 hover:text-slate-800 transition-colors">Sign in</Link>
            <Link to="/register" className="font-semibold hover:underline" style={{ color: '#16a34a' }}>Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
