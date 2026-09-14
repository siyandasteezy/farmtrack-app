import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const FN = '/.netlify/functions';

/**
 * Auth backed by the server. The session is an httpOnly cookie, so nothing
 * here can read or forge it, and `plan` comes from the database rather than
 * from anything stored in the browser.
 */

async function api(path, { method = 'GET', body } = {}) {
  try {
    const res = await fetch(`${FN}/${path}`, {
      method,
      credentials: 'same-origin',          // send/receive the session cookie
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.error || 'Something went wrong. Please try again.' };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: 'You appear to be offline — check your connection and try again.' };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Undefined session until /auth-me answers — routes must wait, or a signed-in
  // visitor gets bounced to /login on every refresh.
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await api('auth-me');
    setUser(res.ok ? res.user : null);
    return res.ok ? res.user : null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api('auth-me');
      if (!cancelled) {
        setUser(res.ok ? res.user : null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api('auth-login', { method: 'POST', body: { email, password } });
    if (!res.ok) return res;
    setUser(res.user);
    return { ok: true, user: res.user };
  }, []);

  const register = useCallback(async (data) => {
    const res = await api('auth-register', { method: 'POST', body: data });
    if (!res.ok) return res;
    setUser(res.user);
    return { ok: true, user: res.user };
  }, []);

  const logout = useCallback(async () => {
    await api('auth-logout', { method: 'POST' });
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const res = await api('auth-profile', { method: 'POST', body: patch });
    if (!res.ok) return res;
    setUser(res.user);
    return { ok: true, user: res.user, emailChanged: res.emailChanged };
  }, []);

  const changePassword = useCallback(async (current, next) => {
    const res = await api('auth-password', { method: 'POST', body: { current, next } });
    return res.ok ? { ok: true } : res;
  }, []);

  /* Billing state lives in the database. After Yoco confirms a payment the
     server extends the subscription, so the client only re-reads the user. */
  const activatePlan  = useCallback(() => refresh(), [refresh]);
  const activateTrial = useCallback(() => refresh(), [refresh]);

  return (
    <AuthContext.Provider value={{
      user, loading, refresh,
      login, register, logout,
      updateProfile, changePassword,
      activatePlan, activateTrial,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
