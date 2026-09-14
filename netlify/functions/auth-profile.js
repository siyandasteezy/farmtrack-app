import { prisma } from '../lib/db.js';
import { json, withUser, publicUser, initialsOf, normaliseEmail } from '../lib/auth.js';

/**
 * POST /.netlify/functions/auth-profile
 * { name?, farm?, email?, avatar? } -> { user, emailChanged }
 *
 * Changing the address clears emailVerified — a confirmed old address says
 * nothing about a new one.
 */
export default withUser(async (req, user) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const name  = body.name  === undefined ? user.name : String(body.name).trim();
  const farm  = body.farm  === undefined ? user.farm : String(body.farm).trim();
  const email = body.email === undefined ? user.email : normaliseEmail(body.email);
  const avatar = body.avatar === undefined
    ? user.avatar
    : (String(body.avatar).trim().slice(0, 2).toUpperCase() || initialsOf(name));

  if (!name) return json({ error: 'Name is required.' }, 400);
  if (!email || !email.includes('@')) return json({ error: 'A valid email is required.' }, 400);

  const emailChanged = email !== user.email;

  try {
    if (emailChanged) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) return json({ error: 'Another account already uses that email.' }, 409);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name, farm, email,
        avatar: avatar || initialsOf(name),
        ...(emailChanged ? { emailVerified: false } : {}),
      },
    });

    return json({ user: publicUser(updated), emailChanged });
  } catch (err) {
    if (err?.code === 'P2002') {
      return json({ error: 'Another account already uses that email.' }, 409);
    }
    console.error('profile update failed', err);
    return json({ error: 'Could not save your changes — please try again.' }, 500);
  }
});
