import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, Building, Brain, BookOpen, CreditCard, LogOut, Settings, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';

const navItems = [
  { to: '/app', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/app/whatsapp', icon: <MessageCircle size={18} />, label: 'WhatsApp' },
  { to: '/app/negocio', icon: <Building size={18} />, label: 'Mi Negocio' },
  { to: '/app/agente', icon: <Brain size={18} />, label: 'Prompt IA' },
  { to: '/app/tutoriales', icon: <BookOpen size={18} />, label: 'Tutoriales' },
  { to: '/app/billing', icon: <CreditCard size={18} />, label: 'Suscripción' },
];

export default function DashboardLayout() {
  const { profile, signOut, isTrialActive, isSubscribed, hasAccess } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000))
    : 0;

  return (
    <div className="dash">
      {/* Sidebar */}
      <aside className="dash__sidebar">
        <div className="dash__sidebar-top">
          <div className="dash__logo">
            <MessageCircle size={20} />
            <span>Agente IA</span>
          </div>

          {isTrialActive && !isSubscribed && (
            <div className="dash__trial">
              <Zap size={12} />
              <span>Trial: {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''}</span>
            </div>
          )}

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
        <Outlet />
      </main>
    </div>
  );
}
