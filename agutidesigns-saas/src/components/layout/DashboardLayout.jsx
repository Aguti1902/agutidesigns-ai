import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, Building, Brain, BookOpen, CreditCard, LogOut, Zap, HelpCircle, Clock, AlertTriangle, ArrowRight, Lock, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AgentSelector from '../dashboard/AgentSelector';
import './DashboardLayout.css';

const navItems = [
  { to: '/app', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/app/whatsapp', icon: <MessageCircle size={18} />, label: 'WhatsApp' },
  { to: '/app/negocio', icon: <Building size={18} />, label: 'Mi Negocio' },
  { to: '/app/agente', icon: <Brain size={18} />, label: 'Prompt IA' },
  { to: '/app/tutoriales', icon: <BookOpen size={18} />, label: 'Tutoriales' },
  { to: '/app/billing', icon: <CreditCard size={18} />, label: 'Suscripción' },
  { to: '/app/mensajes', icon: <BarChart3 size={18} />, label: 'Mensajes' },
  { to: '/app/soporte', icon: <HelpCircle size={18} />, label: 'Soporte' },
];

function TrialCountdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calc() {
      const diff = new Date(endsAt) - new Date();
      if (diff <= 0) { setTimeLeft('Expirado'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        const rh = h % 24;
        setTimeLeft(`${d}d ${rh}h ${m}m`);
      } else {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return <span>{timeLeft}</span>;
}

export default function DashboardLayout() {
  const { profile, signOut, isTrialActive, isSubscribed, hasAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Permitir billing, checkout y mensajes cuando la suscripción ha expirado
  const isBillingPage = location.pathname.includes('/billing');
  const isCheckoutPage = location.pathname.includes('/checkout');
  const isMessagesPage = location.pathname.includes('/mensajes');
  const isFacturacionPage = location.pathname.includes('/facturacion');
  const allowWhenExpired = isBillingPage || isCheckoutPage || isMessagesPage || isFacturacionPage;

  // ── Expired: bloquear todo excepto billing, checkout y mensajes ──
  if (!hasAccess && profile && !allowWhenExpired) {
    return (
      <div className="expired">
        <div className="expired__card">
          <div className="expired__icon"><Lock size={40} /></div>
          <h1>Tu periodo de prueba ha terminado</h1>
          <p>Tu agente de WhatsApp IA se ha desactivado. Elige un plan para seguir atendiendo a tus clientes automáticamente.</p>
          <Link to="/app/billing" className="expired__btn">
            <Zap size={18} /> Elegir un plan y continuar <ArrowRight size={16} />
          </Link>
          <button className="expired__logout" onClick={handleLogout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      {/* Trial Banner — top bar */}
      {isTrialActive && !isSubscribed && (
        <div className="trial-banner">
          <div className="trial-banner__left">
            <Clock size={14} />
            <span>Periodo de prueba: <strong><TrialCountdown endsAt={profile.trial_ends_at} /></strong> restante</span>
          </div>
          <Link to="/app/billing" className="trial-banner__btn">
            <Zap size={12} /> Elegir plan
          </Link>
        </div>
      )}

      <div className="dash__body">
        {/* Sidebar */}
        <aside className="dash__sidebar">
          <div className="dash__sidebar-top">
          <div className="dash__logo">
            <img src="/images/Logoverde.png" alt="Agutidesigns" className="dash__logo-img" />
            <span className="dash__logo-badge">IA</span>
          </div>

            <nav className="dash__nav">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `dash__nav-item ${isActive ? 'dash__nav-item--active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {profile?.role === 'admin' && (
              <Link to="/admin" className="dash__admin-link">
                <Shield size={14} /> Panel de Admin
              </Link>
            )}
          </div>

          <div className="dash__sidebar-bottom">
            <div className="dash__user">
              <div className="dash__user-avatar">{profile?.full_name?.charAt(0) || 'U'}</div>
              <div className="dash__user-info">
                <span className="dash__user-name">{profile?.full_name || 'Usuario'}</span>
                <span className="dash__user-plan">{isSubscribed ? 'Pro' : isTrialActive ? 'Trial' : 'Expirado'}</span>
              </div>
            </div>
            <button className="dash__logout" onClick={handleLogout}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="dash__content">
          <AgentSelector />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
