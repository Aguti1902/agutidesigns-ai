import { useState, useEffect } from 'react';
import {
  MessageCircle, Users, BarChart3, Zap, ArrowRight, TrendingUp,
  CalendarCheck, CheckCircle, Circle, Clock, Building, Bot,
  ChevronRight, FileText, Receipt, AlertTriangle, TrendingDown,
  Target, Euro, Sparkles, Brain, Calculator, Award, Minus, Plus
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

/* ── Simulador de ingresos ── */
function SimuladorIngresos({ valorMedio, conversion, totalLeads }) {
  const [proyectosExtra, setProyectosExtra] = useState(3);
  const [subidaPrecio, setSubidaPrecio] = useState(10);
  const [pctMantenimiento, setPctMantenimiento] = useState(30);
  const precioMant = Math.round((valorMedio || 1000) * 0.05);
  const ingresoBase = (valorMedio || 1000) * Math.max(1, Math.round((totalLeads || 1) * ((conversion || 20) / 100)));
  const ganaProyectos = proyectosExtra * (valorMedio || 1000);
  const ganaSubida = ingresoBase * (subidaPrecio / 100);
  const gainMant = Math.round((totalLeads || 5) * (pctMantenimiento / 100)) * precioMant * 12;
  const totalGain = ganaProyectos + ganaSubida + gainMant;

  return (
    <div className="sim-card">
      <div className="sim-card__head">
        <Calculator size={18} style={{ color: '#25D366' }} />
        <div>
          <h3>Simulador de ingresos</h3>
          <p>¿Cuánto ganarías si cambias estas 3 cosas?</p>
        </div>
      </div>
      <div className="sim-sliders">
        <div className="sim-row">
          <div className="sim-row__label">
            <span>Si cierro <strong>{proyectosExtra} proyectos más</strong> este mes</span>
            <span className="sim-gain">+{ganaProyectos.toLocaleString('es-ES')}€</span>
          </div>
          <div className="sim-controls">
            <button onClick={() => setProyectosExtra(Math.max(1, proyectosExtra - 1))}><Minus size={10} /></button>
            <span>{proyectosExtra}</span>
            <button onClick={() => setProyectosExtra(proyectosExtra + 1)}><Plus size={10} /></button>
          </div>
        </div>
        <div className="sim-row">
          <div className="sim-row__label">
            <span>Si subo mis precios un <strong>{subidaPrecio}%</strong></span>
            <span className="sim-gain">+{Math.round(ganaSubida).toLocaleString('es-ES')}€/año</span>
          </div>
          <div className="sim-controls">
            <button onClick={() => setSubidaPrecio(Math.max(5, subidaPrecio - 5))}><Minus size={10} /></button>
            <span>{subidaPrecio}%</span>
            <button onClick={() => setSubidaPrecio(subidaPrecio + 5)}><Plus size={10} /></button>
          </div>
        </div>
        <div className="sim-row">
          <div className="sim-row__label">
            <span>Si vendo mantenimiento al <strong>{pctMantenimiento}%</strong> de clientes</span>
            <span className="sim-gain">+{gainMant.toLocaleString('es-ES')}€/año</span>
          </div>
          <div className="sim-controls">
            <button onClick={() => setPctMantenimiento(Math.max(10, pctMantenimiento - 10))}><Minus size={10} /></button>
            <span>{pctMantenimiento}%</span>
            <button onClick={() => setPctMantenimiento(Math.min(100, pctMantenimiento + 10))}><Plus size={10} /></button>
          </div>
        </div>
      </div>
      <div className="sim-total">
        <span>Ingreso potencial adicional</span>
        <strong>+{totalGain.toLocaleString('es-ES')}€</strong>
      </div>
    </div>
  );
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
  const [rentabilidad, setRentabilidad] = useState({ topClientes: [], tiposMasRentables: [], precioMedioTipo: [] });
  const [recentConvos, setRecentConvos] = useState([]);
  const [todayAppts, setTodayAppts] = useState([]);
  const [pipeline, setPipeline] = useState({ borrador: [], enviado: [], aceptado: [] });
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [setupStatus, setSetupStatus] = useState({ whatsapp: false, business: false, prompt: false, booking: false, fiscal: false, servicios: false });
  const [roiData, setRoiData] = useState({ leadsIA: 0, valorEstimado: 0 });

  // Ajustes rápidos
  const [quickPrecioMin, setQuickPrecioMin] = useState('');
  const [quickDisponible, setQuickDisponible] = useState(true);
  const [quickTono, setQuickTono] = useState('cercano');
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (activeAgent) loadAll();
    else loadSetupOnly();
    loadQuickSettings();
  }, [activeAgent?.id, user?.id]);

  async function loadQuickSettings() {
    const [bizRes, agentRes] = await Promise.all([
      supabase.from('businesses').select('extra_context').eq('user_id', user.id).single(),
      activeAgent?.id ? supabase.from('agents').select('config').eq('id', activeAgent.id).single() : Promise.resolve({ data: null }),
    ]);
    if (bizRes.data?.extra_context) {
      try {
        const e = JSON.parse(bizRes.data.extra_context);
        if (e.precio_minimo) setQuickPrecioMin(e.precio_minimo);
        if (e.disponible !== undefined) setQuickDisponible(e.disponible !== 'no');
      } catch {}
    }
    // Leer tono desde la config del agente (fuente de verdad compartida con Configuración IA)
    if (agentRes.data?.config) {
      try {
        const cfg = JSON.parse(agentRes.data.config);
        if (cfg.tono) setQuickTono(cfg.tono);
      } catch {}
    } else if (bizRes.data?.extra_context) {
      try {
        const e = JSON.parse(bizRes.data.extra_context);
        if (e.tono_rapido) setQuickTono(e.tono_rapido);
      } catch {}
    }
  }

  async function saveQuickSettings(patch) {
    setQuickSaving(true);
    const { data } = await supabase.from('businesses').select('id, extra_context').eq('user_id', user.id).maybeSingle();
    const prev = (() => { try { return data?.extra_context ? JSON.parse(data.extra_context) : {}; } catch { return {}; } })();
    const merged = { ...prev, ...patch };
    if (data) await supabase.from('businesses').update({ extra_context: JSON.stringify(merged), updated_at: new Date().toISOString() }).eq('id', data.id);
    else await supabase.from('businesses').insert({ user_id: user.id, name: 'Mi Negocio', extra_context: JSON.stringify(merged) });
    // Sincronizar tono con agents.config (misma fuente que Configuración IA)
    if (patch.tono_rapido && activeAgent?.id) {
      const { data: agentData } = await supabase.from('agents').select('config').eq('id', activeAgent.id).single();
      const agentCfg = (() => { try { return agentData?.config ? JSON.parse(agentData.config) : {}; } catch { return {}; } })();
      agentCfg.tono = patch.tono_rapido;
      await supabase.from('agents').update({ config: JSON.stringify(agentCfg) }).eq('id', activeAgent.id);
    }
    setQuickSaving(false);
  }

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

    // Rentabilidad: top clientes por facturación
    const clienteMap = {};
    for (const f of factPagRes.data || []) {
      const key = f.cliente_nombre || 'Sin nombre';
      const t = calcTotal(f.lineas, f.iva);
      clienteMap[key] = (clienteMap[key] || 0) + t;
    }
    const topClientes = Object.entries(clienteMap).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, v]) => ({ nombre: n, valor: Math.round(v) }));

    // Tipo de proyecto más rentable (basado en primera descripción de línea)
    const tipoMap = {};
    for (const f of factPagRes.data || []) {
      const tipo = (f.lineas?.[0]?.descripcion || 'Otros').split(' ').slice(0, 2).join(' ');
      const t = calcTotal(f.lineas, f.iva);
      if (!tipoMap[tipo]) tipoMap[tipo] = { total: 0, count: 0 };
      tipoMap[tipo].total += t;
      tipoMap[tipo].count++;
    }
    const tiposMasRentables = Object.entries(tipoMap).sort((a, b) => b[1].total - a[1].total).slice(0, 3).map(([tipo, data]) => ({ tipo, media: Math.round(data.total / data.count), total: Math.round(data.total) }));
    setRentabilidad({ topClientes, tiposMasRentables });
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
    { key: 'servicios', label: 'Añadir servicios y precios', done: setupStatus.servicios, to: '/app/ajustes', icon: <FileText size={14} /> },
    { key: 'prompt', label: 'Configurar IA', done: setupStatus.prompt, to: '/app/ajustes?tab=ia', icon: <Bot size={14} /> },
    { key: 'booking', label: 'Activar agendamiento', done: setupStatus.booking, to: '/app/calendario', icon: <CalendarCheck size={14} /> },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;
  const allSetup = setupDone === setupSteps.length;
  const iaActiva = setupStatus.whatsapp && setupStatus.prompt;

  // Calcular estado de mensajes con créditos extra
  const msgCredits = profile?.message_credits || profile?.extra_messages || 0;
  const msgQuota = profile?.message_quota_monthly || profile?.message_limit || 500;
  const totalAvailable = msgQuota + msgCredits;
  const msgUsedPct = totalAvailable > 0 ? Math.min(100, Math.round((totalMessages / totalAvailable) * 100)) : 0;
  const iaPausada = msgUsedPct >= 100;
  const msgWarning = msgUsedPct >= 80 && !iaPausada;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1>¡Hola, {profile?.full_name?.split(' ')[0] || 'diseñador'}!</h1>
          <p>Tu agente IA, tus citas y tus presupuestos en un vistazo.</p>
        </div>
      </div>

      {/* ── Ajustes rápidos ── */}
      <div className="quick-chips">
        {/* Chip 1: Presupuesto mínimo */}
        <div className="quick-chip">
          <span className="quick-chip__label"><Euro size={12} /> Presupuesto mínimo</span>
          <div className="quick-chip__input-wrap">
            <input
              type="number"
              value={quickPrecioMin}
              onChange={e => setQuickPrecioMin(e.target.value)}
              onBlur={() => saveQuickSettings({ precio_minimo: quickPrecioMin })}
              placeholder="400"
              className="quick-chip__input"
            />
            <span className="quick-chip__unit">€</span>
          </div>
        </div>

        {/* Chip 2: Disponibilidad */}
        <button
          type="button"
          className={`quick-chip quick-chip--toggle ${quickDisponible ? 'quick-chip--on' : 'quick-chip--off'}`}
          onClick={() => {
            const next = !quickDisponible;
            setQuickDisponible(next);
            saveQuickSettings({ disponible: next ? 'si' : 'no' });
          }}
        >
          <span className="quick-chip__dot" />
          <span className="quick-chip__label">{quickDisponible ? 'Disponible esta semana' : 'No disponible'}</span>
        </button>

        {/* Chip 3: Tono */}
        <div className="quick-chip">
          <span className="quick-chip__label"><Bot size={12} /> Tono</span>
          <div className="quick-chip__select-wrap">
            {['cercano', 'profesional', 'directo'].map(t => (
              <button key={t} type="button"
                className={`quick-chip__opt ${quickTono === t ? 'quick-chip__opt--on' : ''}`}
                onClick={() => { setQuickTono(t); saveQuickSettings({ tono_rapido: t }); }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <Link to="/app/ajustes" className="quick-chip quick-chip--link">
          <Building size={12} /> Ajustes completos <ChevronRight size={11} />
        </Link>
      </div>

      {/* ══ BARRA DE MENSAJES IA — primer elemento visual ══ */}
      <div className={`msg-bar ${iaPausada ? 'msg-bar--paused' : !setupStatus.whatsapp ? 'msg-bar--warning' : msgWarning ? 'msg-bar--warning' : 'msg-bar--ok'}`}>
        <div className="msg-bar__top">
          <div className="msg-bar__left">
            <div className={`msg-bar__dot ${iaPausada ? 'msg-bar__dot--paused' : !setupStatus.whatsapp ? 'msg-bar__dot--warn' : msgWarning ? 'msg-bar__dot--warn' : 'msg-bar__dot--ok'}`} />
            <div>
              <strong className="msg-bar__title">
                {iaPausada
                  ? <><AlertTriangle size={13} /> IA pausada — Sin mensajes disponibles</>
                  : !setupStatus.whatsapp
                    ? <><AlertTriangle size={13} /> WhatsApp no conectado</>
                    : msgWarning
                      ? <><Zap size={13} /> Mensajes al {msgUsedPct}% — Recarga pronto</>
                      : 'Agente IA activo'}
              </strong>
              <span className="msg-bar__sub">
                {totalMessages.toLocaleString('es-ES')} de {totalAvailable.toLocaleString('es-ES')} mensajes usados este mes
                {msgCredits > 0 && <span className="msg-bar__credits"> · {msgCredits.toLocaleString('es-ES')} créditos extra</span>}
              </span>
            </div>
          </div>
          <div className="msg-bar__right">
            <span className="msg-bar__pct" style={{ color: iaPausada ? '#ef4444' : msgWarning ? '#f59e0b' : '#25D366' }}>{msgUsedPct}%</span>
            {(iaPausada || msgWarning) && (
              <Link to="/app/billing" className={`btn btn--sm ${iaPausada ? 'btn--danger' : 'btn--warning'}`}>
                <Zap size={12} /> {iaPausada ? 'Reactivar IA' : 'Comprar mensajes'}
              </Link>
            )}
          </div>
        </div>
        <div className="msg-bar__track">
          <div className="msg-bar__fill" style={{ width: `${msgUsedPct}%` }} />
        </div>
        {iaPausada && (
          <div className="msg-bar__paused-msg">
            Tu agente IA ha dejado de responder porque agotaste tu cuota. Compra un pack de mensajes para reactivarlo ahora.
          </div>
        )}
      </div>

      {/* ── Bloqueo inteligente: pasos pendientes ── */}
      {!iaActiva && !iaPausada && (
        <div className="dash-gate">
          <div className="dash-gate__left">
            <AlertTriangle size={20} />
            <div>
              <strong>
                {setupDone === 0
                  ? 'Configura tu agente para empezar'
                  : `Te ${setupSteps.length - setupDone === 1 ? 'falta 1 paso' : `faltan ${setupSteps.length - setupDone} pasos`} para activar el agente`}
              </strong>
              <span>
                {!setupStatus.whatsapp && 'WhatsApp no conectado · '}
                {!setupStatus.servicios && 'Servicios y precios vacíos · '}
                {!setupStatus.prompt && 'IA no configurada'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!setupStatus.whatsapp && <Link to="/app/whatsapp" className="btn btn--outline btn--sm"><MessageCircle size={12} /> WhatsApp</Link>}
            <Link to="/app/ajustes" className="btn btn--primary btn--sm"><Zap size={12} /> Completar ajustes</Link>
          </div>
        </div>
      )}

      {/* ── 4 KPIs core ── */}
      <div className="kpi-grid kpi-grid--4">
        <KpiCard label="Leads generados" value={stats.leads} sub="total acumulado" icon={<Users size={18} />} color="#25D366" href="/app/whatsapp" />
        <KpiCard label="Citas agendadas" value={stats.aiAppts} sub="por la IA" icon={<CalendarCheck size={18} />} color="#3b82f6" href="/app/calendario" />
        <KpiCard label="Presupuestos enviados" value={pipeline.enviado.length + pipeline.aceptado.length} sub="activos" icon={<FileText size={18} />} color="#8b5cf6" href="/app/presupuestos" />
        <KpiCard label="Ventas cerradas" value={pipeline.aceptado.length} sub="presupuestos aceptados" icon={<TrendingUp size={18} />} color="#f59e0b" href="/app/presupuestos" />
      </div>

      {/* ── Dos columnas: leads + citas ── */}
      <div className="dash-cols">
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
                    <small style={{ color: 'var(--text-tertiary)', fontSize: '0.62rem' }}>
                      {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-widget__empty"><Bot size={22} /><p>La IA cualificará leads aquí. Conecta WhatsApp para empezar.</p></div>
          )}
        </div>

        <div className="dash-widget">
          <div className="dash-widget__head">
            <h3><CalendarCheck size={16} /> Citas de hoy</h3>
            <Link to="/app/calendario">Ver agenda <ChevronRight size={12} /></Link>
          </div>
          {todayAppts.length > 0 ? (
            <div className="dash-widget__list">
              {todayAppts.map((a, i) => (
                <div key={i} className="dash-appt">
                  <div className={`dash-appt__time ${a.created_by === 'ai' ? 'dash-appt__time--ai' : ''}`}>{a.start_time?.substring(0, 5)}</div>
                  <div className="dash-appt__info"><b>{a.client_name}</b><span>{a.service || 'Discovery call'}</span></div>
                  {a.created_by === 'ai' && <span className="dash-appt__badge">IA</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-widget__empty"><CalendarCheck size={22} /><p>No hay citas para hoy. La IA agendará automáticamente.</p></div>
          )}
        </div>
      </div>

      {/* ── Configuración pendiente ── */}
      {!allSetup && (
        <div className="dash-setup">
          <div className="dash-setup__head">
            <div>
              <h3>Configura tu agente</h3>
              <span>{setupDone} de {setupSteps.length} pasos</span>
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

    </div>
  );
}
