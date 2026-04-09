import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Textarea, Btn } from '../components/FormField';

const TYPES = ['Checkup', 'Vaccination', 'Treatment', 'Deworming', 'Farrier', 'Surgery', 'Other'];
const STATUSES = ['Completed', 'Ongoing', 'Scheduled'];

function typeIcon(t) {
  return { Vaccination:'💉', Treatment:'🩹', Checkup:'🔍', Farrier:'🐴', Surgery:'🏥', Deworming:'💊' }[t] || '📋';
}

function typeIconBg(t) {
  return { Vaccination:'bg-blue-50', Treatment:'bg-red-50', Checkup:'bg-slate-50', Farrier:'bg-amber-50', Surgery:'bg-purple-50', Deworming:'bg-green-50' }[t] || 'bg-slate-50';
}

function HealthForm({ health, livestock, onSave, onClose }) {
  const [form, setForm] = useState({
    date: health?.date || new Date().toISOString().slice(0, 10),
    animalTag: health?.animalTag || '',
    type: health?.type || 'Checkup',
    vet: health?.vet || '',
    status: health?.status || 'Completed',
    cost: health?.cost || '',
    notes: health?.notes || '',
  });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.animalTag || !form.date) return alert('Animal and date are required');
    const a = livestock.find(x => x.tag === form.animalTag);
    onSave({ ...health, ...form, animalName: a?.name || form.animalTag, cost: parseFloat(form.cost) || 0 });
    onClose();
  };

  return (
    <Modal open title={health ? 'Edit Record' : 'Add Health Record'} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *">
            <Input type="date" value={form.date} onChange={set('date')} />
          </FormField>
          <FormField label="Animal *">
            <Select value={form.animalTag} onChange={set('animalTag')}>
              <option value="">Select animal…</option>
              {livestock.map(a => <option key={a.id} value={a.tag}>{a.tag} — {a.name}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Event type">
            <Select value={form.type} onChange={set('type')}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="Vet / Person">
            <Input placeholder="Dr. Name" value={form.vet} onChange={set('vet')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Status">
            <Select value={form.status} onChange={set('status')}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Cost ($)">
            <Input type="number" placeholder="0" value={form.cost} onChange={set('cost')} />
          </FormField>
        </div>
        <FormField label="Notes">
          <Textarea rows={2} placeholder="Details…" value={form.notes} onChange={set('notes')} />
        </FormField>
      </div>
    </Modal>
  );
}

export default function Health() {
  const { health, livestock, addHealth, updateHealth, removeHealth } = useData();
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(null);

  const shown = useMemo(() => {
    if (tab === 'scheduled')    return health.filter(h => h.status === 'Scheduled');
    if (tab === 'vaccinations') return health.filter(h => h.type === 'Vaccination');
    return health;
  }, [health, tab]);

  const totalCost = health.reduce((s, h) => s + h.cost, 0);

  const TABS = [
    { key: 'all', label: 'All Records' },
    { key: 'scheduled', label: 'Upcoming' },
    { key: 'vaccinations', label: 'Vaccinations' },
  ];

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Health &amp; Vet</h2>
          <p className="text-sm text-slate-400 mt-0.5">Medical records, vaccinations, and scheduled care</p>
        </div>
        <Btn onClick={() => setModal({ type: 'add' })}>
          <Plus size={16} /> Add record
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="✅" label="Completed" value={health.filter(h=>h.status==='Completed').length} color="green" />
        <StatCard icon="🔄" label="Ongoing" value={health.filter(h=>h.status==='Ongoing').length} color="amber" />
        <StatCard icon="📅" label="Scheduled" value={health.filter(h=>h.status==='Scheduled').length} color="blue" />
        <StatCard icon="💰" label="Total Vet Cost" value={`$${totalCost}`} color="green" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 mb-5 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm font-medium">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Date','Animal','Type','Vet / Person','Notes','Cost','Status',''].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(h => (
                  <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-medium">
                      {new Date(h.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-semibold text-slate-800">{h.animalName}</div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">{h.animalTag}</div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${typeIconBg(h.type)}`}>
                        <span>{typeIcon(h.type)}</span>
                        <span className="text-slate-700">{h.type}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">{h.vet}</td>
                    <td className="px-3 py-3.5 text-slate-500 max-w-xs truncate">{h.notes}</td>
                    <td className="px-3 py-3.5 font-bold text-slate-800">${h.cost}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={h.status} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ type: 'edit', record: h })}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removeHealth(h.id)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal?.type === 'add' && (
        <HealthForm livestock={livestock} onSave={addHealth} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <HealthForm health={modal.record} livestock={livestock} onSave={updateHealth} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
