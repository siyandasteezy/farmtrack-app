import { json, getSessionUser, publicUser } from '../lib/auth.js';

/**
 * GET /.netlify/functions/auth-me -> { user } | { user: null }
 *
 * How the app restores a session on load. Returns 200 with a null user rather
 * than 401 so a signed-out visitor is a normal state, not an error.
 */
export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  try {
    const user = await getSessionUser(req);
    return json({ user: user ? publicUser(user) : null });
  } catch (err) {
    console.error('auth-me failed', err);
    return json({ user: null });
  }
};
