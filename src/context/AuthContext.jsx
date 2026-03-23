import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// Mock user store – in production this would be server-side
const MOCK_USERS = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@greenmeadows.farm',
    password: 'farm1234',
    farm: 'Green Meadows Farm',
    plan: 'active',          // active | trial | unpaid
    trialEnds: null,
    avatar: 'JD',
    role: 'Owner',
    joinedAt: '2024-01-15',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('farmtrack_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [users, setUsers] = useState(MOCK_USERS);

  const login = useCallback((email, password) => {
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return { ok: false, error: 'Invalid email or password.' };
    const { password: _, ...safe } = found;
    setUser(safe);
    localStorage.setItem('farmtrack_user', JSON.stringify(safe));
    return { ok: true, user: safe };
  }, [users]);

  const register = useCallback((data) => {
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    const initials = data.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const newUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      farm: data.farm,
      plan: 'unpaid',
      avatar: initials,
      role: 'Owner',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    setUsers(prev => [...prev, newUser]);
    const { password: _, ...safe } = newUser;
    setUser(safe);
    localStorage.setItem('farmtrack_user', JSON.stringify(safe));
    return { ok: true, user: safe };
  }, [users]);

  const activatePlan = useCallback(() => {
    setUser(prev => {
      const updated = { ...prev, plan: 'active' };
      localStorage.setItem('farmtrack_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('farmtrack_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, activatePlan }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
