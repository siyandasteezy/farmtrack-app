import { createContext, useContext, useState, useRef } from 'react';

const DataContext = createContext(null);

/* ── localStorage helpers ───────────────────────────────────────────── */

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  return val;
}

/* ── Provider ───────────────────────────────────────────────────────── */

export function DataProvider({ children }) {
  // Persisted ID counter (ref = synchronous, no async state issues)
  const nextIdRef = useRef(load('ft_nextId', 1));
  const newId = () => {
    const id = nextIdRef.current;
    nextIdRef.current = id + 1;
    try { localStorage.setItem('ft_nextId', String(nextIdRef.current)); } catch {}
    return id;
  };

  const [livestock,      setLivestock]      = useState(() => load('ft_livestock',      []));
  const [health,         setHealth]         = useState(() => load('ft_health',         []));
  const [sensors,        setSensors]        = useState(() => load('ft_sensors',        []));
  const [manualReadings, setManualReadings] = useState(() => load('ft_manualReadings', []));
  const [feed,           setFeed]           = useState(() => load('ft_feed',           []));
  const [equipment,      setEquipment]      = useState(() => load('ft_equipment',      []));
  const [tickets,        setTickets]        = useState(() => load('ft_tickets',        []));
  const [devices,        setDevices]        = useState(() => load('ft_devices',        []));
  const [farmBoundary,   setFarmBoundaryRaw] = useState(() => load('ft_farmBoundary', { lat: -33.7300, lng: 19.0100, radius: 450 }));

  const setFarmBoundary = (v) => { save('ft_farmBoundary', v); setFarmBoundaryRaw(v); };

  /* ── Livestock ── */
  const addAnimal    = (a)  => setLivestock(p => save('ft_livestock', [...p, { ...a, id: newId() }]));
  const updateAnimal = (a)  => setLivestock(p => save('ft_livestock', p.map(x => x.id === a.id ? a : x)));
  const removeAnimal = (id) => setLivestock(p => save('ft_livestock', p.filter(x => x.id !== id)));

  /* ── Health ── */
  const addHealth    = (h)  => setHealth(p => save('ft_health', [{ ...h, id: newId() }, ...p]));
  const updateHealth = (h)  => setHealth(p => save('ft_health', p.map(x => x.id === h.id ? h : x)));
  const removeHealth = (id) => setHealth(p => save('ft_health', p.filter(x => x.id !== id)));

  /* ── Sensors ── */
  const addSensor    = (s)  => setSensors(p => save('ft_sensors', [...p, { ...s, id: newId(), initialValue: s.value, isManual: false }]));
  const updateSensor = (s)  => setSensors(p => save('ft_sensors', p.map(x => x.id === s.id ? s : x)));
  const removeSensor = (id) => {
    setSensors(p => save('ft_sensors', p.filter(x => x.id !== id)));
    setManualReadings(p => save('ft_manualReadings', p.filter(x => x.sensorId !== id)));
  };

  const addManualReading = (reading) => {
    const sensor = sensors.find(s => s.id === reading.sensorId);
    const numVal = parseFloat(reading.value);
    const newStatus = numVal < (sensor?.min ?? 0) ? 'alert' : numVal > (sensor?.max ?? 9999) ? 'warn' : 'normal';
    const entry = {
      id: `mr-${newId()}`,
      sensorId: reading.sensorId,
      sensorName: sensor?.name || '',
      location: sensor?.location || '',
      unit: sensor?.unit || '',
      value: numVal,
      reason: reading.reason,
      notes: reading.notes || '',
      loggedAt: new Date().toISOString(),
    };
    setManualReadings(p => save('ft_manualReadings', [entry, ...p]));
    if (sensor) {
      setSensors(p => save('ft_sensors', p.map(x => x.id === sensor.id
        ? { ...x, value: numVal, status: newStatus, isManual: true, lastManualAt: entry.loggedAt }
        : x
      )));
    }
  };

  const removeManualReading = (id) => {
    const mr = manualReadings.find(r => r.id === id);
    setManualReadings(p => save('ft_manualReadings', p.filter(x => x.id !== id)));
    // If removed reading was the latest for its sensor, revert sensor to previous value
    if (mr) {
      const remaining = manualReadings.filter(r => r.id !== id && r.sensorId === mr.sensorId);
      setSensors(p => save('ft_sensors', p.map(x => {
        if (x.id !== mr.sensorId) return x;
        if (remaining.length > 0) {
          const latest = remaining[0];
          const numVal = latest.value;
          const newStatus = numVal < (x.min ?? 0) ? 'alert' : numVal > (x.max ?? 9999) ? 'warn' : 'normal';
          return { ...x, value: numVal, status: newStatus };
        }
        return { ...x, value: x.initialValue ?? x.value, isManual: false, lastManualAt: null };
      })));
    }
  };

  const clearManualOverride = (sensorId) => {
    setSensors(p => save('ft_sensors', p.map(x => {
      if (x.id !== sensorId) return x;
      const v = x.initialValue ?? x.value;
      const newStatus = v < (x.min ?? 0) ? 'alert' : v > (x.max ?? 9999) ? 'warn' : 'normal';
      return { ...x, value: v, status: newStatus, isManual: false, lastManualAt: null };
    })));
  };

  /* ── Feed ── */
  const addFeed    = (f)  => setFeed(p => save('ft_feed', [...p, { ...f, id: newId() }]));
  const updateFeed = (f)  => setFeed(p => save('ft_feed', p.map(x => x.id === f.id ? f : x)));
  const removeFeed = (id) => setFeed(p => save('ft_feed', p.filter(x => x.id !== id)));

  const addFeedStock = (id, qty) => setFeed(p => save('ft_feed', p.map(f => {
    if (f.id !== id) return f;
    const newStock = f.stock + qty;
    const count = Math.max(1, livestock.filter(a => a.species === f.species).length);
    return { ...f, stock: newStock, daysLeft: Math.round(newStock / (f.dailyPerHead * count)) };
  })));

  /* ── Equipment ── */
  const addEquipment    = (e)  => setEquipment(p => save('ft_equipment', [...p, { ...e, id: `eq-${newId()}` }]));
  const updateEquipment = (e)  => setEquipment(p => save('ft_equipment', p.map(x => x.id === e.id ? e : x)));
  const removeEquipment = (id) => setEquipment(p => save('ft_equipment', p.filter(x => x.id !== id)));

  /* ── Devices ── */
  const addDevice    = (d)  => setDevices(p => save('ft_devices', [...p, { ...d, id: `dev-${newId()}`, status: 'pending', lastSeen: null, createdAt: new Date().toISOString() }]));
  const updateDevice = (d)  => setDevices(p => save('ft_devices', p.map(x => x.id === d.id ? d : x)));
  const removeDevice = (id) => setDevices(p => save('ft_devices', p.filter(x => x.id !== id)));

  /* ── Tickets ── */
  const addTicket    = (t)  => setTickets(p => save('ft_tickets', [{ ...t, id: `tk-${newId()}`, createdAt: new Date().toISOString().slice(0,10), updatedAt: new Date().toISOString().slice(0,10) }, ...p]));
  const updateTicket = (t)  => setTickets(p => save('ft_tickets', p.map(x => x.id === t.id ? { ...t, updatedAt: new Date().toISOString().slice(0,10) } : x)));
  const removeTicket = (id) => setTickets(p => save('ft_tickets', p.filter(x => x.id !== id)));

  return (
    <DataContext.Provider value={{
      livestock,     addAnimal,    updateAnimal,  removeAnimal,
      health,        addHealth,    updateHealth,  removeHealth,
      sensors,       addSensor,    updateSensor,  removeSensor,
      manualReadings, addManualReading, removeManualReading, clearManualOverride,
      feed,          addFeed,      updateFeed,    removeFeed,   addFeedStock,
      equipment,     addEquipment, updateEquipment, removeEquipment,
      devices,       addDevice,    updateDevice,  removeDevice,
      tickets,       addTicket,    updateTicket,  removeTicket,
      farmBoundary,  setFarmBoundary,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
