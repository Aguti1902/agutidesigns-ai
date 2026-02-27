import { useState, useEffect } from 'react';
import {
  MessageCircle, Users, BarChart3, Zap, ArrowRight, TrendingUp,
  CalendarCheck, CheckCircle, Circle, Clock, Building, Bot,
  ChevronRight, FileText, Receipt, AlertTriangle, TrendingDown,
  Target, Euro, Sparkles, Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

function calcTotal(lineas, iva) {
  const base = (lineas || []).reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0);
  return base * (1 + (parseFloat(iva) || 0) / 100);
}

function KpiCard({ label, value, sub, icon, color, href, highlight }) {
  const inner = (
    <div className={`kpi-card ${highlight ? 'kpi-card--highlight' : ''}`} style={{ '--kpi-color': color }}>
      <div className="kpi-card__ico" style={{ background: `${color}15`, color }}>{icon}</div>
      <div className="kpi-card__body">
        <span className="kpi-card__value">{value}</span>
        <span className="kpi-card__label">{label}</span>
        {sub && <span className="kpi-card__sub">{sub}</span>}
      </div>
    </div>
  );
  return href ? <Link to={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const { activeAgent, agents } = useAgents();

  const [stats, setStats] = useState({ messagesToday: 0, leads: 0, appointmentsToday: 0, aiAppts: 0, conversion: 0, valorMedio: 0, totalFacturado: 0 });
  const [recentConvos, setRecentConvos] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [pipeline, setPipeline] = useState({ borrador: [], enviado: [], aceptado: [] });
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [setupStatus, setSetupStatus] = useState({ whatsapp: false, business: false, prompt: false, booking: false, fiscal: false, servicios: false });
  const [roiData, setRoiData] = useState({ leadsIA: 0, valorEstimado: 0 });

  useEffect(() => {
    if (!user) return;
    if (activeAgent) loadAll();
    else loadSetupOnly();
  }, [activeAgent?.id, user?.id]);

  async function loadSetupOnly() {
    const bizRes = await supabase.from('businesses').select('name, extra_context').eq('user_id', user.id).single();
    const biz = bizRes.data;
    const extra = (() => { try { return biz?.extra_context ? JSON.parse(biz.extra_context) : {}; } catch { return {}; } })();
    setSetupStatus(s => ({ ...s, business: !!(biz?.name), fiscal: !!(extra.fiscal_name), servicios: !!(extra.web_services_detail || extra.prices_list) }));
  }

  async function loadAll() {
    if (!activeAgent || !user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data: agentConvos } = await supabase.from('conversations').select('id').eq('agent_id', activeAgent.id);
    const convoIds = (agentConvos || []).map(c => c.id);

    const [msgsRes, leadsRes, apptsRes, aiApptsRes, recentRes, todayApptsRes, bizRes, presRes, factRes, presAllRes, factPagRes] = await Promise.all([
      convoIds.length > 0
        ? supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()).in('conversation_id', convoIds)
        : Promise.resolve({ count: 0 }),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('agent_id', activeAgent.id).eq('is_lead', true),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('appointment_date', todayStr).neq('status', 'cancelled'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('created_by', 'ai'),
      supabase.from('conversations').select('id, contact_name, contact_phone, last_message_at, is_lead').eq('agent_id', activeAgent.id).order('last_message_at', { ascending: false }).limit(5),
      supabase.from('appointments').select('*').eq('user_id', user.id).eq('appointment_date', todayStr).neq('status', 'cancelled').order('start_time', { ascending: true }).limit(5),
      supabase.from('businesses').select('name, extra_context').eq('user_id', user.id).single(),
      supabase.from('presupuestos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('facturas').select('*').eq('user_id', user.id).in('estado', ['pendiente', 'vencida']).order('created_at', { ascending: false }).limit(5),
      supabase.from('presupuestos').select('estado, lineas, iva').eq('user_id', user.id),
      supabase.from('facturas').select('lineas, iva').eq('user_id', user.id).eq('estado', 'pagada'),
    ]);

    const allPresups = presAllRes.data || [];
    const aceptados = allPresups.filter(p => p.estado === 'aceptado').length;
    const totalLeads = leadsRes.count || 0;
    const conversion = totalLeads > 0 ? Math.round((aceptados / totalLeads) * 100) : 0;

    const factPagadas = factPagRes.data || [];
    const totalFacturado = factPagadas.reduce((s, f) => s + calcTotal(f.lineas, f.iva), 0);
    const valorMedio = factPagadas.length > 0 ? Math.round(totalFacturado / factPagadas.length) : 0;

    // ROI IA: leads atendidos * valor medio * 0.3 (tasa conversión media)
    const leadsIA = totalLeads;
    const valorEstimado = Math.round(leadsIA * (valorMedio || 1000) * 0.3);

    const biz = bizRes.data;
    const extra = (() => { try { return biz?.extra_context ? JSON.parse(biz.extra_context) : {}; } catch { return {}; } })();

    // Pipeline
    const pipeData = (presRes.data || []).slice(0, 12);
    setPipeline({
      borrador: pipeData.filter(p => p.estado === 'borrador'),
      enviado: pipeData.filter(p => p.estado === 'enviado'),
      aceptado: pipeData.filter(p => p.estado === 'aceptado'),
    });

    setStats({ messagesToday: msgsRes.count || 0, leads: totalLeads, appointmentsToday: apptsRes.count || 0, aiAppts: aiApptsRes.count || 0, conversion, valorMedio, totalFacturado });
    setRecentConvos(recentRes.data || []);
    setTodayAppts(todayApptsRes.data || []);
    setFacturasPendientes(factRes.data || []);
    setRoiData({ leadsIA, valorEstimado });
    setSetupStatus({
      whatsapp: !!activeAgent.whatsapp_connected,
      business: !!(biz?.name),
      fiscal: !!(extra.fiscal_name),
      servicios: !!(extra.web_services_detail || extra.prices_list),
      prompt: !!(activeAgent.system_prompt && activeAgent.system_prompt.length > 100),
      booking: !!activeAgent.booking_enabled,
    });
  }

  const totalMessages = agents.reduce((sum, a) => sum + (a.total_messages || 0), 0);
  const msgLimit = (profile?.message_limit || 500) + (profile?.extra_messages || 0);
  const msgPercent = msgLimit > 0 ? Math.min(100, (totalMessages / msgLimit) * 100) : 0;
  const pendienteTotal = facturasPendientes.reduce((s, f) => s + calcTotal(f.lineas, f.iva), 0);
  const vencidasCount = facturasPendientes.filter(f => f.estado === 'vencida').length;

  const setupSteps = [
    { key: 'whatsapp', label: 'Conectar WhatsApp', done: setupStatus.whatsapp, to: '/app/whatsapp', icon: <MessageCircle size={14} /> },
    { key: 'fiscal', label: 'Datos fiscales', done: setupStatus.fiscal, to: '/app/negocio', icon: <Building size={14} /> },
    { key: 'servicios', label: 'Servicios y precios', done: setupStatus.servicios, to: '/app/negocio', icon: <FileText size={14} /> },
    { key: 'prompt', label: 'Configurar IA', done: setupStatus.prompt, to: '/app/agente', icon: <Bot size={14} /> },
    { key: 'booking', label: 'Activar agendamiento', done: setupStatus.booking, to: '/app/calendario', icon: <CalendarCheck size={14} /> },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;
  const allSetup = setupDone === setupSteps.length;
  const iaActiva = setupStatus.whatsapp && setupStatus.prompt;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>¡Hola, {profile?.full_name?.split(' ')[0] || 'diseñador'}! 👋</h1>
          <p>Tu negocio de diseño web en un vistazo.</p>
        </div>
      </div>

      {/* ── Gate: IA no activa ── */}
      {!iaActiva && (
        <div className="dash-gate">
          <div className="dash-gate__left">
            <AlertTriangle size={20} />
            <div>
              <strong>Tu IA no está activa todavía</strong>
              <span>Completa la configuración para que el agente empiece a cualificar leads automáticamente.</span>
            </div>
          </div>
          <Link to="/app/agente" className="btn btn--primary btn--sm"><Zap size={12} /> Activar ahora</Link>
        </div>
      )}

      {/* ── IA activa status ── */}
      {iaActiva && (
        <div className="dash-status dash-status--on">
          <div className="dash-status__left">
            <div className="dash-status__dot dash-status__dot--on" />
            <div>
              <strong>Agente IA en línea</strong>
              <span>{activeAgent?.whatsapp_number || 'WhatsApp conectado'} — Cualificando leads automáticamente</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Alerta facturas vencidas ── */}
      {vencidasCount > 0 && (
        <div className="dash-alert dash-alert--danger">
          <AlertTriangle size={16} />
          <span><strong>{vencidasCount} factura{vencidasCount > 1 ? 's' : ''} vencida{vencidasCount > 1 ? 's' : ''}</strong> — Revísalas antes de que el cliente se olvide.</span>
          <Link to="/app/facturas">Ver facturas <ChevronRight size={12} /></Link>
        </div>
      )}

      {/* ── KPIs: fila 1 ── */}
      <div className="kpi-grid">
        <KpiCard label="Mensajes IA hoy" value={stats.messagesToday} icon={<MessageCircle size={18} />} color="#25D366" href="/app/whatsapp" />
        <KpiCard label="Leads captados" value={stats.leads} sub="total acumulado" icon={<Users size={18} />} color="#3b82f6" href="/app/whatsapp" />
        <KpiCard label="% Conversión" value={`${stats.conversion}%`} sub="leads → aceptados" icon={<TrendingUp size={18} />} color={stats.conversion > 20 ? '#25D366' : stats.conversion > 5 ? '#f59e0b' : '#ef4444'} />
        <KpiCard label="Valor medio" value={stats.valorMedio > 0 ? `${stats.valorMedio.toLocaleString('es-ES')}€` : '—'} sub="por proyecto" icon={<Euro size={18} />} color="#8b5cf6" href="/app/facturas" />
        <KpiCard label="Citas por IA" value={stats.aiAppts} sub="generadas automáticamente" icon={<CalendarCheck size={18} />} color="#06b6d4" href="/app/calendario" />
        <KpiCard label="Por cobrar" value={`${pendienteTotal.toFixed(0)}€`} icon={<Receipt size={18} />} color={pendienteTotal > 0 ? '#f59e0b' : '#25D366'} href="/app/facturas" />
      </div>

      {/* ── Banner ROI IA ── */}
      {roiData.leadsIA > 0 && (
        <div className="dash-roi">
          <div className="dash-roi__inner">
            <div className="dash-roi__left">
              <Sparkles size={22} />
              <div>
                <span className="dash-roi__label">Dinero que habrías perdido sin la IA</span>
                <span className="dash-roi__amount">{roiData.valorEstimado.toLocaleString('es-ES')}€ estimados</span>
                <span className="dash-roi__sub">Basado en {roiData.leadsIA} leads atendidos automáticamente × valor medio de proyecto × 30% conversión del sector</span>
              </div>
            </div>
            <div className="dash-roi__right">
              <TrendingDown size={16} />
              <span>Sin IA</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline ── */}
      <div className="dash-pipeline">
        <div className="dash-pipeline__head">
          <h3><Target size={16} /> Pipeline de proyectos</h3>
          <Link to="/app/presupuestos">Ver todos <ChevronRight size={12} /></Link>
        </div>
        <div className="dash-pipeline__cols">
          {[
            { key: 'borrador', label: 'Borrador', color: '#666', items: pipeline.borrador },
            { key: 'enviado', label: 'Enviado', color: '#f59e0b', items: pipeline.enviado },
            { key: 'aceptado', label: 'Aceptado', color: '#25D366', items: pipeline.aceptado },
          ].map(col => (
            <div key={col.key} className="dash-pipeline__col">
              <div className="dash-pipeline__col-head" style={{ '--pcol': col.color }}>
                <span>{col.label}</span>
                <span className="dash-pipeline__count">{col.items.length}</span>
              </div>
              {col.items.length === 0 ? (
                <div className="dash-pipeline__empty">—</div>
              ) : (
                col.items.slice(0, 4).map((p, i) => {
                  const total = calcTotal(p.lineas, p.iva);
                  return (
                    <div key={i} className="dash-pipeline__item">
                      <span className="dash-pipeline__name">{p.cliente_nombre || 'Sin nombre'}</span>
                      <span className="dash-pipeline__amt" style={{ color: col.color }}>{total.toFixed(0)}€</span>
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Columnas ── */}
      <div className="dash-cols">
        {/* Leads recientes */}
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
                  <div className="dash-convo__info">
                    <b>{c.contact_name || c.contact_phone || 'Sin nombre'}</b>
                    <span>{c.contact_phone || ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    {c.is_lead && <span className="dash-lead-tag">Lead</span>}
                    <small style={{ color: 'var(--text-tertiary)', fontSize: '0.62rem' }}>{c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-widget__empty"><Bot size={22} /><p>La IA cualificará leads aquí. Conecta WhatsApp para empezar.</p></div>
          )}
        </div>

        {/* Citas de hoy */}
        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><CalendarCheck size={16} /> Citas de hoy</h3>
            <Link to="/app/calendario">Calendario <ChevronRight size={12} /></Link>
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
      </div>

      {/* ── Facturas pendientes ── */}
      {facturasPendientes.length > 0 && (
        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><Receipt size={16} /> Facturas pendientes</h3>
            <Link to="/app/facturas">Ver todas <ChevronRight size={12} /></Link>
          </div>
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
        </div>
      )}

      {/* ── Setup progress ── */}
      {!allSetup && (
        <div className="dash-setup">
          <div className="dash-setup__head">
            <div>
              <h3>Configura tu agente IA</h3>
              <span>{setupDone} de {setupSteps.length} pasos completados</span>
            </div>
            <span className="dash-setup__pct">{Math.round((setupDone / setupSteps.length) * 100)}%</span>
          </div>
          <div className="dash-setup__bar"><div className="dash-setup__fill" style={{ width: `${(setupDone / setupSteps.length) * 100}%` }} /></div>
          <div className="dash-setup__steps">
            {setupSteps.map((s, i) => (
              <Link key={i} to={s.to} className={`dash-setup__step ${s.done ? 'dash-setup__step--done' : ''}`}>
                <span className="dash-setup__step-ico">{s.done ? <CheckCircle size={15} /> : <Circle size={15} />}</span>
                {s.icon}
                <span>{s.label}</span>
                <ChevronRight size={13} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Uso de mensajes ── */}
      <div className="dash-usage">
        <div className="dash-usage__top">
          <span><BarChart3 size={14} /> Mensajes IA usados este mes</span>
          <Link to="/app/mensajes">Ver detalle <ChevronRight size={12} /></Link>
        </div>
        <div className="dash-usage__bar"><div className="dash-usage__fill" style={{ width: `${msgPercent}%`, background: msgPercent > 95 ? '#ef4444' : msgPercent > 80 ? '#f59e0b' : '#25D366' }} /></div>
        <span className="dash-usage__text">{totalMessages.toLocaleString('es-ES')} / {msgLimit.toLocaleString('es-ES')} mensajes</span>
      </div>
    </div>
  );
}
