import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Textarea, Btn } from '../components/FormField';
import {
  CROP_CATEGORIES, CROP_META, PLANTING_STATUSES, PLANTING_STATUS_TONE,
  cropsByCategory, generatePlantingCode,
} from '../data/crops';

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

function StatusChip({ status }) {
  const tone = PLANTING_STATUS_TONE[status] || PLANTING_STATUS_TONE.Removed;
  return (
    <span className="text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
      style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>
      {status}
    </span>
  );
}

/* ── Form ────────────────────────────────────────────────────────────── */

function PlantingForm({ planting, existing, zones, onSave, onClose }) {
  const isNew = !planting;
  const [form, setForm] = useState(() => ({
    code: planting?.code || generatePlantingCode(existing),
    category: planting?.category || 'Grain',
    crop: planting?.crop || cropsByCategory('Grain')[0],
    variety: planting?.variety || '',
    location: planting?.location || '',
    areaHa: planting?.areaHa ?? '',
    plantCount: planting?.plantCount ?? '',
    plantedAt: planting?.plantedAt || '',
    expectedHarvest: planting?.expectedHarvest || '',
    status: planting?.status || 'Growing',
    perennial: planting?.perennial ?? false,
    notes: planting?.notes || '',
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };

  /* Switching category changes which crops are on offer. */
  const onCategory = (e) => {
    const category = e.target.value;
    const first = cropsByCategory(category)[0];
    setError('');
    setForm(p => ({ ...p, category, crop: first, variety: '', perennial: !!CROP_META[first]?.perennial }));
  };

  /* Orchards and vines default to perennial; the farmer can still override. */
  const onCrop = (e) => {
    const crop = e.target.value;
    setError('');
    setForm(p => ({ ...p, crop, variety: '', perennial: !!CROP_META[crop]?.perennial }));
  };

  const crops = cropsByCategory(form.category);
  const varieties = CROP_META[form.crop]?.varieties || [];

  const handleSave = () => {
    if (!form.code.trim()) { setError('A planting code is required'); return; }
    if (!form.crop) { setError('Choose a crop'); return; }
    const clash = existing.some(p => p.code === form.code.trim() && p.id !== planting?.id);
    if (clash) { setError(`${form.code.trim()} is already used by another planting`); return; }

    onSave({
      ...planting,
      ...form,
      code: form.code.trim(),
      areaHa: form.areaHa === '' ? null : parseFloat(form.areaHa),
      plantCount: form.plantCount === '' ? null : parseInt(form.plantCount, 10),
      perennial: !!form.perennial,
    });
    onClose();
  };

  return (
    <Modal open title={isNew ? 'Add Planting' : `Edit — ${planting.code}`} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save planting</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Planting code *" hint={isNew ? 'Auto-generated — edit to use your own' : undefined}>
            <Input value={form.code} onChange={set('code')} />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={set('status')}>
              {PLANTING_STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Category *">
            <Select value={form.category} onChange={onCategory}>
              {CROP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </Select>
          </FormField>
          <FormField label="Crop *">
            <Select value={form.crop} onChange={onCrop}>
              {crops.map(c => <option key={c}>{c}</option>)}
            </Select>
          </FormField>
        </div>

        <FormField label="Variety / cultivar"
          hint={varieties.length ? 'Pick one or type your own' : 'Optional'}>
          <Input value={form.variety} onChange={set('variety')} list="crop-varieties"
            placeholder={varieties[0] ? `e.g. ${varieties[0]}` : 'e.g. your cultivar'} />
          <datalist id="crop-varieties">
            {varieties.map(v => <option key={v} value={v} />)}
          </datalist>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Field / block"
            hint={zones.length === 0 ? 'Add zones in Farm Plan to see suggestions' : undefined}>
            <Input value={form.location} onChange={set('location')} list="crop-zones"
              placeholder="e.g. North Field" />
            <datalist id="crop-zones">
              {zones.map(z => <option key={z.id} value={z.name} />)}
            </datalist>
          </FormField>
          <FormField label="Area (ha)">
            <Input type="number" step="0.01" min="0" placeholder="e.g. 2.5"
              value={form.areaHa} onChange={set('areaHa')} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={form.perennial ? 'Established' : 'Planted'}>
            <Input type="date" value={form.plantedAt} onChange={set('plantedAt')} />
          </FormField>
          <FormField label="Expected harvest">
            <Input type="date" value={form.expectedHarvest} onChange={set('expectedHarvest')} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={form.perennial ? 'Trees / vines' : 'Plants'} hint="Optional">
            <Input type="number" min="0" placeholder="e.g. 420"
              value={form.plantCount} onChange={set('plantCount')} />
          </FormField>
          <FormField label="Type" hint="Perennial blocks are harvested season after season">
            <Select value={form.perennial ? 'Perennial' : 'Annual'}
              onChange={(e) => setForm(p => ({ ...p, perennial: e.target.value === 'Perennial' }))}>
              <option>Annual</option>
              <option>Perennial</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Notes">
          <Textarea rows={2} placeholder="Soil prep, irrigation setup, anything worth remembering…"
            value={form.notes} onChange={set('notes')} />
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

/* ── Page ────────────────────────────────────────────────────────────── */

export default function Crops() {
  const { plantings, zones, addPlanting, updatePlanting, removePlanting } = useData();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const shown = useMemo(() => plantings.filter(p => {
    const inCat = category === 'All' || p.category === category;
    const q = !search || `${p.code} ${p.crop} ${p.variety || ''} ${p.location || ''}`
      .toLowerCase().includes(search.toLowerCase());
    return inCat && q;
  }), [plantings, category, search]);

  const growing = plantings.filter(p => p.status === 'Growing');
  const totalHa = plantings
    .filter(p => ['Planned', 'Growing'].includes(p.status))
    .reduce((s, p) => s + (p.areaHa || 0), 0);

  /* Anything due in the next 30 days is worth surfacing. "Now" is captured
     once on mount so the window doesn't shift on every render. */
  const [mountedAt] = useState(() => Date.now());
  const dueSoon = useMemo(() => plantings.filter(p => {
    if (p.status !== 'Growing' || !p.expectedHarvest) return false;
    const diff = new Date(p.expectedHarvest).getTime() - mountedAt;
    return diff >= 0 && diff <= 30 * 86400000;
  }).length, [plantings, mountedAt]);

  const countOf = (c) => c === 'All' ? plantings.length : plantings.filter(p => p.category === c).length;

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Crops</h2>
          <p className="text-sm text-slate-400 mt-0.5">Plantings across your fields, orchards and tunnels</p>
        </div>
        <Btn onClick={() => setModal({ type: 'add' })}><Plus size={16} /> Add planting</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🌱" label="Plantings" value={plantings.length}
          sub={`${growing.length} growing`} color="green" />
        <StatCard icon="📐" label="Area planted" value={`${totalHa.toFixed(1)} ha`}
          sub="Planned and growing" color="blue" />
        <StatCard icon="🗓️" label="Harvest due" value={dueSoon}
          sub="Within 30 days" color={dueSoon > 0 ? 'amber' : 'green'} />
        <StatCard icon="🌳" label="Perennial blocks" value={plantings.filter(p => p.perennial).length}
          sub="Orchards and vines" color="green" />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {['All', ...CROP_CATEGORIES].map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${
              category === c ? 'text-white border-green-600' : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
            }`}
            style={category === c ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
            {c} <span className="opacity-60">({countOf(c)})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>

        <div className="relative mb-5 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search code, crop, variety or field…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {plantings.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-sm font-medium">No plantings yet</p>
            <p className="text-xs mt-1">Add what's in the ground and track it through to harvest.</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-medium">Nothing matches that search</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Code','Crop','Field','Area','Planted','Expected harvest','Status',''].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-3.5">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">{p.code}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {CROP_META[p.crop]?.emoji || '🌱'} {p.crop}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.variety || p.category}{p.perennial ? ' · perennial' : ''}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-slate-600">{p.location || <span className="text-slate-300">—</span>}</td>
                    <td className="px-3 py-3.5 text-slate-700 font-semibold whitespace-nowrap">
                      {p.areaHa ? `${p.areaHa} ha` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">{fmtDate(p.plantedAt)}</td>
                    <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">{fmtDate(p.expectedHarvest)}</td>
                    <td className="px-3 py-3.5"><StatusChip status={p.status} /></td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal({ type: 'edit', record: p })}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removePlanting(p.id)}
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
        <PlantingForm existing={plantings} zones={zones} onSave={addPlanting} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <PlantingForm planting={modal.record} existing={plantings} zones={zones}
          onSave={updatePlanting} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
