import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, Wrench, Ticket,
  AlertTriangle, CheckCircle, Clock, X, ChevronDown,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  EQUIPMENT_TYPES, EQUIPMENT_STATUSES,
  TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES,
} from '../data/equipment';
import { Modal } from '../components/Modal';
import { FormField, Input, Select, Textarea, Btn } from '../components/FormField';
import { StatCard } from '../components/StatCard';
import clsx from 'clsx';

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_THEME = {
  Active:      { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  Maintenance: { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  Retired:     { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
};

const PRIORITY_THEME = {
  Low:      { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
  Medium:   { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  High:     { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  Critical: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
};

const TICKET_STATUS_THEME = {
  Open:        { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  'In Progress': { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  Resolved:    { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  Closed:      { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
};

function Pill({ theme, dot = true, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: theme.bg, color: theme.text }}>
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme.dot }} />}
      {children}
    </span>
  );
}

const card = {
  background: '#ffffff',
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)',
};

// ── Equipment Form ────────────────────────────────────────────────────────────

function EquipmentForm({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    name:         item?.name         || '',
    type:         item?.type         || EQUIPMENT_TYPES[0],
    serial:       item?.serial       || '',
    location:     item?.location     || '',
    status:       item?.status       || 'Active',
    purchaseDate: item?.purchaseDate || '',
    lastService:  item?.lastService  || '',
    notes:        item?.notes        || '',
  });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.name.trim()) return alert('Name is required');
    onSave({ ...item, ...form });
    onClose();
  };

  return (
    <Modal open title={item ? `Edit — ${item.name}` : 'Add Equipment'} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>Save</Btn></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Equipment name *">
            <Input placeholder="e.g. John Deere 5075E" value={form.name} onChange={set('name')} />
          </FormField>
          <FormField label="Type *">
            <Select value={form.type} onChange={set('type')}>
              {EQUIPMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Serial / Asset number">
            <Input placeholder="e.g. JD5075E-2021-001" value={form.serial} onChange={set('serial')} />
          </FormField>
          <FormField label="Location">
            <Input placeholder="e.g. Main Barn" value={form.location} onChange={set('location')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Status">
            <Select value={form.status} onChange={set('status')}>
              {EQUIPMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Purchase date">
            <Input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
          </FormField>
          <FormField label="Last serviced">
            <Input type="date" value={form.lastService} onChange={set('lastService')} />
          </FormField>
        </div>
        <FormField label="Notes">
          <Textarea rows={2} placeholder="Optional notes…" value={form.notes} onChange={set('notes')} />
        </FormField>
      </div>
    </Modal>
  );
}

// ── Ticket Form ───────────────────────────────────────────────────────────────

function TicketForm({ ticket, equipment, onSave, onClose }) {
  const categoryKeys = Object.keys(TICKET_CATEGORIES);
  const [form, setForm] = useState({
    title:       ticket?.title       || '',
    description: ticket?.description || '',
    priority:    ticket?.priority    || 'Medium',
    status:      ticket?.status      || 'Open',
    category:    ticket?.category    || categoryKeys[0],
    subCategory: ticket?.subCategory || '',
    assignedTo:  ticket?.assignedTo  || '',
  });
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  // Build subcategory list — Equipment category uses actual equipment names
  const subOptions = useMemo(() => {
    if (form.category === 'Equipment') {
      return equipment.map(e => e.name);
    }
    return TICKET_CATEGORIES[form.category]?.sub || [];
  }, [form.category, equipment]);

  const handleCategoryChange = (e) => {
    setForm(p => ({ ...p, category: e.target.value, subCategory: '' }));
  };

  const handleSave = () => {
    if (!form.title.trim())      return alert('Title is required');
    if (!form.category)          return alert('Category is required');
    if (!form.subCategory)       return alert('Sub-category is required');
    onSave({ ...ticket, ...form });
    onClose();
  };

  return (
    <Modal open title={ticket ? 'Edit Ticket' : 'Create Ticket'} onClose={onClose}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave}>{ticket ? 'Save changes' : 'Create ticket'}</Btn></>}>
      <div className="flex flex-col gap-4">
        <FormField label="Title *">
          <Input placeholder="Brief description of the issue" value={form.title} onChange={set('title')} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          {/* Category — links to existing farm sections */}
          <FormField label="Category *">
            <Select value={form.category} onChange={handleCategoryChange}>
              {categoryKeys.map(c => (
                <option key={c} value={c}>{TICKET_CATEGORIES[c].icon} {c}</option>
              ))}
            </Select>
          </FormField>
          {/* Sub-category — auto-populated from farm data */}
          <FormField label="Sub-category *">
            <Select value={form.subCategory} onChange={set('subCategory')}>
              <option value="">Select sub-category…</option>
              {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Priority">
            <Select value={form.priority} onChange={set('priority')}>
              {TICKET_PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={set('status')}>
              {TICKET_STATUSES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Assigned to">
            <Input placeholder="Name or team" value={form.assignedTo} onChange={set('assignedTo')} />
          </FormField>
        </div>

        <FormField label="Description">
          <Textarea rows={3} placeholder="Detailed description of the issue, steps to reproduce, etc." value={form.description} onChange={set('description')} />
        </FormField>

        {/* Category link preview */}
        {form.category && form.subCategory && (
          <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-base">{TICKET_CATEGORIES[form.category]?.icon}</span>
            <span>Linked to</span>
            <span className="font-bold text-slate-700">{form.category}</span>
            <span className="text-slate-400">›</span>
            <span className="font-bold text-slate-700">{form.subCategory}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Ticket Card ───────────────────────────────────────────────────────────────

function TicketCard({ ticket, onEdit, onDelete, onStatusChange }) {
  const pTh = PRIORITY_THEME[ticket.priority]  || PRIORITY_THEME.Medium;
  const sTh = TICKET_STATUS_THEME[ticket.status] || TICKET_STATUS_THEME.Open;
  const catMeta = TICKET_CATEGORIES[ticket.category];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-slate-200 transition-all"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04)' }}>

      {/* Top row */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
          style={{ background: pTh.bg }}>
          {catMeta?.icon || '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-slate-800 leading-snug">{ticket.title}</div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
            <span className="font-semibold text-slate-600">{ticket.category}</span>
            <span>›</span>
            <span>{ticket.subCategory}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(ticket)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(ticket.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{ticket.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Pill theme={pTh}>{ticket.priority}</Pill>
          <Pill theme={sTh}>{ticket.status}</Pill>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {ticket.assignedTo && (
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                {ticket.assignedTo.charAt(0)}
              </span>
              {ticket.assignedTo}
            </span>
          )}
          <span>{ticket.createdAt}</span>
        </div>
      </div>

      {/* Quick status change */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-1.5 flex-wrap">
        {TICKET_STATUSES.filter(s => s !== ticket.status).map(s => (
          <button key={s} onClick={() => onStatusChange(ticket.id, s)}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-700 transition-all">
            → {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Equipment() {
  const { equipment, addEquipment, updateEquipment, removeEquipment,
          tickets,   addTicket,    updateTicket,    removeTicket } = useData();

  const [tab, setTab] = useState('equipment'); // 'equipment' | 'tickets'

  // Equipment state
  const [eqSearch,  setEqSearch]  = useState('');
  const [eqTypeF,   setEqTypeF]   = useState('');
  const [eqStatusF, setEqStatusF] = useState('');
  const [eqModal,   setEqModal]   = useState(null);

  // Ticket state
  const [tkSearch,   setTkSearch]   = useState('');
  const [tkCatF,     setTkCatF]     = useState('');
  const [tkPriF,     setTkPriF]     = useState('');
  const [tkStatusF,  setTkStatusF]  = useState('');
  const [tkModal,    setTkModal]    = useState(null);

  // Filtered equipment
  const filteredEq = useMemo(() => equipment.filter(e => {
    const q  = !eqSearch  || `${e.name} ${e.type} ${e.serial} ${e.location}`.toLowerCase().includes(eqSearch.toLowerCase());
    const ty = !eqTypeF   || e.type   === eqTypeF;
    const st = !eqStatusF || e.status === eqStatusF;
    return q && ty && st;
  }), [equipment, eqSearch, eqTypeF, eqStatusF]);

  // Filtered tickets
  const filteredTk = useMemo(() => tickets.filter(t => {
    const q  = !tkSearch   || `${t.title} ${t.description} ${t.assignedTo}`.toLowerCase().includes(tkSearch.toLowerCase());
    const ca = !tkCatF     || t.category === tkCatF;
    const pr = !tkPriF     || t.priority === tkPriF;
    const st = !tkStatusF  || t.status   === tkStatusF;
    return q && ca && pr && st;
  }), [tickets, tkSearch, tkCatF, tkPriF, tkStatusF]);

  // Ticket stats
  const tkOpen       = tickets.filter(t => t.status === 'Open').length;
  const tkInProgress = tickets.filter(t => t.status === 'In Progress').length;
  const tkResolved   = tickets.filter(t => t.status === 'Resolved').length;
  const tkCritical   = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed' && t.status !== 'Resolved').length;

  const handleTicketStatus = (id, newStatus) => {
    const t = tickets.find(x => x.id === id);
    if (t) updateTicket({ ...t, status: newStatus });
  };

  const TABS = [
    { key: 'equipment', label: 'Equipment', Icon: Wrench },
    { key: 'tickets',   label: 'Tickets',   Icon: Ticket, badge: tkOpen + tkInProgress },
  ];

  return (
    <div className="flex flex-col gap-5 fade-in">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Equipment &amp; Tickets</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage farm equipment and raise maintenance tickets</p>
        </div>
        <Btn onClick={() => tab === 'equipment' ? setEqModal({ type: 'add' }) : setTkModal({ type: 'add' })}>
          <Plus size={16} />
          {tab === 'equipment' ? 'Add equipment' : 'New ticket'}
        </Btn>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 gap-1">
        {TABS.map(({ key, label, Icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            )}>
            <Icon size={15} />
            {label}
            {badge > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: '#fee2e2', color: '#b91c1c' }}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── EQUIPMENT TAB ── */}
      {tab === 'equipment' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="🔧" label="Total equipment" value={equipment.length} color="blue" />
            <StatCard icon="✅" label="Active" value={equipment.filter(e => e.status === 'Active').length} color="green" />
            <StatCard icon="🛠️" label="Under maintenance" value={equipment.filter(e => e.status === 'Maintenance').length} color="amber" />
            <StatCard icon="📦" label="Retired" value={equipment.filter(e => e.status === 'Retired').length} color="purple" />
          </div>

          {/* Filters */}
          <div style={{ ...card, padding: 20 }}>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/15 bg-white placeholder:text-slate-400 transition-all"
                  placeholder="Search name, serial, location…"
                  value={eqSearch} onChange={e => setEqSearch(e.target.value)}
                />
              </div>
              <select
                className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-green-500 transition-all"
                value={eqTypeF} onChange={e => setEqTypeF(e.target.value)}>
                <option value="">All types</option>
                {EQUIPMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select
                className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-green-500 transition-all"
                value={eqStatusF} onChange={e => setEqStatusF(e.target.value)}>
                <option value="">All statuses</option>
                {EQUIPMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Equipment table */}
            {filteredEq.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="text-5xl mb-3">🔧</div>
                <p className="text-sm font-medium">No equipment found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Name','Type','Serial / Asset','Location','Status','Last Service','Notes','Actions'].map(h => (
                        <th key={h} className="text-left px-3 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEq.map(e => (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3.5 font-bold text-slate-800">{e.name}</td>
                        <td className="px-3 py-3.5">
                          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-lg">{e.type}</span>
                        </td>
                        <td className="px-3 py-3.5 text-slate-500 font-mono text-xs">{e.serial || '—'}</td>
                        <td className="px-3 py-3.5">
                          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-md">{e.location || '—'}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          <Pill theme={STATUS_THEME[e.status] || STATUS_THEME.Active}>{e.status}</Pill>
                        </td>
                        <td className="px-3 py-3.5 text-slate-500">{e.lastService || '—'}</td>
                        <td className="px-3 py-3.5 text-slate-400 max-w-[200px] truncate text-xs">{e.notes || '—'}</td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEqModal({ type: 'edit', item: e })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setEqModal({ type: 'delete', item: e })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-400 mt-3 px-1">Showing {filteredEq.length} of {equipment.length} items</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TICKETS TAB ── */}
      {tab === 'tickets' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="🎫" label="Open" value={tkOpen} color="red" />
            <StatCard icon="🔄" label="In Progress" value={tkInProgress} color="amber" />
            <StatCard icon="✅" label="Resolved" value={tkResolved} color="green" />
            <StatCard icon="🚨" label="Critical open" value={tkCritical} color={tkCritical > 0 ? 'red' : 'green'} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/15 bg-white placeholder:text-slate-400 transition-all"
                placeholder="Search title, description, assignee…"
                value={tkSearch} onChange={e => setTkSearch(e.target.value)}
              />
            </div>
            <select
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-green-500 transition-all"
              value={tkCatF} onChange={e => setTkCatF(e.target.value)}>
              <option value="">All categories</option>
              {Object.keys(TICKET_CATEGORIES).map(c => (
                <option key={c} value={c}>{TICKET_CATEGORIES[c].icon} {c}</option>
              ))}
            </select>
            <select
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-green-500 transition-all"
              value={tkPriF} onChange={e => setTkPriF(e.target.value)}>
              <option value="">All priorities</option>
              {TICKET_PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select
              className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 bg-white outline-none focus:border-green-500 transition-all"
              value={tkStatusF} onChange={e => setTkStatusF(e.target.value)}>
              <option value="">All statuses</option>
              {TICKET_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Ticket grid */}
          {filteredTk.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-3">🎫</div>
              <p className="text-sm font-medium">No tickets match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTk.map(t => (
                <TicketCard
                  key={t.id}
                  ticket={t}
                  onEdit={(tk) => setTkModal({ type: 'edit', ticket: tk })}
                  onDelete={(id) => removeTicket(id)}
                  onStatusChange={handleTicketStatus}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Equipment Modals ── */}
      {eqModal?.type === 'add' && (
        <EquipmentForm onSave={addEquipment} onClose={() => setEqModal(null)} />
      )}
      {eqModal?.type === 'edit' && (
        <EquipmentForm item={eqModal.item} onSave={updateEquipment} onClose={() => setEqModal(null)} />
      )}
      {eqModal?.type === 'delete' && (
        <Modal open title="Remove equipment" onClose={() => setEqModal(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setEqModal(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => { removeEquipment(eqModal.item.id); setEqModal(null); }}>Remove</Btn>
          </>}>
          <p className="text-sm text-slate-600">
            Remove <strong>{eqModal.item.name}</strong> from your equipment list? This action cannot be undone.
          </p>
        </Modal>
      )}

      {/* ── Ticket Modals ── */}
      {tkModal?.type === 'add' && (
        <TicketForm equipment={equipment} onSave={addTicket} onClose={() => setTkModal(null)} />
      )}
      {tkModal?.type === 'edit' && (
        <TicketForm ticket={tkModal.ticket} equipment={equipment} onSave={updateTicket} onClose={() => setTkModal(null)} />
      )}
    </div>
  );
}
