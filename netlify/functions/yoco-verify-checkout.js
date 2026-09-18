import { prisma } from '../lib/db.js';
import { json, withUser, publicUser } from '../lib/auth.js';
import { markPaidAndExtend } from '../lib/billing.js';

/**
 * Confirms a checkout with Yoco (server-side, using the secret key) when the
 * user returns from the hosted payment page, and — only if Yoco itself says
 * "completed" — records the payment and extends the subscription by a month.
 *
 * Access therefore comes from the database, not from the browser claiming to
 * have paid.
 *
 * This is the fast path, so the user sees their subscription live the moment
 * they return. yoco-webhook is the backstop for when they never come back; the
 * two share markPaidAndExtend, which only lets one of them add the month.
 *
 * POST /.netlify/functions/yoco-verify-checkout { checkoutId } -> { status, user }
 */

const YOCO_API = 'https://payments.yoco.com/api';

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

    // If the webhook got here first this adds nothing and simply reports the
    // account as it already stands.
    const { user: updatedUser } = await markPaidAndExtend(payment.id, user.id);

    return json({ status: 'completed', user: publicUser(updatedUser) });
  } catch (err) {
    console.error('Yoco verify error', err);
    return json({ status: 'unknown' });
  }
});
