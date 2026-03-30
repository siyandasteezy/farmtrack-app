import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { MapPin, List, Battery, BatteryLow, Wifi, Clock, X, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

/* ── Farm Zone Layout ────────────────────────────────────────────────
   SVG viewBox: "0 0 720 460"
   Each zone: { x, y, w, h, color, border, emoji }
──────────────────────────────────────────────────────────────────── */
const FARM_ZONES = {
  'Paddock A':   { x:10,  y:10,  w:200, h:200, color:'#dcfce7', border:'#4ade80', emoji:'🐄', label:'Paddock A'   },
  'Barn 1':      { x:220, y:10,  w:160, h:90,  color:'#fefce8', border:'#fde047', emoji:'🏠', label:'Barn 1'      },
  'Stable 1':    { x:220, y:110, w:160, h:100, color:'#fdf4ff', border:'#d8b4fe', emoji:'🐴', label:'Stable 1'    },
  'Field B':     { x:390, y:10,  w:160, h:200, color:'#f0fdf4', border:'#86efac', emoji:'🌾', label:'Field B'     },
  'Hen House 1': { x:560, y:10,  w:150, h:90,  color:'#fffbeb', border:'#fcd34d', emoji:'🐔', label:'Hen House 1' },
  'Hen House 2': { x:560, y:110, w:150, h:100, color:'#fffbeb', border:'#fcd34d', emoji:'🐔', label:'Hen House 2' },
  'Field C':     { x:10,  y:220, w:200, h:120, color:'#f0fdf4', border:'#6ee7b7', emoji:'🐐', label:'Field C'     },
  'Pen 1':       { x:220, y:220, w:90,  h:120, color:'#fdf2f8', border:'#f0abfc', emoji:'🐷', label:'Pen 1'       },
  'Farrowing':   { x:320, y:220, w:60,  h:120, color:'#fff7ed', border:'#fdba74', emoji:'🐷', label:'Farrowing'   },
  'Field D':     { x:390, y:220, w:160, h:120, color:'#fefce8', border:'#bef264', emoji:'🦙', label:'Field D'     },
  'Orchard':     { x:560, y:220, w:150, h:120, color:'#fafaf9', border:'#a8a29e', emoji:'🌳', label:'Orchard'     },
  'Quarantine':  { x:10,  y:350, w:150, h:100, color:'#fff1f2', border:'#fca5a5', emoji:'🚨', label:'Quarantine'  },
  'Field E':     { x:170, y:350, w:200, h:100, color:'#f0fdf4', border:'#6ee7b7', emoji:'🦌', label:'Field E'     },
  'Pond Area':   { x:380, y:350, w:130, h:100, color:'#eff6ff', border:'#93c5fd', emoji:'🐟', label:'Pond Area'   },
  'Hutch Row A': { x:520, y:350, w:190, h:100, color:'#f5f5f4', border:'#d6d3d1', emoji:'🐇', label:'Hutch Row A' },
};

const SPECIES_MARKER = {
  Cattle:  { bg:'#16a34a', ring:'#dcfce7' },
  Sheep:   { bg:'#3b82f6', ring:'#dbeafe' },
  Goat:    { bg:'#eab308', ring:'#fef9c3' },
  Pig:     { bg:'#ec4899', ring:'#fce7f3' },
  Horse:   { bg:'#a855f7', ring:'#f3e8ff' },
  Poultry: { bg:'#f97316', ring:'#ffedd5' },
  Rabbit:  { bg:'#78716c', ring:'#f5f5f4' },
  Alpaca:  { bg:'#d946ef', ring:'#fdf4ff' },
  Duck:    { bg:'#06b6d4', ring:'#cffafe' },
  Deer:    { bg:'#f59e0b', ring:'#fef3c7' },
  Bee:     { bg:'#ca8a04', ring:'#fefce8' },
};

const SPECIES_META = {
  Cattle:'🐄', Sheep:'🐑', Goat:'🐐', Pig:'🐷', Horse:'🐴',
  Poultry:'🐔', Rabbit:'🐇', Alpaca:'🦙', Duck:'🦆', Deer:'🦌', Bee:'🐝',
};

const STATUS_STYLE = {
  Healthy:    { bg:'#f0fdf4', border:'#bbf7d0', text:'#16a34a' },
  Pregnant:   { bg:'#eff6ff', border:'#bfdbfe', text:'#2563eb' },
  Treatment:  { bg:'#fff7ed', border:'#fed7aa', text:'#c2410c' },
  Quarantine: { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
  Sick:       { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
  Sold:       { bg:'#f1f5f9', border:'#cbd5e1', text:'#64748b' },
};

/* Stable pseudo-random position within a zone based on animal id */
function markerPos(id, zone) {
  const a = Math.abs(Math.sin(id * 127.1 + 1) * 9999) % 1;
  const b = Math.abs(Math.sin(id * 311.7 + 7) * 9999) % 1;
  return {
    x: zone.x + 14 + a * (zone.w - 28),
    y: zone.y + 18 + b * (zone.h - 36),
  };
}

function relativeTime(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function BatteryBadge({ pct }) {
  const color = pct > 50 ? '#16a34a' : pct > 20 ? '#f59e0b' : '#ef4444';
  const bg    = pct > 50 ? '#f0fdf4' : pct > 20 ? '#fffbeb' : '#fff5f5';
  const Icon  = pct < 20 ? BatteryLow : Battery;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
      style={{ background: bg, color, border: `1px solid ${color}33` }}>
      <Icon size={11} /> {pct}%
    </span>
  );
}

/* ── Detail Panel ───────────────────────────────────────────────────── */

function DetailPanel({ animal, healthRecords, onClose }) {
  const st  = STATUS_STYLE[animal.status] || STATUS_STYLE.Healthy;
  const mk  = SPECIES_MARKER[animal.species] || SPECIES_MARKER.Cattle;
  const trk = animal.tracker;
  const lastHealth = healthRecords
    .filter(h => h.animalTag === animal.tag || h.animalId === animal.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  return (
    <div className="flex flex-col h-full" style={{ background: '#fff' }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${mk.ring}, #fff)`, borderBottom: '1px solid #f1f5f9' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: mk.ring, border: `2px solid ${mk.bg}33` }}>
              {SPECIES_META[animal.species] || '🐾'}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{animal.name}</h3>
              <div className="text-xs text-slate-500 mt-0.5 font-mono font-bold">{animal.tag}</div>
            </div>
          </div>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        {/* Status */}
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
          style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: st.text }} />
          {animal.status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

        {/* Tracker */}
        {trk ? (
          <div className="rounded-2xl p-4" style={{ background: '#0f172a', border: '1px solid #1e293b' }}>
            <div className="flex items-center gap-2 mb-3">
              <Wifi size={13} color="#22c55e" />
              <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Live Tracker</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <div className="text-slate-500 mb-0.5">Device</div>
                <div className="font-mono font-bold text-white">{trk.deviceId}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-0.5">Battery</div>
                <BatteryBadge pct={trk.battery} />
              </div>
              <div className="col-span-2">
                <div className="text-slate-500 mb-0.5">Last seen</div>
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock size={11} className="text-slate-500" />
                  {relativeTime(trk.lastSeen)} · {new Date(trk.lastSeen).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-500 mb-1">Signal</div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${trk.battery}%` }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <MapPin size={16} className="text-slate-300 flex-shrink-0" />
            <div className="text-xs text-slate-400">No GPS tracker attached to this animal.</div>
          </div>
        )}

        {/* Location */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Location</div>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <MapPin size={14} className="text-green-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-700">{animal.location}</span>
          </div>
        </div>

        {/* Animal details */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Animal Details</div>
          <div className="rounded-2xl overflow-hidden border border-slate-100">
            {[
              ['Species',  `${SPECIES_META[animal.species]} ${animal.species}`],
              ['Breed',    animal.breed],
              ['Sex',      animal.sex],
              ['Age',      `${animal.age} yr${animal.age !== 1 ? 's' : ''}`],
              ['Weight',   animal.weight ? `${animal.weight} kg` : '—'],
              ['Born',     animal.dob],
            ].map(([k, v], i) => (
              <div key={k} className={clsx('flex items-center justify-between px-3 py-2.5 text-xs', i !== 0 && 'border-t border-slate-50')}>
                <span className="text-slate-400 font-semibold">{k}</span>
                <span className="font-bold text-slate-700">{v}</span>
              </div>
            ))}
            {animal.notes && (
              <div className="border-t border-slate-50 px-3 py-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Notes</span>
                <span className="text-xs text-slate-600">{animal.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Last health event */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Last Health Event</div>
          {lastHealth ? (
            <div className="rounded-2xl p-3.5" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg text-white"
                  style={{ background: lastHealth.type === 'Vaccination' ? '#3b82f6' : lastHealth.type === 'Treatment' ? '#ef4444' : '#64748b' }}>
                  {lastHealth.type}
                </span>
                <span className="text-xs text-slate-400">{lastHealth.date}</span>
              </div>
              <div className="text-xs font-semibold text-slate-700">{lastHealth.description || lastHealth.notes || '—'}</div>
              {lastHealth.vet && <div className="text-[11px] text-slate-400 mt-1">Dr. {lastHealth.vet}</div>}
            </div>
          ) : (
            <div className="rounded-2xl p-3.5 text-xs text-slate-400" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              No health records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Farm Map SVG ───────────────────────────────────────────────────── */

function FarmMap({ trackedAnimals, selected, onSelect }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative w-full overflow-auto rounded-2xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
        style={{ background: 'rgba(255,255,255,.95)', border: '1px solid #e2e8f0', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,.06)' }}>
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Species</div>
        {[...new Set(trackedAnimals.map(a => a.species))].map(sp => (
          <div key={sp} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: SPECIES_MARKER[sp]?.bg || '#64748b' }} />
            {SPECIES_META[sp]} {sp}
          </div>
        ))}
      </div>

      {/* Compass */}
      <div className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-500"
        style={{ background: 'rgba(255,255,255,.9)', border: '1px solid #e2e8f0' }}>
        N
      </div>

      <svg
        viewBox="0 0 720 460"
        style={{ minWidth: 520, width: '100%', display: 'block' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Farm boundary */}
        <rect x="5" y="5" width="710" height="450" rx="12"
          fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" strokeDasharray="8 4" />

        {/* Zones */}
        {Object.entries(FARM_ZONES).map(([name, z]) => (
          <g key={name}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="8"
              fill={z.color} stroke={z.border} strokeWidth="1.5" />
            {/* Zone label */}
            <text x={z.x + z.w / 2} y={z.y + 13} textAnchor="middle"
              style={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700, fontFamily: 'ui-sans-serif,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {z.label}
            </text>
          </g>
        ))}

        {/* Animal markers */}
        {trackedAnimals.map(animal => {
          const zone = FARM_ZONES[animal.location];
          if (!zone) return null;
          const pos  = markerPos(animal.id, zone);
          const mk   = SPECIES_MARKER[animal.species] || SPECIES_MARKER.Cattle;
          const isSel = selected?.id === animal.id;
          const isHov = hovered === animal.id;
          const lowBat = animal.tracker?.battery < 20;

          return (
            <g key={animal.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(isSel ? null : animal)}
              onMouseEnter={() => setHovered(animal.id)}
              onMouseLeave={() => setHovered(null)}>

              {/* Selection ring */}
              {(isSel || isHov) && (
                <circle cx={pos.x} cy={pos.y} r="16"
                  fill="none" stroke={mk.bg} strokeWidth="3" opacity="0.6" />
              )}

              {/* Marker background */}
              <circle cx={pos.x} cy={pos.y} r={isSel ? 13 : 10}
                fill={mk.bg} stroke="#fff" strokeWidth="2"
                style={{ filter: isSel ? `drop-shadow(0 0 6px ${mk.bg}99)` : 'none', transition: 'r 0.15s' }} />

              {/* Species emoji */}
              <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                style={{ fontSize: isSel ? 13 : 10, userSelect: 'none', transition: 'font-size 0.15s' }}>
                {SPECIES_META[animal.species] || '🐾'}
              </text>

              {/* Low battery warning dot */}
              {lowBat && (
                <circle cx={pos.x + 9} cy={pos.y - 8} r="4"
                  fill="#ef4444" stroke="#fff" strokeWidth="1.5" />
              )}

              {/* Hover tooltip */}
              {isHov && !isSel && (
                <g>
                  <rect x={pos.x - 30} y={pos.y - 36} width={60} height={20} rx="6"
                    fill="#0f172a" opacity="0.92" />
                  <text x={pos.x} y={pos.y - 22} textAnchor="middle"
                    style={{ fontSize: 9, fill: '#f1f5f9', fontWeight: 700, fontFamily: 'ui-sans-serif,sans-serif' }}>
                    {animal.name} · {animal.tag}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Tracked List ───────────────────────────────────────────────────── */

function TrackedList({ allAnimals, onSelect }) {
  const tracked = allAnimals.filter(a => a.tracker);
  const untracked = allAnimals.filter(a => !a.tracker);

  const Row = ({ a }) => {
    const st  = STATUS_STYLE[a.status] || STATUS_STYLE.Healthy;
    const trk = a.tracker;
    return (
      <tr className="hover:bg-slate-50/70 transition-colors cursor-pointer" onClick={() => onSelect(a)}>
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: SPECIES_MARKER[a.species]?.ring || '#f1f5f9' }}>
              {SPECIES_META[a.species]}
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm leading-tight">{a.name}</div>
              <div className="text-[11px] font-mono font-bold text-slate-400">{a.tag}</div>
            </div>
          </div>
        </td>
        <td className="py-3 pr-4 text-xs text-slate-600 font-semibold">{a.species}</td>
        <td className="py-3 pr-4">
          <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">📍 {a.location}</span>
        </td>
        <td className="py-3 pr-4">
          <span className="text-[11px] font-bold px-2 py-1 rounded-lg" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
            {a.status}
          </span>
        </td>
        {trk ? (
          <>
            <td className="py-3 pr-4"><BatteryBadge pct={trk.battery} /></td>
            <td className="py-3 pr-4 text-xs text-slate-500 font-semibold">{relativeTime(trk.lastSeen)}</td>
            <td className="py-3 text-[11px] font-mono text-slate-400">{trk.deviceId}</td>
          </>
        ) : (
          <td colSpan={3} className="py-3 text-xs text-slate-300 italic">No tracker</td>
        )}
      </tr>
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="text-sm font-extrabold text-slate-700">All Animals</div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold px-2.5 py-1 rounded-lg text-white" style={{ background: '#16a34a' }}>{tracked.length} tracked</span>
          <span className="font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500">{untracked.length} untracked</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {['Animal', 'Species', 'Location', 'Status', 'Battery', 'Last Seen', 'Device ID'].map(h => (
                <th key={h} className="pb-3 pr-4 pt-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left whitespace-nowrap first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 px-5">
            {[...tracked, ...untracked].map(a => <Row key={a.id} a={a} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function Tracking() {
  const { livestock, health } = useData();
  const [view, setView]       = useState('map');
  const [selected, setSelected] = useState(null);

  const trackedAnimals = useMemo(() => livestock.filter(a => a.tracker), [livestock]);
  const lowBattery     = useMemo(() => trackedAnimals.filter(a => a.tracker.battery < 20), [trackedAnimals]);
  const onlineCount    = trackedAnimals.length; // all with trackers are "online" in simulation

  const handleSelect = (animal) => {
    setSelected(animal);
    if (animal && view === 'list') setView('map');
  };

  return (
    <div className="flex flex-col gap-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Animal Tracking</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Live GPS tracker map — {trackedAnimals.length} of {livestock.length} animals tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
            style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', color: '#15803d', border: '1px solid #bbf7d0' }}>
            <div className="w-2 h-2 rounded-full bg-green-500 pulse" />
            {onlineCount} Online
          </div>
        </div>
      </div>

      {/* Low battery alert */}
      {lowBattery.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
          style={{ background: '#fff5f5', border: '1px solid #fca5a5' }}>
          <AlertTriangle size={16} color="#ef4444" className="flex-shrink-0" />
          <span className="text-red-700 font-semibold">
            Low battery: {lowBattery.map(a => `${a.name} (${a.tracker.battery}%)`).join(', ')} — trackers need charging.
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tracked Animals', value: trackedAnimals.length,                               icon: '📡', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Untracked',       value: livestock.length - trackedAnimals.length,             icon: '📍', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
          { label: 'Zones Active',    value: new Set(trackedAnimals.map(a => a.location)).size,    icon: '🗺️',  color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'Low Battery',     value: lowBattery.length,                                    icon: '🔋', color: '#ef4444', bg: '#fff5f5', border: '#fecaca' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
        {[{ id: 'map', label: 'Map View', icon: <MapPin size={14} /> }, { id: 'list', label: 'List View', icon: <List size={14} /> }].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
              view === v.id ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700')}>
            {v.icon}{v.label}
          </button>
        ))}
      </div>

      {/* Map view */}
      {view === 'map' && (
        <div className="flex gap-4 items-start">
          {/* Map */}
          <div className="flex-1 min-w-0">
            <FarmMap
              trackedAnimals={trackedAnimals}
              selected={selected}
              onSelect={handleSelect}
            />
            <p className="text-xs text-slate-400 mt-2 text-center">
              Click any animal marker to view details · Markers show approximate GPS position within zone
            </p>
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="w-80 flex-shrink-0 rounded-2xl overflow-hidden shadow-xl flex flex-col"
              style={{ border: '1px solid #e2e8f0', maxHeight: 'calc(100vh - 180px)', position: 'sticky', top: 16 }}>
              <DetailPanel
                animal={selected}
                healthRecords={health}
                onClose={() => setSelected(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <TrackedList allAnimals={livestock} onSelect={handleSelect} />
      )}

      {/* No trackers state */}
      {trackedAnimals.length === 0 && (
        <div className="rounded-2xl p-12 text-center" style={{ background: '#fff', border: '1px dashed #e2e8f0' }}>
          <div className="text-4xl mb-3">📡</div>
          <h3 className="text-base font-extrabold text-slate-700 mb-1">No GPS Trackers Active</h3>
          <p className="text-sm text-slate-400">Assign a tracker device to an animal on the Livestock page to see it appear here.</p>
        </div>
      )}
    </div>
  );
}
