/**
 * The site's public origin, used for links in email and for Yoco's return URLs.
 *
 * APP_URL exists because some of these URLs are handed to a third party or
 * pasted into an email, where a deploy-preview hostname would be wrong. But an
 * env var that points at a domain the site no longer lives on fails quietly:
 * the confirmation link and the post-payment redirect both go somewhere
 * plausible-looking and dead, and nothing in the logs says so.
 *
 * That is exactly what happened after the insimi → isibaya rename — the old
 * host kept resolving to a parked page, so nothing errored. Hence the warning
 * below: when APP_URL disagrees with the host actually serving the request, it
 * is almost always the leftover, and it should be visible in the logs.
 */

export function appOrigin(req) {
  const requested = safeOrigin(req?.url);
  const configured = safeOrigin(process.env.APP_URL);

  if (!configured) {
    if (process.env.APP_URL) {
      console.warn(`appOrigin: APP_URL is not a valid URL (${process.env.APP_URL}) — using ${requested}`);
    }
    return requested;
  }

  // Deploy previews and localhost legitimately differ; a different apex domain
  // in production does not.
  if (requested && hostOf(requested) !== hostOf(configured)) {
    console.warn(
      `appOrigin: APP_URL (${configured}) does not match the host serving this ` +
      `request (${requested}). Email links and payment redirects will point at ` +
      `APP_URL — check it is still the live domain.`
    );
  }

  return configured;
}

function safeOrigin(value) {
  if (!value || typeof value !== 'string') return null;
  try { return new URL(value).origin; } catch { return null; }
}

const hostOf = (origin) => {
  try { return new URL(origin).host; } catch { return null; }
};
