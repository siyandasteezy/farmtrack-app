import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Beef, HeartPulse, Activity,
  Wheat, Scale, BarChart2, Wrench, LogOut, X, CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const NAV = [
  { to: '/dashboard',   label: 'Dashboard',       Icon: LayoutDashboard },
  { to: '/livestock',   label: 'Livestock',        Icon: Beef },
  { to: '/health',      label: 'Health & Vet',     Icon: HeartPulse },
  { to: '/sensors',     label: 'Sensors',          Icon: Activity },
  { to: '/feed',        label: 'Feed & Nutrition', Icon: Wheat },
  { to: '/regulations', label: 'Regulations',      Icon: Scale },
  { to: '/reports',     label: 'Reports',          Icon: BarChart2 },
  { to: '/equipment',   label: 'Equipment',        Icon: Wrench },
];

export function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-out',
          'lg:translate-x-0 lg:z-auto lg:relative lg:flex-shrink-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          background: 'linear-gradient(175deg, #0f4c2a 0%, #166534 55%, #14532d 100%)',
          boxShadow: '4px 0 32px rgba(0,0,0,.2)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(8px)' }}>
              🐄
            </div>
            <div>
              <div className="text-white font-extrabold text-lg leading-none tracking-tight">FarmTrack</div>
              <div className="text-[11px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-md inline-block"
                style={{ background: 'rgba(255,255,255,.15)', color: 'rgba(255,255,255,.8)' }}>
                PRO
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,.5)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Section label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-bold tracking-[0.15em] uppercase"
            style={{ color: 'rgba(255,255,255,.3)' }}>
            Main Menu
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-white text-green-900 shadow-lg'
                  : 'hover:bg-white/10'
              )}
              style={({ isActive }) => !isActive ? { color: 'rgba(255,255,255,.65)' } : {}}
            >
              {({ isActive }) => (
                <>
                  <div className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'text-white/70 group-hover:bg-white/10 group-hover:text-white'
                  )}
                    style={!isActive ? { background: 'rgba(255,255,255,.08)' } : {}}>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={isActive ? 'font-semibold text-green-900' : ''}>{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 my-3" style={{ height: '1px', background: 'rgba(255,255,255,.08)' }} />

        {/* Billing */}
        <div className="px-3 mb-2">
          <NavLink
            to="/billing"
            onClick={onClose}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive ? 'bg-white text-green-900 shadow-lg' : 'hover:bg-white/10'
            )}
            style={({ isActive }) => !isActive ? { color: 'rgba(255,255,255,.5)' } : {}}
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  isActive ? 'bg-green-100 text-green-700' : 'text-white/60'
                )}
                  style={!isActive ? { background: 'rgba(255,255,255,.07)' } : {}}>
                  <CreditCard size={15} strokeWidth={2} />
                </div>
                <span>Billing</span>
              </>
            )}
          </NavLink>
        </div>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(255,255,255,.9)', color: '#166534' }}
            >
              {user?.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white text-sm font-semibold truncate leading-tight">{user?.name}</div>
              <div className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,.4)' }}>
                {user?.farm}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all hover:bg-white/10 group"
            style={{ color: 'rgba(255,255,255,.4)' }}
          >
            <LogOut size={14} />
            <span className="group-hover:text-white/70 transition-colors">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
