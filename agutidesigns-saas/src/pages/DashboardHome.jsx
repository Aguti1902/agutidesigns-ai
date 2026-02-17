import { useState, useEffect } from 'react';
import { MessageCircle, Users, BarChart3, Zap, ArrowRight, TrendingUp, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const quickActions = [
  { label: 'Conectar WhatsApp', to: '/app/whatsapp', desc: 'Vincula tu número y ve conversaciones' },
  { label: 'Datos del negocio', to: '/app/negocio', desc: 'Contexto para la IA' },
  { label: 'Configurar prompt', to: '/app/agente', desc: 'Personaliza tu agente' },
  { label: 'Ver mensajes', to: '/app/mensajes', desc: 'Uso y packs de mensajes' },
];

export default function DashboardHome() {
  const { profile } = useAuth();
  const { activeAgent, agents } = useAgents();
  const [stats, setStats] = useState({ messagesToday: 0, leads: 0, activeConvos: 0 });

  useEffect(() => {
    if (!activeAgent) return;
    async function loadStats() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get conversation IDs first to avoid issues with empty IN clause
      const { data: agentConvos } = await supabase
        .from('conversations')
        .select('id')
        .eq('agent_id', activeAgent.id);
      const convoIds = (agentConvos || []).map(c => c.id);

      const [msgsRes, leadsRes, activesRes] = await Promise.all([
        convoIds.length > 0
          ? supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', today.toISOString())
              .in('conversation_id', convoIds)
          : Promise.resolve({ count: 0 }),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', activeAgent.id)
          .eq('is_lead', true),
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', activeAgent.id)
          .eq('status', 'active'),
      ]);

      setStats({
        messagesToday: msgsRes.count || 0,
        leads: leadsRes.count || 0,
        activeConvos: activesRes.count || 0,
      });
    }
    loadStats();

    const channel = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadStats())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeAgent?.id]);

  const isConnected = activeAgent?.whatsapp_connected === true;
  const totalMessages = agents.reduce((sum, a) => sum + (a.total_messages || 0), 0);

  const statsData = [
    { label: 'Mensajes hoy', value: stats.messagesToday.toString(), icon: <MessageCircle size={18} />, color: '#25D366' },
    { label: 'Leads captados', value: stats.leads.toString(), icon: <Users size={18} />, color: '#E5FC63' },
    { label: 'Convos activas', value: stats.activeConvos.toString(), icon: <BarChart3 size={18} />, color: '#EC6746' },
    { label: 'Agente', value: isConnected ? 'Activo' : 'Inactivo', icon: isConnected ? <Wifi size={18} /> : <WifiOff size={18} />, color: isConnected ? '#25D366' : '#666' },
  ];

  return (
    <div className="page">
      <div className="page__header">
        <h1>¡Hola, {profile?.full_name || 'ahí'}!</h1>
        <p>Aquí tienes un resumen de tu agente de WhatsApp IA.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
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

      {/* Message exhausted banner */}
      {profile && totalMessages >= ((profile.message_limit || 500) + (profile.extra_messages || 0)) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-lg)', marginTop: '1rem' }}>
          <WifiOff size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.85rem', color: '#ef4444', display: 'block' }}>Mensajes agotados — IA desconectada</strong>
            <span style={{ fontSize: '0.75rem', color: '#999' }}>Amplía tus mensajes para reactivar la IA.</span>
          </div>
          <Link to="/app/mensajes" className="btn btn--primary btn--sm" style={{ flexShrink: 0 }}><Zap size={12} /> Ampliar</Link>
        </div>
      )}

      {/* Message usage mini */}
      {profile && totalMessages < ((profile.message_limit || 500) + (profile.extra_messages || 0)) && (
        <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#999' }}><TrendingUp size={14} style={{ verticalAlign: 'middle' }} /> Uso de mensajes</span>
            <Link to="/app/mensajes" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none' }}>Ver detalle →</Link>
          </div>
          <div style={{ background: '#1a1a1a', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '6px', transition: 'width 0.5s',
              width: `${Math.min(100, (totalMessages / ((profile.message_limit || 500) + (profile.extra_messages || 0))) * 100)}%`,
              background: (totalMessages / ((profile.message_limit || 500) + (profile.extra_messages || 0))) > 0.95 ? '#ef4444' : (totalMessages / ((profile.message_limit || 500) + (profile.extra_messages || 0))) > 0.8 ? '#f59e0b' : '#25D366',
            }} />
          </div>
          <p style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.3rem' }}>
            {totalMessages.toLocaleString('es-ES')} de {((profile.message_limit || 500) + (profile.extra_messages || 0)).toLocaleString('es-ES')} mensajes usados
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <h3 className="page__section-title">Acciones rápidas</h3>
      <div className="actions-grid">
        {quickActions.map((a, i) => (
          <Link key={i} to={a.to} className="action-card">
            <div>
              <span className="action-card__label">{a.label}</span>
              <span className="action-card__desc">{a.desc}</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </div>
  );
}
