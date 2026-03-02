import { useState, useEffect } from 'react';
import {
  Bot, Save, Check, Loader2, Zap, MessageSquare, Shield, Target,
  AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles,
  Calendar, Users, Euro, Lock, Clock, TrendingUp, Repeat, Link2,
  Copy, BookOpen, CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import './DashboardPages.css';

/* ══════════════════════════════════════════
   PROMPT EN CAPAS (arquitectura estructurada)
   Capa 1: Identidad del producto (fija)
   Capa 2: Negocio del usuario
   Capa 3: Comportamiento comercial
   Capa 4: Restricciones
   Capa 5: Contexto conversación
══════════════════════════════════════════ */
function buildSystemPrompt({ name, formalidad, agresividad, tecnicismo, language, capabilities, restrictions, greeting, farewell, customRules, businessData, estrategia, cierre }) {
  const extra = (() => { try { return businessData?.extra_context ? JSON.parse(businessData.extra_context) : {}; } catch { return {}; } })();

  const formalMap = ['Muy informal. Tuteo, emojis frecuentes, lenguaje coloquial.', 'Informal pero correcto. Tuteo natural, algún emoji puntual.', 'Neutro. Ni muy formal ni muy informal. Adaptarse al cliente.', 'Profesional. Sin tuteo excesivo, pocas bromas.', 'Muy formal. Usted, lenguaje corporativo, sin emojis.'];
  const agresMap = ['Solo informar. No presionar nunca. Si el cliente no tiene interés, no insistir.', 'Suave. Insinuar la compra pero sin presionar. Una llamada a la acción por conversación.', 'Equilibrado. Proponer activamente pero respetar el ritmo del cliente.', 'Proactivo. Buscar activamente el cierre. Varias llamadas a la acción. Superar objeciones.', 'Cerrador. Orientado al cierre en cada mensaje. Técnicas de venta activas siempre.'];
  const tecMap = ['Lenguaje muy simple. No usar términos técnicos. Explicar todo como si el cliente no sabe nada de web.', 'Lenguaje simple con algún término técnico explicado.', 'Balance. Términos técnicos cuando ayudan, siempre con breve explicación.', 'Técnico. Puede usar términos del sector (SEO, CMS, WordPress, etc.) sin explicarlos.', 'Muy técnico. Cliente con conocimientos del sector. Tecnicismos naturales.'];
  const langMap = { es: 'Español siempre.', en: 'English always.', 'es-en': 'Detecta el idioma del cliente y responde en ese idioma.', auto: 'Detecta el idioma y respóndele en su idioma.' };
  const objMap = {
    agendar: 'OBJETIVO: Proponer una llamada de discovery de 20-30 minutos al final de cada conversación con interés real. No intentes cerrar por WhatsApp — tu misión es conseguir la llamada.',
    cerrar: 'OBJETIVO: Cerrar el proyecto directamente por WhatsApp cuando sea posible. Proporciona toda la info necesaria para que el cliente pueda decidir sin llamada.',
    cualificar: 'OBJETIVO: Cualificar al lead (presupuesto, tipo de proyecto, urgencia, decisor) y pasarlo al equipo humano cuando sea válido. No intentes cerrar tú.'
  };

  const negNombre = businessData?.name || 'el negocio';
  const negWeb = extra.web_services_detail || businessData?.services || '';
  const negPrecios = extra.prices_list || businessData?.prices || '';
  const negPortfolio = extra.web_portfolio || '';
  const negTestimonios = extra.web_testimonials || '';
  const negFaq = extra.web_faqs || extra.faq_list || businessData?.faq || '';
  const negAbout = extra.web_about || businessData?.description || '';
  const negTech = extra.technologies || '';
  const negProc = extra.work_process || '';
  const negPago = extra.payment_methods || '';
  const negEntrega = extra.delivery_time || '';
  const negTel = businessData?.phone || '';
  const negEmail = businessData?.email || '';
  const negWebUrl = businessData?.website || '';
  const negDif = extra.differentiators || '';

  const capMap = {
    leads: `CAPTAR LEADS: Recoge nombre, email y teléfono del prospecto de forma natural antes de terminar la conversación.${estrategia.presupuestoMin ? ` Si el presupuesto mencionado es inferior a ${estrategia.presupuestoMin}€, indícalo con tacto y redirige.` : ''}`,
    precios: 'INFORMAR PRECIOS: Usa los rangos de precio del negocio. Da siempre rangos, nunca precios cerrados sin Discovery.',
    ventas: 'VENDER: Detecta la oportunidad, recomienda el servicio más adecuado y guía hacia el cierre.',
    citas: 'AGENDAR CALLS: Cuando hay interés real, propón fecha y hora concreta para la Discovery call.',
    objeciones: `SUPERAR OBJECIONES:\n- "Es caro" → Desglosa el valor. Compara con el coste de no tener web.\n- "Tengo que pensarlo" → "¿Qué información te falta para decidir?"\n- "Ya tengo alguien" → "¿Estás contento? Si en algún momento buscas alternativa, aquí estamos."`,
    upselling: `UPSELLING: Sugiere servicios complementarios de forma natural.${capabilities.includes('upselling') && extra.upsellingServices ? `\nServicios a sugerir: ${extra.upsellingServices}` : '\nEj: SEO + web, mantenimiento mensual, formación WordPress.'}`,
    ofertas: `OFERTAS: Informa de las promociones actuales.${extra.ofertasText ? `\n${extra.ofertasText}` : '\n(No hay ofertas activas actualmente.)'}`,
    derivar: `DERIVAR: Cuando el proyecto es complejo o el lead es de alto valor, transfiere al profesional.${extra.derivarContacto ? `\nContacto: ${extra.derivarContacto}` : ''}`,
    seguimiento: `SEGUIMIENTO: Si el prospecto quedó pendiente, recupéralo.${extra.seguimientoMsg ? `\nMensaje: "${extra.seguimientoMsg}"` : ' Usa un tono cálido y sin presión.'}`,
  };

  const restMap = {
    no_inventar: '✗ NUNCA inventes servicios, precios, plazos o información que no tengas.',
    no_descuentos: `✗ NO ofrezcas descuentos por tu cuenta.${cierre.puedeDescuento ? ` Solo puedes ofrecer hasta un ${cierre.maxDescuento}% de descuento si el cliente insiste y hay alto interés.` : ' No tienes autorización para hacer descuentos.'}`,
    no_competencia: '✗ NO menciones ni compares con otros profesionales o agencias.',
    no_presionar: '✗ NO seas agresivo. Vender es ayudar, no presionar.',
    no_prometer: '✗ NO prometas resultados específicos (posición 1 en Google, X ventas, etc.).',
    derivar_complejas: '✗ Si el proyecto supera el alcance habitual, deriva al profesional humano.',
    confirmar_precios: '✗ Siempre aclara que los precios son orientativos y el definitivo se fija en Discovery.',
    pedir_datos: '✓ SIEMPRE intenta recoger nombre + teléfono/email antes de terminar.',
    precio_minimo: `✗ NUNCA cierres proyectos por debajo de ${cierre.precioMinimoCierre}€.`,
    max_revisiones: `✗ El proyecto incluye máximo ${cierre.maxRevisiones} ronda${cierre.maxRevisiones > 1 ? 's' : ''} de revisión. No incluyas más sin coste adicional.`,
    no_negociar_mant: '✗ El precio de mantenimiento mensual NO es negociable.',
  };

  const activeCaps = capabilities.filter(c => capMap[c]).map(c => `✓ ${capMap[c]}`).join('\n\n');
  const activeRests = restrictions.filter(r => restMap[r]).map(r => restMap[r]).join('\n');
  const clienteIdealStr = estrategia.clienteIdeal?.length ? `Cliente ideal: ${estrategia.clienteIdeal.join(', ')}.` : '';

  return `/* CAPA 1 — IDENTIDAD */
Eres "${name || 'Asistente'}", el agente comercial de IA de ${negNombre}. Experto en diseño web y desarrollo freelance.

TONO: ${formalMap[formalidad - 1] || formalMap[2]}
AGRESIVIDAD COMERCIAL: ${agresMap[agresividad - 1] || agresMap[2]}
NIVEL TÉCNICO: ${tecMap[tecnicismo - 1] || tecMap[2]}
IDIOMA: ${langMap[language] || langMap.es}
${greeting ? `SALUDO: "${greeting}"` : `SALUDO: "¡Hola! 👋 Soy ${name || 'el asistente'} de ${negNombre}. ¿En qué puedo ayudarte con tu proyecto?"`}
${farewell ? `DESPEDIDA: "${farewell}"` : ''}

/* CAPA 2 — NEGOCIO */
NOMBRE: ${negNombre}
${negWebUrl ? `WEB: ${negWebUrl}` : ''}
${negTel ? `TEL: ${negTel}` : ''}
${negEmail ? `EMAIL: ${negEmail}` : ''}
${negAbout ? `SOBRE EL NEGOCIO:\n${negAbout}` : ''}
${negWeb ? `SERVICIOS:\n${negWeb}` : ''}
${negPrecios ? `PRECIOS ORIENTATIVOS:\n${negPrecios}` : ''}
${negEntrega ? `PLAZOS: ${negEntrega}` : ''}
${negProc ? `PROCESO:\n${negProc}` : ''}
${negPago ? `FORMA DE PAGO: ${negPago}` : ''}
${negTech ? `TECNOLOGÍAS: ${negTech}` : ''}
${negDif ? `DIFERENCIADORES: ${negDif}` : ''}
${negPortfolio ? `PORTFOLIO:\n${negPortfolio}` : ''}
${negTestimonios ? `TESTIMONIOS:\n${negTestimonios}` : ''}
${negFaq ? `FAQ:\n${negFaq}` : ''}

/* CAPA 3 — COMPORTAMIENTO COMERCIAL */
${objMap[estrategia.objetivo] || objMap.agendar}
${clienteIdealStr}

CAPACIDADES ACTIVAS:
${activeCaps || '✓ Atender consultas generales sobre los servicios del negocio.'}

LÓGICA DE CIERRE:
${cierre.puedeDescuento ? `- Puedes ofrecer hasta un ${cierre.maxDescuento}% de descuento como máximo si el cliente tiene alto interés demostrado.` : '- No puedes ofrecer descuentos.'}
${cierre.puedeFraccionar ? `- Puedes ofrecer fraccionamiento: ${cierre.comoPago}.` : '- No puedes ofrecer fraccionamiento sin consultar.'}
${cierre.linkReserva ? `- Puedes enviar el link de reserva/pago: ${cierre.linkReserva}` : ''}
${cierre.maxSeguimientos > 0 ? `- Máximo ${cierre.maxSeguimientos} seguimiento${cierre.maxSeguimientos > 1 ? 's' : ''} si no responde, cada ${cierre.intervaloSeguimiento}.` : ''}
${cierre.umbralMensajes > 0 ? `- Si el cliente lleva más de ${cierre.umbralMensajes} mensajes sin decidir, deriva al profesional humano.` : ''}

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
- SIEMPRE termina con una pregunta o llamada a la acción clara.`;
}

/* ── Slider con etiquetas ── */
function RangeSlider({ value, onChange, min = 1, max = 5, labels }) {
  return (
    <div className="ai-slider">
      <div className="ai-slider__track">
        <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="ai-slider__input" />
        <div className="ai-slider__fill" style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
      </div>
      {labels && (
        <div className="ai-slider__labels">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}
    </div>
  );
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

/* ── Section ── */
function Block({ letter, color, title, desc, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ai-block">
      <button className="ai-block__hd" type="button" onClick={() => setOpen(o => !o)}>
        <div className="ai-block__hd-l">
          <span className="ai-block__letter" style={{ background: `${color}15`, color, borderColor: `${color}30` }}>{letter}</span>
          <span className="ai-block__ico" style={{ color }}>{icon}</span>
          <div>
            <span className="ai-block__title">{title}</span>
            {desc && <span className="ai-block__desc">{desc}</span>}
          </div>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="ai-block__body">{children}</div>}
    </div>
  );
}

const CAPABILITIES = [
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

const OBJETIVOS = [
  { id: 'agendar', label: 'Agendar discovery call', desc: 'La IA siempre termina proponiendo una llamada de 20 min' },
  { id: 'cerrar', label: 'Cerrar directo por WhatsApp', desc: 'La IA intenta cerrar el proyecto sin llamada previa' },
  { id: 'cualificar', label: 'Filtrar y cualificar', desc: 'La IA solo cualifica y pasa los buenos leads al humano' },
];

const LANGUAGES = [
  { id: 'es', label: '🇪🇸 ES' }, { id: 'en', label: '🇬🇧 EN' },
  { id: 'es-en', label: '🌍 ES+EN' }, { id: 'auto', label: '🔍 Auto' },
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

export default function PromptBuilder() {
  const { user } = useAuth();
  const { activeAgent, refreshAgents } = useAgents();

  // Bloque A
  const [agentName, setAgentName] = useState('');
  const [language, setLanguage] = useState('es');
  const [formalidad, setFormalidad] = useState(3);
  const [agresividad, setAgresividad] = useState(3);
  const [tecnicismo, setTecnicismo] = useState(2);
  const [greeting, setGreeting] = useState('');
  const [farewell, setFarewell] = useState('');

  // Bloque B
  const [capabilities, setCapabilities] = useState(CAPABILITIES.filter(c => c.default).map(c => c.id));
  const [objetivo, setObjetivo] = useState('agendar');
  const [clienteIdeal, setClienteIdeal] = useState([]);
  const [presupuestoMin, setPresupuestoMin] = useState('');
  const [ofertasText, setOfertasText] = useState('');
  const [upsellingServices, setUpsellingServices] = useState('');
  const [seguimientoMsg, setSeguimientoMsg] = useState('');
  const [derivarContacto, setDerivarContacto] = useState('');

  // Bloque C — Lógica de cierre
  const [puedeDescuento, setPuedeDescuento] = useState(false);
  const [maxDescuento, setMaxDescuento] = useState('10');
  const [puedeFraccionar, setPuedeFraccionar] = useState(false);
  const [comoPago, setComoPago] = useState('');
  const [linkReserva, setLinkReserva] = useState('');
  const [maxSeguimientos, setMaxSeguimientos] = useState(2);
  const [intervaloSeguimiento, setIntervaloSeguimiento] = useState('48h');
  const [umbralMensajes, setUmbralMensajes] = useState(10);

  // Bloque D
  const [restrictions, setRestrictions] = useState(RESTRICTIONS_BASE.filter(r => r.default).map(r => r.id));
  const [precioMinimoCierre, setPrecioMinimoCierre] = useState('');
  const [maxRevisiones, setMaxRevisiones] = useState('2');
  const [noNegociarMant, setNoNegociarMant] = useState(true);
  const [customRules, setCustomRules] = useState('');

  const [businessData, setBusinessData] = useState(null);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { if (user) { loadAgent(); loadBusiness(); } }, [user]);
  useEffect(() => { if (activeAgent) setBookingEnabled(!!activeAgent.booking_enabled); }, [activeAgent]);

  async function loadAgent() {
    const { data } = await supabase.from('agents').select('*').eq('user_id', user.id).single();
    if (!data) return;
    if (data.name) setAgentName(data.name);
    if (data.language) setLanguage(data.language);
    try {
      const cfg = data.config ? JSON.parse(data.config) : {};
      if (cfg.capabilities) setCapabilities(cfg.capabilities);
      if (cfg.restrictions) setRestrictions(cfg.restrictions);
      if (cfg.formalidad) setFormalidad(cfg.formalidad);
      if (cfg.agresividad) setAgresividad(cfg.agresividad);
      if (cfg.tecnicismo) setTecnicismo(cfg.tecnicismo);
      if (cfg.greeting !== undefined) setGreeting(cfg.greeting);
      if (cfg.farewell !== undefined) setFarewell(cfg.farewell);
      if (cfg.objetivo) setObjetivo(cfg.objetivo);
      if (cfg.clienteIdeal) setClienteIdeal(cfg.clienteIdeal);
      if (cfg.presupuestoMinimo) setPresupuestoMin(cfg.presupuestoMinimo);
      if (cfg.ofertasText) setOfertasText(cfg.ofertasText);
      if (cfg.upsellingServices) setUpsellingServices(cfg.upsellingServices);
      if (cfg.seguimientoMsg) setSeguimientoMsg(cfg.seguimientoMsg);
      if (cfg.derivarContacto) setDerivarContacto(cfg.derivarContacto);
      if (cfg.puedeDescuento !== undefined) setPuedeDescuento(cfg.puedeDescuento);
      if (cfg.maxDescuento) setMaxDescuento(cfg.maxDescuento);
      if (cfg.puedeFraccionar !== undefined) setPuedeFraccionar(cfg.puedeFraccionar);
      if (cfg.comoPago) setComoPago(cfg.comoPago);
      if (cfg.linkReserva) setLinkReserva(cfg.linkReserva);
      if (cfg.maxSeguimientos !== undefined) setMaxSeguimientos(cfg.maxSeguimientos);
      if (cfg.intervaloSeguimiento) setIntervaloSeguimiento(cfg.intervaloSeguimiento);
      if (cfg.umbralMensajes !== undefined) setUmbralMensajes(cfg.umbralMensajes);
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

  function buildConfig() {
    return {
      capabilities, restrictions, formalidad, agresividad, tecnicismo,
      greeting, farewell, objetivo, clienteIdeal, presupuestoMinimo: presupuestoMin,
      ofertasText, upsellingServices, seguimientoMsg, derivarContacto,
      puedeDescuento, maxDescuento, puedeFraccionar, comoPago, linkReserva,
      maxSeguimientos, intervaloSeguimiento, umbralMensajes,
      precioMinimoCierre, maxRevisiones, noNegociarMant, customRules,
    };
  }

  function buildEstrategia() { return { objetivo, clienteIdeal, presupuestoMin }; }
  function buildCierre() { return { puedeDescuento, maxDescuento, puedeFraccionar, comoPago, linkReserva, maxSeguimientos, intervaloSeguimiento, umbralMensajes, precioMinimoCierre: precioMinimoCierre || '0', maxRevisiones: maxRevisiones || '2' }; }

  async function toggleBooking() {
    if (!activeAgent) return;
    const val = !bookingEnabled;
    await supabase.from('agents').update({ booking_enabled: val, updated_at: new Date().toISOString() }).eq('id', activeAgent.id);
    setBookingEnabled(val);
    refreshAgents();
  }

  async function handleSave() {
    setSaving(true);
    const extraSaved = (() => { try { return businessData?.extra_context ? JSON.parse(businessData.extra_context) : {}; } catch { return {}; } })();
    const extraUpdated = { ...extraSaved, ofertasText, upsellingServices, seguimientoMsg, derivarContacto };
    if (businessData) {
      await supabase.from('businesses').update({ extra_context: JSON.stringify(extraUpdated), updated_at: new Date().toISOString() }).eq('user_id', user.id);
    }

    const finalRestrictions = [...restrictions];
    if (precioMinimoCierre && !finalRestrictions.includes('precio_minimo')) finalRestrictions.push('precio_minimo');
    if (maxRevisiones && !finalRestrictions.includes('max_revisiones')) finalRestrictions.push('max_revisiones');
    if (noNegociarMant && !finalRestrictions.includes('no_negociar_mant')) finalRestrictions.push('no_negociar_mant');

    const prompt = buildSystemPrompt({ name: agentName, formalidad, agresividad, tecnicismo, language, capabilities, restrictions: finalRestrictions, greeting, farewell, customRules, businessData: { ...businessData, extra_context: JSON.stringify(extraUpdated) }, estrategia: buildEstrategia(), cierre: buildCierre() });
    const agentData = { name: agentName || 'Asistente', language, system_prompt: prompt, config: JSON.stringify(buildConfig()), updated_at: new Date().toISOString() };

    const { data: existing } = await supabase.from('agents').select('id').eq('user_id', user.id).single();
    if (existing) await supabase.from('agents').update(agentData).eq('id', existing.id);
    else await supabase.from('agents').insert({ user_id: user.id, ...agentData });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  }

  const toggleCap = (id) => setCapabilities(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  const toggleRest = (id) => setRestrictions(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
  const toggleCliente = (id) => setClienteIdeal(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  const businessFilled = businessData ? Object.values(businessData).filter(v => v && typeof v === 'string' && v.trim()).length : 0;

  const previewPrompt = buildSystemPrompt({ name: agentName, formalidad, agresividad, tecnicismo, language, capabilities, restrictions: [...restrictions, ...(precioMinimoCierre ? ['precio_minimo'] : []), ...(maxRevisiones ? ['max_revisiones'] : []), ...(noNegociarMant ? ['no_negociar_mant'] : [])], greeting, farewell, customRules, businessData, estrategia: buildEstrategia(), cierre: buildCierre() });

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><Bot size={22} /> Configuración de la IA</h1>
          <p>Agente pre-entrenado para diseñadores web freelance. 4 bloques estratégicos.</p>
        </div>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saved ? <><Check size={14} /> Guardado</> : saving ? <><Loader2 size={14} className="spin" /> Guardando...</> : <><Save size={14} /> Guardar</>}
        </button>
      </div>

      {businessFilled < 4 && (
        <div className="ai-alert ai-alert--warn"><AlertCircle size={16} /><span>Rellena <strong>Mi Negocio → Tu Página Web</strong> para que la IA responda con tus datos reales.</span></div>
      )}
      {businessFilled >= 4 && (
        <div className="ai-alert ai-alert--ok"><Check size={16} /><span>Datos del negocio cargados. La IA usará tu información real.</span></div>
      )}

      {/* ══ BLOQUE A — IDENTIDAD Y TONO ══ */}
      <Block letter="A" color="#3b82f6" title="Identidad y Tono" desc="Nombre, idioma y registros del agente" icon={<Bot size={16}/>}>
        <div className="form-grid">
          <div className="form-field">
            <label>Nombre del agente</label>
            <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Ej: Alex, Sofia, Asistente Guti..." />
            <span className="form-field__hint">Con qué nombre se presenta a los clientes</span>
          </div>
          <div className="form-field">
            <label>Idioma de respuesta</label>
            <div className="chips">
              {LANGUAGES.map(l => <button key={l.id} type="button" className={`chip ${language === l.id ? 'chip--active' : ''}`} onClick={() => setLanguage(l.id)}>{l.label}</button>)}
            </div>
          </div>
        </div>

        <div className="ai-sliders">
          <div className="ai-slider-row">
            <div className="ai-slider-row__label">
              <span>Nivel de formalidad</span>
              <strong>{['Muy informal', 'Informal', 'Neutro', 'Profesional', 'Muy formal'][formalidad - 1]}</strong>
            </div>
            <RangeSlider value={formalidad} onChange={setFormalidad} labels={['Coloquial', 'Muy formal']} />
          </div>
          <div className="ai-slider-row">
            <div className="ai-slider-row__label">
              <span>Agresividad comercial</span>
              <strong>{['Solo informar', 'Suave', 'Equilibrado', 'Proactivo', 'Cerrador'][agresividad - 1]}</strong>
            </div>
            <RangeSlider value={agresividad} onChange={setAgresividad} labels={['Solo informar', 'Cerrador agresivo']} />
          </div>
          <div className="ai-slider-row">
            <div className="ai-slider-row__label">
              <span>Nivel de explicación técnica</span>
              <strong>{['Muy simple', 'Simple', 'Balanceado', 'Técnico', 'Muy técnico'][tecnicismo - 1]}</strong>
            </div>
            <RangeSlider value={tecnicismo} onChange={setTecnicismo} labels={['Sin términos técnicos', 'Tecnicismos naturales']} />
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '1.25rem' }}>
          <div className="form-field form-field--full">
            <label>Saludo inicial personalizado</label>
            <textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={2} placeholder={`Ej: ¡Hola! 👋 Soy ${agentName || 'Alex'}, el asistente de ${businessData?.name || 'nuestro estudio'}. ¿En qué puedo ayudarte con tu proyecto web?`} />
          </div>
          <div className="form-field form-field--full">
            <label>Despedida personalizada</label>
            <textarea value={farewell} onChange={e => setFarewell(e.target.value)} rows={2} placeholder="Ej: ¡Genial! Cualquier cosa que necesites, aquí estaré. Que tengas un buen día 🚀" />
          </div>
        </div>
      </Block>

      {/* ══ BLOQUE B — ESTRATEGIA COMERCIAL ══ */}
      <Block letter="B" color="#f59e0b" title="Estrategia Comercial" desc="Objetivo, cliente ideal y capacidades de la IA" icon={<Target size={16}/>}>
        <div className="form-field form-field--full" style={{ marginBottom: '1.25rem' }}>
          <label><Target size={13}/> Objetivo principal de la IA</label>
          <div className="ai-objetivo-list">
            {OBJETIVOS.map(o => (
              <div key={o.id} className={`ai-objetivo ${objetivo === o.id ? 'ai-objetivo--on' : ''}`} onClick={() => setObjetivo(o.id)}>
                <div className="ai-objetivo__radio">{objetivo === o.id ? '●' : '○'}</div>
                <div><b>{o.label}</b><span>{o.desc}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="form-field">
            <label><Euro size={13}/> Presupuesto mínimo de proyecto (€)</label>
            <input type="number" value={presupuestoMin} onChange={e => setPresupuestoMin(e.target.value)} placeholder="400" />
            <span className="form-field__hint">Si el cliente menciona menos, la IA lo gestiona con tacto</span>
          </div>
          <div className="form-field">
            <label><Users size={13}/> Cliente ideal</label>
            <div className="chips" style={{ flexWrap: 'wrap' }}>
              {CLIENTE_TIPOS.map(c => <button key={c.id} type="button" className={`chip ${clienteIdeal.includes(c.id) ? 'chip--active' : ''}`} onClick={() => toggleCliente(c.id)}>{c.label}</button>)}
            </div>
          </div>
        </div>

        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.65rem' }}><Zap size={13}/> Capacidades activas</label>
        <div className="ai-cap-grid">
          {CAPABILITIES.map(c => {
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
                    <textarea value={ofertasText} onChange={e => setOfertasText(e.target.value)} rows={2} placeholder="Ej: -15% en webs hasta fin de mes · Pack web + SEO desde 999€" />
                  </div>
                )}
                {isOn && c.id === 'upselling' && (
                  <div className="ai-cap-sub" onClick={e => e.stopPropagation()}>
                    <label>Servicios a ofrecer como complemento</label>
                    <textarea value={upsellingServices} onChange={e => setUpsellingServices(e.target.value)} rows={2} placeholder="Ej: SEO (300€), Mantenimiento (50€/mes), Formación WordPress (90€)" />
                  </div>
                )}
                {isOn && c.id === 'seguimiento' && (
                  <div className="ai-cap-sub" onClick={e => e.stopPropagation()}>
                    <label>Mensaje de seguimiento para leads fríos</label>
                    <textarea value={seguimientoMsg} onChange={e => setSeguimientoMsg(e.target.value)} rows={2} placeholder="Ej: ¡Hola! Te escribo porque hablamos de tu proyecto web. ¿Has tenido tiempo de pensarlo? 😊" />
                  </div>
                )}
                {isOn && c.id === 'derivar' && (
                  <div className="ai-cap-sub" onClick={e => e.stopPropagation()}>
                    <label>Persona/contacto al que derivar</label>
                    <input value={derivarContacto} onChange={e => setDerivarContacto(e.target.value)} placeholder="Ej: Guti — +34 600 000 000 — guti@estudio.com" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Agendamiento toggle */}
        <div className="ai-toggle-row" style={{ marginTop: '1rem' }}>
          <div><b><Calendar size={13}/> Agendamiento automático de discovery calls</b><span>La IA propone y agenda llamadas directamente en tu calendario</span></div>
          <Toggle on={bookingEnabled} onChange={() => toggleBooking()} disabled={!activeAgent} />
        </div>
      </Block>

      {/* ══ BLOQUE C — LÓGICA DE CIERRE ══ */}
      <Block letter="C" color="#8b5cf6" title="Lógica de Cierre" desc="Descuentos, fraccionamiento, seguimientos y umbrales" icon={<TrendingUp size={16}/>} defaultOpen={false}>
        <div className="ai-toggle-rows">
          <div className="ai-toggle-row">
            <div><b>¿Puede ofrecer descuento?</b><span>Autoriza a la IA a negociar precio dentro de un límite</span></div>
            <Toggle on={puedeDescuento} onChange={setPuedeDescuento} />
          </div>
          {puedeDescuento && (
            <div className="ai-sub-row">
              <div className="form-field">
                <label>Descuento máximo permitido (%)</label>
                <input type="number" min="1" max="50" value={maxDescuento} onChange={e => setMaxDescuento(e.target.value)} placeholder="10" />
              </div>
            </div>
          )}
          <div className="ai-toggle-row">
            <div><b>¿Puede ofrecer fraccionamiento de pago?</b><span>La IA puede proponer pagar en plazos</span></div>
            <Toggle on={puedeFraccionar} onChange={setPuedeFraccionar} />
          </div>
          {puedeFraccionar && (
            <div className="ai-sub-row">
              <div className="form-field form-field--full">
                <label>¿Cómo? (explícalo para que la IA lo sepa)</label>
                <input value={comoPago} onChange={e => setComoPago(e.target.value)} placeholder="Ej: 50% al inicio, 50% a la entrega. Máximo 2 plazos." />
              </div>
            </div>
          )}
          <div className="ai-toggle-row">
            <div><b>¿Envía link de reserva o pago?</b><span>La IA puede enviar un enlace para reservar o pagar</span></div>
            <Toggle on={!!linkReserva} onChange={v => { if (!v) setLinkReserva(''); }} />
          </div>
          {!!linkReserva || true ? (
            <div className="ai-sub-row">
              <div className="form-field form-field--full">
                <label><Link2 size={12}/> URL del link de reserva/pago (opcional)</label>
                <input value={linkReserva} onChange={e => setLinkReserva(e.target.value)} placeholder="https://calendly.com/tu-nombre o https://stripe.com/tu-link" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="form-grid" style={{ marginTop: '1.25rem' }}>
          <div className="form-field">
            <label><Repeat size={13}/> Máximo de seguimientos si no responde</label>
            <select value={maxSeguimientos} onChange={e => setMaxSeguimientos(Number(e.target.value))} style={{ width: '100%', padding: '0.65rem 0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <option value={0}>Sin seguimiento</option>
              <option value={1}>1 seguimiento</option>
              <option value={2}>2 seguimientos (recomendado)</option>
              <option value={3}>3 seguimientos</option>
            </select>
          </div>
          <div className="form-field">
            <label><Clock size={13}/> Intervalo entre seguimientos</label>
            <select value={intervaloSeguimiento} onChange={e => setIntervaloSeguimiento(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <option value="24h">24 horas</option>
              <option value="48h">48 horas (recomendado)</option>
              <option value="1 semana">1 semana</option>
            </select>
          </div>
          <div className="form-field">
            <label><MessageSquare size={13}/> Mensajes antes de derivar al humano</label>
            <select value={umbralMensajes} onChange={e => setUmbralMensajes(Number(e.target.value))} style={{ width: '100%', padding: '0.65rem 0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <option value={5}>5 mensajes</option>
              <option value={10}>10 mensajes (recomendado)</option>
              <option value={15}>15 mensajes</option>
              <option value={0}>Sin límite</option>
            </select>
            <span className="form-field__hint">Si el cliente no decide, la IA deriva al profesional</span>
          </div>
        </div>
      </Block>

      {/* ══ BLOQUE D — RESTRICCIONES ══ */}
      <Block letter="D" color="#ef4444" title="Restricciones" desc="Lo que el agente NUNCA debe hacer — protege tu margen" icon={<Shield size={16}/>} defaultOpen={false}>
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
            <span className="form-field__hint">Protege tu margen mínimo por proyecto</span>
          </div>
          <div className="form-field">
            <label><Repeat size={13}/> Máximo de revisiones incluidas</label>
            <input type="number" min="1" max="10" value={maxRevisiones} onChange={e => setMaxRevisiones(e.target.value)} placeholder="2" />
            <span className="form-field__hint">La IA no incluirá más revisiones sin coste adicional</span>
          </div>
        </div>

        <div className="ai-toggle-row" style={{ marginTop: '1rem' }}>
          <div><b>No negociar el precio de mantenimiento mensual</b><span>El mantenimiento tiene precio fijo y no admite descuentos</span></div>
          <Toggle on={noNegociarMant} onChange={setNoNegociarMant} />
        </div>

        <div className="form-field form-field--full" style={{ marginTop: '1.25rem' }}>
          <label>Reglas adicionales personalizadas</label>
          <textarea value={customRules} onChange={e => setCustomRules(e.target.value)} rows={3} placeholder="Ej: Si preguntan por apps móviles, indicar que no las hacemos. Si el cliente menciona que tiene menos de 400€, no aceptar el proyecto..." />
        </div>
      </Block>

      {/* ══ PLANTILLAS DE RESPUESTAS ══ */}
      <Block letter="E" color="#25D366" title="Plantillas de respuesta a objeciones" desc="Respuestas optimizadas para las situaciones más comunes. La IA las usará como referencia." icon={<BookOpen size={16}/>} defaultOpen={false}>
        {[
          {
            objecion: '"Es caro" / "Me parece mucho"',
            respuesta: `Entiendo perfectamente, el precio es importante. Lo que incluye este presupuesto es [describir valor: diseño personalizado, desarrollo, SEO básico, soporte X meses...]. Si lo comparamos con lo que puede generarte en clientes —muchos negocios recuperan la inversión en los primeros meses— suele salir muy rentable. Dicho esto, podemos ver qué opciones encajan mejor con tu presupuesto. ¿Qué rango tienes en mente?`,
          },
          {
            objecion: '"Me lo tengo que pensar"',
            respuesta: `Sin ningún problema, sin prisa. ¿Hay alguna duda concreta que te haya surgido? A veces aclarar un detalle ayuda a decidir con más seguridad. Y si lo prefieres, podemos hacer una llamada de 20 minutos sin compromiso para que te vayas con toda la info clara.`,
          },
          {
            objecion: '"Otro me lo hace más barato"',
            respuesta: `Totalmente normal que compares, es lo que haría cualquiera. La diferencia suele estar en qué incluye exactamente cada propuesta: el diseño, el soporte posterior, los plazos de entrega, la experiencia del profesional... A veces lo más barato acaba siendo lo más caro si hay que rehacerlo. ¿Sabes qué incluye concretamente la otra oferta? Así puedo explicarte en qué se diferencia la mía.`,
          },
          {
            objecion: '"No sé si lo necesito ahora"',
            respuesta: `Te entiendo. La pregunta clave es: ¿tus clientes potenciales te buscan en Google ahora mismo? ¿Hay personas que podrían contratarte pero no saben que existes? Una web bien hecha trabaja por ti las 24h, incluso cuando estás con otros clientes. Si no es el momento perfecto, al menos queda con la info clara para cuando sí lo sea.`,
          },
          {
            objecion: '"¿Puedes hacerme un descuento?"',
            respuesta: `Mi precio está ajustado al trabajo real que implica el proyecto. Lo que sí puedo ofrecerte es ajustar el alcance si el presupuesto es un condicionante: por ejemplo, empezar con las páginas más importantes y ampliar después. ¿Qué es lo más prioritario para ti en este momento?`,
          },
          {
            objecion: '"¿Cuánto tardas?"',
            respuesta: `Depende del proyecto. Una web corporativa suele estar lista en 3-4 semanas desde que me das todo el material (textos, fotos, logo). Una landing page en 1-2 semanas. Trabajo con plazos cerrados —te doy fecha de entrega y la cumplo. ¿Tienes alguna fecha límite o presentación importante?`,
          },
        ].map((t, i) => (
          <PlantillaItem key={i} objecion={t.objecion} respuesta={t.respuesta} />
        ))}
        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: '#25D366' }}>Cómo funcionan:</strong> Estas plantillas se inyectan en el prompt de la IA bajo "Técnicas de venta". La IA las adaptará a cada conversación con tu tono y datos de tu negocio.
        </div>
      </Block>

      {/* ── Vista previa del prompt ── */}
      <div className="ai-preview-bar">
        <button type="button" className="ai-preview-btn" onClick={() => setShowPreview(o => !o)}>
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Ocultar prompt' : 'Ver prompt en 5 capas'}
          <Sparkles size={12} style={{ color: '#25D366' }} />
        </button>
        <span className="ai-preview-badge">Estructura en capas · {previewPrompt.length} caracteres</span>
      </div>
      {showPreview && <div className="ai-preview-box"><pre>{previewPrompt}</pre></div>}

      {/* ── Guardar sticky ── */}
      <div className="sticky-save">
        <button className="btn btn--primary btn--lg" onClick={handleSave} disabled={saving}>
          {saved ? <><Check size={16} /> Guardado y activo</> : saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar configuración</>}
        </button>
      </div>
    </div>
  );
}
