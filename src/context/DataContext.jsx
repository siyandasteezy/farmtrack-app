import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext(null);
const ENDPOINT = '/.netlify/functions/data';

/**
 * Farm data, held on the server and scoped to the signed-in account.
 *
 * Every mutation goes to the database first and only then updates local state,
 * so what is on screen is what was actually saved. The function signatures are
 * unchanged from the localStorage version, so pages call them exactly as before.
 */

const EMPTY = {
  livestock: [], health: [], inspections: [], harvests: [], colonyEvents: [],
  sensors: [], manualReadings: [], feed: [], equipment: [], tickets: [],
  devices: [], zones: [], plantings: [],
  farmProfile: { name: '', address: '', country: '', area: '', areaUnit: 'ha', lat: '', lng: '' },
  farmBoundary: { type: 'circle', lat: -33.7300, lng: 19.0100, radius: 450 },
};

async function call(body) {
  const res = await fetch(ENDPOINT, {
    method: body ? 'POST' : 'GET',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Could not reach the server.');
  return data;
}

export function DataProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const data = await call(null);
      setState({ ...EMPTY, ...data });
      setError('');
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, []);

  useEffect(() => {
    // No mounted-ref guard: StrictMode remounts would leave it stuck false and
    // the app would never leave its loading state. React 18+ tolerates a state
    // update after unmount, so the guard bought nothing.
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  /* ── generic helpers ──────────────────────────────────────────── */

  const put = useCallback(async (collection, record, { prepend = false } = {}) => {
    try {
      const { record: saved } = await call({ collection, op: 'create', record });
      setState(s => ({ ...s, [collection]: prepend ? [saved, ...s[collection]] : [...s[collection], saved] }));
      setError('');
      return saved;
    } catch (e) { setError(e.message); return null; }
  }, []);

  const patch = useCallback(async (collection, id, record) => {
    try {
      const { record: saved } = await call({ collection, op: 'update', id, record });
      setState(s => ({ ...s, [collection]: s[collection].map(x => (x.id === id ? saved : x)) }));
      setError('');
      return saved;
    } catch (e) { setError(e.message); return null; }
  }, []);

  const drop = useCallback(async (collection, id) => {
    try {
      await call({ collection, op: 'delete', id });
      setState(s => ({ ...s, [collection]: s[collection].filter(x => x.id !== id) }));
      setError('');
      return true;
    } catch (e) { setError(e.message); return false; }
  }, []);

  const saveSingleton = useCallback(async (collection, record) => {
    // Show it straight away — this is a form the user just submitted — then
    // reconcile with whatever the server stored.
    setState(s => ({ ...s, [collection]: record }));
    try {
      const { record: saved } = await call({ collection, record });
      setState(s => ({ ...s, [collection]: saved }));
      setError('');
    } catch (e) { setError(e.message); }
  }, []);

  /* ── Livestock ── */
  const addAnimal    = (a)  => put('livestock', a);
  const updateAnimal = (a)  => patch('livestock', a.id, a);
  const removeAnimal = (id) => drop('livestock', id);

  /* ── Health ── */
  const addHealth    = (h)  => put('health', h, { prepend: true });
  const updateHealth = (h)  => patch('health', h.id, h);
  const removeHealth = (id) => drop('health', id);

  /* ── Apiary ── */
  const addInspection    = (i)  => put('inspections', i, { prepend: true });
  const updateInspection = (i)  => patch('inspections', i.id, i);
  const removeInspection = (id) => drop('inspections', id);

  const addHarvest    = (h)  => put('harvests', h, { prepend: true });
  const updateHarvest = (h)  => patch('harvests', h.id, h);
  const removeHarvest = (id) => drop('harvests', id);

  const addColonyEvent    = (e)  => put('colonyEvents', e, { prepend: true });
  const updateColonyEvent = (e)  => patch('colonyEvents', e.id, e);
  const removeColonyEvent = (id) => drop('colonyEvents', id);

  /* ── Sensors ── */
  const addSensor = (s) => put('sensors', { ...s, initialValue: s.value, isManual: false, isCustom: true });
  const updateSensor = (s) => patch('sensors', s.id, s);

  const removeSensor = async (id) => {
    const ok = await drop('sensors', id);
    // The database cascades the readings; mirror that locally.
    if (ok) setState(s => ({ ...s, manualReadings: s.manualReadings.filter(r => r.sensorId !== id) }));
  };

  const statusFor = (value, sensor) =>
    value < (sensor?.min ?? 0) ? 'alert' : value > (sensor?.max ?? 9999) ? 'warn' : 'normal';

  const addManualReading = async (reading) => {
    const sensor = state.sensors.find(s => s.id === reading.sensorId);
    const numVal = parseFloat(reading.value);
    const loggedAt = new Date().toISOString();

    const saved = await put('manualReadings', {
      sensorId: reading.sensorId,
      sensorName: sensor?.name || '',
      location: sensor?.location || '',
      unit: sensor?.unit || '',
      value: numVal,
      status: statusFor(numVal, sensor),
      reason: reading.reason,
      notes: reading.notes || '',
      loggedAt,
    }, { prepend: true });

    // A manual reading overrides the sensor's current value until cleared.
    if (saved && sensor) {
      await patch('sensors', sensor.id, {
        ...sensor, value: numVal, status: statusFor(numVal, sensor),
        isManual: true, lastManualAt: loggedAt,
      });
    }
  };

  const removeManualReading = async (id) => {
    const mr = state.manualReadings.find(r => r.id === id);
    const ok = await drop('manualReadings', id);
    if (!ok || !mr) return;

    const sensor = state.sensors.find(s => s.id === mr.sensorId);
    if (!sensor) return;

    // Fall back to the next most recent reading, or the sensor's original value.
    const remaining = state.manualReadings.filter(r => r.id !== id && r.sensorId === mr.sensorId);
    if (remaining.length > 0) {
      const v = remaining[0].value;
      await patch('sensors', sensor.id, { ...sensor, value: v, status: statusFor(v, sensor) });
    } else {
      const v = sensor.initialValue ?? sensor.value;
      await patch('sensors', sensor.id, {
        ...sensor, value: v, status: statusFor(v, sensor), isManual: false, lastManualAt: null,
      });
    }
  };

  const clearManualOverride = async (sensorId) => {
    const sensor = state.sensors.find(s => s.id === sensorId);
    if (!sensor) return;
    const v = sensor.initialValue ?? sensor.value;
    await patch('sensors', sensorId, {
      ...sensor, value: v, status: statusFor(v, sensor), isManual: false, lastManualAt: null,
    });
  };

  /* ── Feed ── */
  const addFeed    = (f)  => put('feed', f);
  const updateFeed = (f)  => patch('feed', f.id, f);
  const removeFeed = (id) => drop('feed', id);

  const addFeedStock = async (id, qty) => {
    const item = state.feed.find(f => f.id === id);
    if (!item) return;
    const stock = (item.stock || 0) + qty;
    const count = Math.max(1, state.livestock.filter(a => a.species === item.species).length);
    const daysLeft = item.dailyPerHead > 0 ? Math.round(stock / (item.dailyPerHead * count)) : 0;
    await patch('feed', id, { ...item, stock, daysLeft });
  };

  /* ── Equipment & tickets ── */
  const addEquipment    = (e)  => put('equipment', e);
  const updateEquipment = (e)  => patch('equipment', e.id, e);
  const removeEquipment = (id) => drop('equipment', id);

  const addTicket    = (t)  => put('tickets', t, { prepend: true });
  const updateTicket = (t)  => patch('tickets', t.id, t);  // updatedAt is set by the database
  const removeTicket = (id) => drop('tickets', id);

  /* ── Devices ── */
  const addDevice    = (d)  => put('devices', { ...d, status: 'pending', lastSeen: null });
  const updateDevice = (d)  => patch('devices', d.id, d);
  const removeDevice = (id) => drop('devices', id);

  /* ── Farm plan ── */
  const addZone    = (z)  => put('zones', z);
  const updateZone = (z)  => patch('zones', z.id, z);
  const removeZone = (id) => drop('zones', id);

  /* ── Crops ── */
  const addPlanting    = (p)  => put('plantings', p, { prepend: true });
  const updatePlanting = (p)  => patch('plantings', p.id, p);
  const removePlanting = (id) => drop('plantings', id);

  const setFarmProfile  = (v) => saveSingleton('farmProfile', v);
  const setFarmBoundary = (v) => saveSingleton('farmBoundary', v);

  /* ── One-time import of data left in this browser ── */
  const importLegacy = useCallback(async (payload) => {
    try {
      const res = await call({ collection: 'livestock', op: 'import', payload });
      await reload();
      return { ok: true, counts: res.counts || {} };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [reload]);

  return (
    <DataContext.Provider value={{
      ...state,
      loading, error, reload, importLegacy,
      addAnimal, updateAnimal, removeAnimal,
      addHealth, updateHealth, removeHealth,
      addSensor, updateSensor, removeSensor,
      addManualReading, removeManualReading, clearManualOverride,
      addFeed, updateFeed, removeFeed, addFeedStock,
      addEquipment, updateEquipment, removeEquipment,
      addDevice, updateDevice, removeDevice,
      addTicket, updateTicket, removeTicket,
      setFarmBoundary, setFarmProfile,
      addZone, updateZone, removeZone,
      addPlanting, updatePlanting, removePlanting,
      addInspection, updateInspection, removeInspection,
      addHarvest, updateHarvest, removeHarvest,
      addColonyEvent, updateColonyEvent, removeColonyEvent,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
