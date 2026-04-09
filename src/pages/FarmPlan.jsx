import { useState } from 'react';
import { Plus, Pencil, Trash2, LocateFixed, Building2, MapPin } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BoundaryEditor } from '../components/BoundaryEditor';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Btn } from '../components/FormField';

/* ── Constants ──────────────────────────────────────────────────────── */

const ZONE_TYPES = ['Paddock', 'Barn', 'Field', 'Pen', 'Stable', 'Hen House', 'Silo', 'Pond', 'Orchard', 'Quarantine', 'Yard', 'Other'];

const ZONE_COLORS = [
  { label: 'Green',   bg: '#dcfce7', border: '#4ade80' },
  { label: 'Blue',    bg: '#dbeafe', border: '#60a5fa' },
  { label: 'Yellow',  bg: '#fef9c3', border: '#fde047' },
  { label: 'Purple',  bg: '#f3e8ff', border: '#d8b4fe' },
  { label: 'Orange',  bg: '#ffedd5', border: '#fdba74' },
  { label: 'Pink',    bg: '#fce7f3', border: '#f9a8d4' },
  { label: 'Teal',    bg: '#ccfbf1', border: '#5eead4' },
  { label: 'Red',     bg: '#fee2e2', border: '#fca5a5' },
  { label: 'Stone',   bg: '#f5f5f4', border: '#d6d3d1' },
];

const COUNTRIES = ['South Africa', 'United States', 'United Kingdom', 'Australia', 'New Zealand', 'Canada', 'Kenya', 'Nigeria', 'Zimbabwe', 'Zambia', 'Other'];
const AREA_UNITS = ['ha', 'acres', 'km²', 'm²'];

/* ── Zone Form Modal ────────────────────────────────────────────────── */

function ZoneModal({ zone, onSave, onClose }) {
  const [form, setForm] = useState({
    name: zone?.name || '',
    type: zone?.type || 'Paddock',
    colorIndex: zone ? ZONE_COLORS.findIndex(c => c.bg === zone.color) || 0 : 0,
  });
  const [error, setError] = useState('');
  const set = (k) => (e) => { setError(''); setForm(p => ({ ...p, [k]: e.target.value })); };

  const handleSave = () => {
    if (!form.name.trim()) { setError('Zone name is required'); return; }
    const color = ZONE_COLORS[parseInt(form.colorIndex)] || ZONE_COLORS[0];
    onSave({ ...zone, name: form.name.trim(), type: form.type, color: color.bg, border: color.border });
    onClose();
  };

  return (
    <Modal open title={zone ? 'Edit Zone' : 'Add Zone / Location'} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save zone</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Zone name *">
            <Input placeholder="e.g. Paddock A" value={form.name} onChange={set('name')} autoFocus />
          </FormField>
          <FormField label="Type">
            <Select value={form.type} onChange={set('type')}>
              {ZONE_TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>
        </div>
        <FormField label="Colour">
          <div className="flex flex-wrap gap-2 mt-1">
            {ZONE_COLORS.map((c, i) => (
              <button key={i} type="button"
                onClick={() => { setError(''); setForm(p => ({ ...p, colorIndex: i })); }}
                className="w-8 h-8 rounded-lg border-2 transition-all"
                style={{
                  background: c.bg,
                  borderColor: parseInt(form.colorIndex) === i ? c.border : 'transparent',
                  boxShadow: parseInt(form.colorIndex) === i ? `0 0 0 2px ${c.border}` : 'none',
                }}
                title={c.label}
              />
            ))}
          </div>
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

/* ── Section Card ───────────────────────────────────────────────────── */

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white rounded-2xl p-6"
      style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0' }}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function FarmPlan() {
  const { farmProfile, setFarmProfile, farmBoundary, setFarmBoundary, zones, addZone, updateZone, removeZone } = useData();
  const { user } = useAuth();

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(farmProfile);
  const [showBoundaryEditor, setShowBoundaryEditor] = useState(false);
  const [zoneModal, setZoneModal] = useState(null);

  const handleSaveProfile = () => {
    setFarmProfile(profileForm);
    // If profile lat/lng are set and boundary is still at the factory default, sync the boundary centre
    const lat = parseFloat(profileForm.lat);
    const lng = parseFloat(profileForm.lng);
    const isDefaultCenter = farmBoundary.lat === -33.7300 && farmBoundary.lng === 19.0100;
    if (!isNaN(lat) && !isNaN(lng) && farmBoundary.type !== 'polygon' && isDefaultCenter) {
      setFarmBoundary({ ...farmBoundary, lat, lng });
    }
    setEditingProfile(false);
  };

  const setP = (k) => (e) => setProfileForm(p => ({ ...p, [k]: e.target.value }));

  const displayName = farmProfile.name || user?.farm || 'My Farm';

  return (
    <>
    <div className="flex flex-col gap-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Farm Plan</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Configure your farm profile, boundary, and zones
          </p>
        </div>
      </div>

      {/* Farm Profile */}
      <SectionCard icon="🏡" title="Farm Profile" subtitle="Basic details about your farm">
        {!editingProfile ? (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Farm Name',  value: displayName },
                { label: 'Address',    value: farmProfile.address || '—' },
                { label: 'Country',    value: farmProfile.country || '—' },
                { label: 'Total Area', value: farmProfile.area ? `${farmProfile.area} ${farmProfile.areaUnit}` : '—' },
                { label: 'Latitude',   value: farmProfile.lat  || '—', mono: true },
                { label: 'Longitude',  value: farmProfile.lng  || '—', mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                  <div className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</div>
                </div>
              ))}
            </div>
            <Btn variant="secondary" size="sm" onClick={() => { setProfileForm(farmProfile); setEditingProfile(true); }}>
              <Pencil size={13} /> Edit profile
            </Btn>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Farm name">
                <Input placeholder="e.g. Green Meadows Farm" value={profileForm.name} onChange={setP('name')} />
              </FormField>
              <FormField label="Country">
                <Select value={profileForm.country} onChange={setP('country')}>
                  <option value="">Select country…</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </Select>
              </FormField>
            </div>
            <FormField label="Address">
              <Input placeholder="Street address, town, region" value={profileForm.address} onChange={setP('address')} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Total area">
                <Input type="number" step="0.1" min="0" placeholder="0" value={profileForm.area} onChange={setP('area')} />
              </FormField>
              <FormField label="Unit">
                <Select value={profileForm.areaUnit} onChange={setP('areaUnit')}>
                  {AREA_UNITS.map(u => <option key={u}>{u}</option>)}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude" hint="Decimal degrees — e.g. -33.7300">
                <Input type="number" step="0.000001" placeholder="e.g. -33.7300"
                  value={profileForm.lat} onChange={setP('lat')} />
              </FormField>
              <FormField label="Longitude" hint="Decimal degrees — e.g. 19.0100">
                <Input type="number" step="0.000001" placeholder="e.g. 19.0100"
                  value={profileForm.lng} onChange={setP('lng')} />
              </FormField>
            </div>
            <div className="flex gap-2">
              <Btn onClick={handleSaveProfile}>Save</Btn>
              <Btn variant="secondary" onClick={() => setEditingProfile(false)}>Cancel</Btn>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Farm Boundary */}
      <SectionCard icon="📍" title="Farm Boundary" subtitle="GPS geofence used in Animal Tracking to detect animals outside your farm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {farmBoundary.type === 'polygon' ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Shape</div>
                <div className="text-sm font-semibold text-slate-800">Custom Polygon</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vertices</div>
                <div className="text-sm font-semibold text-slate-800">{farmBoundary.points?.length ?? 0} points</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Centre Latitude</div>
                <div className="text-sm font-mono font-semibold text-slate-800">{(farmBoundary.lat ?? 0).toFixed(6)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Centre Longitude</div>
                <div className="text-sm font-mono font-semibold text-slate-800">{(farmBoundary.lng ?? 0).toFixed(6)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Radius</div>
                <div className="text-sm font-semibold text-slate-800">
                  {(farmBoundary.radius ?? 0) >= 1000
                    ? `${((farmBoundary.radius ?? 0) / 1000).toFixed(2)} km`
                    : `${farmBoundary.radius ?? 0} m`}
                </div>
              </div>
            </div>
          )}
          <Btn onClick={() => setShowBoundaryEditor(true)}>
            <LocateFixed size={15} /> Edit Boundary
          </Btn>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Animals with GPS trackers outside this boundary will be flagged as escaped in Animal Tracking.
        </p>
      </SectionCard>

      {/* Zones */}
      <SectionCard icon="🗺️" title="Zones & Locations"
        subtitle="Define the areas on your farm — used in livestock records, sensor placement, and animal tracking">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {zones.length === 0 ? 'No zones defined yet.' : `${zones.length} zone${zones.length !== 1 ? 's' : ''} defined`}
          </p>
          <Btn size="sm" onClick={() => setZoneModal({ type: 'add' })}>
            <Plus size={14} /> Add zone
          </Btn>
        </div>

        {zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-2xl"
            style={{ background: '#f8fafc', border: '1px dashed #e2e8f0' }}>
            <div className="text-4xl">🗺️</div>
            <p className="text-sm text-slate-500 font-medium">Add zones like Paddock A, Barn 1, Field B…</p>
            <p className="text-xs text-slate-400">These will appear as location options when adding animals and sensors</p>
            <Btn size="sm" onClick={() => setZoneModal({ type: 'add' })}>
              <Plus size={14} /> Add your first zone
            </Btn>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Zone', 'Type', 'Colour', ''].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map(z => (
                  <tr key={z.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ background: z.color, border: `1px solid ${z.border}` }} />
                        {z.name}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-600 bg-slate-100">{z.type}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-6 h-6 rounded-lg border"
                        style={{ background: z.color, borderColor: z.border }} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setZoneModal({ type: 'edit', zone: z })}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => removeZone(z.id)}
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
      </SectionCard>

    </div>

    {showBoundaryEditor && (
      <BoundaryEditor
        current={farmBoundary}
        defaultCenter={
          parseFloat(farmProfile.lat) && parseFloat(farmProfile.lng)
            ? { lat: parseFloat(farmProfile.lat), lng: parseFloat(farmProfile.lng) }
            : null
        }
        onSave={setFarmBoundary}
        onClose={() => setShowBoundaryEditor(false)}
      />
    )}

    {zoneModal?.type === 'add' && (
      <ZoneModal onSave={addZone} onClose={() => setZoneModal(null)} />
    )}
    {zoneModal?.type === 'edit' && (
      <ZoneModal zone={zoneModal.zone} onSave={updateZone} onClose={() => setZoneModal(null)} />
    )}
    </>
  );
}
