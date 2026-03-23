import { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { REGULATIONS } from '../data/regulations';
import { AlertBox } from '../components/AlertBox';
import clsx from 'clsx';

const SEVERITY_STYLES = {
  red:   { dot: 'bg-red-500',   bg: '#fee2e2', text: '#b91c1c',  label: 'Mandatory' },
  amber: { dot: 'bg-amber-500', bg: '#fef3c7', text: '#b45309',  label: 'Required' },
  green: { dot: 'bg-green-500', bg: '#dcfce7', text: '#15803d',  label: 'Certification' },
  blue:  { dot: 'bg-blue-500',  bg: '#dbeafe', text: '#1d4ed8',  label: 'Recommended' },
};

function RegItem({ item }) {
  const [open, setOpen] = useState(false);
  const sty = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.blue;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-100 transition-all hover:border-slate-200">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sty.dot}`} />
        <div className="flex-1 font-semibold text-sm text-slate-800">{item.title}</div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: sty.bg, color: sty.text }}
          >
            {sty.label}
          </span>
          <ChevronDown
            size={14}
            className={clsx('text-slate-400 transition-transform', open && 'rotate-180')}
          />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/70">
          {item.body}
        </div>
      )}
    </div>
  );
}

export default function Regulations() {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return REGULATIONS.map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        const matchQ = !q || `${item.title} ${item.body}`.toLowerCase().includes(q);
        const matchT = !tagFilter || item.tag === tagFilter;
        return matchQ && matchT;
      }),
    })).filter(cat => cat.items.length > 0);
  }, [search, tagFilter]);

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Regulations &amp; Compliance</h2>
          <p className="text-sm text-slate-400 mt-0.5">International livestock farming standards reference</p>
        </div>
        <span
          className="text-xs font-bold px-3.5 py-1.5 rounded-xl"
          style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
        >
          Reference Guide · 2024
        </span>
      </div>

      <AlertBox color="blue">
        This is a reference guide based on common international livestock farming regulations.
        Always consult your local agricultural authority for jurisdiction-specific requirements.
      </AlertBox>

      {/* Search & filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/15 bg-white placeholder:text-slate-400 transition-all"
            placeholder="Search regulations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/15 transition-all"
          value={tagFilter} onChange={e => setTagFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option>Mandatory</option>
          <option>Certification</option>
          <option>Recommended</option>
        </select>
      </div>

      {/* Regulation sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm font-medium">No regulations match your search</p>
        </div>
      ) : (
        filtered.map(cat => (
          <div key={cat.category} className="bg-white rounded-2xl border border-slate-100 p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.category}</span>
            </h3>
            <div className="flex flex-col gap-2">
              {cat.items.map(item => <RegItem key={item.title} item={item} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
