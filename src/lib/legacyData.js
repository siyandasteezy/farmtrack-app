/**
 * Data left in the browser from before the farm records moved to the server.
 * Read once when offering the one-time import, then cleared — never written to.
 */

const LEGACY_KEYS = {
  livestock: 'ft_livestock', health: 'ft_health', inspections: 'ft_inspections',
  harvests: 'ft_harvests', colonyEvents: 'ft_colonyEvents', sensors: 'ft_sensors',
  manualReadings: 'ft_manualReadings', feed: 'ft_feed', equipment: 'ft_equipment',
  tickets: 'ft_tickets', devices: 'ft_devices', zones: 'ft_zones',
  farmProfile: 'ft_farmProfile', farmBoundary: 'ft_farmBoundary',
};

export function readLegacyData() {
  const out = {};
  let rows = 0;
  for (const [name, key] of Object.entries(LEGACY_KEYS)) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length) { out[name] = parsed; rows += parsed.length; }
      } else if (parsed && typeof parsed === 'object') {
        out[name] = parsed;
      }
    } catch { /* unreadable key — skip it */ }
  }
  return { payload: out, rows };
}

export function clearLegacyData() {
  for (const key of Object.values(LEGACY_KEYS)) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  try { localStorage.removeItem('ft_nextId'); } catch { /* ignore */ }
}
