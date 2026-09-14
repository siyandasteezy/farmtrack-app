import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db.js';

/**
 * Session handling. The session is a signed JWT carried in an httpOnly cookie,
 * so page scripts cannot read or forge it — unlike the localStorage flag this
 * replaces. Subscription state is always read from the database, never from
 * anything the browser sends.
 */

const COOKIE = 'isibaya_session';
const SESSION_DAYS = 30;
const TRIAL_DAYS = 14;

export const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(s);
}

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw, hash) => bcrypt.compare(pw, hash);

export async function createSessionToken(userId) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

/** Cookie is Secure in production; localhost has no HTTPS under `netlify dev`. */
function cookieAttrs(req) {
  const isLocal = new URL(req.url).hostname === 'localhost';
  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(isLocal ? [] : ['Secure']),
  ];
}

export function sessionCookie(req, token) {
  return `${COOKIE}=${token}; ${cookieAttrs(req).join('; ')}; Max-Age=${SESSION_DAYS * 86400}`;
}

export function clearCookie(req) {
  return `${COOKIE}=; ${cookieAttrs(req).join('; ')}; Max-Age=0`;
}

function readCookie(req, name) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

/** Returns the signed-in user row, or null. Never throws on a bad token. */
export async function getSessionUser(req) {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload?.uid) return null;
    return await prisma.user.findUnique({ where: { id: String(payload.uid) } });
  } catch {
    return null; // expired, tampered with, or signed by a rotated secret
  }
}

/** Wraps a handler so it only runs for a signed-in user. */
export function withUser(handler) {
  return async (req) => {
    const user = await getSessionUser(req);
    if (!user) return json({ error: 'Not signed in.' }, 401);
    return handler(req, user);
  };
}

/**
 * Whether the account may use the app right now. Derived from the database,
 * so it cannot be faked from the client.
 */
export function accessFor(user, now = new Date()) {
  if (user.subscriptionEndsAt && user.subscriptionEndsAt > now) {
    return { plan: 'active', until: user.subscriptionEndsAt, active: true };
  }
  if (user.trialEndsAt && user.trialEndsAt > now) {
    const daysLeft = Math.ceil((user.trialEndsAt - now) / 86400000);
    return { plan: 'trial', until: user.trialEndsAt, daysLeft, active: true };
  }
  return { plan: 'unpaid', until: null, active: false };
}

/** The only user shape the browser ever receives — no hash, no salt. */
export function publicUser(user) {
  const access = accessFor(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    farm: user.farm,
    avatar: user.avatar,
    role: user.role,
    emailVerified: user.emailVerified,
    joinedAt: user.createdAt?.toISOString().slice(0, 10),
    plan: access.plan,
    planUntil: access.until,
    trialEnds: user.trialEndsAt?.toISOString().slice(0, 10) ?? null,
    active: access.active,
  };
}

export const trialEnd = () => new Date(Date.now() + TRIAL_DAYS * 86400000);

export const initialsOf = (name) =>
  name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const normaliseEmail = (e) => String(e || '').trim().toLowerCase();

export function validPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
}
