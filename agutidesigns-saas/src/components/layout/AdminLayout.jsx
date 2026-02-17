import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, BarChart3, LogOut, Shield, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './DashboardLayout.css';

const navItems = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/usuarios', icon: <Users size={18} />, label: 'Usuarios' },
  { to: '/admin/tickets', icon: <MessageSquare size={18} />, label: 'Soporte' },
  { to: '/admin/metricas', icon: <BarChart3 size={18} />, label: 'Métricas' },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="dash">
      <div className="dash__body">
        <aside className="dash__sidebar">
          <div className="dash__sidebar-top">
            <div className="dash__logo">
              <img src="/images/Logoverde.png" alt="Agutidesigns" className="dash__logo-img" />
              <span className="dash__logo-badge" style={{ background: '#f59e0b', color: '#000' }}>ADMIN</span>
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
          </div>

          <div className="dash__sidebar-bottom">
            <div className="dash__user">
              <div className="dash__user-avatar" style={{ background: '#f59e0b', color: '#000' }}>
                <Shield size={16} />
              </div>
              <div className="dash__user-info">
                <span className="dash__user-name">{profile?.full_name || 'Admin'}</span>
                <span className="dash__user-plan" style={{ color: '#f59e0b' }}>Administrador</span>
              </div>
            </div>
            <button className="dash__logout" onClick={handleLogout}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="dash__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
