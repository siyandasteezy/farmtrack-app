import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/db.js';
import { json, withUser } from '../lib/auth.js';

/**
 * Creates a Yoco Checkout for one month of isibaya Pro and returns the hosted
 * page's redirect URL. The Yoco SECRET key lives only here, server-side.
 *
 * The checkout is recorded against the signed-in user as PENDING, so the
 * payment can later be tied back to an account without trusting anything the
 * browser reports.
 *
 * Env: YOCO_SECRET_KEY, optional APP_URL.
 * POST /.netlify/functions/yoco-create-checkout -> { id, redirectUrl }
 */

const YOCO_API = 'https://payments.yoco.com/api';
export const PLAN_AMOUNT_CENTS = 180_000; // R1,800.00
export const PLAN_CURRENCY = 'ZAR';

export default withUser(async (req, user) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.YOCO_SECRET_KEY;
  if (!key) {
    return json({ error: 'Payments are not configured yet (YOCO_SECRET_KEY missing).' }, 503);
  }

  // Money is about to change hands, and the receipt and any billing notice go
  // to this address — so it has to be one the account holder actually controls.
  if (!user.emailVerified) {
    return json({
      error: 'Please confirm your email address before subscribing.',
      needsEmailVerification: true,
    }, 403);
  }

  const origin = process.env.APP_URL || new URL(req.url).origin;

  try {
    const res = await fetch(`${YOCO_API}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        amount: PLAN_AMOUNT_CENTS,
        currency: PLAN_CURRENCY,
        successUrl: `${origin}/payment?yoco=success`,
        cancelUrl: `${origin}/payment?yoco=cancelled`,
        failureUrl: `${origin}/payment?yoco=failed`,
        metadata: { userId: user.id, product: 'isibaya-monthly' },
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.redirectUrl) {
      console.error('Yoco checkout failed', res.status, data);
      return json({ error: 'Could not start the payment — please try again.' }, 502);
    }

    await prisma.payment.create({
      data: {
        userId: user.id,
        yocoCheckoutId: data.id,
        amountCents: PLAN_AMOUNT_CENTS,
        currency: PLAN_CURRENCY,
        status: 'PENDING',
      },
    });

    return json({ id: data.id, redirectUrl: data.redirectUrl }, 201);
  } catch (err) {
    console.error('Yoco checkout error', err);
    return json({ error: 'Could not reach the payment provider.' }, 502);
  }
});
