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
  const [sensors]                   = useState(INITIAL_SENSORS);
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
      sensors,
      feed,       updateFeed,   addFeedStock,
      equipment,  addEquipment, updateEquipment, removeEquipment,
      tickets,    addTicket,    updateTicket,    removeTicket,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
