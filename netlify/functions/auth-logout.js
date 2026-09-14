import { json, clearCookie } from '../lib/auth.js';

/** POST /.netlify/functions/auth-logout — expires the session cookie. */
export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie(req) });
};
