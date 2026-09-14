import { prisma } from '../lib/db.js';
import {
  json, withUser, verifyPassword, hashPassword,
  createSessionToken, sessionCookie, validPassword,
} from '../lib/auth.js';

/**
 * POST /.netlify/functions/auth-password
 * { current, next } -> { ok: true } + a fresh session cookie
 *
 * Knowing the current password is required, so a borrowed session cannot be
 * used to lock the real owner out.
 */
export default withUser(async (req, user) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const current = String(body.current || '');
  const next = body.next;

  const pwErr = validPassword(next);
  if (pwErr) return json({ error: pwErr }, 400);

  try {
    const ok = await verifyPassword(current, user.passwordHash);
    if (!ok) return json({ error: 'Your current password is incorrect.' }, 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next) },
    });

    // Re-issue the session so the current device stays signed in.
    const token = await createSessionToken(user.id);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(req, token) });
  } catch (err) {
    console.error('password change failed', err);
    return json({ error: 'Could not change your password — please try again.' }, 500);
  }
});
