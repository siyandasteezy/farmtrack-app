import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Sun, Bell } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/livestock':   'Livestock',
  '/health':      'Health & Vet',
  '/sensors':     'Sensors',
  '/feed':        'Feed & Nutrition',
  '/regulations': 'Regulations',
  '/reports':     'Reports & Analytics',
  '/billing':     'Billing & Subscription',
};

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[location.pathname] || 'FarmTrack';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0"
          style={{
            background: 'rgba(255,255,255,.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03)',
          }}>

          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all lg:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-800 leading-none">{title}</h1>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Weather */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold"
              style={{ background: '#fef9c3', color: '#92400e' }}>
              <Sun size={14} />
              <span>24°C · Sunny</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-700 leading-none">{user?.name?.split(' ')[0]}</div>
                <div className="text-xs text-slate-400 mt-0.5">{user?.role}</div>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
              >
                {user?.avatar}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
