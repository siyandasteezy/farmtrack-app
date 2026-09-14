import { prisma } from '../lib/db.js';
import { json, withUser } from '../lib/auth.js';
import { COLLECTIONS, SINGLETONS, sanitise, serialise } from '../lib/collections.js';

/**
 * Farm data, scoped to the signed-in account.
 *
 *   GET  /.netlify/functions/data            -> every collection in one trip
 *   POST /.netlify/functions/data            -> { collection, op, id?, record? }
 *
 * Every read and write is filtered by userId, so one account can never see or
 * touch another's rows even by guessing an id.
 */

export default withUser(async (req, user) => {
  if (req.method === 'GET')  return loadAll(user);
  if (req.method === 'POST') return mutate(req, user);
  return json({ error: 'Method not allowed' }, 405);
});

async function loadAll(user) {
  try {
    const names = Object.keys(COLLECTIONS);
    const rows = await Promise.all(names.map(name => {
      const spec = COLLECTIONS[name];
      return prisma[spec.model].findMany({
        where: { userId: user.id },
        orderBy: spec.orderBy,
      });
    }));

    const out = {};
    names.forEach((name, i) => { out[name] = rows[i].map(serialise); });

    for (const [name, spec] of Object.entries(SINGLETONS)) {
      const row = await prisma[spec.model].findUnique({ where: { userId: user.id } });
      out[name] = row ? serialise(row) : spec.empty;
    }

    return json(out);
  } catch (err) {
    console.error('data load failed', err);
    return json({ error: 'Could not load your farm data.' }, 500);
  }
}

async function mutate(req, user) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const { collection, op, id, record } = body || {};

  // Singletons are upserted whole.
  if (SINGLETONS[collection]) {
    const spec = SINGLETONS[collection];
    const { data, error } = sanitise(spec, record);
    if (error) return json({ error }, 400);
    try {
      const row = await prisma[spec.model].upsert({
        where: { userId: user.id },
        create: { ...data, userId: user.id },
        update: data,
      });
      return json({ record: serialise(row) });
    } catch (err) {
      console.error(`${collection} upsert failed`, err);
      return json({ error: 'Could not save that change.' }, 500);
    }
  }

  const spec = COLLECTIONS[collection];
  if (!spec) return json({ error: 'Unknown collection.' }, 400);

  try {
    if (op === 'create') {
      const { data, error } = sanitise(spec, record);
      if (error) return json({ error }, 400);
      const row = await prisma[spec.model].create({ data: { ...data, userId: user.id } });
      return json({ record: serialise(row) }, 201);
    }

    if (op === 'update') {
      if (!id) return json({ error: 'id is required.' }, 400);
      const { data, error } = sanitise(spec, record, { partial: true });
      if (error) return json({ error }, 400);
      // updateMany with the userId filter means another account's row simply
      // matches nothing, rather than being updated.
      const res = await prisma[spec.model].updateMany({
        where: { id: String(id), userId: user.id },
        data,
      });
      if (res.count === 0) return json({ error: 'That record no longer exists.' }, 404);
      const row = await prisma[spec.model].findUnique({ where: { id: String(id) } });
      return json({ record: serialise(row) });
    }

    if (op === 'delete') {
      if (!id) return json({ error: 'id is required.' }, 400);
      const res = await prisma[spec.model].deleteMany({
        where: { id: String(id), userId: user.id },
      });
      if (res.count === 0) return json({ error: 'That record no longer exists.' }, 404);
      return json({ ok: true });
    }

    if (op === 'import') {
      return importAll(body.payload, user);
    }

    return json({ error: 'Unknown operation.' }, 400);
  } catch (err) {
    if (err?.code === 'P2002') {
      return json({ error: 'A record with that identifier already exists.' }, 409);
    }
    console.error(`${collection}.${op} failed`, err);
    return json({ error: 'Could not save that change.' }, 500);
  }
}

/**
 * One-time move of a browser's existing data onto the account. Refuses if the
 * account already holds anything, so it cannot silently duplicate a farm.
 */
async function importAll(payload, user) {
  if (!payload || typeof payload !== 'object') return json({ error: 'Nothing to import.' }, 400);

  try {
    const existing = await prisma.animal.count({ where: { userId: user.id } });
    if (existing > 0) {
      return json({ error: 'This account already has livestock — import skipped.' }, 409);
    }

    const counts = {};
    // Sensors and devices/readings are linked, so sensors go first and their
    // old ids are mapped to the new ones.
    const order = ['sensors', ...Object.keys(COLLECTIONS).filter(c => c !== 'sensors')];
    const sensorIdMap = new Map();

    for (const name of order) {
      const spec = COLLECTIONS[name];
      const rows = Array.isArray(payload[name]) ? payload[name] : [];
      let made = 0;

      for (const raw of rows) {
        const { data, error } = sanitise(spec, raw);
        if (error) continue;                       // skip rows that can't satisfy the schema

        if (name === 'manualReadings' || name === 'devices') {
          const mapped = sensorIdMap.get(String(raw.sensorId));
          data.sensorId = mapped ?? null;
          if (name === 'manualReadings' && !data.sensorId) continue;  // reading needs its sensor
        }

        try {
          const created = await prisma[spec.model].create({ data: { ...data, userId: user.id } });
          if (name === 'sensors') sensorIdMap.set(String(raw.id), created.id);
          made += 1;
        } catch (rowErr) {
          if (rowErr?.code !== 'P2002') throw rowErr;  // ignore duplicate tags, keep going
        }
      }
      if (made) counts[name] = made;
    }

    for (const [name, spec] of Object.entries(SINGLETONS)) {
      if (!payload[name]) continue;
      const { data, error } = sanitise(spec, payload[name]);
      if (error) continue;
      await prisma[spec.model].upsert({
        where: { userId: user.id },
        create: { ...data, userId: user.id },
        update: data,
      });
      counts[name] = 1;
    }

    return json({ ok: true, counts });
  } catch (err) {
    console.error('import failed', err);
    return json({ error: 'Could not import your existing data.' }, 500);
  }
}
