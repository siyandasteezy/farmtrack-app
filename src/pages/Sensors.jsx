import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { AlertBox } from '../components/AlertBox';
import { PenLine, X, RotateCcw, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

const TEMP_DATA = [19,18,17,17,18,20,22,24,25,26,25,24].map((v,i) => ({ t:`${i*2}:00`, barn:v, hen:v+2.5 }));

const REASONS = [
  'Sensor offline',
  'Sensor malfunction',
  'Calibration check',
  'Cross-verification reading',
  'Temporary replacement reading',
  'Maintenance period',
  'Other',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1e293b', borderRadius:10, padding:'10px 14px', boxShadow:'0 10px 25px rgba(0,0,0,.2)' }}>
      <p style={{ color:'#94a3b8', fontSize:11, marginBottom:6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#f1f5f9', marginBottom:2 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
          <span style={{ color:'#94a3b8' }}>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{p.value}°C</span>
        </div>
      ))}
    </div>
  );
};

function pct(s) {
  if (s.max === s.min) return 100;
  return Math.round(((s.value - s.min) / (s.max - s.min)) * 100);
}

function formatLoggedAt(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-ZA', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function SensorCard({ sensor: s, onManualEntry, onClearOverride }) {
  const p = Math.max(0, Math.min(100, pct(s)));
  const isAlert = s.status === 'alert';
  const isWarn  = s.status === 'warn';

  const barColor   = isAlert ? '#ef4444' : isWarn ? '#f59e0b' : '#22c55e';
  const topColor   = s.isManual ? '#8b5cf6' : (isAlert ? '#ef4444' : isWarn ? '#f59e0b' : '#22c55e');
  const cardBg     = s.isManual
    ? 'linear-gradient(135deg,#faf5ff,#ede9fe)'
    : isAlert ? 'linear-gradient(135deg,#fff5f5,#fee2e2)'
    : isWarn  ? 'linear-gradient(135deg,#fffbeb,#fef3c7)'
    : '#ffffff';
  const cardBorder = s.isManual ? '#c4b5fd' : isAlert ? '#fca5a5' : isWarn ? '#fde68a' : '#e2e8f0';

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5 group"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
      }}
    >
      {/* Top colour bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: topColor }} />

      {/* Category + manual badge row */}
      <div className="flex items-center justify-between mb-2.5 gap-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{s.category}</div>
        {s.isManual && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{ background:'#ede9fe', color:'#7c3aed', border:'1px solid #c4b5fd' }}>
            MANUAL
          </span>
        )}
      </div>

      {/* Value row */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xl leading-none">{s.icon}</span>
        <span className="text-2xl font-extrabold text-slate-900 leading-none">{s.value}</span>
        <span className="text-xs text-slate-400 leading-none">{s.unit}</span>
      </div>

      {/* Name */}
      <div className="text-sm font-bold text-slate-700 mb-3 truncate">{s.name}</div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all" style={{ width:`${p}%`, background: barColor }} />
      </div>

      {/* Min / max scale */}
      <div className="flex justify-between text-[10px] text-slate-400 mb-2">
        <span>{s.min}</span>
        <span>{s.max}</span>
      </div>

      {/* Location + status */}
      <div className="text-[11px] text-slate-400 mb-1 truncate">📍 {s.location}</div>
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: barColor }}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isAlert ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-green-500 pulse'}`} />
        {s.status === 'normal' ? 'Normal' : s.status === 'warn' ? 'Warning' : 'Critical'}
      </div>

      {/* Action buttons — appear on hover */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
        <button
          onClick={() => onManualEntry(s)}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg transition-all hover:opacity-90"
          style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', color:'#fff' }}
        >
          <PenLine size={11} />
          Manual Entry
        </button>
        {s.isManual && (
          <button
            onClick={() => onClearOverride(s.id)}
            title="Clear manual override — restore sensor reading"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Manual Entry Modal ─────────────────────────────────────────────── */
function ManualEntryModal({ sensor, onClose, onSave }) {
  const [form, setForm] = useState({
    value: sensor.value,
    reason: REASONS[0],
    notes: '',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const num = parseFloat(form.value);
    if (isNaN(num)) { setError('Please enter a valid number.'); return; }
    onSave({ sensorId: sensor.id, value: num, reason: form.reason, notes: form.notes });
    onClose();
  };

  const predictedStatus = () => {
    const num = parseFloat(form.value);
    if (isNaN(num)) return null;
    if (num < sensor.min) return { label:'Critical', color:'#ef4444', bg:'#fee2e2' };
    if (num > sensor.max) return { label:'Warning',  color:'#f59e0b', bg:'#fef3c7' };
    return { label:'Normal', color:'#16a34a', bg:'#dcfce7' };
  };
  const pred = predictedStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background:'#fff', boxShadow:'0 20px 60px rgba(0,0,0,.18)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', borderBottom:'1px solid #7c3aed' }}>
          <div>
            <div className="text-white font-extrabold text-base flex items-center gap-2">
              <PenLine size={16} /> Manual Sensor Reading
            </div>
            <div className="text-violet-200 text-xs mt-0.5">{sensor.icon} {sensor.name} · {sensor.location}</div>
          </div>
          <button onClick={onClose} className="text-violet-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Context strip */}
          <div className="rounded-xl p-3 flex items-center gap-4 text-xs"
            style={{ background:'#f8fafc', border:'1px solid #e2e8f0' }}>
            <div className="text-center">
              <div className="text-slate-400 mb-0.5">Current</div>
              <div className="font-extrabold text-slate-800">{sensor.value}{sensor.unit}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-slate-400 mb-0.5">Min</div>
              <div className="font-bold text-slate-600">{sensor.min}{sensor.unit}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 mb-0.5">Max</div>
              <div className="font-bold text-slate-600">{sensor.max}{sensor.unit}</div>
            </div>
            {pred && (
              <>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-slate-400 mb-0.5">Predicted</div>
                  <span className="font-bold px-2 py-0.5 rounded-lg text-[11px]"
                    style={{ background: pred.bg, color: pred.color }}>{pred.label}</span>
                </div>
              </>
            )}
          </div>

          {/* New value */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              New Reading Value <span className="text-slate-400 font-normal">({sensor.unit})</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                value={form.value}
                onChange={e => { set('value', e.target.value); setError(''); }}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
              <span className="text-sm font-semibold text-slate-400 pr-1">{sensor.unit}</span>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Reason for Manual Entry</label>
            <select
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            >
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="e.g. Sensor probe submerged — reading taken with handheld device"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
            />
          </div>

          {/* Info note */}
          <div className="rounded-xl p-3 text-xs text-violet-700 flex gap-2"
            style={{ background:'#f5f3ff', border:'1px solid #ede9fe' }}>
            <span className="mt-0.5">ℹ️</span>
            <span>This reading will override the sensor display and be logged in the Manual Readings history below. The sensor will be marked <strong>MANUAL</strong> until a live reading is restored.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
            Save Reading
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function Sensors() {
  const { sensors, addManualReading, clearManualOverride, manualReadings } = useData();
  const [cat, setCat] = useState('All');
  const [activeModal, setActiveModal] = useState(null); // sensor object

  const categories = useMemo(() => ['All', ...new Set(sensors.map(s => s.category))], [sensors]);
  const shown = cat === 'All' ? sensors : sensors.filter(s => s.category === cat);
  const alerts = sensors.filter(s => s.status !== 'normal');

  const normalCount = sensors.filter(s => s.status === 'normal').length;
  const warnCount   = sensors.filter(s => s.status === 'warn').length;
  const alertCount  = sensors.filter(s => s.status === 'alert').length;
  const manualCount = sensors.filter(s => s.isManual).length;

  const card = {
    background: '#ffffff',
    borderRadius: 20,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
    padding: 24,
  };

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Farm Sensors</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time IoT monitoring — {sensors.length} sensors active
            {manualCount > 0 && (
              <span className="ml-2 text-violet-500 font-semibold">· {manualCount} manual override{manualCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
          style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', color:'#15803d', border:'1px solid #bbf7d0' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 pulse" />
          Live · Updated now
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.filter(s => s.status === 'alert').map(s => (
            <AlertBox key={s.id} color="red">
              <strong>{s.icon} {s.name}</strong> at <strong>{s.location}</strong> is CRITICAL — {s.value}{s.unit}
              {s.isManual && <span className="ml-1 text-xs font-bold">(manual reading)</span>}
            </AlertBox>
          ))}
          {alerts.filter(s => s.status === 'warn').map(s => (
            <AlertBox key={s.id} color="amber">
              <strong>{s.icon} {s.name}</strong> at <strong>{s.location}</strong> — {s.value}{s.unit} approaching threshold
              {s.isManual && <span className="ml-1 text-xs font-bold">(manual reading)</span>}
            </AlertBox>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all',
              cat === c
                ? 'text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700'
            )}
            style={cat === c ? { background:'linear-gradient(135deg, #16a34a, #15803d)' } : {}}>
            {c}
          </button>
        ))}
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {shown.map(s => (
          <SensorCard
            key={s.id}
            sensor={s}
            onManualEntry={setActiveModal}
            onClearOverride={clearManualOverride}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Temperature Trend (24h)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TEMP_DATA}>
              <defs>
                <linearGradient id="gb2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="ga2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit="°" />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} iconType="circle" formatter={v => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
              <Area type="monotone" dataKey="barn" stroke="#22c55e" strokeWidth={2.5} fill="url(#gb2)" name="Barn 1" dot={false} activeDot={{ r:4, strokeWidth:0 }} />
              <Area type="monotone" dataKey="hen" stroke="#f59e0b" strokeWidth={2.5} fill="url(#ga2)" name="Hen House" dot={false} activeDot={{ r:4, strokeWidth:0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Sensor Status Summary</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[{name:'Normal',value:normalCount},{name:'Warning',value:warnCount},{name:'Critical',value:alertCount}]}
                dataKey="value" cx="40%" cy="50%" outerRadius={78} innerRadius={30} paddingAngle={3}
              >
                <Cell fill="#22c55e" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
              <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} iconType="circle"
                formatter={(v) => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
              <Tooltip contentStyle={{ background:'#1e293b', border:'none', borderRadius:10, color:'#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Manual Readings Log ─────────────────────────────────────────── */}
      <div style={card}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1px solid #ddd6fe' }}>
            <ClipboardList size={15} color="#7c3aed" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider leading-none">Manual Readings Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">All manually captured sensor data</p>
          </div>
          {manualReadings.length > 0 && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{ background:'#ede9fe', color:'#7c3aed' }}>
              {manualReadings.length} entr{manualReadings.length === 1 ? 'y' : 'ies'}
            </span>
          )}
        </div>

        {manualReadings.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm font-semibold text-slate-400">No manual readings yet</p>
            <p className="text-xs text-slate-300 mt-1">
              Click <strong className="text-violet-400">Manual Entry</strong> on any sensor card to capture a reading
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  {['Sensor', 'Location', 'Value', 'Reason', 'Notes', 'Logged At'].map(h => (
                    <th key={h} className="pb-2.5 pr-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {manualReadings.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-slate-800 whitespace-nowrap">{r.sensorName}</td>
                    <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs">📍 {r.location}</span>
                    </td>
                    <td className="py-2.5 pr-4 font-bold whitespace-nowrap">
                      <span style={{ color:'#7c3aed' }}>{r.value}{r.unit}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap text-xs">{r.reason}</td>
                    <td className="py-2.5 pr-4 text-slate-400 text-xs max-w-[160px] truncate">{r.notes || '—'}</td>
                    <td className="py-2.5 text-slate-400 text-xs whitespace-nowrap">{formatLoggedAt(r.loggedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {activeModal && (
        <ManualEntryModal
          sensor={activeModal}
          onClose={() => setActiveModal(null)}
          onSave={(reading) => {
            addManualReading(reading);
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
}
