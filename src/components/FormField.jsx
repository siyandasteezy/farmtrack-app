export function FormField({ label, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700">{label}</label>
      )}
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

const inputBase = [
  'w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 bg-white outline-none transition-all',
  'border-slate-200 placeholder:text-slate-400',
  'focus:border-green-500 focus:ring-3 focus:ring-green-500/15',
  'hover:border-slate-300',
].join(' ');

export function Input({ className = '', ...props }) {
  return <input className={`${inputBase} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputBase} cursor-pointer ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea className={`${inputBase} resize-none ${className}`} {...props} />
  );
}

export function Btn({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed';

  const variants = {
    primary:   { cls: 'text-white shadow-sm hover:shadow-md', style: { background: 'linear-gradient(135deg, #16a34a, #15803d)' } },
    secondary: { cls: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80', style: {} },
    danger:    { cls: 'text-white shadow-sm hover:shadow-md', style: { background: 'linear-gradient(135deg, #dc2626, #b91c1c)' } },
    amber:     { cls: 'text-white shadow-sm', style: { background: 'linear-gradient(135deg, #d97706, #b45309)' } },
    blue:      { cls: 'text-white shadow-sm', style: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' } },
    ghost:     { cls: 'bg-transparent hover:bg-slate-100 text-slate-600', style: {} },
  };

  const sizes = {
    sm:   'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md:   'px-4 py-2.5 text-sm gap-2 rounded-xl',
    lg:   'px-6 py-3 text-sm gap-2.5 rounded-xl',
    icon: 'p-2 rounded-lg',
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      className={`${base} ${v.cls} ${sizes[size] || sizes.md} ${className}`}
      style={v.style}
      {...props}
    >
      {children}
    </button>
  );
}
