/**
 * Transactional email via Resend.
 *
 * Failures are reported rather than swallowed — an unsent confirmation email
 * looks identical to a lost one from the user's side, and silently "succeeding"
 * would leave them waiting for a message that was never sent.
 */

const RESEND_API = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'isibaya <no-reply@isibaya.smartpick.co.za>';

export async function sendEmail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'Email is not configured yet (RESEND_API_KEY missing).' };

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || DEFAULT_FROM,
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
        // Lets support reply straight to the person who wrote in, even though
        // the message is sent from our own verified domain.
        ...(replyTo ? { reply_to: [replyTo] } : {}),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('Resend rejected the send', res.status, data);
      return { ok: false, error: data?.message || 'The email could not be sent.' };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('Resend request failed', err);
    return { ok: false, error: 'Could not reach the email service.' };
  }
}

const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function confirmationEmail({ name, link }) {
  const safeName = esc(name || 'there');
  return {
    subject: 'Confirm your email for isibaya',
    text:
`Hi ${name || 'there'},

Confirm your email address to finish setting up your isibaya account:

${link}

This link works once and expires in 24 hours. If you didn't create an
isibaya account, you can ignore this message.

— isibaya`,
    html: `<!doctype html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#14532d,#15803d);padding:28px 32px;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.3px;">🐄 isibaya</div>
            <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:2px;">Livestock management for modern farms</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Hi ${safeName},</p>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
              Confirm your email address to finish setting up your isibaya account.
              We use it for your subscription receipts and anything important about your farm.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:linear-gradient(135deg,#16a34a,#15803d);">
              <a href="${link}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Confirm my email</a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
              This link works once and expires in 24 hours. If the button doesn't work, paste this into your browser:<br>
              <span style="color:#15803d;word-break:break-all;">${esc(link)}</span>
            </p>
            <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
              If you didn't create an isibaya account, you can ignore this message.
            </p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} isibaya</p>
    </td></tr>
  </table>
</body></html>`,
  };
}
