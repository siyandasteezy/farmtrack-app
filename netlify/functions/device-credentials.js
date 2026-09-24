import { randomBytes } from 'node:crypto';
import { json, withUser } from '../lib/auth.js';

/**
 * Issues credentials for a new device.
 *
 * These used to be generated in the browser with Math.random(), which is not a
 * cryptographic generator — its output is predictable from previous values, so
 * anyone who saw one token could work towards others. A device token is the
 * only thing standing between a stranger and writing readings into someone's
 * farm, so it is minted here with the platform CSPRNG instead.
 *
 * Nothing is stored yet: the device row is created through the normal data
 * endpoint when the wizard finishes. This only mints the values.
 *
 * POST /.netlify/functions/device-credentials -> { deviceId, token }
 */

export default withUser(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  return json({
    // Short and readable — it is printed on a label and typed by a human.
    // Identifying, not secret: the token is what authenticates.
    deviceId: 'FT-' + randomBytes(3).toString('hex').toUpperCase(),
    // 32 bytes, hex. Long enough that guessing is not a strategy.
    token: 'ft_' + randomBytes(32).toString('hex'),
  }, 201);
});
