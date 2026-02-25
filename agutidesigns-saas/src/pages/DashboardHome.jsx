import { useState, useEffect } from 'react';
import { MessageCircle, Users, BarChart3, Zap, ArrowRight, TrendingUp, Wifi, WifiOff, CalendarCheck, CheckCircle, Circle, Clock, Building, Brain, Phone, Bot, ChevronRight, FileText, Receipt, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

function calcTotal(lineas, iva) {
  const base = (lineas || []).reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0);
  return base * (1 + (parseFloat(iva) || 0) / 100);
}

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const { activeAgent, agents } = useAgents();
  const [stats, setStats] = useState({ messagesToday: 0, leads: 0, appointmentsToday: 0 });
  const [recentConvos, setRecentConvos] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [recentPresups, setRecentPresups] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [setupStatus, setSetupStatus] = useState({ whatsapp: false, business: false, prompt: false, booking: false });

  useEffect(() => {
    if (!activeAgent || !user) return;
    loadAll();
    const ch = supabase.channel('dash-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeAgent?.id, user?.id]);

  async function loadAll() {
    if (!activeAgent || !user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data: agentConvos } = await supabase.from('conversations').select('id').eq('agent_id', activeAgent.id);
    const convoIds = (agentConvos || []).map(c => c.id);

    const [msgsRes, leadsRes, apptsRes, recentRes, todayApptsRes, bizRes, presRes, factRes] = await Promise.all([
      convoIds.length > 0 ? supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()).in('conversation_id', convoIds) : Promise.resolve({ count: 0 }),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('agent_id', activeAgent.id).eq('is_lead', true),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('appointment_date', todayStr).neq('status', 'cancelled'),
      supabase.from('conversations').select('id, contact_name, contact_phone, last_message_at').eq('agent_id', activeAgent.id).order('last_message_at', { ascending: false }).limit(4),
      supabase.from('appointments').select('*').eq('user_id', user.id).eq('appointment_date', todayStr).neq('status', 'cancelled').order('start_time', { ascending: true }).limit(4),
      supabase.from('businesses').select('name, sector').eq('user_id', user.id).single(),
      supabase.from('presupuestos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4),
      supabase.from('facturas').select('*').eq('user_id', user.id).in('estado', ['pendiente', 'vencida']).order('created_at', { ascending: false }).limit(4),
    ]);

    setStats({ messagesToday: msgsRes.count || 0, leads: leadsRes.count || 0, appointmentsToday: apptsRes.count || 0 });
    setRecentConvos(recentRes.data || []);
    setTodayAppts(todayApptsRes.data || []);
    setRecentPresups(presRes.data || []);
    setFacturasPendientes(factRes.data || []);
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
    { key: 'business', label: 'Completar Mi Negocio', done: setupStatus.business, to: '/app/negocio' },
    { key: 'prompt', label: 'Configurar Prompt IA', done: setupStatus.prompt, to: '/app/agente' },
    { key: 'booking', label: 'Activar agendamiento', done: setupStatus.booking, to: '/app/calendario' },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;
  const allSetup = setupDone === setupSteps.length;
  const pendienteTotal = facturasPendientes.reduce((s, f) => s + calcTotal(f.lineas, f.iva), 0);
  const vencidasCount = facturasPendientes.filter(f => f.estado === 'vencida').length;

  return (
    <div className="page">
      <div className="page__header">
        <h1>¡Hola, {profile?.full_name?.split(' ')[0] || 'diseñador'}!</h1>
        <p>Tu negocio de diseño web en un vistazo.</p>
      </div>

      {/* Connection Status */}
      <div className={`dash-status ${isConnected ? 'dash-status--on' : 'dash-status--off'}`}>
        <div className="dash-status__left">
          <div className={`dash-status__dot ${isConnected ? 'dash-status__dot--on' : ''}`} />
          <div>
            <strong>{isConnected ? 'Agente IA en línea' : 'Agente desconectado'}</strong>
            <span>{isConnected ? `${activeAgent?.whatsapp_number || 'WhatsApp conectado'} — Cualificando leads automáticamente` : 'Conecta tu WhatsApp para activar la IA'}</span>
          </div>
        </div>
        {!isConnected && <Link to="/app/whatsapp" className="btn btn--primary btn--sm"><Phone size={12} /> Conectar</Link>}
      </div>

      {/* Alerta facturas vencidas */}
      {vencidasCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
          <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '0.85rem' }}><strong style={{ color: '#ef4444' }}>{vencidasCount} factura{vencidasCount > 1 ? 's' : ''} vencida{vencidasCount > 1 ? 's' : ''}</strong> — Revísalas antes de que el cliente se olvide.</span>
          <Link to="/app/facturas" style={{ fontSize: '0.75rem', color: '#ef4444', textDecoration: 'none', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>Ver facturas →</Link>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Mensajes IA hoy', value: stats.messagesToday, icon: <MessageCircle size={18} />, color: '#25D366' },
          { label: 'Leads captados', value: stats.leads, icon: <Users size={18} />, color: '#3b82f6' },
          { label: 'Citas hoy', value: stats.appointmentsToday, icon: <CalendarCheck size={18} />, color: '#8b5cf6' },
          { label: 'Por cobrar', value: `${pendienteTotal.toFixed(0)}€`, icon: <Receipt size={18} />, color: pendienteTotal > 0 ? '#f59e0b' : '#25D366' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card__icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <div><span className="stat-card__value">{s.value}</span><span className="stat-card__label">{s.label}</span></div>
          </div>
        ))}
      </div>

      {/* Message usage */}
      <div className="dash-usage">
        <div className="dash-usage__top">
          <span><TrendingUp size={14} /> Mensajes IA usados</span>
          <Link to="/app/mensajes">Ver detalle <ChevronRight size={12} /></Link>
        </div>
        <div className="dash-usage__bar"><div className="dash-usage__fill" style={{ width: `${msgPercent}%`, background: msgPercent > 95 ? '#ef4444' : msgPercent > 80 ? '#f59e0b' : '#25D366' }} /></div>
        <span className="dash-usage__text">{totalMessages.toLocaleString('es-ES')} / {msgLimit.toLocaleString('es-ES')} mensajes</span>
      </div>

      {/* Two columns */}
      <div className="dash-cols">
        {/* Conversaciones recientes */}
        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><MessageCircle size={16} /> Leads recientes</h3>
            <Link to="/app/whatsapp">Ver todos <ChevronRight size={12} /></Link>
          </div>
          {recentConvos.length > 0 ? (
            <div className="dash-widget__list">
              {recentConvos.map((c, i) => (
                <div key={i} className="dash-convo">
                  <div className="dash-convo__av">{(c.contact_name || '?')[0].toUpperCase()}</div>
                  <div className="dash-convo__info"><b>{c.contact_name || c.contact_phone || 'Sin nombre'}</b><span>{c.contact_phone || ''}</span></div>
                  <small>{c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-widget__empty"><Bot size={22} /><p>La IA cualificará leads de diseño web aquí. Conecta WhatsApp para empezar.</p></div>
          )}
        </div>

        {/* Presupuestos recientes */}
        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><FileText size={16} /> Presupuestos recientes</h3>
            <Link to="/app/presupuestos">Ver todos <ChevronRight size={12} /></Link>
          </div>
          {recentPresups.length > 0 ? (
            <div className="dash-widget__list">
              {recentPresups.map((p, i) => {
                const total = calcTotal(p.lineas, p.iva);
                const color = { borrador: '#666', enviado: '#f59e0b', aceptado: '#25D366', rechazado: '#ef4444' }[p.estado] || '#666';
                return (
                  <div key={i} className="dash-convo">
                    <div className="dash-convo__av" style={{ background: `${color}18`, color }}><FileText size={14} /></div>
                    <div className="dash-convo__info"><b>{p.cliente_nombre || 'Sin nombre'}</b><span>{p.numero}</span></div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>{total.toFixed(0)}€</div>
                      <div style={{ fontSize: '0.6rem', color, fontFamily: 'var(--font-mono)' }}>{p.estado}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dash-widget__empty"><FileText size={22} /><p>Crea tu primer presupuesto profesional.</p></div>
          )}
        </div>
      </div>

      {/* Segunda fila: citas + facturas pendientes */}
      <div className="dash-cols">
        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><CalendarCheck size={16} /> Citas de hoy</h3>
            <Link to="/app/calendario">Ver calendario <ChevronRight size={12} /></Link>
          </div>
          {todayAppts.length > 0 ? (
            <div className="dash-widget__list">
              {todayAppts.map((a, i) => (
                <div key={i} className="dash-appt">
                  <div className={`dash-appt__time ${a.created_by === 'ai' ? 'dash-appt__time--ai' : ''}`}>{a.start_time?.substring(0, 5)}</div>
                  <div className="dash-appt__info"><b>{a.client_name}</b><span>{a.service || 'Sin servicio especificado'}</span></div>
                  {a.created_by === 'ai' && <span className="dash-appt__badge">IA</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-widget__empty"><CalendarCheck size={22} /><p>No hay citas para hoy.</p></div>
          )}
        </div>

        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><Receipt size={16} /> Facturas pendientes</h3>
            <Link to="/app/facturas">Ver todas <ChevronRight size={12} /></Link>
          </div>
          {facturasPendientes.length > 0 ? (
            <div className="dash-widget__list">
              {facturasPendientes.map((f, i) => {
                const total = calcTotal(f.lineas, f.iva);
                const vencida = f.estado === 'vencida';
                return (
                  <div key={i} className="dash-convo">
                    <div className="dash-convo__av" style={{ background: vencida ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: vencida ? '#ef4444' : '#f59e0b' }}><Receipt size={14} /></div>
                    <div className="dash-convo__info"><b>{f.cliente_nombre || 'Sin nombre'}</b><span style={{ color: vencida ? '#ef4444' : undefined }}>{vencida ? '¡VENCIDA!' : f.numero}</span></div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0, color: vencida ? '#ef4444' : undefined }}>{total.toFixed(0)}€</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dash-widget__empty"><Receipt size={22} /><p>Sin facturas pendientes. ¡Todo al día!</p></div>
          )}
        </div>
      </div>

      {/* Setup progress */}
      {!allSetup && (
        <div className="dash-setup">
          <div className="dash-setup__head">
            <div><h3>Configura tu agente IA</h3><span>{setupDone} de {setupSteps.length} pasos</span></div>
            <span className="dash-setup__pct">{Math.round((setupDone / setupSteps.length) * 100)}%</span>
          </div>
          <div className="dash-setup__bar"><div className="dash-setup__fill" style={{ width: `${(setupDone / setupSteps.length) * 100}%` }} /></div>
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

      {/* Quick actions */}
      <h3 className="page__section-title">Acciones rápidas</h3>
      <div className="actions-grid">
        {[
          { label: 'Nuevo presupuesto', to: '/app/presupuestos', desc: 'Crea un presupuesto en PDF' },
          { label: 'Conectar WhatsApp', to: '/app/whatsapp', desc: 'Activa tu agente IA' },
          { label: 'Configurar IA', to: '/app/agente', desc: 'Entrena con tus servicios y tarifas' },
          { label: 'Ver calendario', to: '/app/calendario', desc: 'Citas y llamadas de discovery' },
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
