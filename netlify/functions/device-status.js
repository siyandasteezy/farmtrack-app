import { prisma } from '../lib/db.js';
import { json, withUser } from '../lib/auth.js';

/**
 * Whether a device has actually reported, and what it last sent.
 *
 * Exists so the setup wizard can wait for a real reading instead of claiming
 * success. The previous "verify" step printed a scripted ACK after a timer,
 * which told people their hardware was connected when nothing had been
 * received at all.
 *
 * Light on purpose — the wizard polls it every few seconds, so it must not
 * drag the whole farm dataset along the way the main data endpoint does.
 *
 * GET /.netlify/functions/device-status?deviceId=FT-AB12
 */

export default withUser(async (req, user) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const deviceId = new URL(req.url).searchParams.get('deviceId');
  if (!deviceId) return json({ error: 'deviceId is required.' }, 400);

  try {
    const device = await prisma.device.findFirst({
      where: { deviceId, userId: user.id },   // scoped, so no peeking at other accounts
      select: { id: true, status: true, lastSeen: true },
    });

    if (!device) return json({ found: false, reported: false });

    const latest = await prisma.deviceReading.findFirst({
      where: { deviceId: device.id },
      orderBy: { receivedAt: 'desc' },
      select: { value: true, unit: true, status: true, recordedAt: true, receivedAt: true },
    });

    return json({
      found: true,
      reported: !!latest,
      status: device.status,
      lastSeen: device.lastSeen,
      latest: latest || null,
    });
  } catch (err) {
    console.error('device-status failed', err);
    return json({ error: 'Could not check the device.' }, 500);
  }
});
