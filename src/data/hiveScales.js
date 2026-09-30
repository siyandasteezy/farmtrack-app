/**
 * Hive scales — reading weight as what the colony is actually doing.
 *
 * A scale under a hive is the only sensor that tells a beekeeper something
 * they cannot see without opening the box, and opening the box sets the
 * colony back. Weight answers three questions: is a flow on, are the stores
 * enough to survive the dearth, and did something just go wrong.
 *
 * Two things this module refuses to pretend:
 *
 * Weight above an empty hive is not honey. Bees, brood and drawn comb are
 * most of it — a strong colony on empty comb can sit 15 kg above bare
 * woodware with nothing to harvest. Stores are measured against a baseline
 * taken with the colony established and before the flow, and if that baseline
 * is missing no estimate is offered at all.
 *
 * A single reading means very little. A hive is lighter at noon with the
 * foragers out and heavier after rain on the roof. Everything here works off
 * daily means, and a trend is only reported once there are enough days to
 * support one.
 */

const DAY = 86400000;

/**
 * A reference weight, or null when it was never set.
 *
 * Number(null) is 0, not NaN, so an unset column coming back from the database
 * would otherwise sail through a Number.isFinite check and be treated as a
 * baseline of zero — which reports the entire hive, bees and woodware
 * included, as honey. That is the one mistake this module exists to prevent.
 */
const kg = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** A scale is any sensor pointed at a hive and weighing in kilograms. */
export const isHiveScale = (sensor) =>
  !!sensor?.hiveTag && /^kg$/i.test((sensor.unit || '').trim());

export const scaleForHive = (tag, sensors = []) =>
  sensors.find(s => isHiveScale(s) && s.hiveTag === tag) || null;

/** Local calendar day key — readings are grouped by the beekeeper's day. */
const dayKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Daily mean weight, oldest first.
 *
 * Averaging the day flattens the forage cycle, which otherwise swamps the
 * signal: the difference between a hive at dawn and the same hive at midday
 * can be larger than a good day's nectar.
 */
export function dailyMeans(readings = []) {
  const buckets = new Map();
  for (const r of readings) {
    const key = dayKey(r.recordedAt || r.receivedAt);
    const value = Number(r.value);
    if (!key || !Number.isFinite(value)) continue;
    const b = buckets.get(key) || { sum: 0, n: 0 };
    b.sum += value; b.n += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .map(([day, b]) => ({ day, kg: b.sum / b.n, samples: b.n }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Stores above the established baseline.
 *
 * Null when there is no baseline — an estimate without one would be the
 * weight of the bees presented as honey.
 */
export function storesEstimate(hive, currentKg) {
  const baseline = kg(hive?.baselineKg);
  if (baseline === null || !Number.isFinite(currentKg)) return null;
  return Math.round((currentKg - baseline) * 10) / 10;
}

/** What the colony and comb weigh, once there is both a tare and a baseline. */
export function colonyWeight(hive) {
  const tare = kg(hive?.tareKg);
  const baseline = kg(hive?.baselineKg);
  if (tare === null || baseline === null) return null;
  return Math.round((baseline - tare) * 10) / 10;
}

/**
 * Average daily change over the last `days` complete days of means.
 * Null until there are at least two days to compare.
 */
export function trend(readings = [], days = 7) {
  const means = dailyMeans(readings);
  if (means.length < 2) return null;

  const window = means.slice(-Math.max(2, days));
  const first = window[0];
  const last = window[window.length - 1];
  const span = (new Date(last.day) - new Date(first.day)) / DAY;
  if (span <= 0) return null;

  const perDay = (last.kg - first.kg) / span;
  return {
    perDay: Math.round(perDay * 100) / 100,
    total: Math.round((last.kg - first.kg) * 10) / 10,
    days: span,
    from: first.day,
    to: last.day,
  };
}

/* A day's nectar in a good flow is kilograms; a quiet hive drifts by grams.
   Below this the colony is holding steady rather than gaining or shrinking. */
const FLAT_PER_DAY = 0.2;

/**
 * A sudden loss large enough to mean something happened: a swarm leaving, a
 * robbing event, a harvest, or the hive knocked over. A prime swarm can take
 * well over a kilogram of bees with it, so the bar sits above ordinary
 * day-to-day movement without being so high that a swarm slips under it.
 */
const DROP_KG = 1.5;

export const MOVEMENT = {
  flow:    { label: 'Gaining',  tone: 'green', hint: 'Putting on weight — a flow is on. Check whether it needs more room.' },
  steady:  { label: 'Steady',   tone: 'slate', hint: 'Holding its weight.' },
  dearth:  { label: 'Losing',   tone: 'amber', hint: 'Losing weight — the colony is eating into its stores.' },
  drop:    { label: 'Sharp drop', tone: 'red', hint: 'A sudden loss. Swarm, robbing, a harvest, or the hive is over.' },
};

/**
 * Everything worth saying about one hive's weight.
 *
 * Returns null when there is no scale or nothing has been weighed — the page
 * then says so plainly rather than rendering zeroes that look like readings.
 */
export function hiveWeightStatus(hive, sensor, readings = []) {
  if (!sensor) return null;

  const means = dailyMeans(readings);
  const latest = readings.length
    ? Number(readings[0]?.value)
    : Number(sensor.value);
  if (!Number.isFinite(latest)) return null;

  const week = trend(readings, 7);
  const dayOverDay = means.length >= 2
    ? Math.round((means[means.length - 1].kg - means[means.length - 2].kg) * 10) / 10
    : null;

  let movement = 'steady';
  if (dayOverDay !== null && dayOverDay <= -DROP_KG) movement = 'drop';
  else if (week && week.perDay > FLAT_PER_DAY) movement = 'flow';
  else if (week && week.perDay < -FLAT_PER_DAY) movement = 'dearth';

  const stores = storesEstimate(hive, latest);
  const min = kg(hive?.minStoresKg);
  const lowStores = min !== null && stores !== null && stores < min;

  return {
    currentKg: Math.round(latest * 10) / 10,
    stores,
    colonyKg: colonyWeight(hive),
    week,
    dayOverDay,
    movement,
    lowStores,
    minStoresKg: min,
    days: means.length,
    // A trend needs history. Say so rather than drawing a line through two points.
    thin: means.length < 3,
  };
}

/**
 * Per-apiary roll-up. Only scaled hives count towards the totals, and the
 * count of unscaled ones is returned so the page can say what the number does
 * not cover rather than implying it weighed the whole yard.
 */
export function apiaryWeights(hives = [], sensors = [], readingsByHive = {}) {
  const sites = {};

  for (const hive of hives) {
    const name = hive.location?.trim() || 'Unassigned';
    const site = sites[name] ||= {
      name, hives: 0, scaled: 0, totalKg: 0, totalStores: 0,
      storesKnown: false, alerts: [],
    };
    site.hives += 1;

    const sensor = scaleForHive(hive.tag, sensors);
    const status = hiveWeightStatus(hive, sensor, readingsByHive[hive.tag] || []);
    if (!status) continue;

    site.scaled += 1;
    site.totalKg += status.currentKg;
    if (status.stores !== null) { site.totalStores += status.stores; site.storesKnown = true; }
    if (status.movement === 'drop') site.alerts.push({ tag: hive.tag, kind: 'drop' });
    if (status.lowStores) site.alerts.push({ tag: hive.tag, kind: 'low' });
  }

  return Object.values(sites)
    .map(s => ({
      ...s,
      totalKg: Math.round(s.totalKg * 10) / 10,
      totalStores: s.storesKnown ? Math.round(s.totalStores * 10) / 10 : null,
    }))
    .sort((a, b) => b.scaled - a.scaled || a.name.localeCompare(b.name));
}
