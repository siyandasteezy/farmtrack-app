import { sendEmail } from '../lib/email.js';

/**
 * POST /.netlify/functions/contact  { name, email, subject?, message, website? }
 *
 * Public on purpose — someone weighing the product up has no account yet.
 * The message is sent from the verified isibaya domain with Reply-To set to
 * the sender, so replying from the support inbox reaches them directly.
 *
 * The support address is a published contact address, not a secret, so it
 * lives here rather than in an environment variable — an env var whose value
 * also appears in the repo trips Netlify's secrets scanner.
 */

const SUPPORT_EMAIL = 'support@smartpick.co.za';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Keeps a hostile value out of the Subject/Reply-To headers. */
const oneLine = (s, max) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }

  // Honeypot: a real person never fills a field they cannot see.
  if (body.website) return json({ ok: true });

  const name    = oneLine(body.name, 120);
  const email   = oneLine(body.email, 200).toLowerCase();
  const subject = oneLine(body.subject, 150);
  const message = String(body.message ?? '').trim().slice(0, 5000);

  if (!name)    return json({ error: 'Please tell us your name.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);
  if (message.length < 10) return json({ error: 'Please include a little more detail in your message.' }, 400);

  const heading = subject || 'Website enquiry';

  const sent = await sendEmail({
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject: `isibaya — ${heading}`,
    text: `${heading}\n\nFrom: ${name} <${email}>\n\n${message}\n\n— sent from the isibaya contact form`,
    html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);">
        <tr><td style="background:linear-gradient(135deg,#14532d,#15803d);padding:20px 26px;">
          <div style="font-size:16px;font-weight:800;color:#fff;">🐄 isibaya — contact form</div>
        </td></tr>
        <tr><td style="padding:24px 26px;">
          <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#0f172a;">${esc(heading)}</p>
          <p style="margin:0 0 18px;font-size:13px;color:#64748b;">
            From <strong style="color:#0f172a;">${esc(name)}</strong> ·
            <a href="mailto:${esc(email)}" style="color:#15803d;">${esc(email)}</a>
          </p>
          <div style="font-size:14px;line-height:1.65;color:#334155;white-space:pre-wrap;border-left:3px solid #bbf7d0;padding-left:14px;">${esc(message)}</div>
          <p style="margin:22px 0 0;font-size:12px;color:#94a3b8;">Reply directly to this email to answer ${esc(name)}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  });

  if (!sent.ok) {
    console.error('contact form send failed', sent.error);
    return json({ error: "We couldn't send your message just now. Please email support@smartpick.co.za directly." }, 502);
  }

  return json({ ok: true });
};
