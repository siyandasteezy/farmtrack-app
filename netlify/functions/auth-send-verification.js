import { randomBytes, createHash } from 'node:crypto';
import { prisma } from '../lib/db.js';
import { json, withUser } from '../lib/auth.js';
import { sendEmail, confirmationEmail } from '../lib/email.js';
import { appOrigin } from '../lib/origin.js';

/**
 * POST /.netlify/functions/auth-send-verification -> { ok }
 *
 * Issues a single-use confirmation link. Only the SHA-256 of the token is
 * stored, so a database leak does not yield working links, and the token is
 * bound to the address it was issued for — changing the email invalidates any
 * link already in flight.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const hash = (t) => createHash('sha256').update(t).digest('hex');

export default withUser(async (req, user) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (user.emailVerified) {
    return json({ ok: true, alreadyVerified: true });
  }

  try {
    // Cheap throttle so the button cannot be used to mail-bomb an address.
    const recent = await prisma.emailVerification.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
      return json({ error: `Please wait ${wait}s before requesting another email.` }, 429);
    }

    // Any earlier link for this account stops working once a new one is issued.
    await prisma.emailVerification.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = randomBytes(32).toString('hex');
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const origin = appOrigin(req);
    const link = `${origin}/verify-email?token=${token}`;
    const { subject, html, text } = confirmationEmail({ name: user.name, link });

    const sent = await sendEmail({ to: user.email, subject, html, text });
    if (!sent.ok) {
      // Don't leave a token behind for an email that never went out.
      await prisma.emailVerification.deleteMany({ where: { userId: user.id, usedAt: null } });
      return json({ error: sent.error }, 502);
    }

    return json({ ok: true, sentTo: user.email });
  } catch (err) {
    console.error('send verification failed', err);
    return json({ error: 'Could not send the confirmation email — please try again.' }, 500);
  }
});
