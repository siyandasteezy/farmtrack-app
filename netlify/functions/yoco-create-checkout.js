import { randomUUID } from 'node:crypto';

/**
 * Creates a Yoco Checkout for one month of isibaya Pro and returns the
 * hosted-page redirect URL. The Yoco SECRET key lives only here, server-side
 * — it must never be exposed to the browser.
 *
 * Env: YOCO_SECRET_KEY (sk_test_… / sk_live_…), optional APP_URL.
 * Endpoint: POST /.netlify/functions/yoco-create-checkout  ->  { id, redirectUrl }
 */

const YOCO_API = 'https://payments.yoco.com/api';
const PLAN_AMOUNT_CENTS = 180_000; // R1,800.00
const PLAN_CURRENCY = 'ZAR';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.YOCO_SECRET_KEY;
  if (!key) {
    return json({ error: 'Payments are not configured yet (YOCO_SECRET_KEY missing).' }, 503);
  }

  let body = {};
  try { body = await req.json(); } catch { /* body is optional */ }

  const origin = process.env.APP_URL || new URL(req.url).origin;
  const userId = typeof body.userId === 'string' ? body.userId : 'guest';

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
        metadata: { userId, product: 'isibaya-monthly' },
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.redirectUrl) {
      console.error('Yoco checkout failed', res.status, data);
      return json({ error: 'Could not start the payment — please try again.' }, 502);
    }
    return json({ id: data.id, redirectUrl: data.redirectUrl }, 201);
  } catch (err) {
    console.error('Yoco checkout error', err);
    return json({ error: 'Could not reach the payment provider.' }, 502);
  }
};
