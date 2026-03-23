import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const STYLES = {
  red: {
    Icon: AlertCircle,
    bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', iconColor: '#ef4444',
    iconBg: '#fee2e2',
  },
  amber: {
    Icon: AlertTriangle,
    bg: '#fffbeb', border: '#fde68a', text: '#92400e', iconColor: '#f59e0b',
    iconBg: '#fef3c7',
  },
  green: {
    Icon: CheckCircle,
    bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', iconColor: '#22c55e',
    iconBg: '#dcfce7',
  },
  blue: {
    Icon: Info,
    bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', iconColor: '#3b82f6',
    iconBg: '#dbeafe',
  },
};

export function AlertBox({ color = 'blue', children, className }) {
  const s = STYLES[color] || STYLES.blue;
  const { Icon } = s;

  return (
    <div
      className={clsx('flex items-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium', className)}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: s.iconBg }}
      >
        <Icon size={14} style={{ color: s.iconColor }} />
      </div>
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
