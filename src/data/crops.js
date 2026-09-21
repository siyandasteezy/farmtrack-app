/**
 * Crop reference data, weighted towards what South African farms actually grow.
 *
 * Varieties are suggestions, not a closed list — the field accepts free text,
 * because cultivar ranges change season to season and vary by region. Only
 * long-established cultivar names are listed here.
 */

export const CROP_CATEGORIES = ['Grain', 'Vegetable', 'Fruit'];

export const CROP_META = {
  /* ── Grains, oilseeds and legumes ── */
  'Maize (white)':  { category: 'Grain', emoji: '🌽', perennial: false, unit: 't' },
  'Maize (yellow)': { category: 'Grain', emoji: '🌽', perennial: false, unit: 't' },
  'Wheat':          { category: 'Grain', emoji: '🌾', perennial: false, unit: 't' },
  'Barley':         { category: 'Grain', emoji: '🌾', perennial: false, unit: 't' },
  'Oats':           { category: 'Grain', emoji: '🌾', perennial: false, unit: 't' },
  'Sorghum':        { category: 'Grain', emoji: '🌾', perennial: false, unit: 't' },
  'Sunflower':      { category: 'Grain', emoji: '🌻', perennial: false, unit: 't' },
  'Soybean':        { category: 'Grain', emoji: '🫘', perennial: false, unit: 't' },
  'Groundnut':      { category: 'Grain', emoji: '🥜', perennial: false, unit: 't' },
  'Dry beans':      { category: 'Grain', emoji: '🫘', perennial: false, unit: 't' },
  'Lucerne':        { category: 'Grain', emoji: '🌿', perennial: true,  unit: 'bales' },

  /* ── Vegetables ── */
  'Potato':       { category: 'Vegetable', emoji: '🥔', perennial: false, unit: 't' },
  'Sweet potato': { category: 'Vegetable', emoji: '🍠', perennial: false, unit: 'kg' },
  'Tomato':       { category: 'Vegetable', emoji: '🍅', perennial: false, unit: 'kg', varieties: ['Roma', 'Money Maker', 'Heinz'] },
  'Onion':        { category: 'Vegetable', emoji: '🧅', perennial: false, unit: 'kg' },
  'Cabbage':      { category: 'Vegetable', emoji: '🥬', perennial: false, unit: 'kg' },
  'Spinach':      { category: 'Vegetable', emoji: '🥬', perennial: false, unit: 'kg' },
  'Carrot':       { category: 'Vegetable', emoji: '🥕', perennial: false, unit: 'kg' },
  'Beetroot':     { category: 'Vegetable', emoji: '🫒', perennial: false, unit: 'kg' },
  'Butternut':    { category: 'Vegetable', emoji: '🎃', perennial: false, unit: 'kg' },
  'Pumpkin':      { category: 'Vegetable', emoji: '🎃', perennial: false, unit: 'kg' },
  'Green beans':  { category: 'Vegetable', emoji: '🫛', perennial: false, unit: 'kg' },
  'Green pepper': { category: 'Vegetable', emoji: '🫑', perennial: false, unit: 'kg' },
  'Chilli':       { category: 'Vegetable', emoji: '🌶️', perennial: false, unit: 'kg' },
  'Lettuce':      { category: 'Vegetable', emoji: '🥬', perennial: false, unit: 'kg' },
  'Cauliflower':  { category: 'Vegetable', emoji: '🥦', perennial: false, unit: 'kg' },
  'Broccoli':     { category: 'Vegetable', emoji: '🥦', perennial: false, unit: 'kg' },

  /* ── Fruit, nuts and vines (mostly perennial) ── */
  'Orange':       { category: 'Fruit', emoji: '🍊', perennial: true, unit: 'kg', varieties: ['Valencia', 'Navel'] },
  'Lemon':        { category: 'Fruit', emoji: '🍋', perennial: true, unit: 'kg', varieties: ['Eureka'] },
  'Naartjie':     { category: 'Fruit', emoji: '🍊', perennial: true, unit: 'kg' },
  'Grapefruit':   { category: 'Fruit', emoji: '🍊', perennial: true, unit: 'kg' },
  'Table grapes': { category: 'Fruit', emoji: '🍇', perennial: true, unit: 'kg' },
  'Wine grapes':  { category: 'Fruit', emoji: '🍇', perennial: true, unit: 't',  varieties: ['Chenin Blanc', 'Cabernet Sauvignon', 'Shiraz', 'Pinotage', 'Chardonnay', 'Sauvignon Blanc'] },
  'Apple':        { category: 'Fruit', emoji: '🍎', perennial: true, unit: 'kg', varieties: ['Golden Delicious', 'Granny Smith', 'Royal Gala', 'Fuji'] },
  'Pear':         { category: 'Fruit', emoji: '🍐', perennial: true, unit: 'kg', varieties: ['Packham', 'Forelle'] },
  'Peach':        { category: 'Fruit', emoji: '🍑', perennial: true, unit: 'kg' },
  'Plum':         { category: 'Fruit', emoji: '🍑', perennial: true, unit: 'kg' },
  'Apricot':      { category: 'Fruit', emoji: '🍑', perennial: true, unit: 'kg' },
  'Avocado':      { category: 'Fruit', emoji: '🥑', perennial: true, unit: 'kg', varieties: ['Hass', 'Fuerte'] },
  'Macadamia':    { category: 'Fruit', emoji: '🌰', perennial: true, unit: 'kg' },
  'Pecan':        { category: 'Fruit', emoji: '🌰', perennial: true, unit: 'kg' },
  'Mango':        { category: 'Fruit', emoji: '🥭', perennial: true, unit: 'kg' },
  'Banana':       { category: 'Fruit', emoji: '🍌', perennial: true, unit: 'kg' },
  'Litchi':       { category: 'Fruit', emoji: '🍒', perennial: true, unit: 'kg' },
  'Blueberry':    { category: 'Fruit', emoji: '🫐', perennial: true, unit: 'kg' },
  'Watermelon':   { category: 'Fruit', emoji: '🍉', perennial: false, unit: 'kg' },
  'Olive':        { category: 'Fruit', emoji: '🫒', perennial: true, unit: 'kg' },
};

export const PLANTING_STATUSES = ['Planned', 'Growing', 'Harvested', 'Failed', 'Removed'];

/* Colour the status chip the way the rest of the app signals health. */
export const PLANTING_STATUS_TONE = {
  Planned:   { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Growing:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Harvested: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  Failed:    { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  Removed:   { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
};

export const cropsByCategory = (category) =>
  Object.keys(CROP_META).filter(c => CROP_META[c].category === category);

/** PL-2026-001, continuing from whatever already exists. */
export function generatePlantingCode(existing = []) {
  return nextCode('PL', existing.map(p => p.code));
}

/** LOT-2026-001 — the batch identifier that leaves the farm with the produce. */
export function generateLotCode(existing = []) {
  return nextCode('LOT', existing.map(h => h.lotCode));
}

function nextCode(prefix, codes) {
  const year = new Date().getFullYear();
  const full = `${prefix}-${year}-`;
  const highest = codes
    .filter(c => typeof c === 'string' && c.startsWith(full))
    .map(c => parseInt(c.slice(full.length), 10))
    .filter(n => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${full}${String(highest + 1).padStart(3, '0')}`;
}

/* Class 1/2/3 are the grades the Agricultural Product Standards Act 119 of
   1990 puts on fresh produce. Grain is graded on its own scales, so the list
   stays short and Ungraded is a first-class answer rather than a gap. */
export const HARVEST_GRADES = [
  'Ungraded', 'Class 1', 'Class 2', 'Class 3', 'Processing', 'Reject',
];

export const HARVEST_UNITS = ['kg', 't', 'bales', 'crates', 'bins', 'punnets', 'litres'];

export const HARVEST_DESTINATIONS = [
  'Packhouse', 'Fresh produce market', 'Co-op / silo', 'Direct buyer',
  'Processor', 'Farm gate', 'Own use', 'Discarded',
];

/** The unit a crop is usually measured in, falling back to kilograms. */
export const unitForCrop = (crop) => CROP_META[crop]?.unit || 'kg';

/** Everything taken off one planting. */
export const harvestsFor = (code, harvests = []) =>
  harvests.filter(h => h.plantingCode === code);

/**
 * Yield for a planting, normalised to a single unit so the numbers add up.
 *
 * Harvests recorded in different units are kept apart rather than summed —
 * adding crates to kilograms would produce a confident, meaningless total.
 */
export function yieldFor(code, harvests = [], planting = null) {
  const rows = harvestsFor(code, harvests);
  if (rows.length === 0) return null;

  const byUnit = {};
  let income = 0;
  for (const h of rows) {
    const unit = h.unit || 'kg';
    byUnit[unit] = (byUnit[unit] || 0) + (h.quantity || 0);
    if (h.pricePerUnit) income += (h.quantity || 0) * h.pricePerUnit;
  }

  // Per-hectare only makes sense against one unit and a known area.
  const units = Object.keys(byUnit);
  const area = planting?.areaHa || null;
  const perHa = units.length === 1 && area ? byUnit[units[0]] / area : null;

  return {
    byUnit, units, income,
    perHa, perHaUnit: units.length === 1 ? units[0] : null,
    count: rows.length,
  };
}
