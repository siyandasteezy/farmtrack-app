import clsx from 'clsx';

const COLORS = {
  green:  { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  amber:  { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  red:    { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  blue:   { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  purple: { bg: '#ede9fe', text: '#6d28d9', dot: '#8b5cf6' },
  gray:   { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
};

const STATUS_MAP = {
  Healthy: 'green', Pregnant: 'blue', Treatment: 'red',
  Scheduled: 'amber', Completed: 'green', Ongoing: 'amber',
  normal: 'green', warn: 'amber', alert: 'red',
  active: 'green', unpaid: 'red', trial: 'amber',
};

export function Badge({ children, color, status, dot = false, className }) {
  const key = color || STATUS_MAP[status] || 'gray';
  const theme = COLORS[key] || COLORS.gray;

  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide', className)}
      style={{ background: theme.bg, color: theme.text }}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme.dot }} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge status={status} dot>{status}</Badge>;
}
