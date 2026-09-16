/**
 * The one place that decides what a client may read and write.
 *
 * Every collection names its Prisma model and an explicit field whitelist, so
 * a request can never set userId, id or timestamps by smuggling them into the
 * body. Values are coerced to the column's type rather than trusted.
 */

/* An empty string is kept as '' rather than folded to null: several columns
   are non-nullable with a '' default, and null would be rejected there while
   '' is valid for both nullable and non-nullable text. */
const str   = (v) => (v === null || v === undefined) ? null : String(v);
const num   = (v) => { if (v === null || v === undefined || v === '') return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
const int   = (v) => { const n = num(v); return n === null ? null : Math.trunc(n); };
const bool  = (v) => v === true || v === 'true';
const list  = (v) => Array.isArray(v) ? v.map(x => String(x)) : [];
const json  = (v) => (v === undefined ? null : v);

/** 'YYYY-MM-DD' or ISO in, Date or null out. */
const date = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/* Serialising back: date-only columns become 'YYYY-MM-DD' because that is what
   <input type="date"> needs; timestamps stay ISO. */
const DATE_ONLY = new Set([
  'date', 'dob', 'purchaseDate', 'lastService', 'plantedAt', 'expectedHarvest',
]);

export const COLLECTIONS = {
  livestock: {
    model: 'animal',
    orderBy: { createdAt: 'asc' },
    fields: {
      tag: str, name: str, species: str, breed: str, dob: date, sex: str,
      weight: num, location: str, status: str, notes: str,
      strength: str, queenStatus: str, queenYear: str, queenColour: str,
      trackerDeviceId: str, trackerBattery: int, trackerLat: num,
      trackerLng: num, trackerLastSeen: date,
    },
    required: ['tag', 'species'],
  },
  health: {
    model: 'healthRecord',
    orderBy: { date: 'desc' },
    fields: {
      date: date, animalTag: str, animalName: str, type: str, vet: str,
      status: str, cost: num, notes: str,
    },
    required: ['date', 'animalTag'],
  },
  inspections: {
    model: 'inspection',
    orderBy: { date: 'desc' },
    fields: {
      date: date, hiveTag: str, inspector: str, queenSeen: str,
      broodPattern: str, stores: str, temperament: str, varroaCount: num,
      pests: list, actions: str, notes: str,
    },
    required: ['date', 'hiveTag'],
  },
  harvests: {
    model: 'harvest',
    orderBy: { date: 'desc' },
    fields: { date: date, hiveTag: str, product: str, quantity: num, frames: int, notes: str },
    required: ['date', 'hiveTag', 'product'],
  },
  colonyEvents: {
    model: 'colonyEvent',
    orderBy: { date: 'desc' },
    fields: { date: date, hiveTag: str, type: str, detail: str },
    required: ['date', 'hiveTag', 'type'],
  },
  sensors: {
    model: 'sensor',
    orderBy: { createdAt: 'asc' },
    fields: {
      name: str, category: str, icon: str, location: str, unit: str,
      min: num, max: num, value: num, initialValue: num, status: str,
      isManual: bool, isCustom: bool, lastManualAt: date,
    },
    required: ['name', 'unit'],
  },
  manualReadings: {
    model: 'manualReading',
    orderBy: { loggedAt: 'desc' },
    fields: {
      sensorId: str, sensorName: str, location: str, unit: str,
      value: num, status: str, reason: str, notes: str, loggedAt: date,
    },
    required: ['sensorId'],
  },
  feed: {
    model: 'feedItem',
    orderBy: { createdAt: 'asc' },
    fields: {
      species: str, type: str, dailyPerHead: num, stock: num,
      unit: str, costPerKg: num, daysLeft: int,
    },
    required: ['species', 'type'],
  },
  equipment: {
    model: 'equipment',
    orderBy: { createdAt: 'asc' },
    fields: {
      name: str, type: str, serial: str, location: str, status: str,
      purchaseDate: date, lastService: date, notes: str,
    },
    required: ['name'],
  },
  tickets: {
    model: 'ticket',
    orderBy: { createdAt: 'desc' },
    fields: {
      title: str, description: str, category: str, subCategory: str,
      priority: str, status: str, assignedTo: str,
    },
    required: ['title'],
  },
  devices: {
    model: 'device',
    orderBy: { createdAt: 'asc' },
    fields: {
      deviceId: str, sensorId: str, protocol: str, token: str,
      reportingInterval: int, status: str, lastSeen: date,
    },
    required: ['deviceId'],
  },
  zones: {
    model: 'zone',
    orderBy: { createdAt: 'asc' },
    fields: { name: str, type: str, color: str, border: str },
    required: ['name'],
  },
  plantings: {
    model: 'planting',
    orderBy: { createdAt: 'desc' },
    fields: {
      code: str, crop: str, variety: str, category: str, location: str,
      areaHa: num, perennial: bool, plantCount: int,
      plantedAt: date, expectedHarvest: date, status: str, notes: str,
    },
    required: ['code', 'crop', 'category'],
  },
};

/* One row per user rather than a list. */
export const SINGLETONS = {
  farmProfile: {
    model: 'farmProfile',
    fields: { name: str, address: str, country: str, area: str, areaUnit: str, lat: num, lng: num },
    empty: { name: '', address: '', country: '', area: '', areaUnit: 'ha', lat: '', lng: '' },
  },
  farmBoundary: {
    model: 'farmBoundary',
    fields: { type: str, lat: num, lng: num, radius: num, points: json },
    empty: { type: 'circle', lat: -33.7300, lng: 19.0100, radius: 450 },
  },
};

/**
 * Keeps only whitelisted keys, coerced. Unknown keys are dropped silently.
 *
 * A key the caller didn't send is left out entirely rather than written as
 * null — several columns are non-nullable with defaults, and a null would be
 * rejected. An explicit null in the body is still honoured, so a field can be
 * deliberately cleared.
 */
export function sanitise(spec, body, { partial = false } = {}) {
  const src = body || {};
  const data = {};
  for (const [key, cast] of Object.entries(spec.fields)) {
    if (!(key in src)) continue;
    data[key] = cast(src[key]);
  }
  if (!partial && spec.required) {
    for (const key of spec.required) {
      if (data[key] === null || data[key] === undefined) {
        return { error: `${key} is required.` };
      }
    }
  }
  return { data };
}

/** Shapes a row for the browser: ids as strings, dates as the UI expects. */
export function serialise(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'userId') continue;                 // never leaks outward
    if (v instanceof Date) {
      out[k] = DATE_ONLY.has(k) ? v.toISOString().slice(0, 10) : v.toISOString();
    } else {
      out[k] = v;
    }
  }
  return out;
}
