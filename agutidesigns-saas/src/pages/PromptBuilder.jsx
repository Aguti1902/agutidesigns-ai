import { useState, useEffect } from 'react';
import {
  Bot, Save, Check, Loader2, Zap, MessageSquare, Shield, Target,
  AlertCircle, ChevronDown, ChevronUp, Sparkles,
  Calendar, Euro, Lock, Clock, Repeat, Link2, Settings2, Copy, BookOpen, CheckCircle, Users, TrendingUp,
  Smile, Briefcase, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import './DashboardPages.css';

/* ══════════════════════════════════════════
   PROMPT EN CAPAS (arquitectura estructurada)
══════════════════════════════════════════ */
function buildSystemPrompt({ agentName, tono, language, serviciosOfrecidos, presupuestoMin, puedeCerrarSinLlamada, puedeDescuento, maxDescuento, maxSeguimientos, bookingEnabled, duracionLlamada, umbralMensajes, businessData,
  // advanced
  formalidad, agresividad, tecnicismo, capabilities, restrictions, greeting, farewell, customRules, objetivo, clienteIdeal, ofertasText, upsellingServices, seguimientoMsg, derivarContacto, puedeFraccionar, comoPago, linkReserva, intervaloSeguimiento, precioMinimoCierre, maxRevisiones, noNegociarMant
}) {
  const extra = (() => { try { return businessData?.extra_context ? JSON.parse(businessData.extra_context) : {}; } catch { return {}; } })();

  const tonoMap = {
    cercano: { f: 2, a: 2, desc: 'Cercano y empático. Tuteo natural, algún emoji puntual. Cálido pero sin excesos.' },
    profesional: { f: 3, a: 3, desc: 'Profesional y equilibrado. Ni muy formal ni muy informal. Activo pero siempre respetuoso.' },
    directo: { f: 3, a: 4, desc: 'Directo y orientado al cierre. Propone activamente, supera objeciones, busca la decisión.' },
  };
  const tonoData = tonoMap[tono] || tonoMap.profesional;
  const f = formalidad || tonoData.f;
  const a = agresividad || tonoData.a;
  const t = tecnicismo || 2;

  const formalMap = ['Muy informal. Tuteo, emojis frecuentes.', 'Informal pero correcto. Tuteo natural, algún emoji.', 'Neutro. Adaptarse al cliente.', 'Profesional. Sin tuteo excesivo.', 'Muy formal. Usted, sin emojis.'];
  const agresMap = ['Solo informar. Sin presión.', 'Suave. Una llamada a la acción por conversación.', 'Equilibrado. Proponer activamente pero respetar el ritmo.', 'Proactivo. Buscar el cierre. Superar objeciones.', 'Cerrador. Técnicas de venta activas siempre.'];
  const langMap = { es: 'Español siempre.', en: 'English always.', 'es-en': 'Detecta el idioma del cliente y responde en ese idioma.', auto: 'Detecta el idioma y respóndele en su idioma.' };

  const finalObjetivo = puedeCerrarSinLlamada ? 'cerrar' : (objetivo || 'agendar');
  const objMap = {
    agendar: 'OBJETIVO: Proponer una llamada de discovery de 20-30 min cuando hay interés real. Tu misión es conseguir la llamada, no cerrar por WhatsApp.',
    cerrar: 'OBJETIVO: Cerrar el proyecto directamente por WhatsApp cuando sea posible. Da toda la info necesaria para que el cliente decida sin llamada.',
    cualificar: 'OBJETIVO: Cualificar al lead (presupuesto, tipo de proyecto, urgencia) y pasarlo al equipo humano cuando sea válido.',
  };

  const negNombre = businessData?.name || 'el negocio';
  const negWeb = extra.web_services_detail || businessData?.services || '';
  const negPrecios = extra.prices_list || businessData?.prices || '';
  const negAbout = extra.web_about || businessData?.description || '';
  const negPago = extra.payment_methods || '';
  const negEntrega = extra.delivery_time || '';
  const negTel = businessData?.phone || '';
  const negEmail = businessData?.email || '';
  const negWebUrl = businessData?.website || '';

  const serviciosList = serviciosOfrecidos?.length
    ? serviciosOfrecidos.join(', ')
    : (negWeb || 'diseño web, landing pages, ecommerce');

  const descuentoRule = puedeDescuento
    ? `Puedes ofrecer hasta un ${maxDescuento || 10}% de descuento si el cliente tiene alto interés demostrado.`
    : 'No tienes autorización para hacer descuentos.';

  const seguimientosRule = maxSeguimientos > 0
    ? `Haz máximo ${maxSeguimientos} seguimiento${maxSeguimientos > 1 ? 's' : ''} si el cliente no responde.`
    : 'No hagas seguimientos automáticos.';

  const umbralRule = umbralMensajes > 0
    ? `Si el cliente lleva más de ${umbralMensajes} mensajes sin decidir, deriva al profesional humano.`
    : '';

  const calendlyLink = extra.calendly_url || '';
  const teamsLink = extra.teams_url || '';
  const agendaRule = bookingEnabled
    ? `Puedes proponer y agendar una llamada de ${duracionLlamada || 30} minutos.${calendlyLink ? ` Envía este link de reserva: ${calendlyLink}` : ''}${teamsLink ? ` O conéctense por Teams: ${teamsLink}` : ''}`
    : `Para agendar una reunión, proporciona el link de contacto.${calendlyLink ? ` Link de reserva: ${calendlyLink}` : ''}${teamsLink ? ` Teams: ${teamsLink}` : ''}`;

  const activeCaps = (capabilities || ['leads','precios','ventas','citas','objeciones','derivar']).map(c => {
    const capMap = {
      leads: '✓ Recoge nombre, email y teléfono del prospecto de forma natural antes de terminar la conversación.',
      precios: `✓ Da rangos de precio. Nunca precio cerrado sin Discovery.${presupuestoMin ? ` Si el presupuesto es inferior a ${presupuestoMin}€, indícalo con tacto.` : ''}`,
      ventas: '✓ Detecta la oportunidad, recomienda el servicio adecuado y guía hacia el cierre.',
      citas: `✓ Cuando hay interés real, propón fecha y hora concreta para la Discovery call${bookingEnabled ? ` (${duracionLlamada || 30} min)` : ''}.`,
      objeciones: '✓ Supera objeciones: "Es caro" → desglosa el valor. "Me lo pienso" → "¿Qué info te falta para decidir?"',
      derivar: `✓ Cuando el proyecto es complejo o el lead es de alto valor, transfiere al profesional.${derivarContacto ? `\n   Contacto: ${derivarContacto}` : ''}`,
      upselling: `✓ Sugiere servicios complementarios.${upsellingServices ? ` Priorizar: ${upsellingServices}` : ' Ej: SEO, mantenimiento, formación.'}`,
      ofertas: `✓ Informa de las promociones.${ofertasText ? ` ${ofertasText}` : ' (No hay ofertas activas actualmente.)'}`,
      seguimiento: `✓ Recupera prospectos fríos.${seguimientoMsg ? ` Mensaje: "${seguimientoMsg}"` : ' Tono cálido y sin presión.'}`,
    };
    return capMap[c];
  }).filter(Boolean).join('\n');

  const finalRestrictions = [...(restrictions || ['no_inventar','no_descuentos','no_competencia','no_presionar','no_prometer','derivar_complejas','confirmar_precios','pedir_datos'])];
  if (precioMinimoCierre) finalRestrictions.push('precio_minimo');
  if (maxRevisiones) finalRestrictions.push('max_revisiones');
  if (noNegociarMant) finalRestrictions.push('no_negociar_mant');

  const restMap = {
    no_inventar: '✗ NUNCA inventes servicios, precios, plazos o información que no tengas.',
    no_descuentos: `✗ ${descuentoRule}`,
    no_competencia: '✗ NO menciones ni compares con otros profesionales o agencias.',
    no_presionar: '✗ NO seas agresivo. Vender es ayudar, no presionar.',
    no_prometer: '✗ NO prometas resultados específicos.',
    derivar_complejas: '✗ Si el proyecto supera el alcance habitual, deriva al profesional humano.',
    confirmar_precios: '✗ Siempre aclara que los precios son orientativos y el definitivo se fija en Discovery.',
    pedir_datos: '✓ SIEMPRE intenta recoger nombre + teléfono/email antes de terminar.',
    precio_minimo: `✗ NUNCA cierres proyectos por debajo de ${precioMinimoCierre}€.`,
    max_revisiones: `✗ El proyecto incluye máximo ${maxRevisiones} ronda${maxRevisiones > 1 ? 's' : ''} de revisión.`,
    no_negociar_mant: '✗ El precio de mantenimiento mensual NO es negociable.',
  };
  const activeRests = finalRestrictions.filter(r => restMap[r]).map(r => restMap[r]).join('\n');
  const clienteIdealStr = clienteIdeal?.length ? `Cliente ideal: ${clienteIdeal.join(', ')}.` : '';

  return `/* CAPA 1 — IDENTIDAD */
Eres "${agentName || 'Asistente'}", el agente comercial de IA de ${negNombre}. Experto en diseño web y desarrollo freelance para autónomos y pequeñas empresas.

TONO: ${tonoData.desc}
FORMALIDAD: ${formalMap[f - 1] || formalMap[2]}
ESTILO COMERCIAL: ${agresMap[a - 1] || agresMap[2]}
IDIOMA: ${langMap[language] || langMap.es}
${greeting ? `SALUDO: "${greeting}"` : `SALUDO: "¡Hola! 👋 Soy ${agentName || 'el asistente'} de ${negNombre}. ¿En qué puedo ayudarte con tu proyecto?"`}
${farewell ? `DESPEDIDA: "${farewell}"` : ''}

/* CAPA 2 — NEGOCIO */
NOMBRE: ${negNombre}
${negWebUrl ? `WEB: ${negWebUrl}` : ''}
${negTel ? `TEL: ${negTel}` : ''}
${negEmail ? `EMAIL: ${negEmail}` : ''}
SERVICIOS QUE OFRECEMOS: ${serviciosList}
${negAbout ? `SOBRE EL NEGOCIO:\n${negAbout}` : ''}
${negPrecios ? `PRECIOS ORIENTATIVOS:\n${negPrecios}` : ''}
${negEntrega ? `PLAZOS: ${negEntrega}` : ''}
${negPago ? `FORMA DE PAGO: ${negPago}` : ''}
${presupuestoMin ? `PRESUPUESTO MÍNIMO: ${presupuestoMin}€. Si el cliente menciona menos, gestiona con tacto y redirige.` : ''}

/* CAPA 3 — COMPORTAMIENTO COMERCIAL */
${objMap[finalObjetivo] || objMap.agendar}
${clienteIdealStr}

CAPACIDADES ACTIVAS:
${activeCaps || '✓ Atender consultas generales sobre los servicios del negocio.'}

CIERRE Y SEGUIMIENTO:
${descuentoRule}
${puedeFraccionar ? `Puedes ofrecer fraccionamiento: ${comoPago || '50% al inicio, 50% a la entrega.'}` : 'No ofrezcas fraccionamiento sin consultar.'}
${linkReserva ? `Puedes enviar el link de reserva/pago: ${linkReserva}` : ''}
${seguimientosRule}
${umbralRule}
${agendaRule}

/* CAPA 4 — RESTRICCIONES */
${activeRests || '✗ NUNCA inventes información.\n✗ No presiones al cliente.'}
✗ NUNCA digas que eres una IA a menos que te lo pregunten directamente.
✗ Mensajes cortos (WhatsApp, no email). Máximo 3 párrafos.
✗ No hables de temas ajenos al negocio.
${customRules ? `\nREGLAS PERSONALIZADAS:\n${customRules}` : ''}

/* CAPA 5 — FORMATO */
- WhatsApp: mensajes cortos y directos.
- Emojis: 1-2 por mensaje máximo, solo si el tono lo permite.
- *Negritas* para precios, plazos y nombres de servicios.
- SIEMPRE termina con una pregunta o llamada a la acción clara.

/* CAPA 6 — ENVÍO AUTOMÁTICO DE PRESUPUESTO PDF */
Cuando el cliente pida EXPLÍCITAMENTE un presupuesto por escrito, un PDF o un documento de precios para un proyecto concreto, incluye AL FINAL de tu respuesta (después del texto normal) esta etiqueta:
[[PRESUPUESTO:cliente=NOMBRE_CLIENTE|servicios=SERVICIO1:PRECIO,SERVICIO2:PRECIO]]

Ejemplos:
- Cliente: "¿me puedes mandar un presupuesto?" → Incluye: [[PRESUPUESTO:cliente=Carlos|servicios=Web corporativa:1200]]
- Cliente: "mándame el presupuesto del ecommerce" → [[PRESUPUESTO:cliente=María|servicios=Tienda online:2500,Pasarela de pago:200]]
- Cliente: "quiero un documento con los precios" → [[PRESUPUESTO:cliente=Pedro|servicios=Landing page:800]]

REGLAS ESTRICTAS:
- SOLO usa esta etiqueta cuando el cliente pide explícitamente un presupuesto, PDF o documento.
- Usa los precios de tu lista de precios orientativos. Si hay rango, usa el mínimo del rango.
- Si el servicio no tiene precio definido, pregunta más detalles ANTES de incluir la etiqueta.
- La etiqueta NO se muestra al cliente. El sistema genera el PDF y lo envía automáticamente.
- NO incluyas la etiqueta si el cliente solo pregunta por precios de forma general.
- El nombre del cliente es el de la persona con quien estás hablando.`;
}

/* ── Toggle ── */
function Toggle({ on, onChange, disabled }) {
  return (
    <button type="button" className={`ai-toggle ${on ? 'ai-toggle--on' : ''}`}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!on); }}
      disabled={disabled}>
      <span className="ai-toggle__knob" />
    </button>
  );
}

/* ── Block simplificado ── */
function SimpleBlock({ num, title, desc, children }) {
  return (
    <div className="sb">
      <div className="sb__head">
        <div className="sb__num">{num}</div>
        <div>
          <div className="sb__title">{title}</div>
          {desc && <div className="sb__desc">{desc}</div>}
        </div>
      </div>
      <div className="sb__body">{children}</div>
    </div>
  );
}

/* ── Advanced Block (acordeón) ── */
function AdvBlock({ letter, color, title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ai-block">
      <button className="ai-block__hd" type="button" onClick={() => setOpen(o => !o)}>
        <div className="ai-block__hd-l">
          <span className="ai-block__letter" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{letter}</span>
          <span className="ai-block__ico" style={{ color }}>{icon}</span>
          <span className="ai-block__title">{title}</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="ai-block__body">{children}</div>}
    </div>
  );
}

function PlantillaItem({ objecion, respuesta }) {
  const [copiado, setCopiado] = useState(false);
  const [expanded, setExpanded] = useState(false);
  function copiar() {
    navigator.clipboard.writeText(respuesta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }
  return (
    <div className="plantilla-item">
      <div className="plantilla-item__head" onClick={() => setExpanded(o => !o)}>
        <span className="plantilla-item__objecion">{objecion}</span>
        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button type="button" className="btn btn--outline btn--sm" onClick={e => { e.stopPropagation(); copiar(); }}>
            {copiado ? <><CheckCircle size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
          </button>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      {expanded && <div className="plantilla-item__respuesta">{respuesta}</div>}
    </div>
  );
}

const SERVICIOS_LIST = [
  { id: 'Web informativa', label: 'Web informativa' },
  { id: 'Landing page', label: 'Landing page' },
  { id: 'Ecommerce', label: 'Ecommerce' },
  { id: 'Blog', label: 'Blog' },
  { id: 'Portfolio', label: 'Portfolio' },
  { id: 'Mantenimiento web', label: 'Mantenimiento web' },
  { id: 'SEO', label: 'SEO' },
  { id: 'Diseño gráfico', label: 'Diseño gráfico' },
  { id: 'Aplicaciones web', label: 'Apps web' },
  { id: 'Rediseño web', label: 'Rediseño web' },
];

const LANGUAGES = [
  { id: 'es', label: '🇪🇸 ES' }, { id: 'en', label: '🇬🇧 EN' },
  { id: 'es-en', label: '🌍 ES+EN' }, { id: 'auto', label: 'Auto', icon: Search },
];

const CAPABILITIES_ADV = [
  { id: 'leads', label: 'Captar leads', desc: 'Nombre, email y teléfono del prospecto', default: true },
  { id: 'precios', label: 'Informar precios', desc: 'Responde con tus rangos de precio reales', default: true },
  { id: 'ventas', label: 'Vender activamente', desc: 'Recomienda y guía hacia el cierre', default: true },
  { id: 'citas', label: 'Agendar discovery calls', desc: 'Propone llamadas de descubrimiento', default: true },
  { id: 'objeciones', label: 'Superar objeciones', desc: '"Es caro", "me lo pienso"...', default: true },
  { id: 'derivar', label: 'Derivar a humano', desc: 'Transfiere si el proyecto es complejo', default: true },
  { id: 'upselling', label: 'Upselling', desc: 'Sugiere SEO, mantenimiento, formación...', default: false },
  { id: 'ofertas', label: 'Comunicar ofertas', desc: 'Informa de tus promociones activas', default: false },
  { id: 'seguimiento', label: 'Seguimiento de leads', desc: 'Recupera prospectos que se enfriaron', default: false },
];

const CLIENTE_TIPOS = [
  { id: 'pymes', label: 'PYMEs locales' }, { id: 'autonomos', label: 'Autónomos' },
  { id: 'ecommerce', label: 'Ecommerce' }, { id: 'empresas', label: 'Empresas medianas' },
  { id: 'startups', label: 'Startups' }, { id: 'profesionales', label: 'Profesionales liberales' },
];

const OBJETIVOS_ADV = [
  { id: 'agendar', label: 'Agendar discovery call', desc: 'La IA siempre termina proponiendo una llamada de 20 min' },
  { id: 'cerrar', label: 'Cerrar directo por WhatsApp', desc: 'La IA intenta cerrar sin llamada previa' },
  { id: 'cualificar', label: 'Filtrar y cualificar', desc: 'La IA solo cualifica y pasa los buenos leads al humano' },
];

const RESTRICTIONS_BASE = [
  { id: 'no_inventar', label: 'No inventar información', default: true },
  { id: 'no_descuentos', label: 'No hacer descuentos sin permiso', default: true },
  { id: 'no_competencia', label: 'No hablar de la competencia', default: true },
  { id: 'no_presionar', label: 'No ser agresivo al vender', default: true },
  { id: 'no_prometer', label: 'No prometer resultados garantizados', default: true },
  { id: 'derivar_complejas', label: 'Derivar proyectos fuera de scope', default: true },
  { id: 'confirmar_precios', label: 'Aclarar que los precios son orientativos', default: true },
  { id: 'pedir_datos', label: 'Siempre recoger datos de contacto', default: true },
];

export default function PromptBuilder() {
  const { user } = useAuth();
  const { activeAgent, refreshAgents } = useAgents();

  /* ── State simplificado (3 bloques) ── */
  const [agentName, setAgentName] = useState('');
  const [language, setLanguage] = useState('es');
  const [tono, setTono] = useState('profesional');
  const [serviciosOfrecidos, setServiciosOfrecidos] = useState(['Web informativa', 'Landing page', 'Ecommerce']);
  const [presupuestoMin, setPresupuestoMin] = useState('');
  const [puedeCerrarSinLlamada, setPuedeCerrarSinLlamada] = useState(false);
  const [puedeDescuento, setPuedeDescuento] = useState(false);
  const [maxDescuento, setMaxDescuento] = useState('10');
  const [maxSeguimientos, setMaxSeguimientos] = useState(2);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [duracionLlamada, setDuracionLlamada] = useState(30);
  const [umbralMensajes, setUmbralMensajes] = useState(10);

  /* ── State avanzado ── */
  const [formalidad, setFormalidad] = useState(null);
  const [agresividad, setAgresividad] = useState(null);
  const [tecnicismo, setTecnicismo] = useState(2);
  const [greeting, setGreeting] = useState('');
  const [farewell, setFarewell] = useState('');
  const [capabilities, setCapabilities] = useState(CAPABILITIES_ADV.filter(c => c.default).map(c => c.id));
  const [objetivo, setObjetivo] = useState('agendar');
  const [clienteIdeal, setClienteIdeal] = useState([]);
  const [ofertasText, setOfertasText] = useState('');
  const [upsellingServices, setUpsellingServices] = useState('');
  const [seguimientoMsg, setSeguimientoMsg] = useState('');
  const [derivarContacto, setDerivarContacto] = useState('');
  const [puedeFraccionar, setPuedeFraccionar] = useState(false);
  const [comoPago, setComoPago] = useState('');
  const [linkReserva, setLinkReserva] = useState('');
  const [intervaloSeguimiento, setIntervaloSeguimiento] = useState('48h');
  const [restrictions, setRestrictions] = useState(RESTRICTIONS_BASE.filter(r => r.default).map(r => r.id));
  const [precioMinimoCierre, setPrecioMinimoCierre] = useState('');
  const [maxRevisiones, setMaxRevisiones] = useState('2');
  const [noNegociarMant, setNoNegociarMant] = useState(true);
  const [customRules, setCustomRules] = useState('');

  const [businessData, setBusinessData] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (user) { loadAgent(); loadBusiness(); } }, [user]);
  useEffect(() => { if (activeAgent) setBookingEnabled(!!activeAgent.booking_enabled); }, [activeAgent]);

  async function loadAgent() {
    const { data } = await supabase.from('agents').select('*').eq('user_id', user.id).single();
    if (!data) return;
    if (data.name) setAgentName(data.name);
    if (data.language) setLanguage(data.language);
    try {
      const cfg = data.config ? JSON.parse(data.config) : {};
      if (cfg.tono) setTono(cfg.tono);
      if (cfg.serviciosOfrecidos) setServiciosOfrecidos(cfg.serviciosOfrecidos);
      if (cfg.puedeCerrarSinLlamada !== undefined) setPuedeCerrarSinLlamada(cfg.puedeCerrarSinLlamada);
      if (cfg.puedeDescuento !== undefined) setPuedeDescuento(cfg.puedeDescuento);
      if (cfg.maxDescuento) setMaxDescuento(cfg.maxDescuento);
      if (cfg.maxSeguimientos !== undefined) setMaxSeguimientos(cfg.maxSeguimientos);
      if (cfg.duracionLlamada) setDuracionLlamada(cfg.duracionLlamada);
      if (cfg.umbralMensajes !== undefined) setUmbralMensajes(cfg.umbralMensajes);
      if (cfg.presupuestoMinimo) setPresupuestoMin(cfg.presupuestoMinimo);
      // advanced
      if (cfg.formalidad) setFormalidad(cfg.formalidad);
      if (cfg.agresividad) setAgresividad(cfg.agresividad);
      if (cfg.tecnicismo) setTecnicismo(cfg.tecnicismo);
      if (cfg.greeting !== undefined) setGreeting(cfg.greeting);
      if (cfg.farewell !== undefined) setFarewell(cfg.farewell);
      if (cfg.capabilities) setCapabilities(cfg.capabilities);
      if (cfg.objetivo) setObjetivo(cfg.objetivo);
      if (cfg.clienteIdeal) setClienteIdeal(cfg.clienteIdeal);
      if (cfg.ofertasText) setOfertasText(cfg.ofertasText);
      if (cfg.upsellingServices) setUpsellingServices(cfg.upsellingServices);
      if (cfg.seguimientoMsg) setSeguimientoMsg(cfg.seguimientoMsg);
      if (cfg.derivarContacto) setDerivarContacto(cfg.derivarContacto);
      if (cfg.puedeFraccionar !== undefined) setPuedeFraccionar(cfg.puedeFraccionar);
      if (cfg.comoPago) setComoPago(cfg.comoPago);
      if (cfg.linkReserva) setLinkReserva(cfg.linkReserva);
      if (cfg.intervaloSeguimiento) setIntervaloSeguimiento(cfg.intervaloSeguimiento);
      if (cfg.restrictions) setRestrictions(cfg.restrictions);
      if (cfg.precioMinimoCierre) setPrecioMinimoCierre(cfg.precioMinimoCierre);
      if (cfg.maxRevisiones) setMaxRevisiones(cfg.maxRevisiones);
      if (cfg.noNegociarMant !== undefined) setNoNegociarMant(cfg.noNegociarMant);
      if (cfg.customRules) setCustomRules(cfg.customRules);
    } catch {}
  }

  async function loadBusiness() {
    const { data } = await supabase.from('businesses').select('*').eq('user_id', user.id).single();
    setBusinessData(data);
  }

  async function toggleBooking() {
    const val = !bookingEnabled;
    setBookingEnabled(val);
    if (activeAgent) {
      await supabase.from('agents').update({ booking_enabled: val, updated_at: new Date().toISOString() }).eq('id', activeAgent.id);
      refreshAgents();
    }
  }

  async function handleSave() {
    setSaving(true);
    const extraSaved = (() => { try { return businessData?.extra_context ? JSON.parse(businessData.extra_context) : {}; } catch { return {}; } })();
    // Sincronizar tono con extra_context.tono_rapido para que el Dashboard lo lea
    const extraUpdated = { ...extraSaved, ofertasText, upsellingServices, seguimientoMsg, derivarContacto, tono_rapido: tono };
    if (businessData) {
      await supabase.from('businesses').update({ extra_context: JSON.stringify(extraUpdated), updated_at: new Date().toISOString() }).eq('user_id', user.id);
    }

    const config = {
      tono, serviciosOfrecidos, puedeCerrarSinLlamada, puedeDescuento, maxDescuento,
      maxSeguimientos, duracionLlamada, umbralMensajes, presupuestoMinimo: presupuestoMin,
      formalidad, agresividad, tecnicismo, greeting, farewell, capabilities, objetivo,
      clienteIdeal, ofertasText, upsellingServices, seguimientoMsg, derivarContacto,
      puedeFraccionar, comoPago, linkReserva, intervaloSeguimiento, restrictions,
      precioMinimoCierre, maxRevisiones, noNegociarMant, customRules,
    };

    const prompt = buildSystemPrompt({
      agentName, tono, language, serviciosOfrecidos, presupuestoMin,
      puedeCerrarSinLlamada, puedeDescuento, maxDescuento, maxSeguimientos,
      bookingEnabled, duracionLlamada, umbralMensajes, businessData: { ...businessData, extra_context: JSON.stringify(extraUpdated) },
      formalidad, agresividad, tecnicismo, capabilities, restrictions, greeting, farewell,
      customRules, objetivo, clienteIdeal, ofertasText, upsellingServices, seguimientoMsg,
      derivarContacto, puedeFraccionar, comoPago, linkReserva, intervaloSeguimiento,
      precioMinimoCierre, maxRevisiones, noNegociarMant,
    });

    const agentData = { name: agentName || 'Asistente', language, system_prompt: prompt, config: JSON.stringify(config), updated_at: new Date().toISOString() };
    const { data: existing } = await supabase.from('agents').select('id').eq('user_id', user.id).single();
    if (existing) await supabase.from('agents').update(agentData).eq('id', existing.id);
    else await supabase.from('agents').insert({ user_id: user.id, ...agentData });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  const toggleServicio = (id) => setServiciosOfrecidos(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  const toggleCap = (id) => setCapabilities(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  const toggleRest = (id) => setRestrictions(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
  const toggleCliente = (id) => setClienteIdeal(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  const businessFilled = businessData ? Object.values(businessData).filter(v => v && typeof v === 'string' && v.trim()).length : 0;

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><Bot size={22} /> Configura tu agente comercial</h1>
          <p>IA pre-entrenada para diseñadores web freelance. 3 decisiones clave.</p>
        </div>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saved ? <><Check size={14} /> Guardado</> : saving ? <><Loader2 size={14} className="spin" /> Guardando...</> : <><Check size={14} /> Guardar</>}
        </button>
      </div>

      {businessFilled < 4 && (
        <div className="ai-alert ai-alert--warn"><AlertCircle size={16} /><span>Rellena <strong>Ajustes → Mi Negocio</strong> para que la IA responda con tus datos reales.</span></div>
      )}
      {businessFilled >= 4 && (
        <div className="ai-alert ai-alert--ok"><Check size={16} /><span>Datos del negocio cargados. La IA usará tu información real.</span></div>
      )}
      {!activeAgent?.whatsapp_connected && (
        <div className="ai-alert ai-alert--warn" style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>Tu agente IA <strong>no está activo</strong> — necesitas conectar WhatsApp para que empiece a responder.</span>
          </span>
          <a href="/app/whatsapp" className="btn btn--primary" style={{ padding: '0.4rem 1rem', fontSize: '0.78rem', flexShrink: 0 }}>
            Conectar WhatsApp
          </a>
        </div>
      )}

      {/* ══ BLOQUE 1 — CÓMO QUIERES QUE HABLE ══ */}
      <SimpleBlock num="1" title="Cómo quieres que hable" desc="Nombre, idioma y tono del agente">
        <div className="form-grid">
          <div className="form-field">
            <label>Nombre del agente</label>
            <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Ej: Alex, Sofía, Asistente Guti..." />
            <span className="form-field__hint">Con qué nombre se presenta a los clientes</span>
          </div>
          <div className="form-field">
            <label>Idioma de respuesta</label>
            <div className="chips">
              {LANGUAGES.map(l => (
                <button key={l.id} type="button" className={`chip ${language === l.id ? 'chip--active' : ''}`} onClick={() => setLanguage(l.id)}>
                  {l.icon ? <><l.icon size={11} /> {l.label}</> : l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="form-field form-field--full" style={{ marginTop: '0.5rem' }}>
          <label>Tono del agente</label>
          <div className="tone-btns">
            {[
              { id: 'cercano', icon: Smile, label: 'Cercano', desc: 'Cálido y empático' },
              { id: 'profesional', icon: Briefcase, label: 'Profesional', desc: 'Claro y equilibrado' },
              { id: 'directo', icon: Zap, label: 'Directo', desc: 'Orientado al cierre' },
            ].map(t => (
              <button key={t.id} type="button" className={`tone-btn ${tono === t.id ? 'tone-btn--active' : ''}`} onClick={() => setTono(t.id)}>
                <span className="tone-btn__emoji"><t.icon size={20} /></span>
                <span className="tone-btn__label">{t.label}</span>
                <span className="tone-btn__desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </SimpleBlock>

      {/* ══ BLOQUE 2 — CÓMO QUIERES QUE VENDA ══ */}
      <SimpleBlock num="2" title="Cómo quieres que venda" desc="Reglas de negocio que cambian la facturación">
        <div className="form-field" style={{ marginBottom: '1.25rem' }}>
          <label><Euro size={13} /> Presupuesto mínimo de proyecto (€)</label>
          <input type="number" value={presupuestoMin} onChange={e => setPresupuestoMin(e.target.value)} placeholder="400" style={{ maxWidth: '200px' }} />
          <span className="form-field__hint">Si el cliente menciona menos, la IA lo gestiona con tacto</span>
        </div>

        <div className="form-field form-field--full" style={{ marginBottom: '1.25rem' }}>
          <label>Servicios que ofreces</label>
          <div className="chips" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
            {SERVICIOS_LIST.map(s => (
              <button key={s.id} type="button" className={`chip ${serviciosOfrecidos.includes(s.id) ? 'chip--active' : ''}`} onClick={() => toggleServicio(s.id)}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="ai-toggle-rows">
          <div className="ai-toggle-row">
            <div>
              <b>¿Puede cerrar sin llamada previa?</b>
              <span>La IA intenta cerrar el proyecto directamente por WhatsApp</span>
            </div>
            <Toggle on={puedeCerrarSinLlamada} onChange={setPuedeCerrarSinLlamada} />
          </div>
          <div className="ai-toggle-row">
            <div>
              <b>¿Puede ofrecer descuento?</b>
              <span>Autoriza a la IA a negociar precio dentro de un límite</span>
            </div>
            <Toggle on={puedeDescuento} onChange={setPuedeDescuento} />
          </div>
          {puedeDescuento && (
            <div className="ai-sub-row">
              <div className="form-field">
                <label>Descuento máximo permitido (%)</label>
                <input type="number" min="1" max="50" value={maxDescuento} onChange={e => setMaxDescuento(e.target.value)} placeholder="10" style={{ maxWidth: '140px' }} />
              </div>
            </div>
          )}
        </div>

        <div className="form-field" style={{ marginTop: '1.25rem' }}>
          <label><Repeat size={13} /> ¿Cuántos seguimientos hace si no responden?</label>
          <div className="chips">
            {[0, 1, 2, 3].map(n => (
              <button key={n} type="button" className={`chip ${maxSeguimientos === n ? 'chip--active' : ''}`} onClick={() => setMaxSeguimientos(n)}>
                {n === 0 ? 'Ninguno' : `${n} ${n === 1 ? 'seguimiento' : 'seguimientos'}`}
              </button>
            ))}
          </div>
        </div>
      </SimpleBlock>

      {/* ══ BLOQUE 3 — CÓMO AGENDA ══ */}
      <SimpleBlock num="3" title="Cómo agenda y deriva" desc="Agenda automática y cuándo pasar al humano">
        <div className="ai-toggle-row" style={{ marginBottom: '1.25rem' }}>
          <div>
            <b><Calendar size={13} /> Activar agendamiento automático</b>
            <span>La IA propone y agenda llamadas directamente en tu calendario</span>
          </div>
          <Toggle on={bookingEnabled} onChange={() => toggleBooking()} />
        </div>

        {bookingEnabled && (
          <div className="form-field" style={{ marginBottom: '1.25rem' }}>
            <label>Duración de la llamada</label>
            <div className="chips">
              {[15, 20, 30, 45, 60].map(d => (
                <button key={d} type="button" className={`chip ${duracionLlamada === d ? 'chip--active' : ''}`} onClick={() => setDuracionLlamada(d)}>{d} min</button>
              ))}
            </div>
          </div>
        )}

        <div className="form-field" style={{ marginBottom: '1.5rem' }}>
          <label><MessageSquare size={13} /> Derivar a humano después de</label>
          <div className="chips">
            {[5, 10, 15, 20].map(n => (
              <button key={n} type="button" className={`chip ${umbralMensajes === n ? 'chip--active' : ''}`} onClick={() => setUmbralMensajes(n)}>{n} mensajes</button>
            ))}
            <button type="button" className={`chip ${umbralMensajes === 0 ? 'chip--active' : ''}`} onClick={() => setUmbralMensajes(0)}>Sin límite</button>
          </div>
          <span className="form-field__hint" style={{ marginTop: '0.6rem' }}>Si el cliente no decide, la IA escala al profesional humano</span>
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.65rem', fontWeight: 600 }}>
            La IA siempre derivará al humano si:
          </div>
          <div className="derivar-conditions">
            {[
              'Proyecto complejo o alto presupuesto',
              'El cliente lo pide',
              'Dudas técnicas fuera del alcance',
            ].map((cond, i) => (
              <div key={i} className="derivar-condition">
                <Check size={12} />
                <span>{cond}</span>
              </div>
            ))}
          </div>
        </div>
      </SimpleBlock>

      {/* ══ MODO AVANZADO ══ */}
      <div className="advanced-toggle" onClick={() => setShowAdvanced(o => !o)}>
        <Settings2 size={15} />
        <span>Modo avanzado — Ajustes PRO</span>
        <span className="advanced-toggle__badge">Opcional</span>
        {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </div>

      {showAdvanced && (
        <div className="advanced-section">
          <div className="advanced-section__note">
            <AlertCircle size={14} />
            Ajustes finos para usuarios que quieren control total. La configuración básica de arriba ya genera un agente muy eficaz.
          </div>

          {/* Identidad avanzada */}
          <AdvBlock letter="A" color="#3b82f6" title="Identidad avanzada" icon={<Bot size={16}/>}>
            <div className="form-grid">
              <div className="form-field form-field--full">
                <label>Saludo inicial personalizado</label>
                <textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={2} placeholder={`Ej: ¡Hola! 👋 Soy ${agentName || 'Alex'}. ¿En qué puedo ayudarte con tu proyecto web?`} />
              </div>
              <div className="form-field form-field--full">
                <label>Despedida personalizada</label>
                <textarea value={farewell} onChange={e => setFarewell(e.target.value)} rows={2} placeholder="Ej: ¡Genial! Cualquier cosa que necesites, aquí estaré 🚀" />
              </div>
            </div>
          </AdvBlock>

          {/* Estrategia avanzada */}
          <AdvBlock letter="B" color="#f59e0b" title="Estrategia comercial avanzada" icon={<Target size={16}/>}>
            <div className="form-field form-field--full" style={{ marginBottom: '1.25rem' }}>
              <label>Objetivo principal detallado</label>
              <div className="ai-objetivo-list">
                {OBJETIVOS_ADV.map(o => (
                  <div key={o.id} className={`ai-objetivo ${objetivo === o.id ? 'ai-objetivo--on' : ''}`} onClick={() => setObjetivo(o.id)}>
                    <div className="ai-objetivo__radio">{objetivo === o.id ? '●' : '○'}</div>
                    <div><b>{o.label}</b><span>{o.desc}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-field" style={{ marginBottom: '1.25rem' }}>
              <label><Users size={13}/> Tipo de cliente ideal</label>
              <div className="chips" style={{ flexWrap: 'wrap' }}>
                {CLIENTE_TIPOS.map(c => <button key={c.id} type="button" className={`chip ${clienteIdeal.includes(c.id) ? 'chip--active' : ''}`} onClick={() => toggleCliente(c.id)}>{c.label}</button>)}
              </div>
            </div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem' }}><Zap size={13}/> Capacidades activas</label>
            <div className="ai-cap-grid">
              {CAPABILITIES_ADV.map(c => {
                const isOn = capabilities.includes(c.id);
                return (
                  <div key={c.id} className={`ai-cap-card ${isOn ? 'ai-cap-card--on' : ''}`}>
                    <div className="ai-cap-card__head" onClick={() => toggleCap(c.id)} style={{ cursor: 'pointer' }}>
                      <span className="ai-cap-card__label">{c.label}</span>
                      <Toggle on={isOn} onChange={() => toggleCap(c.id)} />
                    </div>
                    <span className="ai-cap-card__desc">{c.desc}</span>
                    {isOn && c.id === 'ofertas' && (
                      <div className="ai-cap-sub" onClick={e => e.stopPropagation()}>
                        <label>Ofertas y promociones activas</label>
                        <textarea value={ofertasText} onChange={e => setOfertasText(e.target.value)} rows={2} placeholder="Ej: -15% en webs hasta fin de mes" />
                      </div>
                    )}
                    {isOn && c.id === 'upselling' && (
                      <div className="ai-cap-sub" onClick={e => e.stopPropagation()}>
                        <label>Servicios a ofrecer como complemento</label>
                        <textarea value={upsellingServices} onChange={e => setUpsellingServices(e.target.value)} rows={2} placeholder="Ej: SEO (300€), Mantenimiento (50€/mes)" />
                      </div>
                    )}
                    {isOn && c.id === 'seguimiento' && (
                      <div className="ai-cap-sub" onClick={e => e.stopPropagation()}>
                        <label>Mensaje de seguimiento</label>
                        <textarea value={seguimientoMsg} onChange={e => setSeguimientoMsg(e.target.value)} rows={2} placeholder="Ej: ¡Hola! ¿Has tenido tiempo de pensarlo? 😊" />
                      </div>
                    )}
                    {isOn && c.id === 'derivar' && (
                      <div className="ai-cap-sub" onClick={e => e.stopPropagation()}>
                        <label>Persona/contacto al que derivar</label>
                        <input value={derivarContacto} onChange={e => setDerivarContacto(e.target.value)} placeholder="Ej: Guti — +34 600 000 000" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AdvBlock>

          {/* Lógica de cierre avanzada */}
          <AdvBlock letter="C" color="#8b5cf6" title="Lógica de cierre avanzada" icon={<TrendingUp size={16}/>}>
            <div className="ai-toggle-rows">
              <div className="ai-toggle-row">
                <div><b>¿Puede ofrecer fraccionamiento de pago?</b><span>La IA puede proponer pagar en plazos</span></div>
                <Toggle on={puedeFraccionar} onChange={setPuedeFraccionar} />
              </div>
              {puedeFraccionar && (
                <div className="ai-sub-row">
                  <div className="form-field form-field--full">
                    <label>¿Cómo? (explícalo para que la IA lo sepa)</label>
                    <input value={comoPago} onChange={e => setComoPago(e.target.value)} placeholder="Ej: 50% al inicio, 50% a la entrega." />
                  </div>
                </div>
              )}
              <div className="ai-sub-row">
                <div className="form-field form-field--full">
                  <label><Link2 size={12}/> URL del link de reserva/pago (opcional)</label>
                  <input value={linkReserva} onChange={e => setLinkReserva(e.target.value)} placeholder="https://calendly.com/tu-nombre" />
                </div>
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: '1.25rem' }}>
              <div className="form-field">
                <label><Clock size={13}/> Intervalo entre seguimientos</label>
                <select value={intervaloSeguimiento} onChange={e => setIntervaloSeguimiento(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  <option value="24h">24 horas</option>
                  <option value="48h">48 horas (recomendado)</option>
                  <option value="1 semana">1 semana</option>
                </select>
              </div>
            </div>
          </AdvBlock>

          {/* Restricciones avanzadas */}
          <AdvBlock letter="D" color="#ef4444" title="Restricciones avanzadas" icon={<Shield size={16}/>}>
            <div className="ai-rest-list" style={{ marginBottom: '1.25rem' }}>
              {RESTRICTIONS_BASE.map(r => (
                <div key={r.id} className="ai-rest-row">
                  <span className={`ai-rest-row__label ${restrictions.includes(r.id) ? 'ai-rest-row__label--on' : ''}`}>{r.label}</span>
                  <Toggle on={restrictions.includes(r.id)} onChange={() => toggleRest(r.id)} />
                </div>
              ))}
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label><Lock size={13}/> Nunca cerrar por debajo de (€)</label>
                <input type="number" value={precioMinimoCierre} onChange={e => setPrecioMinimoCierre(e.target.value)} placeholder="Ej: 600" />
              </div>
              <div className="form-field">
                <label><Repeat size={13}/> Máximo de revisiones incluidas</label>
                <input type="number" min="1" max="10" value={maxRevisiones} onChange={e => setMaxRevisiones(e.target.value)} placeholder="2" />
              </div>
            </div>
            <div className="ai-toggle-row" style={{ marginTop: '1rem' }}>
              <div><b>No negociar el precio de mantenimiento mensual</b><span>El mantenimiento tiene precio fijo</span></div>
              <Toggle on={noNegociarMant} onChange={setNoNegociarMant} />
            </div>
            <div className="form-field form-field--full" style={{ marginTop: '1.25rem' }}>
              <label>Reglas adicionales personalizadas</label>
              <textarea value={customRules} onChange={e => setCustomRules(e.target.value)} rows={3} placeholder="Ej: Si preguntan por apps móviles, indicar que no las hacemos..." />
            </div>
          </AdvBlock>

          {/* Plantillas de objeciones */}
          <AdvBlock letter="E" color="#25D366" title="Plantillas de respuesta a objeciones" icon={<BookOpen size={16}/>}>
            {[
              { objecion: '"Es caro" / "Me parece mucho"', respuesta: `Entiendo perfectamente, el precio es importante. Lo que incluye este presupuesto es [describir valor: diseño personalizado, desarrollo, SEO básico, soporte X meses...]. Si lo comparamos con lo que puede generarte en clientes —muchos negocios recuperan la inversión en los primeros meses— suele salir muy rentable. ¿Qué rango tienes en mente?` },
              { objecion: '"Me lo tengo que pensar"', respuesta: `Sin ningún problema, sin prisa. ¿Hay alguna duda concreta que te haya surgido? A veces aclarar un detalle ayuda a decidir con más seguridad.` },
              { objecion: '"Otro me lo hace más barato"', respuesta: `Totalmente normal que compares. La diferencia suele estar en qué incluye exactamente: el diseño, el soporte posterior, los plazos... ¿Sabes qué incluye la otra oferta?` },
              { objecion: '"¿Puedes hacerme un descuento?"', respuesta: `Mi precio está ajustado al trabajo real. Lo que sí puedo es ajustar el alcance si el presupuesto es un condicionante. ¿Qué es lo más prioritario para ti ahora?` },
              { objecion: '"¿Cuánto tardas?"', respuesta: `Depende del proyecto. Una web corporativa suele estar lista en 3-4 semanas. Una landing en 1-2 semanas. Trabajo con plazos cerrados. ¿Tienes alguna fecha límite?` },
            ].map((t, i) => <PlantillaItem key={i} objecion={t.objecion} respuesta={t.respuesta} />)}
          </AdvBlock>
        </div>
      )}

      {/* ── Guardar sticky ── */}
      <div className="sticky-save">
        {!activeAgent?.whatsapp_connected && (
          <a href="/app/whatsapp" className="btn btn--outline btn--lg" style={{ fontSize: '0.85rem' }}>
            <AlertCircle size={15} /> IA inactiva — Conectar WhatsApp
          </a>
        )}
        <button className="btn btn--primary btn--lg" onClick={handleSave} disabled={saving}>
          {saved ? <><Check size={16} /> Guardado</> : saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Check size={16} /> Guardar configuración</>}
        </button>
      </div>
    </div>
  );
}
