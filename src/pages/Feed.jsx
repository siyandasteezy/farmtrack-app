import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { SPECIES_META } from '../data/livestock';
import { StatCard } from '../components/StatCard';
import { AlertBox } from '../components/AlertBox';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Btn } from '../components/FormField';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1e293b', borderRadius:10, padding:'10px 14px', boxShadow:'0 10px 25px rgba(0,0,0,.2)' }}>
      <p style={{ color:'#94a3b8', fontSize:11, marginBottom:6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#f1f5f9' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
          <span style={{ color:'#94a3b8' }}>{p.name}:</span>
          <span style={{ fontWeight:700 }}>{p.value} kg</span>
        </div>
      ))}
    </div>
  );
};

export default function Feed() {
  const { feed, livestock, addFeedStock } = useData();
  const [orderModal, setOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({ species: 'Cattle', qty: '' });

  const lowFeed = feed.filter(f => f.daysLeft < 20);
  const totalStock = feed.reduce((s, f) => s + f.stock, 0);

  const chartData = feed.map(f => {
    const count = Math.max(1, livestock.filter(a => a.species === f.species).length);
    return {
      name: `${SPECIES_META[f.species]?.emoji || ''} ${f.species}`,
      monthly: Math.round(f.dailyPerHead * count * 30),
    };
  });

  const barColors = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16'];

  const handleOrder = () => {
    const qty = parseFloat(orderForm.qty);
    if (!qty || qty <= 0) return alert('Enter a valid quantity');
    addFeedStock(orderForm.species, qty);
    setOrderModal(false);
    setOrderForm({ species: 'Cattle', qty: '' });
  };

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
          <h2 className="text-xl font-extrabold text-slate-800">Feed &amp; Nutrition</h2>
          <p className="text-sm text-slate-400 mt-0.5">Monitor feed stocks and daily requirements</p>
        </div>
        <Btn onClick={() => setOrderModal(true)}>
          <Plus size={16} /> Log feed order
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🌾" label="Feed types" value={feed.length} color="green" />
        <StatCard icon="⚠️" label="Low stock (<20d)" value={lowFeed.length} color={lowFeed.length > 0 ? 'red' : 'green'} />
        <StatCard icon="📦" label="Total stock" value={`${totalStock.toLocaleString()} kg`} color="blue" />
        <StatCard icon="💰" label="Daily feed cost" value={`$${feed.reduce((s,f)=>s+(f.dailyPerHead*f.costPerKg),0).toFixed(0)}`} color="amber" />
      </div>

      {/* Reorder alerts */}
      {lowFeed.length > 0 && (
        <div className="flex flex-col gap-2">
          {lowFeed.map(f => (
            <AlertBox key={f.id} color={f.daysLeft < 10 ? 'red' : 'amber'}>
              <strong>{SPECIES_META[f.species]?.emoji} {f.species} — {f.type}</strong>: Only{' '}
              <strong>{f.daysLeft} days</strong> of stock remaining ({f.stock} kg). Reorder soon.
            </AlertBox>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock levels */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-5">Stock Levels</h3>
          <div className="flex flex-col gap-5">
            {feed.map(f => {
              const p = Math.min(100, Math.round((f.daysLeft / 60) * 100));
              const color = f.daysLeft < 10 ? '#ef4444' : f.daysLeft < 20 ? '#f59e0b' : '#22c55e';
              const bgColor = f.daysLeft < 10 ? '#fee2e2' : f.daysLeft < 20 ? '#fef3c7' : '#dcfce7';
              return (
                <div key={f.id}>
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="font-semibold text-slate-700">
                      {SPECIES_META[f.species]?.emoji} {f.species}
                      <span className="text-slate-400 font-normal ml-1.5">— {f.type}</span>
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color, background: bgColor }}>
                      {f.daysLeft}d left
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: color }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                    <span className="font-medium">{f.stock} {f.unit} in stock</span>
                    <span>${f.costPerKg.toFixed(2)}/kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily requirements table */}
        <div style={card}>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Daily Requirements</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Species</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Feed type</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Per head/day</th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost/kg</th>
                </tr>
              </thead>
              <tbody>
                {feed.map(f => (
                  <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-800">{SPECIES_META[f.species]?.emoji} {f.species}</td>
                    <td className="py-3 px-3 text-slate-500">{f.type}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{f.dailyPerHead} {f.unit}</td>
                    <td className="py-3 px-3 text-slate-600">${f.costPerKg.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly consumption chart */}
      <div style={card}>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Monthly Consumption Estimate (kg)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit=" kg" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="monthly" radius={[8,8,0,0]} name="Monthly (kg)">
              {chartData.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Order modal */}
      {orderModal && (
        <Modal open title="Log Feed Order" onClose={() => setOrderModal(false)}
          footer={<><Btn variant="secondary" onClick={() => setOrderModal(false)}>Cancel</Btn><Btn onClick={handleOrder}>Log order</Btn></>}>
          <div className="flex flex-col gap-4">
            <FormField label="Species">
              <Select value={orderForm.species} onChange={e => setOrderForm(p => ({ ...p, species: e.target.value }))}>
                {Object.keys(SPECIES_META).map(s => <option key={s}>{s}</option>)}
              </Select>
            </FormField>
            <FormField label="Quantity received (kg)">
              <Input type="number" placeholder="0" value={orderForm.qty} onChange={e => setOrderForm(p => ({ ...p, qty: e.target.value }))} />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}
