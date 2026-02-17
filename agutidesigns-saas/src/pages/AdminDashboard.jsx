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
    extraMessagesTotal: 0,
    addonRevenue: 0,
    avgConsumptionRate: 0,
    usersExhausted: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [topConsumers, setTopConsumers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const [usersRes, subsRes, ticketsRes, newUsersRes, messagesRes, allProfilesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('message_limit, extra_messages').eq('subscription_status', 'active'),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString()),
        supabase.from('agents').select('total_messages'),
        supabase.from('profiles').select('id, message_limit, extra_messages'),
      ]);

      const totalMessages = (messagesRes.data || []).reduce((sum, a) => sum + (a.total_messages || 0), 0);

      // Calculate MRR
      const LIMIT_TO_PRICE = { 500: 29, 5000: 79, 20000: 199 };
      let mrrBase = 0;
      let mrrAddons = 0;
      let totalExtraMessages = 0;

      for (const sub of (subsRes.data || [])) {
        const basePrice = LIMIT_TO_PRICE[sub.message_limit] || 29;
        mrrBase += basePrice;
        
        const extraMsgs = sub.extra_messages || 0;
        totalExtraMessages += extraMsgs;
        
        // Calculate addon price based on actual extra_messages
        // 500→9€, 1000→15€, 2500→29€, 5000→49€, 10000→79€
        if (extraMsgs >= 10000) mrrAddons += Math.floor(extraMsgs / 10000) * 79 + (extraMsgs % 10000 >= 5000 ? 49 : extraMsgs % 10000 >= 2500 ? 29 : extraMsgs % 10000 >= 1000 ? 15 : extraMsgs % 10000 >= 500 ? 9 : 0);
        else if (extraMsgs >= 5000) mrrAddons += 49 + (extraMsgs - 5000 >= 2500 ? 29 : extraMsgs - 5000 >= 1000 ? 15 : extraMsgs - 5000 >= 500 ? 9 : 0);
        else if (extraMsgs >= 2500) mrrAddons += 29 + (extraMsgs - 2500 >= 1000 ? 15 : extraMsgs - 2500 >= 500 ? 9 : 0);
        else if (extraMsgs >= 1000) mrrAddons += 15 + (extraMsgs - 1000 >= 500 ? 9 : 0);
        else if (extraMsgs >= 500) mrrAddons += 9;
      }

      // Consumption rate: messages used / total capacity across all users
      const totalCapacity = (allProfilesRes.data || []).reduce((sum, p) => 
        sum + (p.message_limit || 500) + (p.extra_messages || 0), 0);
      const consumptionRate = totalCapacity > 0 ? Math.round((totalMessages / totalCapacity) * 100) : 0;

      // Users exhausted (agents used >= limit)
      const { data: agentsByUser } = await supabase
        .from('agents')
        .select('user_id, total_messages');
      const messagesByUser = {};
      for (const a of (agentsByUser || [])) {
        messagesByUser[a.user_id] = (messagesByUser[a.user_id] || 0) + (a.total_messages || 0);
      }
      let exhaustedCount = 0;
      for (const p of (allProfilesRes.data || [])) {
        const used = messagesByUser[p.id] || 0;
        const limit = (p.message_limit || 500) + (p.extra_messages || 0);
        if (used >= limit) exhaustedCount++;
      }

      setStats({
        totalUsers: usersRes.count || 0,
        activeSubscriptions: subsRes.data?.length || 0,
        totalRevenue: mrrBase + mrrAddons,
        totalMessages,
        openTickets: ticketsRes.count || 0,
        newUsersThisMonth: newUsersRes.count || 0,
        extraMessagesTotal: totalExtraMessages,
        addonRevenue: mrrAddons,
        avgConsumptionRate: consumptionRate,
        usersExhausted: exhaustedCount,
      });

      // Recent users
      const { data: recent } = await supabase
        .from('profiles')
        .select('id, full_name, subscription_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentUsers(recent || []);

      // Top consumers (users with highest message usage)
      const consumers = (allProfilesRes.data || []).map(p => {
        const used = messagesByUser[p.id] || 0;
        const limit = (p.message_limit || 500) + (p.extra_messages || 0);
        const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
        return { ...p, used, limit, percentage };
      }).sort((a, b) => b.used - a.used).slice(0, 10);
      setTopConsumers(consumers);

      setLoading(false);
    }
    loadStats();
  }, []);

  const statsData = [
    { label: 'Usuarios totales', value: stats.totalUsers, icon: <Users size={20} />, color: '#E5FC63' },
    { label: 'Suscripciones activas', value: stats.activeSubscriptions, icon: <Zap size={20} />, color: '#25D366' },
    { label: 'Revenue total (MRR)', value: `${stats.totalRevenue.toLocaleString('es-ES')}€`, icon: <DollarSign size={20} />, color: '#10b981' },
    { label: 'Revenue addons', value: `${stats.addonRevenue.toLocaleString('es-ES')}€`, icon: <TrendingUp size={20} />, color: '#a855f7' },
    { label: 'Mensajes procesados', value: stats.totalMessages.toLocaleString('es-ES'), icon: <MessageCircle size={20} />, color: '#EC6746' },
    { label: 'Mensajes extra totales', value: stats.extraMessagesTotal.toLocaleString('es-ES'), icon: <BarChart3 size={20} />, color: '#3b82f6' },
    { label: 'Tasa de consumo', value: `${stats.avgConsumptionRate}%`, icon: <TrendingUp size={20} />, color: stats.avgConsumptionRate > 80 ? '#ef4444' : '#10b981' },
    { label: 'Usuarios agotados', value: stats.usersExhausted, icon: <MessageCircle size={20} />, color: '#ef4444' },
    { label: 'Tickets abiertos', value: stats.openTickets, icon: <MessageSquare size={20} />, color: '#f59e0b' },
    { label: 'Nuevos este mes', value: stats.newUsersThisMonth, icon: <Calendar size={20} />, color: '#8b5cf6' },
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

      <h3 className="page__section-title"><BarChart3 size={16} /> Top consumo de mensajes</h3>
      <div className="admin-users-table" style={{ marginBottom: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Usado</th>
              <th>Límite</th>
              <th>Uso</th>
              <th>% Consumo</th>
            </tr>
          </thead>
          <tbody>
            {topConsumers.map(u => (
              <tr key={u.id}>
                <td>{u.full_name || 'Sin nombre'}</td>
                <td>{u.used.toLocaleString('es-ES')}</td>
                <td>{u.limit.toLocaleString('es-ES')}</td>
                <td>
                  <div style={{ width: '100px', height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, u.percentage)}%`,
                      height: '100%',
                      background: u.percentage >= 95 ? '#ef4444' : u.percentage >= 80 ? '#f59e0b' : '#25D366',
                      borderRadius: '3px',
                    }} />
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: u.percentage >= 95 ? '#ef4444' : u.percentage >= 80 ? '#f59e0b' : '#aaa' }}>
                  {u.percentage}%
                </td>
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
