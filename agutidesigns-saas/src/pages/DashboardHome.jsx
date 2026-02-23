import { useState, useEffect } from 'react';
import { MessageCircle, Users, BarChart3, Zap, ArrowRight, TrendingUp, Wifi, WifiOff, CalendarCheck, CheckCircle, Circle, Clock, Building, Brain, Phone, Bot, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const { activeAgent, agents } = useAgents();
  const [stats, setStats] = useState({ messagesToday: 0, leads: 0, activeConvos: 0, appointmentsToday: 0 });
  const [recentConvos, setRecentConvos] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [setupStatus, setSetupStatus] = useState({ whatsapp: false, business: false, prompt: false, booking: false });

  useEffect(() => {
    if (!activeAgent || !user) return;
    loadAll();
    const channel = supabase.channel('dash-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeAgent?.id, user?.id]);

  async function loadAll() {
    if (!activeAgent || !user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data: agentConvos } = await supabase.from('conversations').select('id').eq('agent_id', activeAgent.id);
    const convoIds = (agentConvos || []).map(c => c.id);

    const [msgsRes, leadsRes, activesRes, apptsRes, recentRes, todayApptsRes, bizRes] = await Promise.all([
      convoIds.length > 0
        ? supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()).in('conversation_id', convoIds)
        : Promise.resolve({ count: 0 }),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('agent_id', activeAgent.id).eq('is_lead', true),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('agent_id', activeAgent.id),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('appointment_date', todayStr).neq('status', 'cancelled'),
      supabase.from('conversations').select('id, contact_name, contact_phone, last_message_at').eq('agent_id', activeAgent.id).order('last_message_at', { ascending: false }).limit(5),
      supabase.from('appointments').select('*').eq('user_id', user.id).eq('appointment_date', todayStr).neq('status', 'cancelled').order('start_time', { ascending: true }).limit(5),
      supabase.from('businesses').select('name, sector').eq('user_id', user.id).single(),
    ]);

    setStats({
      messagesToday: msgsRes.count || 0,
      leads: leadsRes.count || 0,
      activeConvos: activesRes.count || 0,
      appointmentsToday: apptsRes.count || 0,
    });
    setRecentConvos(recentRes.data || []);
    setTodayAppts(todayApptsRes.data || []);
    setSetupStatus({
      whatsapp: !!activeAgent.whatsapp_connected,
      business: !!(bizRes.data?.name),
      prompt: !!(activeAgent.system_prompt && activeAgent.system_prompt.length > 50),
      booking: !!activeAgent.booking_enabled,
    });
  }

  const isConnected = activeAgent?.whatsapp_connected === true;
  const totalMessages = agents.reduce((sum, a) => sum + (a.total_messages || 0), 0);
  const msgLimit = (profile?.message_limit || 500) + (profile?.extra_messages || 0);
  const msgPercent = msgLimit > 0 ? Math.min(100, (totalMessages / msgLimit) * 100) : 0;

  const setupSteps = [
    { key: 'whatsapp', label: 'Conectar WhatsApp', done: setupStatus.whatsapp, to: '/app/whatsapp' },
    { key: 'business', label: 'Rellenar datos del negocio', done: setupStatus.business, to: '/app/negocio' },
    { key: 'prompt', label: 'Configurar prompt IA', done: setupStatus.prompt, to: '/app/agente' },
    { key: 'booking', label: 'Activar agendamiento', done: setupStatus.booking, to: '/app/calendario' },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;
  const setupTotal = setupSteps.length;
  const allSetup = setupDone === setupTotal;

  return (
    <div className="page">
      <div className="page__header">
        <h1>¡Hola, {profile?.full_name || 'ahí'}!</h1>
        <p>Aquí tienes un resumen de tu agente de WhatsApp IA.</p>
      </div>

      {/* Connection Status Banner */}
      <div className={`dash-status ${isConnected ? 'dash-status--on' : 'dash-status--off'}`}>
        <div className="dash-status__left">
          <div className={`dash-status__dot ${isConnected ? 'dash-status__dot--on' : ''}`} />
          <div>
            <strong>{isConnected ? 'Agente en línea' : 'Agente desconectado'}</strong>
            <span>{isConnected ? `${activeAgent?.whatsapp_number || 'WhatsApp conectado'} · ${activeAgent?.name || 'Mi Agente IA'}` : 'Conecta tu WhatsApp para activar la IA'}</span>
          </div>
        </div>
        {!isConnected && (
          <Link to="/app/whatsapp" className="btn btn--primary btn--sm"><Phone size={12} /> Conectar</Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {[
          { label: 'Mensajes hoy', value: stats.messagesToday, icon: <MessageCircle size={18} />, color: '#25D366' },
          { label: 'Leads captados', value: stats.leads, icon: <Users size={18} />, color: '#3b82f6' },
          { label: 'Conversaciones', value: stats.activeConvos, icon: <BarChart3 size={18} />, color: '#f59e0b' },
          { label: 'Citas hoy', value: stats.appointmentsToday, icon: <CalendarCheck size={18} />, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card__icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <div>
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Message Usage Bar */}
      {profile && (
        <div className="dash-usage">
          <div className="dash-usage__top">
            <span><TrendingUp size={14} /> Uso de mensajes</span>
            <Link to="/app/mensajes">Ver detalle <ChevronRight size={12} /></Link>
          </div>
          <div className="dash-usage__bar">
            <div className="dash-usage__fill" style={{ width: `${msgPercent}%`, background: msgPercent > 95 ? '#ef4444' : msgPercent > 80 ? '#f59e0b' : '#25D366' }} />
          </div>
          <span className="dash-usage__text">{totalMessages.toLocaleString('es-ES')} / {msgLimit.toLocaleString('es-ES')} mensajes</span>
        </div>
      )}

      {/* Two column layout */}
      <div className="dash-cols">
        {/* Left: Recent conversations */}
        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><MessageCircle size={16} /> Conversaciones recientes</h3>
            <Link to="/app/whatsapp">Ver todas <ChevronRight size={12} /></Link>
          </div>
          {recentConvos.length > 0 ? (
            <div className="dash-widget__list">
              {recentConvos.map((c, i) => (
                <div key={i} className="dash-convo">
                  <div className="dash-convo__av">{(c.contact_name || '?')[0].toUpperCase()}</div>
                  <div className="dash-convo__info">
                    <b>{c.contact_name || c.contact_phone || 'Sin nombre'}</b>
                    <span>{c.contact_phone || ''}</span>
                  </div>
                  <small>{c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-widget__empty"><Bot size={24} /><p>Aún no hay conversaciones. Conecta WhatsApp y empieza a recibir mensajes.</p></div>
          )}
        </div>

        {/* Right: Today's appointments */}
        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><CalendarCheck size={16} /> Citas de hoy</h3>
            <Link to="/app/calendario">Ver calendario <ChevronRight size={12} /></Link>
          </div>
          {todayAppts.length > 0 ? (
            <div className="dash-widget__list">
              {todayAppts.map((a, i) => (
                <div key={i} className="dash-appt">
                  <div className={`dash-appt__time ${a.created_by === 'ai' ? 'dash-appt__time--ai' : ''}`}>
                    {a.start_time?.substring(0, 5)}
                  </div>
                  <div className="dash-appt__info">
                    <b>{a.client_name}</b>
                    <span>{a.service || 'Sin servicio especificado'}</span>
                  </div>
                  {a.created_by === 'ai' && <span className="dash-appt__badge">IA</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-widget__empty"><CalendarCheck size={24} /><p>No hay citas programadas para hoy.</p></div>
          )}
        </div>
      </div>

      {/* Setup Progress */}
      {!allSetup && (
        <div className="dash-setup">
          <div className="dash-setup__head">
            <div>
              <h3>Configura tu agente</h3>
              <span>{setupDone} de {setupTotal} pasos completados</span>
            </div>
            <span className="dash-setup__pct">{Math.round((setupDone / setupTotal) * 100)}%</span>
          </div>
          <div className="dash-setup__bar">
            <div className="dash-setup__fill" style={{ width: `${(setupDone / setupTotal) * 100}%` }} />
          </div>
          <div className="dash-setup__steps">
            {setupSteps.map((s, i) => (
              <Link key={i} to={s.to} className={`dash-setup__step ${s.done ? 'dash-setup__step--done' : ''}`}>
                {s.done ? <CheckCircle size={16} /> : <Circle size={16} />}
                <span>{s.label}</span>
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h3 className="page__section-title">Acciones rápidas</h3>
      <div className="actions-grid">
        {[
          { label: 'Conectar WhatsApp', to: '/app/whatsapp', desc: 'Vincula tu número' },
          { label: 'Datos del negocio', to: '/app/negocio', desc: 'Contexto para la IA' },
          { label: 'Configurar prompt', to: '/app/agente', desc: 'Personaliza tu agente' },
          { label: 'Ver calendario', to: '/app/calendario', desc: 'Citas y reservas' },
        ].map((a, i) => (
          <Link key={i} to={a.to} className="action-card">
            <div><span className="action-card__label">{a.label}</span><span className="action-card__desc">{a.desc}</span></div>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </div>
  );
}
