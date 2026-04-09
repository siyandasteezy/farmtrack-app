import { useState } from 'react';
import { Plus, Pencil, Trash2, PackagePlus } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useData } from '../context/DataContext';
import { SPECIES_META } from '../data/livestock';
import { FEED_UNITS } from '../data/feed';
import { StatCard } from '../components/StatCard';
import { AlertBox } from '../components/AlertBox';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Btn } from '../components/FormField';

const SPECIES = Object.keys(SPECIES_META);
const BAR_COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#a855f7','#06b6d4','#f97316','#84cc16'];

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

const BLANK_FORM = { species: 'Cattle', type: '', dailyPerHead: '', stock: '', unit: 'kg', costPerKg: '' };

function FeedTypeModal({ feed, livestock, onSave, onClose }) {
  const [form, setForm] = useState(feed ? {
    species: feed.species,
    type: feed.type,
    dailyPerHead: String(feed.dailyPerHead),
    stock: String(feed.stock),
    unit: feed.unit,
    costPerKg: String(feed.costPerKg),
  } : BLANK_FORM);
  const [error, setError] = useState('');

  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };

  const handleSave = () => {
    if (!form.type.trim()) { setError('Feed type name is required'); return; }
    const dailyPerHead = parseFloat(form.dailyPerHead);
    const stock = parseFloat(form.stock) || 0;
    const costPerKg = parseFloat(form.costPerKg) || 0;
    if (!dailyPerHead || dailyPerHead <= 0) { setError('Daily per head must be greater than 0'); return; }
    const count = Math.max(1, livestock.filter(a => a.species === form.species).length);
    const daysLeft = dailyPerHead > 0 ? Math.round(stock / (dailyPerHead * count)) : 0;
    onSave({ ...feed, species: form.species, type: form.type.trim(), dailyPerHead, stock, unit: form.unit, costPerKg, daysLeft });
    onClose();
  };

  return (
    <Modal open title={feed ? 'Edit Feed Type' : 'Add Feed Type'} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Species *">
            <Select value={form.species} onChange={set('species')}>
              {SPECIES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Feed type name *">
            <Input placeholder="e.g. Hay / Silage" value={form.type} onChange={set('type')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Daily per head *">
            <Input type="number" step="0.01" min="0" placeholder="0" value={form.dailyPerHead} onChange={set('dailyPerHead')} />
          </FormField>
          <FormField label="Unit">
            <Select value={form.unit} onChange={set('unit')}>
              {FEED_UNITS.map(u => <option key={u}>{u}</option>)}
            </Select>
          </FormField>
          <FormField label="Cost per unit ($)">
            <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.costPerKg} onChange={set('costPerKg')} />
          </FormField>
        </div>
        <FormField label="Current stock">
          <Input type="number" step="0.1" min="0" placeholder="0" value={form.stock} onChange={set('stock')} />
        </FormField>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626' }}>
            ⚠ {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

function RestockModal({ feedItem, onSave, onClose }) {
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const handleSave = () => {
    const q = parseFloat(qty);
    if (!q || q <= 0) { setError('Enter a valid quantity greater than 0'); return; }
    onSave(feedItem.id, q);
    onClose();
  };
  return (
    <Modal open title={`Restock — ${feedItem.species} ${feedItem.type}`} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Log order</Btn></>}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Current stock: <strong className="text-slate-700">{feedItem.stock} {feedItem.unit}</strong>
        </p>
        <FormField label={`Quantity received (${feedItem.unit})`}>
          <Input type="number" step="0.1" min="0" placeholder="0" value={qty} onChange={e => { setError(''); setQty(e.target.value); }} autoFocus />
        </FormField>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626' }}>
            ⚠ {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

const card = {
  background: '#ffffff', borderRadius: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
  padding: 24,
};

export default function Feed() {
  const { feed, livestock, addFeed, updateFeed, removeFeed, addFeedStock } = useData();
  const [modal, setModal] = useState(null);

  const lowFeed = feed.filter(f => f.daysLeft < 20);
  const totalStock = feed.reduce((s, f) => s + f.stock, 0);

  const chartData = feed.map(f => {
    const count = Math.max(1, livestock.filter(a => a.species === f.species).length);
    return {
      name: `${SPECIES_META[f.species]?.emoji || ''} ${f.species}`,
      monthly: Math.round(f.dailyPerHead * count * 30),
    };
  });

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Feed &amp; Nutrition</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage feed types, stock levels, and daily requirements</p>
        </div>
        <Btn onClick={() => setModal({ type: 'add' })}>
          <Plus size={16} /> Add feed type
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🌾" label="Feed types" value={feed.length} color="green" />
        <StatCard icon="⚠️" label="Low stock (<20d)" value={lowFeed.length} color={lowFeed.length > 0 ? 'red' : 'green'} />
        <StatCard icon="📦" label="Total stock" value={`${totalStock.toLocaleString()} kg`} color="blue" />
        <StatCard icon="💰" label="Daily feed cost" value={`$${feed.reduce((s,f)=>s+(f.dailyPerHead*f.costPerKg),0).toFixed(0)}`} color="amber" />
      </div>

      {/* Low stock alerts */}
      {lowFeed.length > 0 && (
        <div className="flex flex-col gap-2">
          {lowFeed.map(f => (
            <AlertBox key={f.id} color={f.daysLeft < 10 ? 'red' : 'amber'}>
              <strong>{SPECIES_META[f.species]?.emoji} {f.species} — {f.type}</strong>: Only{' '}
              <strong>{f.daysLeft} days</strong> of stock remaining ({f.stock} {f.unit}). Reorder soon.
            </AlertBox>
          ))}
        </div>
      )}

      {feed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center py-20 gap-3"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
          <div className="text-5xl">🌾</div>
          <p className="font-semibold text-slate-600">No feed types yet</p>
          <p className="text-sm text-slate-400">Add your first feed type to start tracking stock levels</p>
          <Btn onClick={() => setModal({ type: 'add' })}><Plus size={15} /> Add feed type</Btn>
        </div>
      ) : (
        <>
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color, background: bgColor }}>
                            {f.daysLeft}d left
                          </span>
                          <button onClick={() => setModal({ type: 'restock', item: f })}
                            className="p-1 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Restock">
                            <PackagePlus size={14} />
                          </button>
                          <button onClick={() => setModal({ type: 'edit', item: f })}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => removeFeed(f.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: color }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                        <span className="font-medium">{f.stock} {f.unit} in stock</span>
                        <span>${f.costPerKg.toFixed(2)}/{f.unit}</span>
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
                      <th className="text-left py-2.5 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost/unit</th>
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
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Monthly Consumption Estimate ({feed[0]?.unit || 'kg'})</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#94a3b8' }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="monthly" radius={[8,8,0,0]} name="Monthly (kg)">
                  {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {modal?.type === 'add' && (
        <FeedTypeModal livestock={livestock} onSave={addFeed} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <FeedTypeModal feed={modal.item} livestock={livestock} onSave={updateFeed} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'restock' && (
        <RestockModal feedItem={modal.item} onSave={addFeedStock} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
