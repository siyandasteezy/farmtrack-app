import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, TriangleAlert, ShieldCheck } from 'lucide-react';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Textarea, Btn } from '../components/FormField';
import {
  CROP_CATEGORIES, CROP_META, PLANTING_STATUSES, PLANTING_STATUS_TONE,
  HARVEST_GRADES, HARVEST_UNITS, HARVEST_DESTINATIONS,
  cropsByCategory, generatePlantingCode, generateLotCode, unitForCrop,
} from '../data/crops';
import {
  OPERATION_TYPES, OPERATION_META, OPERATION_TONE, COMMON_ACTIVES, QUANTITY_UNITS,
  isSpray, withholdingUntil, reEntryUntil, withholdingStatus, harvestBreach, startOfDay,
} from '../data/fieldOps';

const rand = (n) => `R${n.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}`;

/* Goes through startOfDay rather than new Date() so a stored 'YYYY-MM-DD'
   renders as that calendar day everywhere. Handed straight to new Date() it is
   read as UTC midnight and displayed a day earlier west of Greenwich, which
   would print a spray date that disagrees with the withholding date computed
   from it. */
const fmtDate = (d) => {
  const day = d ? startOfDay(d) : null;
  return day
    ? day.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

const today = () => new Date().toISOString().slice(0, 10);

function StatusChip({ status }) {
  const tone = PLANTING_STATUS_TONE[status] || PLANTING_STATUS_TONE.Removed;
  return (
    <span className="text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
      style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>
      {status}
    </span>
  );
}

function TypeChip({ type }) {
  const meta = OPERATION_META[type] || OPERATION_META.Other;
  const tone = OPERATION_TONE[meta.tone];
  return (
    <span className="text-[11px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
      style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>
      {meta.emoji} {type}
    </span>
  );
}

/* ── Planting form ───────────────────────────────────────────────────── */

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

/* ── Field operation form ────────────────────────────────────────────── */

function FieldOpForm({ record, plantings, onSave, onClose }) {
  const isNew = !record;
  const [form, setForm] = useState(() => ({
    date: record?.date || today(),
    plantingCode: record?.plantingCode || plantings[0]?.code || '',
    type: record?.type || 'Spray',
    product: record?.product || '',
    activeIngredient: record?.activeIngredient || '',
    registrationNo: record?.registrationNo || '',
    target: record?.target || '',
    dose: record?.dose || '',
    totalQuantity: record?.totalQuantity ?? '',
    quantityUnit: record?.quantityUnit || 'L',
    waterVolumeL: record?.waterVolumeL ?? '',
    phiDays: record?.phiDays ?? '',
    reiHours: record?.reiHours ?? '',
    operator: record?.operator || '',
    equipment: record?.equipment || '',
    windKph: record?.windKph ?? '',
    conditions: record?.conditions || '',
    areaHa: record?.areaHa ?? '',
    cost: record?.cost ?? '',
    notes: record?.notes || '',
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };

  const planting = plantings.find(p => p.code === form.plantingCode);
  const spray = form.type === 'Spray';

  /* The reason this form exists: show the consequence of the withholding
     period while it is still being typed, not after the block is sprayed. */
  const preview = useMemo(() => {
    const days = parseInt(form.phiDays, 10);
    if (!spray || !form.date || !Number.isFinite(days) || days <= 0) return null;
    const until = withholdingUntil({ type: 'Spray', date: form.date, phiDays: days });
    if (!until) return null;
    const planned = planting?.expectedHarvest ? new Date(planting.expectedHarvest) : null;
    if (planned) planned.setHours(0, 0, 0, 0);
    return {
      until,
      clash: !!planned && planned < until,
      shortBy: planned ? Math.ceil((until - planned) / 86400000) : 0,
    };
  }, [spray, form.date, form.phiDays, planting]);

  const handleSave = () => {
    if (!form.plantingCode) { setError('Choose the planting this was applied to'); return; }
    if (!form.date) { setError('A date is required'); return; }
    if (spray && !form.product.trim() && !form.activeIngredient.trim()) {
      setError('Record either the product name or its active ingredient');
      return;
    }

    const numOrNull = (v) => (v === '' || v === null ? null : parseFloat(v));
    const intOrNull = (v) => (v === '' || v === null ? null : parseInt(v, 10));

    onSave({
      ...record,
      ...form,
      // Copied across so the record still reads correctly if the planting is
      // later renamed or removed.
      crop: planting?.crop || record?.crop || null,
      location: planting?.location || record?.location || null,
      totalQuantity: numOrNull(form.totalQuantity),
      waterVolumeL: numOrNull(form.waterVolumeL),
      windKph: numOrNull(form.windKph),
      areaHa: numOrNull(form.areaHa),
      cost: numOrNull(form.cost),
      phiDays: spray ? intOrNull(form.phiDays) : null,
      reiHours: spray ? intOrNull(form.reiHours) : null,
    });
    onClose();
  };

  return (
    <Modal open title={isNew ? 'Record Field Operation' : `Edit — ${record.type}`} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save record</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *">
            <Input type="date" value={form.date} onChange={set('date')} />
          </FormField>
          <FormField label="Operation *">
            <Select value={form.type} onChange={set('type')}>
              {OPERATION_TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>
        </div>

        <FormField label="Planting *"
          hint={planting
            ? `${planting.crop}${planting.location ? ` · ${planting.location}` : ''}`
            : 'Add a planting first'}>
          <Select value={form.plantingCode} onChange={set('plantingCode')}>
            {plantings.length === 0 && <option value="">No plantings yet</option>}
            {plantings.map(p => (
              <option key={p.id} value={p.code}>{p.code} — {p.crop}</option>
            ))}
          </Select>
        </FormField>

        {/* Product detail — sprays and fertilisers */}
        {(spray || form.type === 'Fertiliser') && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={spray ? 'Product *' : 'Product'} hint="Trade name on the label">
                <Input value={form.product} onChange={set('product')} placeholder="e.g. Dithane M-45" />
              </FormField>
              <FormField label="Active ingredient" hint="Pick one or type your own">
                <Input value={form.activeIngredient} onChange={set('activeIngredient')}
                  list="op-actives" placeholder="e.g. Mancozeb" />
                <datalist id="op-actives">
                  {COMMON_ACTIVES.map(a => <option key={a} value={a} />)}
                </datalist>
              </FormField>
            </div>

            {spray && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Registration no." hint="L-number, Act 36 of 1947">
                  <Input value={form.registrationNo} onChange={set('registrationNo')}
                    placeholder="e.g. L1234" />
                </FormField>
                <FormField label="Target" hint="Pest, disease or weed">
                  <Input value={form.target} onChange={set('target')} placeholder="e.g. Downy mildew" />
                </FormField>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Rate" hint="As written on the label">
                <Input value={form.dose} onChange={set('dose')} placeholder="e.g. 2 kg/ha" />
              </FormField>
              <FormField label="Total used">
                <Input type="number" step="0.01" min="0" value={form.totalQuantity}
                  onChange={set('totalQuantity')} placeholder="e.g. 5" />
              </FormField>
              <FormField label="Unit">
                <Select value={form.quantityUnit} onChange={set('quantityUnit')}>
                  {QUANTITY_UNITS.map(u => <option key={u}>{u}</option>)}
                </Select>
              </FormField>
            </div>
          </>
        )}

        {/* Withholding — the regulated part */}
        {spray && (
          <div className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: '#b45309' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#b45309' }}>
                Withholding period
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Days before harvest" hint="Read it off the label">
                <Input type="number" min="0" value={form.phiDays} onChange={set('phiDays')}
                  placeholder="e.g. 14" />
              </FormField>
              <FormField label="Re-entry (hours)" hint="Before workers may go back in">
                <Input type="number" min="0" value={form.reiHours} onChange={set('reiHours')}
                  placeholder="e.g. 24" />
              </FormField>
            </div>

            {preview && (
              <div className="text-sm font-semibold rounded-lg px-3 py-2.5"
                style={preview.clash
                  ? { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }
                  : { background: '#fff', color: '#b45309', border: '1px solid #fde68a' }}>
                {preview.clash ? (
                  <>
                    ⚠ This block cannot be harvested until {fmtDate(preview.until)} — that is{' '}
                    {preview.shortBy} day{preview.shortBy === 1 ? '' : 's'} after the harvest
                    currently planned for {fmtDate(planting.expectedHarvest)}. Move the harvest
                    date or pick a product with a shorter period.
                  </>
                ) : (
                  <>✓ Earliest harvest after this spray: {fmtDate(preview.until)}</>
                )}
              </div>
            )}
            <p className="text-xs" style={{ color: '#92400e' }}>
              isibaya does not know any product's withholding period and never guesses one —
              the label is the only authority. Harvesting early risks residues above the MRL.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Applied by">
            <Input value={form.operator} onChange={set('operator')} placeholder="e.g. S. Dlamini" />
          </FormField>
          <FormField label="Equipment">
            <Input value={form.equipment} onChange={set('equipment')} placeholder="e.g. Boom sprayer" />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Area treated (ha)">
            <Input type="number" step="0.01" min="0" value={form.areaHa} onChange={set('areaHa')}
              placeholder={planting?.areaHa ? String(planting.areaHa) : 'e.g. 2.5'} />
          </FormField>
          {spray ? (
            <FormField label="Wind (km/h)" hint="Drift risk">
              <Input type="number" step="0.1" min="0" value={form.windKph} onChange={set('windKph')}
                placeholder="e.g. 8" />
            </FormField>
          ) : (
            <FormField label="Water (L)">
              <Input type="number" step="1" min="0" value={form.waterVolumeL}
                onChange={set('waterVolumeL')} placeholder="e.g. 400" />
            </FormField>
          )}
          <FormField label="Cost (R)">
            <Input type="number" step="0.01" min="0" value={form.cost} onChange={set('cost')}
              placeholder="e.g. 1250" />
          </FormField>
        </div>

        {spray && Number(form.windKph) > 15 && (
          <div className="text-sm font-medium rounded-lg px-3 py-2.5"
            style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
            ⚠ {form.windKph} km/h is high for spraying — drift onto neighbouring blocks is likely.
          </div>
        )}

        <FormField label="Conditions" hint="Optional">
          <Input value={form.conditions} onChange={set('conditions')}
            placeholder="e.g. Overcast, 18 °C, light wind from the south" />
        </FormField>

        <FormField label="Notes">
          <Textarea rows={2} value={form.notes} onChange={set('notes')}
            placeholder="Anything worth remembering about this application…" />
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

function HarvestForm({ record, plantings, harvests, fieldOps, onSave, onMarkHarvested, onClose }) {
  const isNew = !record;
  const firstPlanting = plantings.find(p => p.status === 'Growing') || plantings[0];

  const [form, setForm] = useState(() => ({
    date: record?.date || today(),
    plantingCode: record?.plantingCode || firstPlanting?.code || '',
    lotCode: record?.lotCode || generateLotCode(harvests),
    quantity: record?.quantity ?? '',
    unit: record?.unit || unitForCrop(firstPlanting?.crop),
    grade: record?.grade || 'Ungraded',
    destination: record?.destination || 'Packhouse',
    pricePerUnit: record?.pricePerUnit ?? '',
    areaHa: record?.areaHa ?? '',
    operator: record?.operator || '',
    notes: record?.notes || '',
    withholdingOverride: record?.withholdingOverride ?? false,
  }));
  const [markHarvested, setMarkHarvested] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };

  const planting = plantings.find(p => p.code === form.plantingCode);

  /* Switching planting re-guesses the unit, since a crop's usual measure is
     part of the crop, not the farm. */
  const onPlanting = (e) => {
    const code = e.target.value;
    const next = plantings.find(p => p.code === code);
    setError('');
    setForm(p => ({ ...p, plantingCode: code, unit: unitForCrop(next?.crop) }));
  };

  /* The Phase 2 warning applied to a harvest that is actually happening. */
  const breach = useMemo(
    () => harvestBreach(form.plantingCode, form.date, fieldOps),
    [form.plantingCode, form.date, fieldOps]);

  const qty = parseFloat(form.quantity);
  const price = parseFloat(form.pricePerUnit);
  const income = Number.isFinite(qty) && Number.isFinite(price) ? qty * price : null;

  const perHa = (() => {
    const area = parseFloat(form.areaHa) || planting?.areaHa;
    return Number.isFinite(qty) && area ? qty / area : null;
  })();

  const handleSave = () => {
    if (!form.plantingCode) { setError('Choose the planting this came off'); return; }
    if (!form.date) { setError('A date is required'); return; }
    if (!Number.isFinite(qty) || qty <= 0) { setError('Record how much came off'); return; }
    if (breach && !form.withholdingOverride) {
      setError('This harvest falls inside a withholding period — confirm it above to continue');
      return;
    }

    const numOrNull = (v) => (v === '' || v === null ? null : parseFloat(v));

    onSave({
      ...record,
      ...form,
      quantity: qty,
      pricePerUnit: numOrNull(form.pricePerUnit),
      areaHa: numOrNull(form.areaHa),
      crop: planting?.crop || record?.crop || null,
      variety: planting?.variety || record?.variety || null,
      location: planting?.location || record?.location || null,
      // Only meaningful when there is actually a breach to acknowledge.
      withholdingOverride: !!breach && !!form.withholdingOverride,
    });

    if (markHarvested && planting) onMarkHarvested(planting);
    onClose();
  };

  return (
    <Modal open title={isNew ? 'Record Harvest' : `Edit — ${record.lotCode || record.crop}`} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save harvest</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date *">
            <Input type="date" value={form.date} onChange={set('date')} />
          </FormField>
          <FormField label="Lot code" hint="Follows the produce off the farm">
            <Input value={form.lotCode} onChange={set('lotCode')} />
          </FormField>
        </div>

        <FormField label="Planting *"
          hint={planting
            ? `${planting.crop}${planting.location ? ` · ${planting.location}` : ''}${planting.areaHa ? ` · ${planting.areaHa} ha` : ''}`
            : 'Add a planting first'}>
          <Select value={form.plantingCode} onChange={onPlanting}>
            {plantings.length === 0 && <option value="">No plantings yet</option>}
            {plantings.map(p => (
              <option key={p.id} value={p.code}>{p.code} — {p.crop}</option>
            ))}
          </Select>
        </FormField>

        {/* A harvest inside a withholding period is the failure Phase 2 exists
            to prevent. It is not blocked outright — the interval may have been
            typed wrong, or this may be going somewhere residues don't matter —
            but it has to be acknowledged, and the acknowledgement is stored. */}
        {breach && (
          <div className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div className="flex items-start gap-2">
              <TriangleAlert size={16} style={{ color: '#b91c1c' }} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm" style={{ color: '#991b1b' }}>
                <strong>This harvest is inside a withholding period.</strong>{' '}
                {breach.op?.product || breach.op?.activeIngredient || 'A spray'} on{' '}
                {fmtDate(breach.op?.date)} holds this block until {fmtDate(breach.until)} —{' '}
                {breach.shortBy} day{breach.shortBy === 1 ? '' : 's'} after the date above.
                Produce taken now may carry residues above the MRL.
              </div>
            </div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="mt-0.5"
                checked={!!form.withholdingOverride}
                onChange={(e) => { setError(''); setForm(p => ({ ...p, withholdingOverride: e.target.checked })); }} />
              <span className="text-sm font-semibold" style={{ color: '#991b1b' }}>
                I understand, and I'm recording this harvest anyway. This will be
                flagged on the record.
              </span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Quantity *">
            <Input type="number" step="0.01" min="0" value={form.quantity}
              onChange={set('quantity')} placeholder="e.g. 1250" />
          </FormField>
          <FormField label="Unit">
            <Select value={form.unit} onChange={set('unit')}>
              {HARVEST_UNITS.map(u => <option key={u}>{u}</option>)}
            </Select>
          </FormField>
          <FormField label="Area taken (ha)" hint="Blank = whole block">
            <Input type="number" step="0.01" min="0" value={form.areaHa}
              onChange={set('areaHa')} placeholder={planting?.areaHa ? String(planting.areaHa) : ''} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Grade">
            <Select value={form.grade} onChange={set('grade')}>
              {HARVEST_GRADES.map(g => <option key={g}>{g}</option>)}
            </Select>
          </FormField>
          <FormField label="Destination">
            <Select value={form.destination} onChange={set('destination')}>
              {HARVEST_DESTINATIONS.map(d => <option key={d}>{d}</option>)}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={`Price per ${form.unit} (R)`} hint="Optional">
            <Input type="number" step="0.01" min="0" value={form.pricePerUnit}
              onChange={set('pricePerUnit')} placeholder="e.g. 12.50" />
          </FormField>
          <FormField label="Harvested by">
            <Input value={form.operator} onChange={set('operator')} placeholder="e.g. Team 2" />
          </FormField>
        </div>

        {(income !== null || perHa !== null) && (
          <div className="flex flex-wrap gap-4 px-3.5 py-3 rounded-xl text-sm"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            {perHa !== null && (
              <div>
                <span className="text-slate-500">Yield</span>{' '}
                <strong style={{ color: '#15803d' }}>
                  {perHa.toFixed(2)} {form.unit}/ha
                </strong>
              </div>
            )}
            {income !== null && (
              <div>
                <span className="text-slate-500">Value</span>{' '}
                <strong style={{ color: '#15803d' }}>{rand(income)}</strong>
              </div>
            )}
          </div>
        )}

        {isNew && planting && planting.status === 'Growing' && !planting.perennial && (
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-600">
            <input type="checkbox" checked={markHarvested}
              onChange={(e) => setMarkHarvested(e.target.checked)} />
            Mark {planting.code} as harvested — it's an annual and this was the last pick
          </label>
        )}

        <FormField label="Notes">
          <Textarea rows={2} value={form.notes} onChange={set('notes')}
            placeholder="Quality, weather, anything the buyer asked about…" />
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
  const {
    plantings, zones, fieldOps, cropHarvests,
    addPlanting, updatePlanting, removePlanting,
    addFieldOp, updateFieldOp, removeFieldOp,
    addCropHarvest, updateCropHarvest, removeCropHarvest,
  } = useData();

  const [tab, setTab] = useState('plantings');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  /* "Now" is captured once on mount so the windows below don't shift on
     every render. */
  const [mountedAt] = useState(() => Date.now());

  const shown = useMemo(() => plantings.filter(p => {
    const inCat = category === 'All' || p.category === category;
    const q = !search || `${p.code} ${p.crop} ${p.variety || ''} ${p.location || ''}`
      .toLowerCase().includes(search.toLowerCase());
    return inCat && q;
  }), [plantings, category, search]);

  const shownOps = useMemo(() => fieldOps.filter(o => {
    if (!search) return true;
    const hay = `${o.plantingCode} ${o.type} ${o.crop || ''} ${o.product || ''} ` +
      `${o.activeIngredient || ''} ${o.target || ''} ${o.operator || ''}`;
    return hay.toLowerCase().includes(search.toLowerCase());
  }), [fieldOps, search]);

  /* Withholding state per planting — the one thing on this page that can cost
     a farmer a consignment if it goes unnoticed. */
  const withholding = useMemo(() => {
    const map = new Map();
    for (const p of plantings) {
      const s = withholdingStatus(p, fieldOps, mountedAt);
      if (s && (s.blocked || s.clash)) map.set(p.code, s);
    }
    return map;
  }, [plantings, fieldOps, mountedAt]);

  const clashes = [...withholding.entries()].filter(([, s]) => s.clash);
  const blocked = [...withholding.entries()].filter(([, s]) => s.blocked);

  const growing = plantings.filter(p => p.status === 'Growing');
  const totalHa = plantings
    .filter(p => ['Planned', 'Growing'].includes(p.status))
    .reduce((s, p) => s + (p.areaHa || 0), 0);

  const dueSoon = useMemo(() => plantings.filter(p => {
    if (p.status !== 'Growing' || !p.expectedHarvest) return false;
    const diff = new Date(p.expectedHarvest).getTime() - mountedAt;
    return diff >= 0 && diff <= 30 * 86400000;
  }).length, [plantings, mountedAt]);

  const countOf = (c) => c === 'All' ? plantings.length : plantings.filter(p => p.category === c).length;
  const plantingOf = (code) => plantings.find(p => p.code === code);

  const shownHarvests = useMemo(() => cropHarvests.filter(h => {
    if (!search) return true;
    const hay = `${h.plantingCode} ${h.crop || ''} ${h.lotCode || ''} ${h.grade || ''} ` +
      `${h.destination || ''} ${h.operator || ''}`;
    return hay.toLowerCase().includes(search.toLowerCase());
  }), [cropHarvests, search]);

  /* Season income only counts what was actually priced, so a farm that
     records tonnage without prices sees no number rather than a wrong one. */
  const season = useMemo(() => {
    const income = cropHarvests.reduce(
      (s, h) => s + ((h.pricePerUnit || 0) * (h.quantity || 0)), 0);
    const flagged = cropHarvests.filter(h => h.withholdingOverride).length;
    return { income, flagged };
  }, [cropHarvests]);

  const TABS = [
    { key: 'plantings', label: 'Plantings', count: plantings.length },
    { key: 'operations', label: 'Field operations', count: fieldOps.length },
    { key: 'harvests', label: 'Harvests', count: cropHarvests.length },
  ];

  const ADD_LABEL = {
    plantings: 'Add planting', operations: 'Record operation', harvests: 'Record harvest',
  };
  const ADD_MODAL = { plantings: 'add', operations: 'add-op', harvests: 'add-harvest' };

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Crops</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Plantings across your fields, orchards and tunnels
          </p>
        </div>
        <Btn onClick={() => setModal({ type: ADD_MODAL[tab] })}
          disabled={tab !== 'plantings' && plantings.length === 0}>
          <Plus size={16} /> {ADD_LABEL[tab]}
        </Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🌱" label="Plantings" value={plantings.length}
          sub={`${growing.length} growing`} color="green" />
        <StatCard icon="📐" label="Area planted" value={`${totalHa.toFixed(1)} ha`}
          sub="Planned and growing" color="blue" />
        {tab === 'harvests' && cropHarvests.length > 0 ? (
          <StatCard icon="💰" label="Season value"
            value={season.income > 0 ? rand(season.income) : '—'}
            sub={season.income > 0
              ? `${cropHarvests.length} harvest${cropHarvests.length === 1 ? '' : 's'}`
              : 'Add prices to see value'}
            color="green" />
        ) : (
          <StatCard icon="🗓️" label="Harvest due" value={dueSoon}
            sub="Within 30 days" color={dueSoon > 0 ? 'amber' : 'green'} />
        )}
        <StatCard icon="🚫" label="Under withholding" value={blocked.length}
          sub={clashes.length > 0 ? `${clashes.length} clash with harvest` : 'Cannot be harvested yet'}
          color={clashes.length > 0 ? 'red' : blocked.length > 0 ? 'amber' : 'green'} />
      </div>

      {/* A planned harvest inside a withholding period is a decision already
          made that will put residues over the limit unless the date moves. */}
      {clashes.length > 0 && (
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <TriangleAlert size={18} style={{ color: '#b91c1c' }} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm" style={{ color: '#b91c1c' }}>
              {clashes.length === 1 ? 'A planned harvest falls' : `${clashes.length} planned harvests fall`}
              {' '}inside a withholding period
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {clashes.map(([code, s]) => {
                const p = plantingOf(code);
                return (
                  <li key={code} className="text-sm" style={{ color: '#991b1b' }}>
                    <span className="font-mono font-bold">{code}</span>
                    {p ? ` (${p.crop})` : ''} — harvest set for {fmtDate(p?.expectedHarvest)},
                    but {s.op?.product || s.op?.activeIngredient || 'a spray'} on{' '}
                    {fmtDate(s.op?.date)} holds it until <strong>{fmtDate(s.until)}</strong>,{' '}
                    {s.shortBy} day{s.shortBy === 1 ? '' : 's'} later.
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* A harvest taken inside a withholding period stays visible rather than
          being buried in the row that records it. */}
      {season.flagged > 0 && (
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <TriangleAlert size={18} style={{ color: '#b45309' }} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm" style={{ color: '#92400e' }}>
            <strong>
              {season.flagged} harvest{season.flagged === 1 ? '' : 's'} recorded inside a
              withholding period
            </strong>
            <div className="mt-0.5">
              Flagged on the Harvests tab. Worth knowing before a buyer or an auditor asks —
              and worth checking the interval was not simply typed wrong.
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${
              tab === t.key ? 'text-white border-green-600' : 'bg-white border-slate-200 text-slate-600 hover:border-green-300'
            }`}
            style={tab === t.key ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : {}}>
            {t.label} <span className="opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {tab === 'plantings' && (
        <div className="flex gap-2 flex-wrap">
          {['All', ...CROP_CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                category === c ? 'border-green-500 text-green-700 bg-green-50' : 'bg-white border-slate-200 text-slate-500 hover:border-green-300'
              }`}>
              {c} <span className="opacity-60">({countOf(c)})</span>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>

        <div className="relative mb-5 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9"
            placeholder={{
              plantings:  'Search code, crop, variety or field…',
              operations: 'Search product, active, target or operator…',
              harvests:   'Search lot, crop, grade or destination…',
            }[tab]}
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {tab === 'plantings' ? (
          plantings.length === 0 ? (
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
                  {shown.map(p => {
                    const w = withholding.get(p.code);
                    return (
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
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          <span className={w?.clash ? 'font-bold' : 'text-slate-600'}
                            style={w?.clash ? { color: '#b91c1c' } : {}}>
                            {fmtDate(p.expectedHarvest)}
                          </span>
                          {w?.blocked && (
                            <div className="text-[11px] font-semibold mt-0.5"
                              style={{ color: w.clash ? '#b91c1c' : '#b45309' }}>
                              🚫 held until {fmtDate(w.until)}
                            </div>
                          )}
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : tab === 'operations' ? (
          fieldOps.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-2">🚜</div>
              <p className="text-sm font-medium">No field operations recorded</p>
              <p className="text-xs mt-1 max-w-md mx-auto">
                Sprays, fertiliser, irrigation and the rest. Spray records are what a packhouse
                or an auditor asks for, and they're what keeps a harvest out of a withholding period.
              </p>
              {plantings.length === 0 && (
                <p className="text-xs mt-2 text-slate-400">Add a planting first.</p>
              )}
            </div>
          ) : shownOps.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm font-medium">Nothing matches that search</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Date','Operation','Planting','Product','Target','Rate','Applied by','Withholding',''].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shownOps.map(o => {
                    const until = withholdingUntil(o);
                    const rei = reEntryUntil(o);
                    const stillHeld = until && until.getTime() > mountedAt;
                    return (
                      <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">{fmtDate(o.date)}</td>
                        <td className="px-3 py-3.5"><TypeChip type={o.type} /></td>
                        <td className="px-3 py-3.5">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
                            {o.plantingCode}
                          </span>
                          {o.crop && <div className="text-xs text-slate-400 mt-0.5">{o.crop}</div>}
                        </td>
                        <td className="px-3 py-3.5">
                          {o.product || o.activeIngredient
                            ? (
                              <>
                                <div className="font-semibold text-slate-800">{o.product || o.activeIngredient}</div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {o.product && o.activeIngredient ? o.activeIngredient : ''}
                                  {o.registrationNo ? `${o.product && o.activeIngredient ? ' · ' : ''}${o.registrationNo}` : ''}
                                </div>
                              </>
                            )
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3.5 text-slate-600">{o.target || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                          {o.dose || <span className="text-slate-300">—</span>}
                          {o.totalQuantity != null && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              {o.totalQuantity} {o.quantityUnit || ''} total
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-slate-600">{o.operator || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 whitespace-nowrap">
                          {isSpray(o) && until ? (
                            <>
                              <span className="text-[11px] font-bold px-2 py-1 rounded-lg"
                                style={stillHeld
                                  ? { background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }
                                  : { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                                {stillHeld ? `held to ${fmtDate(until)}` : `cleared ${fmtDate(until)}`}
                              </span>
                              {rei && (
                                <div className="text-[11px] text-slate-400 mt-1">
                                  re-entry from {fmtDate(rei)}
                                </div>
                              )}
                            </>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setModal({ type: 'edit-op', record: o })}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => removeFieldOp(o.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          cropHarvests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-2">🧺</div>
              <p className="text-sm font-medium">No harvests recorded</p>
              <p className="text-xs mt-1 max-w-md mx-auto">
                What actually came off each block, with a lot code that follows it to the buyer.
                Recording a harvest here checks it against any withholding period still running.
              </p>
              {plantings.length === 0 && (
                <p className="text-xs mt-2 text-slate-400">Add a planting first.</p>
              )}
            </div>
          ) : shownHarvests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm font-medium">Nothing matches that search</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Date','Lot','Planting','Quantity','Yield','Grade','Destination','Value',''].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shownHarvests.map(h => {
                    const p = plantingOf(h.plantingCode);
                    const area = h.areaHa || p?.areaHa;
                    const perHa = area ? (h.quantity || 0) / area : null;
                    const value = h.pricePerUnit ? (h.quantity || 0) * h.pricePerUnit : null;
                    return (
                      <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                          {fmtDate(h.date)}
                          {h.withholdingOverride && (
                            <div className="text-[11px] font-bold mt-0.5" style={{ color: '#b45309' }}>
                              ⚠ inside withholding
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          {h.lotCode
                            ? <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">{h.lotCode}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="text-xs font-mono font-bold text-slate-500">{h.plantingCode}</span>
                          {h.crop && (
                            <div className="font-semibold text-slate-800 mt-0.5">
                              {CROP_META[h.crop]?.emoji || '🌱'} {h.crop}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-slate-800 font-semibold whitespace-nowrap">
                          {h.quantity} {h.unit || 'kg'}
                        </td>
                        <td className="px-3 py-3.5 text-slate-600 whitespace-nowrap">
                          {perHa !== null
                            ? `${perHa.toFixed(2)} ${h.unit || 'kg'}/ha`
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3.5 text-slate-600">{h.grade || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 text-slate-600">{h.destination || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 text-slate-700 font-semibold whitespace-nowrap">
                          {value !== null ? rand(value) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setModal({ type: 'edit-harvest', record: h })}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => removeCropHarvest(h.id)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {modal?.type === 'add' && (
        <PlantingForm existing={plantings} zones={zones} onSave={addPlanting} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <PlantingForm planting={modal.record} existing={plantings} zones={zones}
          onSave={updatePlanting} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'add-op' && (
        <FieldOpForm plantings={plantings} onSave={addFieldOp} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit-op' && (
        <FieldOpForm record={modal.record} plantings={plantings}
          onSave={updateFieldOp} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'add-harvest' && (
        <HarvestForm plantings={plantings} harvests={cropHarvests} fieldOps={fieldOps}
          onSave={addCropHarvest}
          onMarkHarvested={(p) => updatePlanting({ ...p, status: 'Harvested' })}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit-harvest' && (
        <HarvestForm record={modal.record} plantings={plantings} harvests={cropHarvests}
          fieldOps={fieldOps} onSave={updateCropHarvest}
          onMarkHarvested={(p) => updatePlanting({ ...p, status: 'Harvested' })}
          onClose={() => setModal(null)} />
      )}
    </div>
  );
}
