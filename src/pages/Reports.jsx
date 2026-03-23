import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useData } from '../context/DataContext';
import { SPECIES_META } from '../data/livestock';
import { StatCard } from '../components/StatCard';
import { Btn } from '../components/FormField';
import { Printer } from 'lucide-react';

const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const EVENTS = [
  { month:'Sep', vaccinations:2, treatments:1, births:0 },
  { month:'Oct', vaccinations:3, treatments:0, births:1 },
  { month:'Nov', vaccinations:1, treatments:2, births:0 },
  { month:'Dec', vaccinations:0, treatments:1, births:2 },
  { month:'Jan', vaccinations:4, treatments:0, births:0 },
  { month:'Feb', vaccinations:2, treatments:1, births:0 },
  { month:'Mar', vaccinations:3, treatments:1, births:1 },
];
const WEIGHT_DATA = MONTHS.map((m, i) => ({
  month: m,
  bessie: 562 + i * 3,
  bruno:  598 + i * 3.5,
}));
const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6','#8b5cf6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1e293b', borderRadius:10, padding:'10px 14px', boxShadow:'0 10px 25px rgba(0,0,0,.2)' }}>
      <p style={{ color:'#94a3b8', fontSize:11, marginBottom:6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#f1f5f9', marginBottom:2 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
          <span style={{ color:'#94a3b8' }}>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{p.value}{p.unit || ''}</span>
        </div>
      ))}
    </div>
  );
};

const card = {
  background: '#ffffff',
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
  padding: 24,
};

export default function Reports() {
  const { livestock, health } = useData();

  const speciesCounts = useMemo(() => {
    const map = {};
    livestock.forEach(a => { map[a.species] = (map[a.species] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: `${SPECIES_META[name]?.emoji || ''} ${name}`, value }));
  }, [livestock]);

  const costByType = useMemo(() => {
    const map = {};
    health.forEach(h => { map[h.type] = (map[h.type] || 0) + h.cost; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [health]);

  const totalCost = health.reduce((s, h) => s + h.cost, 0);

  const PRODUCTION = [
    { metric: 'Cattle head', value: livestock.filter(a=>a.species==='Cattle').length, change: '+2', good: true },
    { metric: 'Sheep head', value: livestock.filter(a=>a.species==='Sheep').length, change: '0', good: null },
    { metric: 'Pig head', value: livestock.filter(a=>a.species==='Pig').length, change: '+1', good: true },
    { metric: 'Poultry (birds)', value: 550, change: '-20', good: false },
    { metric: 'Eggs / day (est.)', value: '~280', change: '+15', good: true },
    { metric: 'Milk / day (L)', value: '~72', change: '+4', good: true },
    { metric: 'Vet spend (YTD)', value: `$${totalCost}`, change: '', good: null },
  ];

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Reports &amp; Analytics</h2>
          <p className="text-sm text-slate-400 mt-0.5">Farm performance insights and trends</p>
        </div>
        <Btn variant="secondary" onClick={() => window.print()}>
          <Printer size={15} /> Print report
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📈" label="Herd growth (YTD)" value="+12%" sub="3 new births" color="green" />
        <StatCard icon="🥛" label="Milk yield avg/day" value="24.2 L" sub="Per dairy cow" color="blue" />
        <StatCard icon="💊" label="Vet spend (YTD)" value={`$${totalCost}`} sub={`${health.length} events`} color="amber" />
        <StatCard icon="⚖️" label="Avg weight gain" value="1.2 kg/wk" sub="Beef cattle" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly events */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Monthly Health Events</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={EVENTS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} iconType="circle" formatter={v => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
              <Bar dataKey="vaccinations" fill="#3b82f6" radius={[4,4,0,0]} name="Vaccinations" />
              <Bar dataKey="treatments"   fill="#f59e0b" radius={[4,4,0,0]} name="Treatments" />
              <Bar dataKey="births"       fill="#22c55e" radius={[4,4,0,0]} name="Births" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vet costs pie */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Vet Costs by Type</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={costByType} dataKey="value" nameKey="name" cx="40%" cy="50%" outerRadius={80} innerRadius={28} paddingAngle={3}>
                {costByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} iconType="circle"
                formatter={(v) => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
              <Tooltip contentStyle={{ background:'#1e293b', border:'none', borderRadius:10, color:'#f1f5f9' }}
                formatter={(v) => [`$${v}`, 'Cost']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weight trends */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Weight Trends — Cattle (kg)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={WEIGHT_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit=" kg" domain={['auto','auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} iconType="circle" formatter={v => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
              <Line type="monotone" dataKey="bessie" stroke="#22c55e" strokeWidth={2.5} dot={{ r:3, fill:'#22c55e', strokeWidth:0 }} name="Bessie (CT-001)" />
              <Line type="monotone" dataKey="bruno"  stroke="#3b82f6" strokeWidth={2.5} dot={{ r:3, fill:'#3b82f6', strokeWidth:0 }} name="Bruno (CT-002)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Production summary */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Production Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-2.5 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Metric</th>
                  <th className="text-left py-2.5 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Value</th>
                  <th className="text-left py-2.5 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">vs Last Month</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTION.map(row => (
                  <tr key={row.metric} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600">{row.metric}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{row.value}</td>
                    <td className="py-2.5 px-3">
                      {row.change ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                          background: row.good === true ? '#dcfce7' : row.good === false ? '#fee2e2' : '#f1f5f9',
                          color: row.good === true ? '#15803d' : row.good === false ? '#b91c1c' : '#475569',
                        }}>{row.change}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Herd composition mini-chart */}
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mt-5 mb-3">Herd by Species</h3>
          <div className="flex flex-col gap-2.5">
            {speciesCounts.slice(0,6).map((s, i) => {
              const pct = Math.round((s.value / livestock.length) * 100);
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{s.name}</span>
                    <span className="font-bold text-slate-800">{s.value} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
