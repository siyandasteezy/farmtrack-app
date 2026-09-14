import { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useData } from '../context/DataContext';
import { SPECIES_META } from '../data/livestock';
import { StatCard } from '../components/StatCard';
import { Btn } from '../components/FormField';
import { Printer } from 'lucide-react';

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
  const { livestock, health, harvests } = useData();

  /* ── Apiary output ──────────────────────────────────────────── */
  const honeyHarvests = useMemo(() => harvests.filter(h => h.product === 'Honey'), [harvests]);
  const honeyKg = useMemo(
    () => honeyHarvests.reduce((s, h) => s + (h.quantity || 0), 0),
    [honeyHarvests]);

  const honeyByMonth = useMemo(() => {
    const map = {};
    honeyHarvests.forEach(h => {
      const d = new Date(h.date);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + (h.quantity || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, kg]) => {
        const [y, m] = key.split('-');
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-ZA', { month: 'short' });
        return { month: `${label} ${y.slice(2)}`, kg: Math.round(kg * 10) / 10 };
      });
  }, [honeyHarvests]);

  const honeyByHive = useMemo(() => {
    const map = {};
    honeyHarvests.forEach(h => { map[h.hiveTag] = (map[h.hiveTag] || 0) + (h.quantity || 0); });
    return Object.entries(map)
      .map(([hive, kg]) => ({ hive, kg: Math.round(kg * 10) / 10 }))
      .sort((a, b) => b.kg - a.kg);
  }, [honeyHarvests]);

  const byProduct = useMemo(() => {
    const map = {};
    harvests.forEach(h => { map[h.product] = (map[h.product] || 0) + (h.quantity || 0); });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value);
  }, [harvests]);

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

  /* Health events per month, derived from the records rather than a fixed
     seven-month sample. */
  const monthlyHealth = useMemo(() => {
    const map = {};
    health.forEach(h => {
      const d = new Date(h.date);
      if (Number.isNaN(d.getTime())) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const [y, m] = k.split('-');
      map[k] ||= {
        key: k,
        month: `${new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-ZA', { month: 'short' })} ${y.slice(2)}`,
        vaccinations: 0, treatments: 0, checkups: 0,
      };
      if (h.type === 'Vaccination') map[k].vaccinations += 1;
      else if (h.type === 'Treatment') map[k].treatments += 1;
      else map[k].checkups += 1;
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  }, [health]);

  /* Head count per species the farm actually keeps, rather than a fixed list
     with invented poultry, egg and milk figures nothing in the app records. */
  const PRODUCTION = useMemo(() => {
    const perSpecies = {};
    livestock.forEach(a => { perSpecies[a.species] = (perSpecies[a.species] || 0) + 1; });

    const rows = Object.entries(perSpecies)
      .sort((a, b) => b[1] - a[1])
      .map(([species, count]) => ({
        metric: species === 'Bee' ? 'Hives' : `${species} head`,
        value: count,
      }));

    if (health.length) rows.push({ metric: 'Vet spend (YTD)', value: `R${totalCost}` });
    // Harvest totals are not repeated here — the All Hive Products table
    // below already carries them, per product.
    return rows;
  }, [livestock, health, totalCost]);

  /* Weight is only meaningful for animals that actually have one recorded. */
  const weighed = useMemo(() => livestock.filter(a => Number(a.weight) > 0), [livestock]);
  const avgWeightBySpecies = useMemo(() => {
    const map = {};
    weighed.forEach(a => {
      map[a.species] ||= { name: a.species, total: 0, n: 0 };
      map[a.species].total += Number(a.weight);
      map[a.species].n += 1;
    });
    return Object.values(map).map(x => ({ name: x.name, value: Math.round(x.total / x.n) }));
  }, [weighed]);

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

      {/* Each card is backed by real records — nothing is shown on a farm
          that hasn't recorded it yet. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🐄" label="Total livestock" value={livestock.length}
          sub={`${speciesCounts.length} species`} color="green" />
        {weighed.length > 0 && (
          <StatCard icon="⚖️" label="Average weight"
            value={`${Math.round(weighed.reduce((s, a) => s + Number(a.weight), 0) / weighed.length)} kg`}
            sub={`Across ${weighed.length} weighed`} color="green" />
        )}
        {health.length > 0 && (
          <StatCard icon="💊" label="Vet spend (YTD)" value={`R${totalCost}`}
            sub={`${health.length} event${health.length === 1 ? '' : 's'}`} color="amber" />
        )}
        {harvests.length > 0 && (
          <StatCard icon="🍯" label="Honey harvested" value={`${honeyKg.toFixed(1)} kg`}
            sub={`${honeyHarvests.length} harvest${honeyHarvests.length !== 1 ? 's' : ''}`} color="amber" />
        )}
      </div>

      {(monthlyHealth.length > 0 || costByType.length > 0) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Health events per month, from the records themselves */}
        {monthlyHealth.length > 0 && (
          <div style={card}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Monthly Health Events</h3>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={monthlyHealth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" formatter={v => <span style={{fontSize:11,color:'#64748b'}}>{v}</span>} />
                <Bar dataKey="vaccinations" fill="#3b82f6" radius={[4,4,0,0]} name="Vaccinations" />
                <Bar dataKey="treatments"   fill="#f59e0b" radius={[4,4,0,0]} name="Treatments" />
                <Bar dataKey="checkups"     fill="#22c55e" radius={[4,4,0,0]} name="Check-ups" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Vet costs pie */}
        {costByType.length > 0 && (
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
                  formatter={(v) => [`R${v}`, 'Cost']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Average weight per species. A weight trend over time would need
            repeated weigh-ins, which the app doesn't record — only the
            animal's current weight — so this shows what is actually known. */}
        {avgWeightBySpecies.length > 0 && (
          <div style={card}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Average Weight by Species (kg)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={avgWeightBySpecies} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8,8,0,0]} name="Average weight" unit=" kg">
                  {avgWeightBySpecies.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Production summary */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Production Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-2.5 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Metric</th>
                  {/* No "vs last month" column: nothing records a monthly
                      snapshot, so every row would read "—". */}
                  <th className="text-left py-2.5 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTION.map(row => (
                  <tr key={row.metric} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600">{row.metric}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{row.value}</td>
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

      {/* ── Apiary output — only shown once there are harvests ───────── */}
      {harvests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Honey per month */}
          <div style={card}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Honey Production (kg)</h3>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={honeyByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="kg" fill="#f59e0b" radius={[4,4,0,0]} name="Honey" unit=" kg" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Output by hive + product */}
          <div style={card}>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Honey by Hive</h3>
            {honeyByHive.length === 0 ? (
              <p className="text-sm text-slate-400">No honey harvests yet — other hive products are listed below.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {honeyByHive.slice(0, 6).map((h, i) => {
                  const top = honeyByHive[0].kg || 1;
                  const pct = Math.round((h.kg / top) * 100);
                  return (
                    <div key={h.hive}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium font-mono">{h.hive}</span>
                        <span className="font-bold text-slate-800">{h.kg} kg</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mt-5 mb-3">All Hive Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-2.5 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Product</th>
                    <th className="text-left py-2.5 px-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {byProduct.map(p => (
                    <tr key={p.name} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-slate-600">{p.name}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{p.value} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
