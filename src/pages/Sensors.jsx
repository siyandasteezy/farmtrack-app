import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { AlertBox } from '../components/AlertBox';
import { PenLine, X, RotateCcw, ClipboardList, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

/* ── Constants ──────────────────────────────────────────────────────── */

const TEMP_DATA = [19,18,17,17,18,20,22,24,25,26,25,24].map((v,i) => ({ t:`${i*2}:00`, barn:v, hen:v+2.5 }));

const MANUAL_REASONS = [
  'Sensor offline', 'Sensor malfunction', 'Calibration check',
  'Cross-verification reading', 'Temporary replacement reading', 'Maintenance period', 'Other',
];

const SENSOR_CATEGORIES = [
  'Environment', 'Air Quality', 'Water', 'Field', 'Feed',
  'Animal Health', 'Production', 'Weather', 'Security',
];

const COMMON_UNITS = ['°C', '°F', '%', 'ppm', 'L/day', 'km/h', 'mm', 'lux', 'pH', 'bar', 'V', 'kg', 'mg/L', 'mS/cm'];

const ICON_OPTIONS = [
  '🌡️','💧','🌬️','⚗️','🚰','🌱','🌾','🐄','🥛','💨',
  '🌧️','☀️','📍','🔥','⚡','🌊','🧪','📡','🔬','💡',
  '🌿','🐷','🐔','🐑','🐟','🦟','🌡','🏭','🛢️','🔋',
];

/* ── Helpers ────────────────────────────────────────────────────────── */

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

/* ── Sensor Card ────────────────────────────────────────────────────── */

function SensorCard({ sensor: s, onManualEntry, onClearOverride, onDelete }) {
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
      className="rounded-2xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ background:cardBg, border:`1px solid ${cardBorder}`, boxShadow:'0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background:topColor }} />

      {/* Category + badges */}
      <div className="flex items-center justify-between mb-2.5 gap-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{s.category}</div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {s.isManual && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background:'#ede9fe', color:'#7c3aed', border:'1px solid #c4b5fd' }}>MANUAL</span>
          )}
          {s._custom && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>NEW</span>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xl leading-none">{s.icon}</span>
        <span className="text-2xl font-extrabold text-slate-900 leading-none">{s.value}</span>
        <span className="text-xs text-slate-400 leading-none">{s.unit}</span>
      </div>

      <div className="text-sm font-bold text-slate-700 mb-3 truncate">{s.name}</div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all" style={{ width:`${p}%`, background:barColor }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-2">
        <span>{s.min}</span><span>{s.max}</span>
      </div>

      <div className="text-[11px] text-slate-400 mb-1 truncate">📍 {s.location}</div>
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:barColor }}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isAlert ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-green-500 pulse'}`} />
        {s.status === 'normal' ? 'Normal' : s.status === 'warn' ? 'Warning' : 'Critical'}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
        <button onClick={() => onManualEntry(s)}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg transition-all hover:opacity-90"
          style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', color:'#fff' }}>
          <PenLine size={11} /> Manual Entry
        </button>
        {s.isManual && (
          <button onClick={() => onClearOverride(s.id)} title="Restore live reading"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-all">
            <RotateCcw size={13} />
          </button>
        )}
        <button onClick={() => onDelete(s)} title="Remove sensor"
          className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Add Sensor Modal ───────────────────────────────────────────────── */

const BLANK_SENSOR = {
  name: '', category: 'Environment', icon: '📡', location: '',
  unit: '°C', min: 0, max: 100, value: 0,
};

function AddSensorModal({ existingLocations, onClose, onSave }) {
  const [form, setForm]         = useState(BLANK_SENSOR);
  const [customCat, setCustomCat] = useState('');
  const [useCustomCat, setUseCustomCat] = useState(false);
  const [errors, setErrors]     = useState({});

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name     = 'Sensor name is required';
    if (!form.location.trim())    e.location = 'Location is required';
    if (!form.unit.trim())        e.unit     = 'Unit is required';
    const n = parseFloat(form.min), x = parseFloat(form.max), v = parseFloat(form.value);
    if (isNaN(n))                 e.min   = 'Must be a number';
    if (isNaN(x))                 e.max   = 'Must be a number';
    if (!isNaN(n) && !isNaN(x) && n >= x) e.max = 'Max must be greater than min';
    if (isNaN(v))                 e.value = 'Must be a number';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const cat = useCustomCat ? customCat.trim() : form.category;
    const numMin = parseFloat(form.min), numMax = parseFloat(form.max), numVal = parseFloat(form.value);
    const status = numVal < numMin ? 'alert' : numVal > numMax ? 'warn' : 'normal';
    onSave({
      name: form.name.trim(),
      category: cat || 'Environment',
      icon: form.icon,
      location: form.location.trim(),
      unit: form.unit.trim(),
      min: numMin, max: numMax, value: numVal,
      status,
      _custom: true,
    });
  };

  const Field = ({ label, error, children }) => (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  const inputCls = (err) => clsx(
    'w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-all',
    err ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-slate-200 focus:border-green-400 focus:ring-2 focus:ring-green-100'
  );

  const predictedStatus = () => {
    const n = parseFloat(form.min), x = parseFloat(form.max), v = parseFloat(form.value);
    if (isNaN(n) || isNaN(x) || isNaN(v)) return null;
    if (v < n) return { label:'Critical', color:'#ef4444', bg:'#fee2e2' };
    if (v > x) return { label:'Warning',  color:'#f59e0b', bg:'#fef3c7' };
    return    { label:'Normal',   color:'#16a34a', bg:'#dcfce7' };
  };
  const pred = predictedStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background:'#fff', boxShadow:'0 20px 60px rgba(0,0,0,.18)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ background:'linear-gradient(135deg,#16a34a,#15803d)', borderBottom:'1px solid #15803d' }}>
          <div>
            <div className="text-white font-extrabold text-base flex items-center gap-2">
              <Plus size={16} /> Add New Sensor
            </div>
            <div className="text-green-200 text-xs mt-0.5">Configure sensor details and its location on the farm</div>
          </div>
          <button onClick={onClose} className="text-green-200 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4">

          {/* Name */}
          <Field label="Sensor Name *" error={errors.name}>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Water Temperature, Dissolved Oxygen…"
              className={inputCls(errors.name)} />
          </Field>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => set('icon', ic)}
                  className={clsx('w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all',
                    form.icon === ic
                      ? 'border-green-400 bg-green-50 scale-110 shadow-sm'
                      : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                  )}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Category *</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {SENSOR_CATEGORIES.map(c => (
                <button key={c} onClick={() => { setUseCustomCat(false); set('category', c); }}
                  className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                    !useCustomCat && form.category === c
                      ? 'text-white border-green-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
                  )}
                  style={!useCustomCat && form.category === c ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                  {c}
                </button>
              ))}
              <button onClick={() => setUseCustomCat(true)}
                className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                  useCustomCat
                    ? 'text-white border-green-600'
                    : 'bg-white border-dashed border-slate-300 text-slate-500 hover:border-green-300'
                )}
                style={useCustomCat ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                + Custom
              </button>
            </div>
            {useCustomCat && (
              <input value={customCat} onChange={e => setCustomCat(e.target.value)}
                placeholder="Enter custom category name…"
                className={inputCls(false)} />
            )}
          </div>

          {/* Location */}
          <Field label="Location *" error={errors.location}>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Barn 2, Fish Pond A, Field D…"
              list="sensor-locations"
              className={inputCls(errors.location)}
            />
            <datalist id="sensor-locations">
              {existingLocations.map(l => <option key={l} value={l} />)}
            </datalist>
            <p className="text-[11px] text-slate-400 mt-1">
              Type a new location or pick an existing one from the suggestions.
            </p>
          </Field>

          {/* Unit */}
          <Field label="Unit *" error={errors.unit}>
            <div className="flex gap-2 flex-wrap mb-2">
              {COMMON_UNITS.map(u => (
                <button key={u} onClick={() => set('unit', u)}
                  className={clsx('px-2.5 py-1 rounded-lg text-xs font-bold border transition-all',
                    form.unit === u
                      ? 'text-white border-green-600'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-green-300'
                  )}
                  style={form.unit === u ? { background:'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
                  {u}
                </button>
              ))}
            </div>
            <input value={form.unit} onChange={e => set('unit', e.target.value)}
              placeholder="Or type a custom unit…"
              className={inputCls(errors.unit)} />
          </Field>

          {/* Min / Max / Initial value */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min Value *" error={errors.min}>
              <input type="number" step="any" value={form.min}
                onChange={e => set('min', e.target.value)}
                className={inputCls(errors.min)} />
            </Field>
            <Field label="Max Value *" error={errors.max}>
              <input type="number" step="any" value={form.max}
                onChange={e => set('max', e.target.value)}
                className={inputCls(errors.max)} />
            </Field>
            <Field label="Initial Reading *" error={errors.value}>
              <input type="number" step="any" value={form.value}
                onChange={e => set('value', e.target.value)}
                className={inputCls(errors.value)} />
            </Field>
          </div>

          {/* Live preview card */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Preview</label>
            <div className="rounded-2xl p-4 border border-dashed border-green-300"
              style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{form.icon}</span>
                <span className="text-xl font-extrabold text-slate-900">{form.value || '—'}</span>
                <span className="text-xs text-slate-400">{form.unit}</span>
                {pred && (
                  <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-lg"
                    style={{ background:pred.bg, color:pred.color }}>{pred.label}</span>
                )}
              </div>
              <div className="text-sm font-bold text-slate-700">{form.name || 'Sensor Name'}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                📍 {form.location || 'Location'} · {useCustomCat ? (customCat || 'Category') : form.category}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-2 flex gap-3 flex-shrink-0 border-t border-slate-100">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
            Add Sensor
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Manual Entry Modal ─────────────────────────────────────────────── */

function ManualEntryModal({ sensor, onClose, onSave }) {
  const [form, setForm] = useState({ value: sensor.value, reason: MANUAL_REASONS[0], notes: '' });
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const num = parseFloat(form.value);
    if (isNaN(num)) { setError('Please enter a valid number.'); return; }
    onSave({ sensorId: sensor.id, value: num, reason: form.reason, notes: form.notes });
    onClose();
  };

  const pred = () => {
    const num = parseFloat(form.value);
    if (isNaN(num)) return null;
    if (num < sensor.min) return { label:'Critical', color:'#ef4444', bg:'#fee2e2' };
    if (num > sensor.max) return { label:'Warning',  color:'#f59e0b', bg:'#fef3c7' };
    return { label:'Normal', color:'#16a34a', bg:'#dcfce7' };
  };
  const p = pred();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)' }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background:'#fff', boxShadow:'0 20px 60px rgba(0,0,0,.18)' }}>
        <div className="flex items-center justify-between px-6 py-5"
          style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', borderBottom:'1px solid #7c3aed' }}>
          <div>
            <div className="text-white font-extrabold text-base flex items-center gap-2">
              <PenLine size={16} /> Manual Sensor Reading
            </div>
            <div className="text-violet-200 text-xs mt-0.5">{sensor.icon} {sensor.name} · {sensor.location}</div>
          </div>
          <button onClick={onClose} className="text-violet-200 hover:text-white"><X size={20} /></button>
        </div>

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
            {p && (
              <>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <div className="text-slate-400 mb-0.5">Predicted</div>
                  <span className="font-bold px-2 py-0.5 rounded-lg text-[11px]"
                    style={{ background:p.bg, color:p.color }}>{p.label}</span>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              New Reading <span className="text-slate-400 font-normal">({sensor.unit})</span>
            </label>
            <input type="number" step="any" value={form.value}
              onChange={e => { set('value', e.target.value); setError(''); }}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Reason</label>
            <select value={form.reason} onChange={e => set('reason', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
              {MANUAL_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
              placeholder="e.g. Sensor probe submerged — reading taken with handheld device"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none" />
          </div>

          <div className="rounded-xl p-3 text-xs text-violet-700 flex gap-2"
            style={{ background:'#f5f3ff', border:'1px solid #ede9fe' }}>
            <span className="mt-0.5">ℹ️</span>
            <span>This reading will override the sensor display and be logged in the Manual Readings history. The sensor will be marked <strong>MANUAL</strong> until a live reading is restored.</span>
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
            style={{ background:'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
            Save Reading
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Confirm ─────────────────────────────────────────────────── */

function DeleteConfirm({ sensor, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(15,23,42,.45)', backdropFilter:'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background:'#fff', boxShadow:'0 20px 60px rgba(0,0,0,.18)' }}>
        <div className="px-6 py-5 text-center">
          <div className="text-4xl mb-3">{sensor.icon}</div>
          <h3 className="text-base font-extrabold text-slate-800 mb-1">Remove Sensor?</h3>
          <p className="text-sm text-slate-500">
            <strong>{sensor.name}</strong> at <strong>{sensor.location}</strong> will be permanently removed from the dashboard.
          </p>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={() => { onConfirm(sensor.id); onClose(); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)' }}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function Sensors() {
  const { sensors, addSensor, removeSensor, addManualReading, clearManualOverride, manualReadings } = useData();
  const [cat, setCat]             = useState('All');
  const [activeManual, setActiveManual] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories      = useMemo(() => ['All', ...new Set(sensors.map(s => s.category))], [sensors]);
  const existingLocs    = useMemo(() => [...new Set(sensors.map(s => s.location))], [sensors]);
  const shown           = cat === 'All' ? sensors : sensors.filter(s => s.category === cat);
  const alerts          = sensors.filter(s => s.status !== 'normal');
  const normalCount     = sensors.filter(s => s.status === 'normal').length;
  const warnCount       = sensors.filter(s => s.status === 'warn').length;
  const alertCount      = sensors.filter(s => s.status === 'alert').length;
  const manualCount     = sensors.filter(s => s.isManual).length;

  const card = {
    background:'#ffffff', borderRadius:20, border:'1px solid #e2e8f0',
    boxShadow:'0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)', padding:24,
  };

  return (
    <div className="flex flex-col gap-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Farm Sensors</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time IoT monitoring — {sensors.length} sensors active
            {manualCount > 0 && (
              <span className="ml-2 text-violet-500 font-semibold">· {manualCount} manual override{manualCount > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
            <Plus size={15} /> Add Sensor
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
            style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', color:'#15803d', border:'1px solid #bbf7d0' }}>
            <div className="w-2 h-2 rounded-full bg-green-500 pulse" />
            Live · Updated now
          </div>
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
              cat === c ? 'text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700'
            )}
            style={cat === c ? { background:'linear-gradient(135deg, #16a34a, #15803d)' } : {}}>
            {c}
          </button>
        ))}
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {shown.map(s => (
          <SensorCard key={s.id} sensor={s}
            onManualEntry={setActiveManual}
            onClearOverride={clearManualOverride}
            onDelete={setDeleteTarget}
          />
        ))}

        {/* Add new tile */}
        <button onClick={() => setShowAdd(true)}
          className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-2 p-4 min-h-[180px] text-slate-400 hover:text-green-600 group">
          <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center transition-all group-hover:scale-110">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold">Add Sensor</span>
        </button>
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
              <Pie data={[{name:'Normal',value:normalCount},{name:'Warning',value:warnCount},{name:'Critical',value:alertCount}]}
                dataKey="value" cx="40%" cy="50%" outerRadius={78} innerRadius={30} paddingAngle={3}>
                <Cell fill="#22c55e" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
              </Pie>
              <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} iconType="circle"
                formatter={(v) => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
              <Tooltip contentStyle={{ background:'#1e293b', border:'none', borderRadius:10, color:'#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Manual Readings Log */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>{['Sensor','Location','Value','Reason','Notes','Logged At'].map(h => (
                  <th key={h} className="pb-2.5 pr-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {manualReadings.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-slate-800 whitespace-nowrap">{r.sensorName}</td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs">📍 {r.location}</span>
                    </td>
                    <td className="py-2.5 pr-4 font-bold whitespace-nowrap" style={{ color:'#7c3aed' }}>{r.value}{r.unit}</td>
                    <td className="py-2.5 pr-4 text-slate-600 text-xs whitespace-nowrap">{r.reason}</td>
                    <td className="py-2.5 pr-4 text-slate-400 text-xs max-w-[160px] truncate">{r.notes || '—'}</td>
                    <td className="py-2.5 text-slate-400 text-xs whitespace-nowrap">{formatLoggedAt(r.loggedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddSensorModal
          existingLocations={existingLocs}
          onClose={() => setShowAdd(false)}
          onSave={(s) => { addSensor(s); setShowAdd(false); }}
        />
      )}
      {activeManual && (
        <ManualEntryModal
          sensor={activeManual}
          onClose={() => setActiveManual(null)}
          onSave={(r) => { addManualReading(r); setActiveManual(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          sensor={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={removeSensor}
        />
      )}
    </div>
  );
}
