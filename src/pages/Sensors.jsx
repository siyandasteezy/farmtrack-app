import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { AlertBox } from '../components/AlertBox';
import clsx from 'clsx';

const TEMP_DATA = [19,18,17,17,18,20,22,24,25,26,25,24].map((v,i) => ({ t:`${i*2}:00`, barn:v, hen:v+2.5 }));

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

function SensorCard({ sensor: s }) {
  const p = Math.max(0, Math.min(100, pct(s)));
  const isAlert = s.status === 'alert';
  const isWarn  = s.status === 'warn';

  const barColor  = isAlert ? '#ef4444' : isWarn ? '#f59e0b' : '#22c55e';
  const topColor  = isAlert ? '#ef4444' : isWarn ? '#f59e0b' : '#22c55e';
  const cardBg    = isAlert ? 'linear-gradient(135deg,#fff5f5,#fee2e2)' : isWarn ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : '#ffffff';
  const cardBorder= isAlert ? '#fca5a5' : isWarn ? '#fde68a' : '#e2e8f0';

  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: topColor }} />

      {/* Category label */}
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2.5 truncate">{s.category}</div>

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
        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: barColor }} />
      </div>

      {/* Min / max scale under bar */}
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
    </div>
  );
}

export default function Sensors() {
  const { sensors } = useData();
  const [cat, setCat] = useState('All');

  const categories = useMemo(() => ['All', ...new Set(sensors.map(s => s.category))], [sensors]);
  const shown = cat === 'All' ? sensors : sensors.filter(s => s.category === cat);
  const alerts = sensors.filter(s => s.status !== 'normal');

  const normalCount = sensors.filter(s => s.status === 'normal').length;
  const warnCount   = sensors.filter(s => s.status === 'warn').length;
  const alertCount  = sensors.filter(s => s.status === 'alert').length;

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
          <p className="text-sm text-slate-400 mt-0.5">Real-time IoT monitoring — {sensors.length} sensors active</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
          style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', color: '#15803d', border: '1px solid #bbf7d0' }}>
          <div className="w-2 h-2 rounded-full bg-green-500 pulse" />
          Live · Updated now
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.filter(s => s.status === 'alert').map(s => (
            <AlertBox key={s.id} color="red">
              <strong>{s.icon} {s.name}</strong> at <strong>{s.location}</strong> is CRITICAL — {s.value}{s.unit} (min: {s.min}{s.unit})
            </AlertBox>
          ))}
          {alerts.filter(s => s.status === 'warn').map(s => (
            <AlertBox key={s.id} color="amber">
              <strong>{s.icon} {s.name}</strong> at <strong>{s.location}</strong> — {s.value}{s.unit} approaching threshold
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
            style={cat === c ? { background: 'linear-gradient(135deg, #16a34a, #15803d)' } : {}}>
            {c}
          </button>
        ))}
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {shown.map(s => <SensorCard key={s.id} sensor={s} />)}
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
    </div>
  );
}
