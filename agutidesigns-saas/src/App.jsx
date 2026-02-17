import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="loading-spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, profile, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);

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

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <SaasLanding />} />
      <Route path="/auth" element={user ? <Navigate to="/app" replace /> : <AuthPage />} />
      
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
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
