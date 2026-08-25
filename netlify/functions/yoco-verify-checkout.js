/**
 * Confirms a Yoco checkout's status directly with Yoco (server-side, using the
 * secret key) when the user returns from the hosted payment page. The client
 * passes the checkoutId it stored before redirecting.
 *
 * Endpoint: POST /.netlify/functions/yoco-verify-checkout  { checkoutId }
 *   ->  { status }   // "completed" means paid
 */

const YOCO_API = 'https://payments.yoco.com/api';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = process.env.YOCO_SECRET_KEY;
  if (!key) return json({ error: 'Payments are not configured yet (YOCO_SECRET_KEY missing).' }, 503);

  let body = {};
  try { body = await req.json(); } catch { /* handled below */ }

  const id = body.checkoutId;
  if (!id || typeof id !== 'string') return json({ error: 'checkoutId is required.' }, 400);

  try {
    const res = await fetch(`${YOCO_API}/checkouts/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return json({ status: 'unknown' });
    return json({ status: data.status ?? 'unknown' });
  } catch (err) {
    console.error('Yoco verify error', err);
    return json({ status: 'unknown' });
  }
};
