import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Textarea, Btn } from '../components/FormField';
import { AlertBox } from '../components/AlertBox';
import {
  BROOD_PATTERNS, STORES_LEVELS, TEMPERAMENTS,
  HIVE_PESTS, NOTIFIABLE_PESTS, HIVE_PRODUCTS,
} from '../data/livestock';

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });

const hasNotifiable = (pests = []) => pests.some(p => NOTIFIABLE_PESTS.includes(p));

/* Colour the temperament + stores chips so problems stand out in the table. */
const chip = (value) => {
  if (['Very defensive', 'None — feed now', 'No brood'].includes(value)) return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
  if (['Defensive', 'Low', 'Spotty', 'Drone-heavy'].includes(value))     return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
  return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
};

function Chip({ value }) {
  if (!value) return <span className="text-slate-300">—</span>;
  const s = chip(value);
  return (
    <span className="text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {value}
    </span>
  );
}

/* ── Inspection form ─────────────────────────────────────────────────── */

function InspectionForm({ record, hives, onSave, onClose }) {
  const [form, setForm] = useState({
    date: record?.date || today(),
    hiveTag: record?.hiveTag || '',
    inspector: record?.inspector || '',
    queenSeen: record?.queenSeen ?? 'Not seen',
    broodPattern: record?.broodPattern || BROOD_PATTERNS[0],
    stores: record?.stores || STORES_LEVELS[0],
    temperament: record?.temperament || TEMPERAMENTS[1],
    varroaCount: record?.varroaCount ?? '',
    pests: record?.pests || ['None seen'],
    actions: record?.actions || '',
    notes: record?.notes || '',
  });
  const [error, setError] = useState('');
  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };

  const togglePest = (pest) => {
    setForm(p => {
      // "None seen" is exclusive — picking it clears everything else.
      if (pest === 'None seen') return { ...p, pests: ['None seen'] };
      const without = p.pests.filter(x => x !== 'None seen');
      const next = without.includes(pest) ? without.filter(x => x !== pest) : [...without, pest];
      return { ...p, pests: next.length ? next : ['None seen'] };
    });
  };

  const handleSave = () => {
    if (!form.hiveTag) { setError('Please select a hive'); return; }
    if (!form.date) { setError('Date is required'); return; }
    onSave({
      ...record, ...form,
      varroaCount: form.varroaCount === '' ? null : parseFloat(form.varroaCount) || 0,
    });
    onClose();
  };

  return (
    <Modal open title={record ? 'Edit Inspection' : 'Add Hive Inspection'} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save inspection</Btn></>}>
      <div className="flex flex-col gap-4">

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *">
            <Input type="date" value={form.date} onChange={set('date')} />
          </FormField>
          <FormField label="Hive *" hint={hives.length === 0 ? 'Add hives under Livestock → Bee' : undefined}>
            <Select value={form.hiveTag} onChange={set('hiveTag')}>
              <option value="">Select hive…</option>
              {hives.map(h => (
                <option key={h.id} value={h.tag}>{h.tag}{h.location ? ` — ${h.location}` : ''}</option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Inspector">
            <Input placeholder="Who inspected" value={form.inspector} onChange={set('inspector')} />
          </FormField>
          <FormField label="Queen" hint="Eggs are proof of a queen even if unseen">
            <Select value={form.queenSeen} onChange={set('queenSeen')}>
              <option>Seen</option>
              <option>Not seen — eggs present</option>
              <option>Not seen</option>
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Brood pattern">
            <Select value={form.broodPattern} onChange={set('broodPattern')}>
              {BROOD_PATTERNS.map(b => <option key={b}>{b}</option>)}
            </Select>
          </FormField>
          <FormField label="Stores">
            <Select value={form.stores} onChange={set('stores')}>
              {STORES_LEVELS.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Temperament">
            <Select value={form.temperament} onChange={set('temperament')}>
              {TEMPERAMENTS.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>
        </div>

        <FormField label="Varroa count" hint="Mites per 100 bees, or 24-hour board drop. Leave blank if not checked.">
          <Input type="number" min={0} placeholder="e.g. 3" value={form.varroaCount} onChange={set('varroaCount')} />
        </FormField>

        {/* Pests & diseases */}
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pests &amp; diseases seen</div>
          <div className="flex flex-wrap gap-2">
            {HIVE_PESTS.map(p => {
              const on = form.pests.includes(p);
              return (
                <button key={p} type="button" onClick={() => togglePest(p)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all"
                  style={on
                    ? { background: '#f0fdf4', borderColor: '#16a34a', color: '#15803d' }
                    : { background: '#fff', borderColor: '#e2e8f0', color: '#64748b' }}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {hasNotifiable(form.pests) && (
          <AlertBox color="red">
            <strong>American foulbrood is a notifiable disease in South Africa.</strong> Under the
            Control Measures relating to Honey-bees (R.858 of 2013) you must report it to DALRRD and
            manage or destroy the affected colony. Do not move this hive or its equipment.
          </AlertBox>
        )}

        <FormField label="Actions taken">
          <Input placeholder="e.g. Added super, treated for varroa, requeened" value={form.actions} onChange={set('actions')} />
        </FormField>
        <FormField label="Notes">
          <Textarea rows={2} placeholder="Anything else worth recording…" value={form.notes} onChange={set('notes')} />
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

/* ── Harvest form ────────────────────────────────────────────────────── */

function HarvestForm({ record, hives, onSave, onClose }) {
  const [form, setForm] = useState({
    date: record?.date || today(),
    hiveTag: record?.hiveTag || '',
    product: record?.product || HIVE_PRODUCTS[0],
    quantity: record?.quantity ?? '',
    frames: record?.frames ?? '',
    notes: record?.notes || '',
  });
  const [error, setError] = useState('');
  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };

  const handleSave = () => {
    if (!form.hiveTag) { setError('Please select a hive'); return; }
    const qty = parseFloat(form.quantity);
    if (!qty || qty <= 0) { setError('Enter a quantity greater than zero'); return; }
    onSave({
      ...record, ...form,
      quantity: qty,
      frames: form.frames === '' ? null : parseInt(form.frames, 10) || 0,
    });
    onClose();
  };

  return (
    <Modal open title={record ? 'Edit Harvest' : 'Log Harvest'} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save harvest</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *">
            <Input type="date" value={form.date} onChange={set('date')} />
          </FormField>
          <FormField label="Hive *" hint={hives.length === 0 ? 'Add hives under Livestock → Bee' : undefined}>
            <Select value={form.hiveTag} onChange={set('hiveTag')}>
              <option value="">Select hive…</option>
              {hives.map(h => (
                <option key={h.id} value={h.tag}>{h.tag}{h.location ? ` — ${h.location}` : ''}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Product">
            <Select value={form.product} onChange={set('product')}>
              {HIVE_PRODUCTS.map(p => <option key={p}>{p}</option>)}
            </Select>
          </FormField>
          <FormField label="Quantity (kg) *">
            <Input type="number" step="0.1" min={0} placeholder="e.g. 18.5" value={form.quantity} onChange={set('quantity')} />
          </FormField>
          <FormField label="Frames pulled">
            <Input type="number" min={0} placeholder="optional" value={form.frames} onChange={set('frames')} />
          </FormField>
        </div>
        <FormField label="Notes">
          <Textarea rows={2} placeholder="Forage source, moisture, batch…" value={form.notes} onChange={set('notes')} />
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

export default function Apiary() {
  const {
    livestock,
    inspections, addInspection, updateInspection, removeInspection,
    harvests,    addHarvest,    updateHarvest,    removeHarvest,
  } = useData();

  const [tab, setTab] = useState('inspections');
  const [modal, setModal] = useState(null);

  const hives = useMemo(() => livestock.filter(a => a.species === 'Bee'), [livestock]);

  const honeyKg = useMemo(
    () => harvests.filter(h => h.product === 'Honey').reduce((s, h) => s + (h.quantity || 0), 0),
    [harvests]);

  // Captured once on mount — "last 30 days" shouldn't shift on every render.
  const [mountedAt] = useState(() => Date.now());
  const recentCount = useMemo(() => {
    const cutoff = mountedAt - 30 * 86400000;
    return inspections.filter(i => new Date(i.date).getTime() >= cutoff).length;
  }, [inspections, mountedAt]);

  /* A hive needs attention if its most recent inspection flagged a problem. */
  const needsAttention = useMemo(() => {
    const latest = {};
    [...inspections]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach(i => { latest[i.hiveTag] = i; });
    return Object.values(latest).filter(i =>
      hasNotifiable(i.pests) ||
      i.queenSeen === 'Not seen' ||
      i.broodPattern === 'No brood' ||
      i.stores === 'None — feed now'
    ).length;
  }, [inspections]);

  const alerts = useMemo(() => inspections.filter(i => hasNotifiable(i.pests)), [inspections]);

  const TABS = [
    { key: 'inspections', label: `Inspections (${inspections.length})` },
    { key: 'harvests',    label: `Harvests (${harvests.length})` },
  ];

  const closeModal = () => setModal(null);
  const addLabel = tab === 'inspections' ? 'Add inspection' : 'Log harvest';

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Apiary</h2>
          <p className="text-sm text-slate-400 mt-0.5">Hive inspections, disease checks and harvest records</p>
        </div>
        <Btn onClick={() => setModal({ type: tab === 'inspections' ? 'add-inspection' : 'add-harvest' })}>
          <Plus size={16} /> {addLabel}
        </Btn>
      </div>

      {alerts.length > 0 && (
        <AlertBox color="red">
          <strong>🚨 American foulbrood recorded on {alerts.length} inspection{alerts.length !== 1 ? 's' : ''}.</strong>{' '}
          AFB is notifiable in South Africa — report to DALRRD and keep the affected hives and
          equipment isolated.
        </AlertBox>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🐝" label="Hives" value={hives.length} sub={`${new Set(hives.map(h => h.location).filter(Boolean)).size} apiaries`} color="amber" />
        <StatCard icon="🔍" label="Inspections (30d)" value={recentCount} sub={`${inspections.length} all time`} color="blue" />
        <StatCard icon="🍯" label="Honey harvested" value={`${honeyKg.toFixed(1)} kg`} sub={`${harvests.length} harvests`} color="amber" />
        <StatCard icon="⚠️" label="Needs attention" value={needsAttention} sub="From latest inspection" color={needsAttention > 0 ? 'red' : 'green'} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>

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

        {hives.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-2">🐝</div>
            <p className="text-sm font-medium">No hives yet</p>
            <p className="text-xs mt-1">Add them under Livestock → Bee, then inspections and harvests can be logged here.</p>
          </div>
        ) : tab === 'inspections' ? (
          inspections.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm font-medium">No inspections recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Date','Hive','Queen','Brood','Stores','Temperament','Varroa','Pests / disease','Actions',''].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inspections.map(i => (
                    <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-medium">{fmtDate(i.date)}</td>
                      <td className="px-3 py-3.5">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">{i.hiveTag}</span>
                        {i.inspector && <div className="text-xs text-slate-400 mt-1">{i.inspector}</div>}
                      </td>
                      <td className="px-3 py-3.5">
                        <Chip value={i.queenSeen === 'Not seen' ? 'Not seen' : i.queenSeen === 'Seen' ? 'Seen' : 'Eggs present'} />
                      </td>
                      <td className="px-3 py-3.5"><Chip value={i.broodPattern} /></td>
                      <td className="px-3 py-3.5"><Chip value={i.stores} /></td>
                      <td className="px-3 py-3.5"><Chip value={i.temperament} /></td>
                      <td className="px-3 py-3.5 text-slate-600 font-semibold">
                        {i.varroaCount == null ? <span className="text-slate-300">—</span> : i.varroaCount}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-56">
                          {(i.pests || []).map(p => (
                            <span key={p} className="text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap"
                              style={NOTIFIABLE_PESTS.includes(p)
                                ? { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
                                : p === 'None seen'
                                  ? { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }
                                  : { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                              {NOTIFIABLE_PESTS.includes(p) ? `🚨 ${p}` : p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 max-w-xs truncate">{i.actions}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal({ type: 'edit-inspection', record: i })}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => removeInspection(i.id)}
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
          )
        ) : (
          harvests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-2">🍯</div>
              <p className="text-sm font-medium">No harvests logged yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Date','Hive','Product','Quantity','Frames','Notes',''].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {harvests.map(h => (
                    <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap font-medium">{fmtDate(h.date)}</td>
                      <td className="px-3 py-3.5">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">{h.hiveTag}</span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-700 font-semibold">{h.product}</td>
                      <td className="px-3 py-3.5 font-bold text-slate-800">{h.quantity} kg</td>
                      <td className="px-3 py-3.5 text-slate-600">{h.frames ?? <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-3.5 text-slate-500 max-w-xs truncate">{h.notes}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal({ type: 'edit-harvest', record: h })}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => removeHarvest(h.id)}
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
          )
        )}
      </div>

      {modal?.type === 'add-inspection' && (
        <InspectionForm hives={hives} onSave={addInspection} onClose={closeModal} />
      )}
      {modal?.type === 'edit-inspection' && (
        <InspectionForm record={modal.record} hives={hives} onSave={updateInspection} onClose={closeModal} />
      )}
      {modal?.type === 'add-harvest' && (
        <HarvestForm hives={hives} onSave={addHarvest} onClose={closeModal} />
      )}
      {modal?.type === 'edit-harvest' && (
        <HarvestForm record={modal.record} hives={hives} onSave={updateHarvest} onClose={closeModal} />
      )}
    </div>
  );
}
