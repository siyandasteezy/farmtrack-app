import clsx from 'clsx';

const THEMES = {
  green: {
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    border: '#bbf7d0',
    iconBg: 'linear-gradient(135deg, #16a34a, #15803d)',
    value: '#14532d',
    label: '#166534',
    sub: '#4ade80',
  },
  amber: {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    border: '#fde68a',
    iconBg: 'linear-gradient(135deg, #d97706, #b45309)',
    value: '#78350f',
    label: '#92400e',
    sub: '#fbbf24',
  },
  red: {
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '#fecaca',
    iconBg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    value: '#7f1d1d',
    label: '#991b1b',
    sub: '#f87171',
  },
  blue: {
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '#bfdbfe',
    iconBg: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    value: '#1e3a8a',
    label: '#1e40af',
    sub: '#60a5fa',
  },
  purple: {
    bg: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)',
    border: '#ddd6fe',
    iconBg: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    value: '#3b0764',
    label: '#4c1d95',
    sub: '#a78bfa',
  },
};

export function StatCard({ icon, label, value, sub, color = 'green' }) {
  const theme = THEMES[color] || THEMES.green;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5 fade-in"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04)',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
        style={{ background: theme.iconBg }}
      >
        {icon}
      </div>

      {/* Value */}
      <div>
        <div
          className="text-3xl font-extrabold leading-none tracking-tight"
          style={{ color: theme.value }}
        >
          {value}
        </div>
        <div
          className="text-xs font-semibold uppercase tracking-widest mt-2"
          style={{ color: theme.label, opacity: 0.7 }}
        >
          {label}
        </div>
      </div>

      {/* Sub */}
      {sub && (
        <div className="text-xs font-medium" style={{ color: theme.label, opacity: 0.6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
