import { prisma } from '../lib/db.js';
import { json, withUser, publicUser } from '../lib/auth.js';

/**
 * Confirms a checkout with Yoco (server-side, using the secret key) when the
 * user returns from the hosted payment page, and — only if Yoco itself says
 * "completed" — records the payment and extends the subscription by a month.
 *
 * Access therefore comes from the database, not from the browser claiming to
 * have paid.
 *
 * POST /.netlify/functions/yoco-verify-checkout { checkoutId } -> { status, user }
 */

const YOCO_API = 'https://payments.yoco.com/api';

/** Extends from the later of now and any remaining paid period. */
function nextPeriodEnd(current, now) {
  const base = current && current > now ? new Date(current) : new Date(now);
  const end = new Date(base);
  end.setMonth(end.getMonth() + 1);
  return end;
}

export default withUser(async (req, user) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.YOCO_SECRET_KEY;
  if (!key) return json({ error: 'Payments are not configured yet (YOCO_SECRET_KEY missing).' }, 503);

  let body = {};
  try { body = await req.json(); } catch { /* handled below */ }

  const id = body.checkoutId;
  if (!id || typeof id !== 'string') return json({ error: 'checkoutId is required.' }, 400);

  try {
    // The checkout must belong to this account — otherwise anyone could
    // redeem someone else's completed checkout id.
    const payment = await prisma.payment.findUnique({ where: { yocoCheckoutId: id } });
    if (!payment || payment.userId !== user.id) {
      return json({ status: 'unknown' });
    }

    if (payment.status === 'PAID') {
      const fresh = await prisma.user.findUnique({ where: { id: user.id } });
      return json({ status: 'completed', user: publicUser(fresh) });
    }

    const res = await fetch(`${YOCO_API}/checkouts/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return json({ status: 'unknown' });

    const status = data.status ?? 'unknown';
    if (status !== 'completed') {
      if (status === 'failed') {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      }
      return json({ status });
    }

    const now = new Date();
    const periodEnd = nextPeriodEnd(user.subscriptionEndsAt, now);

    const [, updatedUser] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', paidAt: now, periodStart: now, periodEnd },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { subscriptionEndsAt: periodEnd },
      }),
    ]);

    return json({ status: 'completed', user: publicUser(updatedUser) });
  } catch (err) {
    console.error('Yoco verify error', err);
    return json({ status: 'unknown' });
  }
});
