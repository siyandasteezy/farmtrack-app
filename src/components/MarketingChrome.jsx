import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { primaryCta } from '../data/marketing';
import { Btn } from './FormField';

/**
 * Nav and footer shared by every public page.
 *
 * Lives here rather than being copied per page so the marketing site cannot
 * drift into having different menus depending on which page you landed on.
 */

export const SUPPORT_EMAIL = 'support@smartpick.co.za';

export function MarketingNav() {
  const { user } = useAuth();
  const { to, label } = primaryCta(user);

  return (
    <header className="sticky top-0 z-30 glass border-b border-slate-200/60">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-sm"
            style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>🐄</div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">isibaya</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link to="/how-it-works/livestock" className="hover:text-green-700 transition-colors">Livestock</Link>
          <Link to="/how-it-works/crops" className="hover:text-green-700 transition-colors">Fruit, veg &amp; grain</Link>
          <Link to="/#pricing" className="hover:text-green-700 transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!user && <Link to="/login"><Btn variant="ghost" size="md">Sign in</Btn></Link>}
          <Link to={to}><Btn size="md">{label}</Btn></Link>
        </div>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: 'linear-gradient(135deg, #14532d, #15803d)' }}>🐄</div>
          <span className="font-bold text-white">isibaya</span>
        </div>
        <p className="text-xs text-slate-400 order-last sm:order-none text-center">
          © {new Date().getFullYear()} isibaya. Farm management for South African farms.
        </p>
        <div className="flex items-center gap-5 text-sm flex-wrap justify-center">
          <Link to="/#contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
          <Link to="/how-it-works/livestock" className="text-slate-300 hover:text-white transition-colors">Livestock</Link>
          <Link to="/how-it-works/crops" className="text-slate-300 hover:text-white transition-colors">Crops</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-300 hover:text-white transition-colors">
            {SUPPORT_EMAIL}
          </a>
          <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Sign in</Link>
          <Link to="/register" className="font-semibold text-green-400 hover:text-green-300 transition-colors">Create account</Link>
        </div>
      </div>
    </footer>
  );
}
