import { useState, useMemo } from 'react';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { SPECIES_META } from '../data/livestock';
import { StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Textarea, Btn } from '../components/FormField';
import clsx from 'clsx';

const STATUSES = ['Healthy', 'Pregnant', 'Treatment'];
const SEXES = ['Male', 'Female', 'Mixed', 'Colony'];

function AnimalForm({ animal, onSave, onClose }) {
  const [form, setForm] = useState({
    tag: animal?.tag || '', name: animal?.name || '',
    species: animal?.species || 'Cattle', breed: animal?.breed || '',
    dob: animal?.dob || '', sex: animal?.sex || 'Female',
    weight: animal?.weight || '', location: animal?.location || '',
    status: animal?.status || 'Healthy', notes: animal?.notes || '',
  });
  const [error, setError] = useState('');

  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };
  const breeds = SPECIES_META[form.species]?.breeds || [];

  const handleSave = () => {
    if (!form.tag.trim()) { setError('Tag / ID is required'); return; }
    const age = form.dob ? Math.floor((new Date() - new Date(form.dob)) / 31557600000) : 0;
    onSave({ ...animal, ...form, age, weight: parseFloat(form.weight) || 0 });
    onClose();
  };

  return (
    <Modal
      open title={animal ? `Edit — ${animal.tag}` : 'Add Animal'}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleSave}>Save animal</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tag / ID *">
            <Input placeholder="e.g. CT-010" value={form.tag} onChange={set('tag')} />
          </FormField>
          <FormField label="Name">
            <Input placeholder="Optional name" value={form.name} onChange={set('name')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Species *">
            <Select value={form.species} onChange={e => setForm(p => ({ ...p, species: e.target.value, breed: '' }))}>
              {Object.keys(SPECIES_META).map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Breed *">
            <Select value={form.breed} onChange={set('breed')}>
              <option value="">Select breed…</option>
              {breeds.map(b => <option key={b}>{b}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date of Birth">
            <Input type="date" value={form.dob} onChange={set('dob')} />
          </FormField>
          <FormField label="Sex">
            <Select value={form.sex} onChange={set('sex')}>
              {SEXES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Weight (kg)">
            <Input type="number" placeholder="kg" value={form.weight} onChange={set('weight')} />
          </FormField>
          <FormField label="Location">
            <Input placeholder="e.g. Paddock A" value={form.location} onChange={set('location')} />
          </FormField>
        </div>
        <FormField label="Status">
          <Select value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </Select>
        </FormField>
        <FormField label="Notes">
          <Textarea rows={2} placeholder="Optional notes…" value={form.notes} onChange={set('notes')} />
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

function ViewModal({ animal, onClose }) {
  if (!animal) return null;
  const meta = SPECIES_META[animal.species];
  return (
    <Modal open title={`${meta?.emoji} ${animal.name || animal.tag}`} onClose={onClose}
      footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}>
      <div className="grid grid-cols-2 gap-4">
        {[
          ['Tag', animal.tag], ['Species', animal.species], ['Breed', animal.breed],
          ['Date of Birth', animal.dob], ['Age', `${animal.age} yr${animal.age !== 1 ? 's' : ''}`],
          ['Weight', `${animal.weight} kg`], ['Sex', animal.sex], ['Location', animal.location],
        ].map(([l, v]) => (
          <div key={l}>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{l}</div>
            <div className="text-sm font-semibold text-slate-800">{v || '—'}</div>
          </div>
        ))}
        <div className="col-span-2">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Status</div>
          <StatusBadge status={animal.status} />
        </div>
      </div>
      {animal.notes && (
        <div className="mt-4 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">
          📝 {animal.notes}
        </div>
      )}
    </Modal>
  );
}

export default function Livestock() {
  const { livestock, addAnimal, updateAnimal, removeAnimal } = useData();
  const [selected, setSelected] = useState('All');
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [locF, setLocF] = useState('');
  const [modal, setModal] = useState(null);

  const locations = useMemo(() => [...new Set(livestock.map(a => a.location))], [livestock]);

  const filtered = useMemo(() => livestock.filter(a => {
    const sp  = selected === 'All' || a.species === selected;
    const st  = !statusF || a.status === statusF;
    const loc = !locF || a.location === locF;
    const q   = !search || `${a.tag} ${a.name} ${a.breed}`.toLowerCase().includes(search.toLowerCase());
    return sp && st && loc && q;
  }), [livestock, selected, search, statusF, locF]);

  const countOf = (sp) => sp === 'All' ? livestock.length : livestock.filter(a => a.species === sp).length;
  const closeModal = () => setModal(null);

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Livestock</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage all your animals across species</p>
        </div>
        <Btn onClick={() => setModal({ type: 'add' })}>
          <Plus size={16} /> Add animal
        </Btn>
      </div>

      {/* Species tiles */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {['All', ...Object.keys(SPECIES_META)].map(sp => {
          const count = countOf(sp);
          const isActive = selected === sp;
          return (
            <button
              key={sp}
              onClick={() => setSelected(sp)}
              className={clsx(
                'flex flex-col items-center px-5 py-3 rounded-2xl border-2 text-center flex-shrink-0 transition-all cursor-pointer',
                isActive
                  ? 'border-green-500 shadow-md'
                  : 'border-slate-200 bg-white hover:border-green-300 hover:shadow-sm'
              )}
              style={isActive ? { background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderColor: '#22c55e' } : {}}
            >
              <span className="text-2xl">{sp === 'All' ? '🐾' : SPECIES_META[sp].emoji}</span>
              <span className={clsx('text-xs font-bold mt-1', isActive ? 'text-green-800' : 'text-slate-700')}>{sp}</span>
              <span className={clsx('text-[11px]', isActive ? 'text-green-600' : 'text-slate-400')}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/15 bg-white placeholder:text-slate-400 transition-all"
              placeholder="Search tag, name, breed…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 outline-none bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/15 transition-all"
            value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 outline-none bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/15 transition-all"
            value={locF} onChange={e => setLocF(e.target.value)}>
            <option value="">All locations</option>
            {locations.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-sm font-medium">No animals match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 rounded-xl">
                  {['Tag','Animal','Breed','Age','Weight','Sex','Location','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider first:rounded-l-lg last:rounded-r-lg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-3.5">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">{a.tag}</span>
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-slate-800">
                      {SPECIES_META[a.species]?.emoji} {a.name || '—'}
                    </td>
                    <td className="px-3 py-3.5 text-slate-500">{a.breed}</td>
                    <td className="px-3 py-3.5 text-slate-600">{a.age}y</td>
                    <td className="px-3 py-3.5 text-slate-600">{a.weight} kg</td>
                    <td className="px-3 py-3.5 text-slate-600">{a.sex}</td>
                    <td className="px-3 py-3.5">
                      <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md">{a.location}</span>
                    </td>
                    <td className="px-3 py-3.5"><StatusBadge status={a.status} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ type: 'view', animal: a })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setModal({ type: 'edit', animal: a })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setModal({ type: 'delete', animal: a })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-400 mt-3 px-1">Showing {filtered.length} of {livestock.length} animals</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'add' && (
        <AnimalForm onSave={addAnimal} onClose={closeModal} />
      )}
      {modal?.type === 'edit' && (
        <AnimalForm animal={modal.animal} onSave={updateAnimal} onClose={closeModal} />
      )}
      {modal?.type === 'view' && (
        <ViewModal animal={modal.animal} onClose={closeModal} />
      )}
      {modal?.type === 'delete' && (
        <Modal open title="Remove animal" onClose={closeModal}
          footer={
            <>
              <Btn variant="secondary" onClick={closeModal}>Cancel</Btn>
              <Btn variant="danger" onClick={() => { removeAnimal(modal.animal.id); closeModal(); }}>Remove</Btn>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Are you sure you want to remove <strong>{modal.animal.name || modal.animal.tag}</strong> from your records?
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
