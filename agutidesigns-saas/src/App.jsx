import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDomainRedirect } from './hooks/useDomainRedirect';
import SaasLanding from './pages/landing/SaasLanding';
import AuthPage from './components/auth/AuthPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import WhatsAppConnect from './pages/WhatsAppConnect';
import BusinessInfo from './pages/BusinessInfo';
import PromptBuilder from './pages/PromptBuilder';
import Tutorials from './pages/Tutorials';
import Billing from './pages/Billing';
import Checkout from './pages/Checkout';
import Messages from './pages/Messages';
import Support from './pages/Support';
import BillingDetails from './pages/BillingDetails';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminTickets from './pages/AdminTickets';
import AdminUsers from './pages/AdminUsers';
import EmailConfirmed from './pages/EmailConfirmed';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (profile?.role !== 'admin') return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  const { user, profile, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const { isAppDomain, isMainDomain } = useDomainRedirect(user);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Logged in but onboarding not completed → show onboarding
  if (user && profile && !profile.onboarding_completed && !onboardingDone) {
    return <OnboardingFlow onComplete={() => setOnboardingDone(true)} />;
  }

  // localhost always allows everything
  const isLocalhost = window.location.hostname === 'localhost';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        user ? <Navigate to="/app" replace /> : 
        (isAppDomain && !isLocalhost) ? <Navigate to="/app" replace /> : 
        <SaasLanding />
      } />
      <Route path="/auth" element={user ? <Navigate to="/app" replace /> : <AuthPage />} />
      <Route path="/email-confirmado" element={<EmailConfirmed />} />
      
      {/* Protected dashboard routes */}
      <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="whatsapp" element={<WhatsAppConnect />} />
        <Route path="negocio" element={<BusinessInfo />} />
        <Route path="agente" element={<PromptBuilder />} />
        <Route path="tutoriales" element={<Tutorials />} />
        <Route path="billing" element={<Billing />} />
        <Route path="facturacion" element={<BillingDetails />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="mensajes" element={<Messages />} />
        <Route path="soporte" element={<Support />} />
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<AdminUsers />} />
        <Route path="tickets" element={<AdminTickets />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
