/**
 * Field operations — everything done to a planting between going in the ground
 * and coming off it.
 *
 * Spray records carry the regulatory weight. Agricultural remedies in South
 * Africa are registered under the Fertilizers, Farm Feeds, Agricultural
 * Remedies and Stock Remedies Act 36 of 1947, and every registered product
 * carries an L-number on its label along with a withholding period — the days
 * that must pass between spraying and harvest. Harvesting inside that window
 * risks residues above the Maximum Residue Limit, which is how a consignment
 * gets rejected at a packhouse or a border.
 *
 * Deliberately NO table of withholding periods per product here. The period
 * depends on the product, the crop and the dose, labels are revised, and a
 * number that is wrong in the farmer's favour would be worse than no number at
 * all. The label is the authority; this module records what it says and does
 * the date arithmetic.
 */

export const OPERATION_TYPES = [
  'Spray', 'Fertiliser', 'Irrigation', 'Cultivation', 'Pruning', 'Scouting', 'Other',
];

export const OPERATION_META = {
  Spray:       { emoji: '💧', tone: 'amber', blurb: 'Pesticide, fungicide or herbicide' },
  Fertiliser:  { emoji: '🧪', tone: 'green', blurb: 'Granular, foliar or fertigation' },
  Irrigation:  { emoji: '🚿', tone: 'blue',  blurb: 'Water applied' },
  Cultivation: { emoji: '🚜', tone: 'slate', blurb: 'Tillage, ridging, weeding' },
  Pruning:     { emoji: '✂️', tone: 'slate', blurb: 'Pruning, thinning, training' },
  Scouting:    { emoji: '🔍', tone: 'blue',  blurb: 'Pest and disease inspection' },
  Other:       { emoji: '📋', tone: 'slate', blurb: 'Anything else worth recording' },
};

export const OPERATION_TONE = {
  amber: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  green: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  blue:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  slate: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
};

/** Only sprays carry a withholding period and a re-entry interval. */
export const isSpray = (op) => op?.type === 'Spray';

/* Suggestions only — the field takes free text, because product ranges change
   and registrations lapse. Nothing here implies a product is currently
   registered, approved for a given crop, or permitted by a buyer's standard. */
export const COMMON_ACTIVES = [
  'Abamectin', 'Acetamiprid', 'Azoxystrobin', 'Bacillus thuringiensis',
  'Captan', 'Chlorantraniliprole', 'Copper oxychloride', 'Cyprodinil',
  'Difenoconazole', 'Emamectin benzoate', 'Glyphosate', 'Imidacloprid',
  'Lambda-cyhalothrin', 'Mancozeb', 'Metalaxyl', 'Pendimethalin',
  'Potassium silicate', 'Spinetoram', 'Spinosad', 'Sulphur',
  'Tebuconazole', 'Thiamethoxam', 'Trifloxystrobin',
];

export const QUANTITY_UNITS = ['L', 'mL', 'kg', 'g'];

const DAY = 86400000;

/**
 * Midnight-anchored so a comparison never turns on the time of day.
 *
 * 'YYYY-MM-DD' is pulled apart by hand rather than handed to `new Date()`,
 * which reads a bare date string as UTC midnight. Re-anchoring that to local
 * midnight shifts the day backwards anywhere west of Greenwich — so a spray
 * recorded on the 1st would clear its withholding period a day early for a
 * farmer, agent or auditor whose browser is in the Americas. A date written on
 * a form means that calendar day wherever it is read.
 */
export const startOfDay = (value) => {
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * The first date this block may be harvested after a given spray.
 * Null when the operation isn't a spray or no withholding period was recorded.
 */
export function withholdingUntil(op) {
  if (!isSpray(op) || !op?.date) return null;
  const days = Number(op.phiDays);
  if (!Number.isFinite(days) || days <= 0) return null;
  const d = startOfDay(op.date);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * The first day workers may go back into the block.
 *
 * Only the date of a spray is recorded, not the hour, so an hour-precise
 * answer would be invented precision — and inventing it downwards is how
 * somebody walks into a block too early. The interval is rounded up to whole
 * days and counted from the day after application, which is the conservative
 * reading of any interval short of 24 hours.
 */
export function reEntryUntil(op) {
  if (!isSpray(op) || !op?.date) return null;
  const hours = Number(op.reiHours);
  if (!Number.isFinite(hours) || hours <= 0) return null;
  const d = startOfDay(op.date);
  if (!d) return null;
  d.setDate(d.getDate() + Math.ceil(hours / 24));
  return d;
}

/**
 * The binding clear date for a planting: the latest withholding date across
 * every spray on it. One long-interval product holds the whole block back,
 * so the latest wins rather than the most recent spray.
 */
export function clearDateFor(plantingCode, operations = []) {
  let latest = null;
  let driver = null;
  for (const op of operations) {
    if (op.plantingCode !== plantingCode) continue;
    const until = withholdingUntil(op);
    if (until && (!latest || until > latest)) { latest = until; driver = op; }
  }
  return latest ? { until: latest, op: driver } : null;
}

/**
 * What to tell the farmer about a planting right now.
 *
 * `blocked`  — it is inside a withholding period today.
 * `clash`    — the harvest it has planned falls inside one. This is the case
 *              worth shouting about: it is a decision already made that will
 *              put residues over the limit unless the date moves.
 */
export function withholdingStatus(planting, operations = [], now = Date.now()) {
  const clear = clearDateFor(planting?.code, operations);
  if (!clear) return null;

  const today = startOfDay(now);
  const daysLeft = Math.ceil((clear.until - today) / DAY);
  const blocked = daysLeft > 0;

  const planned = planting?.expectedHarvest ? startOfDay(planting.expectedHarvest) : null;
  const clash = !!planned && planned < clear.until;

  return {
    until: clear.until,
    op: clear.op,
    daysLeft: Math.max(daysLeft, 0),
    blocked,
    clash,
    shortBy: clash ? Math.ceil((clear.until - planned) / DAY) : 0,
  };
}

/** PL-2026-001 → the operations recorded against it, newest first. */
export const operationsFor = (code, operations = []) =>
  operations.filter(op => op.plantingCode === code);

/**
 * Whether a harvest on a given date falls inside a withholding period.
 *
 * Only sprays applied on or before the harvest count. A spray that goes on
 * afterwards says nothing about produce already off the field, and letting it
 * count would raise a breach against a harvest that was clean when it
 * happened — then quietly clear itself once enough time passed.
 *
 * Returns null when the harvest is in the clear.
 */
export function harvestBreach(plantingCode, harvestDate, operations = []) {
  const harvested = startOfDay(harvestDate);
  if (!harvested) return null;

  const before = operations.filter(op => {
    const applied = startOfDay(op.date);
    return applied && applied <= harvested;
  });

  const clear = clearDateFor(plantingCode, before);
  if (!clear || harvested >= clear.until) return null;

  return {
    until: clear.until,
    op: clear.op,
    shortBy: Math.ceil((clear.until - harvested) / DAY),
  };
}
