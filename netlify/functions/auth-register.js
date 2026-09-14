import { prisma } from '../lib/db.js';
import {
  json, hashPassword, createSessionToken, sessionCookie,
  publicUser, trialEnd, initialsOf, normaliseEmail, validPassword,
} from '../lib/auth.js';

/**
 * POST /.netlify/functions/auth-register
 * { name, farm, email, password } -> { user }  + session cookie
 */
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const name  = String(body.name || '').trim();
  const farm  = String(body.farm || '').trim();
  const email = normaliseEmail(body.email);
  const password = body.password;

  if (!name)  return json({ error: 'Your name is required.' }, 400);
  if (!email || !email.includes('@')) return json({ error: 'A valid email is required.' }, 400);
  const pwErr = validPassword(password);
  if (pwErr) return json({ error: pwErr }, 400);

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return json({ error: 'An account with that email already exists.' }, 409);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        farm,
        passwordHash: await hashPassword(password),
        avatar: initialsOf(name),
        trialEndsAt: trialEnd(),
      },
    });

    const token = await createSessionToken(user.id);
    return json({ user: publicUser(user) }, 201, { 'Set-Cookie': sessionCookie(req, token) });
  } catch (err) {
    // Unique constraint — someone registered the same email concurrently.
    if (err?.code === 'P2002') {
      return json({ error: 'An account with that email already exists.' }, 409);
    }
    console.error('register failed', err);
    return json({ error: 'Could not create your account — please try again.' }, 500);
  }
};
