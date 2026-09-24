import { timingSafeEqual } from 'node:crypto';
import { prisma } from '../lib/db.js';

/**
 * Telemetry from a physical device.
 *
 *   POST /.netlify/functions/ingest
 *   Authorization: Bearer <device token>
 *   { "deviceId": "FT-AB12", "value": 24.3, "unit": "°C", "ts": 1769000000 }
 *
 * Unauthenticated by session on purpose — a sensor in a field has no cookie
 * and no login. The device token is the credential, and it is scoped to one
 * device belonging to one account, so the worst a leaked token can do is
 * write false readings for that one sensor.
 *
 * Returns 202 rather than 200: the reading is accepted and stored, but the
 * device is not waiting on anything we do with it afterwards.
 */

/** Matches the client-side rule in DataContext so a reading means the same thing either way. */
const statusFor = (value, sensor) =>
  value < (sensor?.min ?? 0) ? 'alert' : value > (sensor?.max ?? 9999) ? 'warn' : 'normal';

/* A device reporting every minute writes over half a million rows a year.
   Readings older than this are dropped, occasionally, on write — see prune(). */
const RETENTION_DAYS = 30;
const PRUNE_CHANCE = 0.02;

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const token = bearer(req.headers.get('authorization'));
  if (!token) return json({ error: 'Missing device token.' }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }

  const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.trim() : '';
  if (!deviceId) return json({ error: 'deviceId is required.' }, 400);

  const value = Number(body?.value);
  if (!Number.isFinite(value)) {
    return json({ error: 'value must be a number.' }, 400);
  }

  try {
    // deviceId is only unique within an account, so several accounts could in
    // principle hold the same one. The token decides which — never the id
    // alone, which would let one account write into another's sensor.
    const candidates = await prisma.device.findMany({
      where: { deviceId },
      include: { sensor: true },
    });

    const device = candidates.find(d => d.token && sameToken(d.token, token));

    // One answer for "no such device" and "wrong token" alike, so the endpoint
    // cannot be used to discover which device ids exist.
    if (!device) return json({ error: 'Unknown device or token.' }, 401);

    const status = statusFor(value, device.sensor);
    const recordedAt = timestampFrom(body?.ts);
    const unit = typeof body?.unit === 'string' ? body.unit.slice(0, 16) : device.sensor?.unit ?? null;

    const writes = [
      prisma.deviceReading.create({
        data: {
          userId: device.userId,
          deviceId: device.id,
          sensorId: device.sensorId,
          value, unit, status, recordedAt,
        },
      }),
      prisma.device.update({
        where: { id: device.id },
        data: { status: 'online', lastSeen: new Date() },
      }),
    ];

    // A manual reading is a person overriding the sensor. Telemetry is stored
    // either way, but it does not silently overwrite that override — the
    // person clears it themselves.
    if (device.sensor && !device.sensor.isManual) {
      writes.push(prisma.sensor.update({
        where: { id: device.sensor.id },
        data: { value, status },
      }));
    }

    await prisma.$transaction(writes);

    if (Math.random() < PRUNE_CHANCE) await prune(device.id);

    return json({
      ok: true,
      status,
      overridden: !!device.sensor?.isManual,
    }, 202);
  } catch (err) {
    console.error('ingest failed', err);
    return json({ error: 'Could not store the reading.' }, 500);
  }
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function bearer(header) {
  if (typeof header !== 'string') return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m ? m[1].trim() : null;
}

/** Constant-time, and length-safe — timingSafeEqual throws on a length mismatch. */
function sameToken(stored, given) {
  const a = Buffer.from(String(stored));
  const b = Buffer.from(String(given));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Devices send seconds, milliseconds, or an ISO string, and a device that has
 * lost power sends 1970. Anything not a sane recent time falls back to now,
 * because a reading with a wrong date is harder to spot than one with none.
 */
function timestampFrom(ts) {
  const now = Date.now();
  let ms = null;

  if (typeof ts === 'number' && Number.isFinite(ts)) {
    ms = ts > 1e11 ? ts : ts * 1000;       // > ~1973 in ms means it already is ms
  } else if (typeof ts === 'string' && ts) {
    const parsed = Date.parse(ts);
    if (!Number.isNaN(parsed)) ms = parsed;
  }

  if (ms === null) return new Date(now);

  const YEAR = 365 * 86400000;
  // A clock a day ahead is drift; a year ahead is wrong.
  if (ms < now - YEAR || ms > now + 86400000) return new Date(now);
  return new Date(ms);
}

/**
 * Trims a device's history. Done on write rather than on a schedule because
 * Netlify Functions have no scheduler here, and sampled rather than every time
 * so the common path stays a single insert.
 */
async function prune(deviceRowId) {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);
  try {
    const { count } = await prisma.deviceReading.deleteMany({
      where: { deviceId: deviceRowId, receivedAt: { lt: cutoff } },
    });
    if (count) console.log(`ingest: pruned ${count} readings older than ${RETENTION_DAYS}d`);
  } catch (err) {
    // Never fail an accepted reading because tidying up failed.
    console.error('ingest: prune failed', err);
  }
}
