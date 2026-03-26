import { createContext, useContext, useState } from 'react';
import { INITIAL_LIVESTOCK } from '../data/livestock';
import { INITIAL_SENSORS } from '../data/sensors';
import { INITIAL_HEALTH } from '../data/health';
import { INITIAL_FEED } from '../data/feed';
import { INITIAL_EQUIPMENT, INITIAL_TICKETS } from '../data/equipment';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [livestock,  setLivestock]  = useState(INITIAL_LIVESTOCK);
  const [health,     setHealth]     = useState(INITIAL_HEALTH);
  const [sensors,      setSensors]      = useState(INITIAL_SENSORS);
  const [manualReadings, setManualReadings] = useState([]);
  const [feed,       setFeed]       = useState(INITIAL_FEED);
  const [equipment,  setEquipment]  = useState(INITIAL_EQUIPMENT);
  const [tickets,    setTickets]    = useState(INITIAL_TICKETS);
  const [nextId,     setNextId]     = useState(200);

  const newId = () => { const id = nextId; setNextId(n => n + 1); return id; };

  // Livestock
  const addAnimal    = (a)  => setLivestock(p => [...p, { ...a, id: newId() }]);
  const updateAnimal = (a)  => setLivestock(p => p.map(x => x.id === a.id ? a : x));
  const removeAnimal = (id) => setLivestock(p => p.filter(x => x.id !== id));

  // Health
  const addHealth    = (h)  => setHealth(p => [{ ...h, id: newId() }, ...p]);
  const updateHealth = (h)  => setHealth(p => p.map(x => x.id === h.id ? h : x));
  const removeHealth = (id) => setHealth(p => p.filter(x => x.id !== id));

  // Sensors
  const addSensor    = (s)  => setSensors(p => [...p, { ...s, id: newId(), isManual: false }]);
  const removeSensor = (id) => setSensors(p => p.filter(x => x.id !== id));
  const updateSensor = (s)  => setSensors(p => p.map(x => x.id === s.id ? s : x));
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
    setManualReadings(p => [entry, ...p]);
    if (sensor) {
      setSensors(p => p.map(x => x.id === sensor.id
        ? { ...x, value: numVal, status: newStatus, isManual: true, lastManualAt: entry.loggedAt }
        : x
      ));
    }
  };
  const clearManualOverride = (sensorId) => {
    const original = INITIAL_SENSORS.find(s => s.id === sensorId);
    if (original) setSensors(p => p.map(x => x.id === sensorId ? { ...original } : x));
  };

  // Feed
  const updateFeed   = (f)  => setFeed(p => p.map(x => x.id === f.id ? f : x));
  const addFeedStock = (species, qty) => setFeed(p => p.map(f => {
    if (f.species !== species) return f;
    const newStock = f.stock + qty;
    const count = Math.max(1, INITIAL_LIVESTOCK.filter(a => a.species === species).length);
    return { ...f, stock: newStock, daysLeft: Math.round(newStock / (f.dailyPerHead * count)) };
  }));

  // Equipment
  const addEquipment    = (e)  => setEquipment(p => [...p, { ...e, id: `eq-${newId()}` }]);
  const updateEquipment = (e)  => setEquipment(p => p.map(x => x.id === e.id ? e : x));
  const removeEquipment = (id) => setEquipment(p => p.filter(x => x.id !== id));

  // Tickets
  const addTicket    = (t)  => setTickets(p => [{ ...t, id: `tk-${newId()}`, createdAt: new Date().toISOString().slice(0,10), updatedAt: new Date().toISOString().slice(0,10) }, ...p]);
  const updateTicket = (t)  => setTickets(p => p.map(x => x.id === t.id ? { ...t, updatedAt: new Date().toISOString().slice(0,10) } : x));
  const removeTicket = (id) => setTickets(p => p.filter(x => x.id !== id));

  return (
    <DataContext.Provider value={{
      livestock,  addAnimal,    updateAnimal,  removeAnimal,
      health,     addHealth,    updateHealth,  removeHealth,
      sensors, addSensor, removeSensor, updateSensor, addManualReading, clearManualOverride, manualReadings,
      feed,       updateFeed,   addFeedStock,
      equipment,  addEquipment, updateEquipment, removeEquipment,
      tickets,    addTicket,    updateTicket,    removeTicket,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
