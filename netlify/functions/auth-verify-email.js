import { createHash } from 'node:crypto';
import { prisma } from '../lib/db.js';
import { json, publicUser } from '../lib/auth.js';

/**
 * POST /.netlify/functions/auth-verify-email  { token } -> { ok, user? }
 *
 * Deliberately unauthenticated: the link is often opened in a different
 * browser from the one that requested it. The token itself is the proof, so
 * it is single-use, time-limited, and only valid while the account still has
 * the address it was issued for.
 */

const hash = (t) => createHash('sha256').update(t).digest('hex');

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  const token = String(body.token || '');
  if (!token) return json({ error: 'This confirmation link is missing its token.' }, 400);

  try {
    const record = await prisma.emailVerification.findUnique({
      where: { tokenHash: hash(token) },
      include: { user: true },
    });

    if (!record) {
      return json({ error: 'This confirmation link is not valid. Request a new one from your profile.' }, 400);
    }
    if (record.usedAt) {
      // Already confirmed — treat as success so a second click isn't alarming.
      return json({ ok: true, already: true });
    }
    if (record.expiresAt < new Date()) {
      return json({ error: 'This confirmation link has expired. Request a new one from your profile.' }, 400);
    }
    if (record.email !== record.user.email) {
      return json({ error: 'Your email address changed after this link was sent. Request a new one.' }, 400);
    }

    const [, updated] = await prisma.$transaction([
      prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
    ]);

    return json({ ok: true, user: publicUser(updated) });
  } catch (err) {
    console.error('verify email failed', err);
    return json({ error: 'Could not confirm your email — please try again.' }, 500);
  }
};
