import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const USERS_KEY   = 'isibaya_users';
const SESSION_KEY = 'isibaya_user';

/* Seed account. Registered accounts are stored alongside it in USERS_KEY —
   without that the registry resets on every page load and anyone who signs
   up is locked out the moment they log out. */
const SEED_USERS = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@greenmeadows.farm',
    password: 'farm1234',      // legacy plaintext — upgraded to a hash on first login
    farm: 'Green Meadows Farm',
    plan: 'active',            // active | trial | unpaid
    trialEnds: null,
    avatar: 'JD',
    role: 'Owner',
    joinedAt: '2024-01-15',
    emailVerified: true,
  },
];

/* ── storage helpers ─────────────────────────────────────────────────── */

function loadUsers() {
  try {
    const v = localStorage.getItem(USERS_KEY);
    return v ? JSON.parse(v) : SEED_USERS;
  } catch { return SEED_USERS; }
}

function saveUsers(list) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(list)); } catch { /* quota / private mode */ }
  return list;
}

function saveSession(user) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* quota / private mode */ }
  return user;
}

/* Never let the password hash or salt reach component state. */
function stripSecrets(u) {
  const { password, pwHash, salt, ...safe } = u; // eslint-disable-line no-unused-vars
  return safe;
}

/* ── password hashing ────────────────────────────────────────────────────
   This is NOT a substitute for server-side auth — anything running in the
   browser can be bypassed. It only means a password (which people reuse
   elsewhere) isn't sitting in localStorage in the clear. */

function newSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const initials = (name) =>
  name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* ── Provider ────────────────────────────────────────────────────────── */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  /* Writes a change to both the registry and the live session, so a plan or
     profile change survives logging out. */
  const syncUser = useCallback((updated) => {
    const list = loadUsers();
    saveUsers(list.map(u => (u.id === updated.id ? { ...u, ...updated } : u)));
    const safe = stripSecrets(updated);
    setUser(safe);
    saveSession(safe);
    return safe;
  }, []);

  const login = useCallback(async (email, password) => {
    const list = loadUsers();
    const found = list.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return { ok: false, error: 'Invalid email or password.' };

    let valid = false;
    if (found.pwHash) {
      valid = (await hashPassword(password, found.salt)) === found.pwHash;
    } else if (found.password) {
      // Legacy seed account — verify the plaintext once, then upgrade it.
      valid = found.password === password;
      if (valid) {
        const salt = newSalt();
        const pwHash = await hashPassword(password, salt);
        const upgraded = { ...found, pwHash, salt };
        delete upgraded.password;
        saveUsers(list.map(u => (u.id === found.id ? upgraded : u)));
      }
    }
    if (!valid) return { ok: false, error: 'Invalid email or password.' };

    const safe = stripSecrets(found);
    setUser(safe);
    saveSession(safe);
    return { ok: true, user: safe };
  }, []);

  const register = useCallback(async (data) => {
    const list = loadUsers();
    const email = data.email.trim();
    if (list.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    const salt = newSalt();
    const newUser = {
      id: Date.now(),
      name: data.name.trim(),
      email,
      salt,
      pwHash: await hashPassword(data.password, salt),
      farm: data.farm.trim(),
      plan: 'unpaid',
      trialEnds: null,
      avatar: initials(data.name),
      role: 'Owner',
      joinedAt: new Date().toISOString().slice(0, 10),
      emailVerified: false,
    };
    saveUsers([...list, newUser]);
    const safe = stripSecrets(newUser);
    setUser(safe);
    saveSession(safe);
    return { ok: true, user: safe };
  }, []);

  /* Edit name / farm / email. Email must stay unique across accounts. */
  const updateProfile = useCallback((patch) => {
    if (!user) return { ok: false, error: 'You are not signed in.' };
    const list = loadUsers();
    const name = (patch.name ?? user.name).trim();
    const farm = (patch.farm ?? user.farm).trim();
    const email = (patch.email ?? user.email).trim();

    if (!name) return { ok: false, error: 'Name is required.' };
    if (!email) return { ok: false, error: 'Email is required.' };
    if (list.some(u => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Another account already uses that email.' };
    }

    const emailChanged = email.toLowerCase() !== user.email.toLowerCase();
    const updated = {
      ...user, name, farm, email,
      avatar: patch.avatar?.trim()?.slice(0, 2).toUpperCase() || initials(name),
      // Changing the email invalidates a previous confirmation.
      emailVerified: emailChanged ? false : user.emailVerified,
    };
    syncUser(updated);
    return { ok: true, user: updated, emailChanged };
  }, [user, syncUser]);

  const changePassword = useCallback(async (current, next) => {
    if (!user) return { ok: false, error: 'You are not signed in.' };
    if (!next || next.length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };

    const list = loadUsers();
    const record = list.find(u => u.id === user.id);
    if (!record) return { ok: false, error: 'Account not found.' };

    const matches = record.pwHash
      ? (await hashPassword(current, record.salt)) === record.pwHash
      : record.password === current;
    if (!matches) return { ok: false, error: 'Your current password is incorrect.' };

    const salt = newSalt();
    const pwHash = await hashPassword(next, salt);
    const updated = { ...record, salt, pwHash };
    delete updated.password;
    saveUsers(list.map(u => (u.id === user.id ? updated : u)));
    return { ok: true };
  }, [user]);

  const markEmailVerified = useCallback(() => {
    if (!user) return;
    syncUser({ ...user, emailVerified: true });
  }, [user, syncUser]);

  const activatePlan = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, plan: 'active' };
      const list = loadUsers();
      saveUsers(list.map(u => (u.id === updated.id ? { ...u, plan: 'active' } : u)));
      saveSession(updated);
      return updated;
    });
  }, []);

  const activateTrial = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      const trialEnds = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const updated = { ...prev, plan: 'trial', trialEnds };
      const list = loadUsers();
      saveUsers(list.map(u => (u.id === updated.id ? { ...u, plan: 'trial', trialEnds } : u)));
      saveSession(updated);
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, login, register, logout,
      activatePlan, activateTrial,
      updateProfile, changePassword, markEmailVerified,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
