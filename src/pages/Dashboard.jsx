import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/Badge';
import { AlertBox } from '../components/AlertBox';

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#8b5cf6'];

const MONTHLY = [
  { month:'Sep', vaccinations:2, treatments:1, births:0 },
  { month:'Oct', vaccinations:3, treatments:0, births:1 },
  { month:'Nov', vaccinations:1, treatments:2, births:0 },
  { month:'Dec', vaccinations:0, treatments:1, births:2 },
  { month:'Jan', vaccinations:4, treatments:0, births:0 },
  { month:'Feb', vaccinations:2, treatments:1, births:0 },
  { month:'Mar', vaccinations:3, treatments:1, births:1 },
];

const TEMP_DATA = [19,18,17,17,18,20,22,24,25,26,25,24].map((v,i) => ({
  hour: `${i*2}:00`, barn: v, henHouse: v + 2.5,
}));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1e293b', borderRadius:10, padding:'10px 14px', border:'none', boxShadow:'0 10px 25px rgba(0,0,0,.2)' }}>
      <p style={{ color:'#94a3b8', fontSize:11, marginBottom:6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#f1f5f9', marginBottom:2 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
          <span style={{ color:'#94a3b8' }}>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{p.value}{p.name.includes('Temp') || p.unit === '°C' ? '°C' : ''}</span>
        </div>
      ))}
    </div>
  );
};

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const { livestock, health, sensors } = useData();
  const { user } = useAuth();

  const healthy  = livestock.filter(a => a.status === 'Healthy').length;
  const total    = livestock.length;
  const alerts   = sensors.filter(s => s.status !== 'normal');
  const upcoming = health.filter(h => h.status === 'Scheduled').length;

  const speciesCounts = useMemo(() => {
    const map = {};
    livestock.forEach(a => { map[a.species] = (map[a.species] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [livestock]);

  const statusCounts = useMemo(() => {
    const map = {};
    livestock.forEach(a => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [livestock]);

  const statusColors = { Healthy:'#22c55e', Pregnant:'#3b82f6', Treatment:'#ef4444' };

  const card = {
    background: '#ffffff',
    borderRadius: 20,
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
    padding: 24,
  };

  return (
    <div className="flex flex-col gap-6 fade-in">

      {/* Greeting banner */}
      <div
        className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)',
          boxShadow: '0 4px 20px rgba(21,128,61,.25)',
        }}
      >
        <div>
          <h2 className="text-xl font-extrabold text-white leading-tight">
            Good morning, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-green-200 text-sm mt-1">
            Here's what's happening on <span className="font-semibold text-white">{user?.farm}</span> today
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-2 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-green-300 pulse" />
          <span className="text-white text-xs font-semibold">Live · Updated now</span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.filter(s => s.status === 'alert').map(s => (
            <AlertBox key={s.id} color="red">
              <strong>{s.icon} {s.name}</strong> at {s.location} is CRITICAL ({s.value}{s.unit})
            </AlertBox>
          ))}
          {alerts.filter(s => s.status === 'warn').slice(0, 2).map(s => (
            <AlertBox key={s.id} color="amber">
              <strong>{s.icon} {s.name}</strong> at {s.location} — {s.value}{s.unit} (warning threshold)
            </AlertBox>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger">
        <StatCard icon="🐄" label="Total Livestock" value={total} sub={`${speciesCounts.length} species`} color="green" />
        <StatCard icon="❤️" label="Healthy Animals" value={healthy} sub={`${Math.round(healthy/total*100)}% of herd`} color="green" />
        <StatCard icon="⚠️" label="Sensor Alerts" value={alerts.length} sub="Require attention" color={alerts.length > 2 ? 'red' : 'amber'} />
        <StatCard icon="📅" label="Upcoming Vet" value={upcoming} sub="Scheduled visits" color="blue" />
        <StatCard icon="🌡️" label="Avg Temp" value="24°C" sub="Barn 1 · Normal" color="blue" />
        <StatCard icon="🥛" label="Milk Yield" value="24.2 L" sub="Per cow / day" color="green" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={card}>
          <SectionHeader title="Herd Composition" />
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={speciesCounts} dataKey="value" nameKey="name" cx="38%" cy="50%" outerRadius={85} innerRadius={35} paddingAngle={2}>
                {speciesCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} iconType="circle"
                formatter={(v) => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <SectionHeader title="Health by Status" />
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={statusCounts} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8,8,0,0]} name="Count">
                {statusCounts.map((s, i) => (
                  <Cell key={i} fill={statusColors[s.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div style={card}>
          <SectionHeader title="Monthly Health Events" />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} iconType="circle" />
              <Bar dataKey="vaccinations" fill="#3b82f6" radius={[4,4,0,0]} name="Vaccinations" />
              <Bar dataKey="treatments"   fill="#f59e0b" radius={[4,4,0,0]} name="Treatments" />
              <Bar dataKey="births"       fill="#22c55e" radius={[4,4,0,0]} name="Births" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <SectionHeader title="Temperature Trend (24h)" />
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={TEMP_DATA}>
              <defs>
                <linearGradient id="gBarn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gHen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit="°" />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} iconType="circle" />
              <Area type="monotone" dataKey="barn" stroke="#22c55e" strokeWidth={2.5} fill="url(#gBarn)" name="Barn 1" dot={false} activeDot={{ r:4, strokeWidth:0 }} />
              <Area type="monotone" dataKey="henHouse" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gHen)" name="Hen House" dot={false} activeDot={{ r:4, strokeWidth:0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent health */}
        <div style={card}>
          <SectionHeader title="Recent Health Events" />
          <div className="flex flex-col gap-3">
            {health.slice(0, 5).map((h, idx) => (
              <div key={h.id} className="flex items-start gap-3 fade-in" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                  h.status === 'Completed' ? 'bg-green-50' : h.status === 'Ongoing' ? 'bg-amber-50' : 'bg-blue-50'
                }`}>
                  {h.type === 'Vaccination' ? '💉' : h.type === 'Treatment' ? '🩹' : h.type === 'Checkup' ? '🔍' : h.type === 'Farrier' ? '🐴' : '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{h.animalName} — {h.type}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{formatDate(h.date)}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{h.vet}</span>
                    <StatusBadge status={h.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical sensors */}
        <div style={card}>
          <SectionHeader title="Critical Sensors" />
          {alerts.length ? (
            <div className="flex flex-col gap-2">
              {alerts.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl fade-in"
                  style={{
                    animationDelay: `${idx * 60}ms`,
                    background: s.status === 'alert' ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${s.status === 'alert' ? '#fecaca' : '#fde68a'}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: s.status === 'alert' ? '#b91c1c' : '#92400e' }}>
                      {s.value}{s.unit}
                    </span>
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-sm font-medium">All sensors normal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
