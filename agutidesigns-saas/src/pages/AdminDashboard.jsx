import { useState, useEffect } from 'react';
import { Users, MessageCircle, DollarSign, TrendingUp, Zap, Calendar, BarChart3, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalMessages: 0,
    openTickets: 0,
    newUsersThisMonth: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [usersRes, subsRes, ticketsRes, newUsersRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('message_limit, extra_messages').eq('subscription_status', 'active'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString()),
        supabase.from('agents').select('total_messages'),
      ]);

      const totalMessages = (messagesRes.data || []).reduce((sum, a) => sum + (a.total_messages || 0), 0);

      // Calculate MRR based on message_limit (500=29€, 5000=79€, 20000=199€)
      const LIMIT_TO_PRICE = { 500: 29, 5000: 79, 20000: 199 };
      const EXTRA_MSG_TO_PRICE = { 500: 9, 1000: 15, 2500: 29, 5000: 49, 10000: 79 };
      let mrr = 0;
      for (const sub of (subsRes.data || [])) {
        const basePrice = LIMIT_TO_PRICE[sub.message_limit] || 29;
        mrr += basePrice;
        // Add addon prices (simplified - assuming 9€ per 500 extra)
        const extraPacks = Math.ceil((sub.extra_messages || 0) / 500);
        mrr += extraPacks * 9;
      }

      setStats({
        totalUsers: usersRes.count || 0,
        activeSubscriptions: subsRes.data?.length || 0,
        totalRevenue: mrr,
        totalMessages,
        openTickets: ticketsRes.count || 0,
        newUsersThisMonth: newUsersRes.count || 0,
      });

      // Recent users (email is not in profiles table)
      const { data: recent } = await supabase
        .from('profiles')
        .select('id, full_name, subscription_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentUsers(recent || []);
      setLoading(false);
    }
    loadStats();
  }, []);

  const statsData = [
    { label: 'Usuarios totales', value: stats.totalUsers, icon: <Users size={20} />, color: '#E5FC63' },
    { label: 'Suscripciones activas', value: stats.activeSubscriptions, icon: <Zap size={20} />, color: '#25D366' },
    { label: 'Mensajes procesados', value: stats.totalMessages.toLocaleString('es-ES'), icon: <MessageCircle size={20} />, color: '#EC6746' },
    { label: 'Tickets abiertos', value: stats.openTickets, icon: <MessageSquare size={20} />, color: '#f59e0b' },
    { label: 'Nuevos este mes', value: stats.newUsersThisMonth, icon: <Calendar size={20} />, color: '#a855f7' },
    { label: 'Revenue (MRR)', value: `${stats.totalRevenue.toLocaleString('es-ES')}€`, icon: <DollarSign size={20} />, color: '#10b981' },
  ];

  if (loading) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1>Dashboard Admin</h1>
        <p>Métricas globales del sistema</p>
      </div>

      <div className="admin-stats-grid">
        {statsData.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card__icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <div>
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="page__section-title"><TrendingUp size={16} /> Usuarios recientes</h3>
      <div className="admin-users-table">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Plan</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(u => (
              <tr key={u.id}>
                <td>{u.full_name || 'Sin nombre'}</td>
                <td>
                  <span className={`admin-badge admin-badge--${u.subscription_status}`}>
                    {u.subscription_status === 'active' ? 'Pro/Business' : u.subscription_status === 'trial' ? 'Trial' : 'Expirado'}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-quick-actions">
        <Link to="/admin/tickets" className="action-card">
          <div>
            <span className="action-card__label">Ver tickets pendientes</span>
            <span className="action-card__desc">{stats.openTickets} tickets esperando respuesta</span>
          </div>
          <MessageSquare size={16} />
        </Link>
        <Link to="/admin/usuarios" className="action-card">
          <div>
            <span className="action-card__label">Gestionar usuarios</span>
            <span className="action-card__desc">Ver todos los usuarios y suscripciones</span>
          </div>
          <Users size={16} />
        </Link>
      </div>
    </div>
  );
}
