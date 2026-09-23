import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../lib/db.js';
import {
  json, hashPassword, createSessionToken, sessionCookie,
  publicUser, trialEnd, initialsOf, normaliseEmail, validPassword,
} from '../lib/auth.js';
import { sendEmail, confirmationEmail } from '../lib/email.js';
import { appOrigin } from '../lib/origin.js';

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

  // What the farm runs. Anything unrecognised falls back to livestock so a
  // malformed request can never leave an account with no modules at all.
  const allowed = ['livestock', 'crops'];
  const picked = Array.isArray(body.enterprises)
    ? body.enterprises.filter(e => allowed.includes(e))
    : [];
  const enterprises = picked.length ? picked : ['livestock'];

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
        enterprises,
        trialEndsAt: trialEnd(),
      },
    });

    // Send the confirmation straight away, but never fail registration over
    // it — the account exists, and the email can be resent from the profile.
    try {
      const origin = appOrigin(req);
      const raw = randomBytes(32).toString('hex');
      await prisma.emailVerification.create({
        data: {
          userId: user.id,
          email: user.email,
          tokenHash: createHash('sha256').update(raw).digest('hex'),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      const mail = confirmationEmail({ name: user.name, link: `${origin}/verify-email?token=${raw}` });
      const sent = await sendEmail({ to: user.email, ...mail });
      if (!sent.ok) console.error('welcome confirmation not sent:', sent.error);
    } catch (mailErr) {
      console.error('welcome confirmation failed', mailErr);
    }

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
