import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from './db.js';

/**
 * Shared billing logic for the two places a payment can be confirmed: the
 * browser coming back from Yoco, and Yoco's webhook. Both funnel through
 * markPaidAndExtend so a single payment can never buy two months.
 */

export const PLAN_AMOUNT_CENTS = 180_000; // R1,800.00
export const PLAN_CURRENCY = 'ZAR';

/** Yoco recommends rejecting deliveries older than three minutes. */
const TOLERANCE_SECONDS = 180;

/**
 * Verifies a webhook against the Standard Webhooks scheme Yoco uses:
 * HMAC-SHA256 over `{webhook-id}.{webhook-timestamp}.{raw body}`, keyed with
 * the base64-decoded part of the whsec_… secret, compared in constant time.
 *
 * The raw body must be the exact bytes received — re-serialising parsed JSON
 * can reorder keys and produce a different signature.
 */
export function verifyYocoWebhook(headers, rawBody) {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');

  if (!secret || !id || !timestamp || !signatureHeader) return false;

  // Reject stale deliveries so a captured request cannot be replayed later.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;

  let key;
  try {
    key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  } catch {
    return false;
  }
  if (!key.length) return false;

  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest('base64');

  // The header carries space-separated "v1,<signature>" entries; any match wins.
  return signatureHeader.split(' ').some(part => {
    const sig = part.split(',')[1] ?? '';
    try {
      const a = Buffer.from(sig, 'base64');
      const b = Buffer.from(expected, 'base64');
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

/** Extends from the later of now and any remaining paid period. */
export function nextPeriodEnd(current, now) {
  const base = current && current > now ? new Date(current) : new Date(now);
  const end = new Date(base);
  end.setMonth(end.getMonth() + 1);
  return end;
}

/**
 * Marks a payment paid and adds a month — exactly once.
 *
 * The status change is an atomic conditional update, so if the webhook and
 * the browser's return both arrive together, only the one that actually
 * flips PENDING -> PAID extends the subscription. Without that guard a
 * single payment could buy two months.
 *
 * Returns { applied, user }.
 */
export async function markPaidAndExtend(paymentId, userId) {
  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, status: 'PENDING' },
    data: { status: 'PAID' },
  });

  if (claimed.count === 0) {
    // Already settled by the other path — report the current state, change nothing.
    return { applied: false, user: await prisma.user.findUnique({ where: { id: userId } }) };
  }

  const now = new Date();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const periodEnd = nextPeriodEnd(user?.subscriptionEndsAt, now);

  const [, updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { paidAt: now, periodStart: now, periodEnd },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { subscriptionEndsAt: periodEnd },
    }),
  ]);

  return { applied: true, user: updated };
}
