import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

import Login       from './pages/Login';
import Register    from './pages/Register';
import Payment     from './pages/Payment';
import { Layout }  from './components/Layout';
import Dashboard   from './pages/Dashboard';
import Livestock   from './pages/Livestock';
import Health      from './pages/Health';
import Sensors     from './pages/Sensors';
import Feed        from './pages/Feed';
import Regulations from './pages/Regulations';
import Reports     from './pages/Reports';
import Billing     from './pages/Billing';
import Equipment   from './pages/Equipment';
import Tracking    from './pages/Tracking';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.plan === 'unpaid') return <Navigate to="/payment" replace />;
  return children;
}

function AuthRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={user.plan === 'unpaid' ? '/payment' : '/dashboard'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      <Route path="/payment"  element={<Payment />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><DataProvider><Layout /></DataProvider></ProtectedRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/livestock"   element={<Livestock />} />
        <Route path="/health"      element={<Health />} />
        <Route path="/sensors"     element={<Sensors />} />
        <Route path="/feed"        element={<Feed />} />
        <Route path="/regulations" element={<Regulations />} />
        <Route path="/reports"     element={<Reports />} />
        <Route path="/equipment"   element={<Equipment />} />
        <Route path="/tracking"    element={<Tracking />} />
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
