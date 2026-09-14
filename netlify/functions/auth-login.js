import { prisma } from '../lib/db.js';
import {
  json, verifyPassword, createSessionToken, sessionCookie,
  publicUser, normaliseEmail,
} from '../lib/auth.js';

/**
 * POST /.netlify/functions/auth-login
 * { email, password } -> { user } + session cookie
 *
 * The same message is returned whether the address is unknown or the password
 * is wrong, so the endpoint cannot be used to discover who has an account.
 */
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const email = normaliseEmail(body.email);
  const password = String(body.password || '');
  const DENY = { error: 'Invalid email or password.' };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return json(DENY, 401);

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return json(DENY, 401);

    const token = await createSessionToken(user.id);
    return json({ user: publicUser(user) }, 200, { 'Set-Cookie': sessionCookie(req, token) });
  } catch (err) {
    console.error('login failed', err);
    return json({ error: 'Could not sign you in — please try again.' }, 500);
  }
};
