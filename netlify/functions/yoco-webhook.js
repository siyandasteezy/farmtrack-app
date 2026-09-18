import { prisma } from '../lib/db.js';
import { verifyYocoWebhook, markPaidAndExtend } from '../lib/billing.js';

/**
 * Receives payment events from Yoco.
 *
 * This is the reliable half of billing. The browser coming back from the
 * hosted payment page (yoco-verify-checkout) only runs if the customer waits
 * for the redirect — close the tab, lose signal, or have the phone ring, and
 * it never fires. Yoco sends this regardless, and retries it, so a paid
 * subscription activates either way.
 *
 * Deliberately unauthenticated: Yoco has no session. Authenticity comes from
 * the signature over the raw body, verified before anything is read out of it.
 *
 * POST /.netlify/functions/yoco-webhook
 * Env: YOCO_WEBHOOK_SECRET (whsec_…, from the webhook registration response)
 */

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  if (!process.env.YOCO_WEBHOOK_SECRET) {
    console.error('yoco-webhook: YOCO_WEBHOOK_SECRET is not set');
    return new Response('Not configured', { status: 503 });
  }

  // The exact bytes Yoco signed. Parsing and re-serialising would reorder keys
  // and break the signature, so the raw text is read first and parsed after.
  const rawBody = await req.text();

  if (!verifyYocoWebhook(req.headers, rawBody)) {
    console.warn('yoco-webhook: rejected an unverified delivery');
    return new Response('Invalid signature', { status: 401 });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Anything other than a successful payment is acknowledged and ignored —
  // a non-2xx would make Yoco retry an event we are never going to act on.
  if (event?.type !== 'payment.succeeded') {
    return ok();
  }

  try {
    const payment = await findPayment(event);
    if (!payment) {
      // Most likely a live event arriving at a test deployment, or a payment
      // taken outside this app. Acknowledge so it isn't retried forever.
      //
      // Yoco does not publish the payment.succeeded schema, so if the metadata
      // ever comes back somewhere other than payload.metadata this is the line
      // that says so. Keys only — the values can identify a customer.
      console.warn(
        'yoco-webhook: no matching payment for event', event.id,
        'payload keys:', Object.keys(event.payload ?? {}),
        'metadata keys:', Object.keys(event.payload?.metadata ?? {}),
      );
      return ok();
    }

    const { applied } = await markPaidAndExtend(payment.id, payment.userId);
    console.log(
      `yoco-webhook: payment ${payment.id} ${applied ? 'activated' : 'was already settled'}`
    );
    return ok();
  } catch (err) {
    // A 500 tells Yoco to retry, which is what we want if the database blinked.
    console.error('yoco-webhook: failed to apply payment', err);
    return new Response('Error', { status: 500 });
  }
};

const ok = () => Response.json({ received: true });

/**
 * Finds the Payment row this event belongs to.
 *
 * Preferred route is the Yoco checkout id, which is already stored against the
 * row. Failing that, the userId we attached as checkout metadata identifies
 * the account and the oldest outstanding checkout is the one being paid.
 */
async function findPayment(event) {
  const payload = event?.payload ?? {};
  const meta = lowerKeys(payload.metadata);

  const checkoutId =
    meta.checkoutid || payload.checkoutId || payload.checkout_id || payload.checkoutid;

  if (typeof checkoutId === 'string' && checkoutId) {
    const byCheckout = await prisma.payment.findUnique({
      where: { yocoCheckoutId: checkoutId },
    });
    if (byCheckout) return byCheckout;
  }

  const userId = meta.userid;
  if (typeof userId === 'string' && userId) {
    return prisma.payment.findFirst({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  return null;
}

/**
 * Yoco does not guarantee the case of metadata keys it echoes back, so `userId`
 * can arrive as `userid`. Matching case-insensitively avoids silently failing
 * to credit a payment because of it.
 */
function lowerKeys(obj) {
  if (!obj || typeof obj !== 'object') return {};
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
}
