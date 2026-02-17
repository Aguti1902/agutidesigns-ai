import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import './DashboardLayout.css';

const navItems = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/usuarios', icon: <Users size={18} />, label: 'Usuarios' },
  { to: '/admin/tickets', icon: <MessageSquare size={18} />, label: 'Soporte', badge: true },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadTickets, setUnreadTickets] = useState(0);

  useEffect(() => {
    async function loadUnread() {
      // Count tickets with new messages (updated_at > admin_last_viewed_at OR admin_last_viewed_at is null)
      const { data } = await supabase
        .from('support_tickets')
        .select('id, admin_last_viewed_at, updated_at')
        .in('status', ['open', 'in_progress']);
      
      const unread = (data || []).filter(t => 
        !t.admin_last_viewed_at || new Date(t.updated_at) > new Date(t.admin_last_viewed_at)
      ).length;
      
      setUnreadTickets(unread);
    }

    loadUnread();

    // Listen for changes
    const channel = supabase
      .channel('admin-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => loadUnread())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => loadUnread())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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
                  {item.badge && unreadTickets > 0 && (
                    <span className="dash__nav-badge">{unreadTickets}</span>
                  )}
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
          <footer className="dash__footer">
            <p>© 2026 Agutidesigns IA · Panel de Administración</p>
            <div className="dash__footer-links">
              <a href="https://agutidesigns.io/privacidad.html" target="_blank" rel="noopener">Privacidad</a>
              <span>·</span>
              <a href="https://agutidesigns.io/terminos.html" target="_blank" rel="noopener">Términos</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
