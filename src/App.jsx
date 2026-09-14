import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import Home        from './pages/Home';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Payment     from './pages/Payment';
import VerifyEmail from './pages/VerifyEmail';
import { Layout }  from './components/Layout';
import Dashboard   from './pages/Dashboard';
import Livestock   from './pages/Livestock';
import Health      from './pages/Health';
import Apiary      from './pages/Apiary';
import Profile     from './pages/Profile';
import Sensors     from './pages/Sensors';
import Feed        from './pages/Feed';
import Regulations from './pages/Regulations';
import Reports     from './pages/Reports';
import Billing     from './pages/Billing';
import Equipment   from './pages/Equipment';
import Tracking    from './pages/Tracking';
import FarmPlan    from './pages/FarmPlan';

/* Restoring the session is a round trip to the server, so routes have to wait
   for it — deciding while `loading` is true would bounce a signed-in visitor
   to /login on every refresh. */
function SessionGate() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 40%, #bbf7d0 100%)' }}>
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24" fill="none" style={{ color: '#15803d' }}>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm font-medium text-green-900/70">Loading your farm…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SessionGate />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.active) return <Navigate to="/payment" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <SessionGate />;
  if (user) return <Navigate to={user.active ? '/dashboard' : '/payment'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing home */}
      <Route path="/" element={<Home />} />

      {/* Public auth routes */}
      <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/payment"  element={<Payment />} />
      {/* Public: the link is often opened in a different browser */}
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><DataProvider><Layout /></DataProvider></ProtectedRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/livestock"   element={<Livestock />} />
        <Route path="/health"      element={<Health />} />
        <Route path="/apiary"      element={<Apiary />} />
        <Route path="/profile"     element={<Profile />} />
        <Route path="/sensors"     element={<Sensors />} />
        <Route path="/feed"        element={<Feed />} />
        <Route path="/regulations" element={<Regulations />} />
        <Route path="/reports"     element={<Reports />} />
        <Route path="/equipment"   element={<Equipment />} />
        <Route path="/tracking"    element={<Tracking />} />
        <Route path="/farm-plan"   element={<FarmPlan />} />
        <Route path="/billing"     element={<Billing />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
