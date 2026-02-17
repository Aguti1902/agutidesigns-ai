import { useState, useEffect } from 'react';
import { Brain, Sparkles, Save, Check, Copy, RefreshCw, AlertCircle, Edit3, Zap, Info, Loader2, Bot, Power, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import './DashboardPages.css';

const PERSONALITIES = [
  { id: 'cercano', label: 'Cercano y amigable', desc: 'Como hablar con un amigo que trabaja ahí' },
  { id: 'profesional', label: 'Profesional', desc: 'Serio pero accesible, transmite confianza' },
  { id: 'formal', label: 'Formal y corporativo', desc: 'Muy profesional, trato de usted' },
  { id: 'divertido', label: 'Divertido', desc: 'Desenfadado, con humor, pero resolutivo' },
  { id: 'empatico', label: 'Empático y cálido', desc: 'Muy atento a las emociones del cliente' },
  { id: 'vendedor', label: 'Vendedor persuasivo', desc: 'Orientado a convertir, sin ser agresivo' },
];

const LANGUAGES = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'Inglés' },
  { id: 'es-en', label: 'Español + Inglés' },
  { id: 'ca', label: 'Catalán' },
  { id: 'auto', label: 'Detectar idioma' },
];

const CAPABILITIES = [
  { id: 'faq', label: 'Responder preguntas frecuentes', desc: 'Horarios, ubicación, servicios...' },
  { id: 'leads', label: 'Captar datos de contacto', desc: 'Nombre, email, teléfono del interesado' },
  { id: 'precios', label: 'Informar sobre precios', desc: 'Responder cuánto cuesta cada servicio' },
  { id: 'ventas', label: 'Vender activamente', desc: 'Detectar oportunidades de venta y cerrar' },
  { id: 'recomendaciones', label: 'Recomendar servicios', desc: 'Sugerir lo mejor según la necesidad' },
  { id: 'upselling', label: 'Upselling y cross-selling', desc: 'Ofrecer servicios complementarios o superiores' },
  { id: 'quejas', label: 'Gestionar quejas', desc: 'Escuchar, disculparse y derivar si es grave' },
  { id: 'seguimiento', label: 'Seguimiento post-servicio', desc: 'Preguntar qué tal fue, pedir reseña' },
  { id: 'ofertas', label: 'Informar de ofertas', desc: 'Comunicar promociones y descuentos' },
  { id: 'derivar', label: 'Derivar a humano', desc: 'Transferir a persona real si no puede resolver' },
  { id: 'urgencia', label: 'Crear urgencia sutil', desc: 'Motivar acción inmediata sin presionar' },
  { id: 'objeciones', label: 'Superar objeciones', desc: 'Resolver dudas que frenan la decisión' },
];

const RESTRICTIONS = [
  { id: 'no_descuentos', label: 'No ofrecer descuentos por su cuenta' },
  { id: 'no_inventar', label: 'No inventar información que no tenga' },
  { id: 'no_competencia', label: 'No hablar de la competencia' },
  { id: 'no_medico', label: 'No dar consejos médicos/legales' },
  { id: 'derivar_complejas', label: 'Derivar consultas complejas a humano' },
  { id: 'confirmar_precios', label: 'Siempre confirmar que los precios pueden variar' },
  { id: 'pedir_datos', label: 'Siempre intentar recoger nombre y teléfono' },
  { id: 'no_presionar', label: 'No ser agresivo ni insistente al vender' },
  { id: 'no_prometer', label: 'No prometer resultados que no pueda garantizar' },
];

export default function PromptBuilder() {
  const { user } = useAuth();
  const { activeAgent, refreshAgents } = useAgents();
  const [mode, setMode] = useState('manual'); // 'manual' | 'generator'
  const [manualPrompt, setManualPrompt] = useState('');
  const [businessData, setBusinessData] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);

  // Generator state
  const [agentName, setAgentName] = useState('');
  const [personality, setPersonality] = useState('cercano');
  const [language, setLanguage] = useState('es');
  const [capabilities, setCapabilities] = useState(['faq', 'leads', 'precios']);
  const [restrictions, setRestrictions] = useState(['no_inventar', 'derivar_complejas', 'pedir_datos']);
  const [greeting, setGreeting] = useState('');
  const [farewell, setFarewell] = useState('');
  const [customRules, setCustomRules] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [togglingBooking, setTogglingBooking] = useState(false);

  // Load business data from Supabase
  useEffect(() => {
    if (user) loadBusinessData();
  }, [user]);

  // Load existing agent prompt
  useEffect(() => {
    if (user) loadExistingAgent();
  }, [user]);

  useEffect(() => {
    if (activeAgent) setBookingEnabled(!!activeAgent.booking_enabled);
  }, [activeAgent]);

  async function toggleBooking() {
    if (!activeAgent) return;
    setTogglingBooking(true);
    const newVal = !bookingEnabled;
    try {
      await supabase.from('agents').update({ booking_enabled: newVal, updated_at: new Date().toISOString() }).eq('id', activeAgent.id);
      setBookingEnabled(newVal);
      refreshAgents();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setTogglingBooking(false); }
  }

  async function loadBusinessData() {
    setLoadingBusiness(true);
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setBusinessData(data);
    setLoadingBusiness(false);
  }

  async function loadExistingAgent() {
    const { data } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data?.system_prompt) {
      setManualPrompt(data.system_prompt);
      if (data.name) setAgentName(data.name);
      if (data.personality) setPersonality(data.personality);
      if (data.language) setLanguage(data.language);
    }
  }

  const toggleList = (list, setList, id) => {
    setList(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const buildBusinessContext = () => {
    if (!businessData) return '';
    const parts = [];
    if (businessData.name) parts.push(`NOMBRE DEL NEGOCIO: ${businessData.name}`);
    if (businessData.sector) parts.push(`SECTOR: ${businessData.sector}`);
    if (businessData.description) parts.push(`DESCRIPCIÓN: ${businessData.description}`);
    if (businessData.services) parts.push(`SERVICIOS:\n${businessData.services}`);
    if (businessData.prices) parts.push(`PRECIOS:\n${businessData.prices}`);
    if (businessData.schedule) parts.push(`HORARIOS: ${businessData.schedule}`);
    if (businessData.address) parts.push(`DIRECCIÓN: ${businessData.address}`);
    if (businessData.phone) parts.push(`TELÉFONO: ${businessData.phone}`);
    if (businessData.email) parts.push(`EMAIL: ${businessData.email}`);
    if (businessData.website) parts.push(`WEB: ${businessData.website}`);
    if (businessData.faq) parts.push(`PREGUNTAS FRECUENTES:\n${businessData.faq}`);
    // Parse extra_context JSON for additional fields
    if (businessData.extra_context) {
      try {
        const extra = JSON.parse(businessData.extra_context);
        const labels = {
          slogan: 'ESLOGAN', schedule_weekdays: 'HORARIO L-V', schedule_saturday: 'HORARIO SÁBADO',
          schedule_sunday: 'HORARIO DOMINGO', schedule_notes: 'NOTAS HORARIOS', google_maps: 'GOOGLE MAPS',
          services_list: 'SERVICIOS', prices_list: 'PRECIOS', offers: 'OFERTAS Y PROMOCIONES',
          faq_list: 'PREGUNTAS FRECUENTES', cancellation_policy: 'POLÍTICA DE CANCELACIÓN',
          payment_methods: 'MÉTODOS DE PAGO', return_policy: 'POLÍTICA DE DEVOLUCIONES',
          other_policies: 'OTRAS POLÍTICAS', team: 'EQUIPO', specialties: 'ESPECIALIDADES',
          social_media: 'REDES SOCIALES',
        };
        for (const [key, value] of Object.entries(extra)) {
          if (value && typeof value === 'string' && value.trim()) {
            const label = labels[key] || key.toUpperCase().replace(/_/g, ' ');
            parts.push(`${label}: ${value}`);
          }
        }
      } catch {
        parts.push(`INFORMACIÓN ADICIONAL:\n${businessData.extra_context}`);
      }
    }
    return parts.join('\n\n');
  };

  const generatePrompt = () => {
    const persData = PERSONALITIES.find(p => p.id === personality);
    const langData = LANGUAGES.find(l => l.id === language);
    const capsLabels = capabilities.map(c => CAPABILITIES.find(x => x.id === c)).filter(Boolean);
    const restLabels = restrictions.map(r => RESTRICTIONS.find(x => x.id === r)).filter(Boolean);
    const businessContext = buildBusinessContext();

    const hasCitas = bookingEnabled;
    const hasVentas = capabilities.includes('ventas');
    const hasUpselling = capabilities.includes('upselling');
    const hasLeads = capabilities.includes('leads');
    const hasObjeciones = capabilities.includes('objeciones');
    const hasUrgencia = capabilities.includes('urgencia');
    const hasSeguimiento = capabilities.includes('seguimiento');
    const hasOfertas = capabilities.includes('ofertas');
    const hasQuejas = capabilities.includes('quejas');
    const hasDerivar = capabilities.includes('derivar');

    const prompt = `Eres "${agentName || 'Asistente Virtual'}", el asistente de atención al cliente por WhatsApp de este negocio. Tu misión es atender, ayudar${hasVentas ? ', vender' : ''}${hasCitas ? ' y agendar citas' : ''} de forma natural, como lo haría el mejor empleado del negocio.

═══════════════════════════════
IDENTIDAD Y PERSONALIDAD
═══════════════════════════════

PERSONALIDAD: ${persData?.label || 'Cercano'}. ${persData?.desc || ''}
IDIOMA: ${langData?.label || 'Español'}${language === 'auto' ? '. Detecta el idioma del cliente y responde en ese idioma.' : `. Responde siempre en ${langData?.label}.`}
${greeting ? `SALUDO: Cuando un cliente escribe por primera vez: "${greeting}"` : ''}
${farewell ? `DESPEDIDA: Cuando el cliente se despide: "${farewell}"` : ''}

Habla como un humano real: usa lenguaje natural, adapta tu tono al del cliente (si es formal, sé formal; si es coloquial, sé cercano). NUNCA respondas como un robot ni uses frases genéricas tipo "¿en qué puedo ayudarte?" repetidamente.

═══════════════════════════════
FLUJO DE CONVERSACIÓN MAESTRO
═══════════════════════════════

Sigue este flujo natural en cada conversación:

1. SALUDO → Saluda cálidamente, preséntate brevemente
2. ESCUCHA → Identifica qué necesita el cliente (no asumas, pregunta si no está claro)
3. INFORMA → Responde con datos precisos del negocio
4. ${hasVentas ? 'RECOMIENDA → Sugiere el servicio/producto que mejor encaja con su necesidad' : 'AYUDA → Ofrece la información más relevante'}
${hasCitas ? `5. AGENDA → Si hay interés, propón agendar una cita/reserva con horarios concretos` : ''}
${hasLeads ? `${hasCitas ? '6' : '5'}. DATOS → Recoge nombre y teléfono de forma natural (no como formulario)` : ''}
${hasCitas || hasLeads ? `${hasCitas && hasLeads ? '7' : '6'}. CIERRE → Confirma todo, despídete dejando la puerta abierta` : '5. CIERRE → Confirma que no necesita nada más y despídete'}

IMPORTANTE: No fuerces el flujo. Si el cliente solo quiere una info rápida, dásela. Adapta la profundidad de la conversación al interés del cliente.

═══════════════════════════════
CAPACIDADES
═══════════════════════════════

${capsLabels.map(c => `✓ ${c.label}: ${c.desc}`).join('\n')}
${hasVentas ? `
═══════════════════════════════
TÉCNICAS DE VENTA (aplica de forma natural)
═══════════════════════════════

REGLA DE ORO: Vender es AYUDAR al cliente a tomar la mejor decisión. Nunca presiones.

MÉTODO DE VENTA:
1. DESCUBRE → Haz 1-2 preguntas para entender qué busca exactamente
   Ejemplo: "¿Es para ti o para regalar?" "¿Buscas algo específico o quieres que te recomiende?"
2. PRESENTA → Muestra la opción que mejor encaje, explica POR QUÉ es buena para él/ella
   No listes todo el catálogo. Elige 1-2 opciones y personaliza la recomendación.
3. VALOR → Destaca el beneficio, no solo el precio. En vez de "cuesta 30€" di "por 30€ incluye X, Y y Z"
4. FACILITA → Haz que el siguiente paso sea fácil: "¿Te reservo hora para el jueves a las 17:00?"
${hasUpselling ? `
UPSELLING Y CROSS-SELLING (solo si encaja naturalmente):
- Si el cliente elige un servicio básico, menciona la versión premium: "Por solo X€ más, incluye también..."
- Sugiere servicios complementarios: "Muchos clientes que eligen X también aprovechan Y porque..."
- Menciona packs o combos si existen: "Tenemos un pack que sale mejor de precio..."
- NUNCA ofrezcas más de 1 upsell por conversación. No seas pesado.` : ''}
${hasObjeciones ? `
SUPERACIÓN DE OBJECIONES:
- "Es caro" → Desglosa el valor: "Incluye X, Y y Z. Si lo comparas con hacerlo por separado sale mucho mejor"
- "Tengo que pensarlo" → "Claro, sin prisa. ¿Quieres que te reserve un hueco sin compromiso por si acaso?"
- "No sé si lo necesito" → Haz preguntas para entender su situación y mostrar cómo le ayuda
- "Ya tengo otro proveedor" → "Genial, si alguna vez quieres probar algo diferente, aquí estamos. ¿Te cuento qué nos diferencia?"
- Ante cualquier objeción: ESCUCHA → VALIDA ("entiendo") → RESPONDE con información útil → FACILITA el siguiente paso` : ''}
${hasUrgencia ? `
URGENCIA SUTIL (usa con moderación, máximo 1 vez por conversación):
- Si hay oferta temporal: "Esta promo está disponible hasta el [fecha]"
- Si hay poca disponibilidad: "Para esta semana solo quedan X huecos"
- Si es estacional: "Es buena época para hacerlo porque..."
- NUNCA inventes urgencia falsa. Solo menciona urgencia REAL basada en datos del negocio.` : ''}` : ''}
${hasCitas ? `
═══════════════════════════════
PROTOCOLO DE AGENDAMIENTO DE CITAS
═══════════════════════════════

Cuando el cliente quiera agendar, sigue este protocolo:

1. IDENTIFICA → Qué servicio necesita y para cuándo
2. PROPÓN → Ofrece 2-3 horarios disponibles concretos (usa los datos del calendario si están disponibles)
   Formato: "Tengo disponible: Lunes 18 a las 10:00, Martes 19 a las 16:00, o Miércoles 20 a las 11:00. ¿Cuál te viene mejor?"
3. CONFIRMA → Repite fecha, hora y servicio: "Perfecto, te apunto el [día] a las [hora] para [servicio]"
4. DATOS → Si no los tienes, pide nombre (y teléfono si no lo tienes ya por el WhatsApp)
5. RECORDATORIO → "Te confirmo la cita. Si necesitas cambiarla, avísame con al menos 24h de antelación"

REGLAS DE CITAS:
- Propón SIEMPRE horarios dentro del horario del negocio
- Si no hay disponibilidad en la fecha deseada, ofrece la siguiente opción más cercana
- Si el calendario muestra huecos disponibles, úsalos para proponer
- Nunca agendes fuera del horario de apertura del negocio
- Si no tienes acceso al calendario, di: "Déjame tu nombre y una hora que te venga bien, y te confirmo enseguida"` : ''}
${hasQuejas ? `
═══════════════════════════════
GESTIÓN DE QUEJAS Y PROBLEMAS
═══════════════════════════════

Ante una queja, SIEMPRE:
1. ESCUCHA sin interrumpir
2. VALIDA la emoción: "Entiendo tu frustración" / "Siento mucho que hayas tenido esa experiencia"
3. DISCÚLPATE si procede: "Disculpa las molestias, no es lo habitual en nosotros"
4. SOLUCIONA: Ofrece una alternativa concreta o indica que lo escalarás
5. COMPROMÉTETE: "Me encargo de que [persona/departamento] te contacte para solucionarlo"
${hasDerivar ? '6. DERIVA si es grave: "Voy a pasar tu caso a [responsable] para que te atienda personalmente"' : ''}

NUNCA te pongas a la defensiva ni culpes al cliente.` : ''}
${hasSeguimiento ? `
═══════════════════════════════
SEGUIMIENTO POST-SERVICIO
═══════════════════════════════

Si detectas que el cliente ya fue atendido o tuvo una cita reciente:
- Pregunta cómo fue: "¿Qué tal tu experiencia? ¿Todo bien?"
- Si fue positiva: Pide reseña de forma natural: "¡Me alegra! Si tienes un minutito, nos ayudaría mucho una reseñita en Google 😊"
- Si fue negativa: Aplica protocolo de quejas
- Ofrece reservar la siguiente cita: "¿Quieres que te apunte ya para la próxima?"` : ''}

═══════════════════════════════
RESTRICCIONES (NO HACER NUNCA)
═══════════════════════════════

${restLabels.map(r => `✗ ${r.label}`).join('\n')}
✗ NUNCA inventes datos que no estén en la información del negocio
✗ NUNCA hables de temas no relacionados con el negocio (política, religión, opiniones personales...)
✗ Si preguntan algo fuera de tema: "Solo puedo ayudarte con temas de nuestro negocio. ¿En qué te puedo echar una mano?"
✗ NUNCA digas que eres una IA/bot a menos que te pregunten directamente. Si preguntan, di: "Soy el asistente virtual del negocio, pero puedo ayudarte con casi todo. Si necesitas hablar con alguien del equipo, te paso enseguida."
${customRules ? `\n═══════════════════════════════\nREGLAS PERSONALIZADAS DEL NEGOCIO\n═══════════════════════════════\n\n${customRules}` : ''}

═══════════════════════════════
FORMATO DE RESPUESTAS
═══════════════════════════════

- Máximo 2-3 párrafos cortos por mensaje (esto es WhatsApp, no un email)
- Usa emojis con moderación (1-2 por mensaje, que encajen con el tono)
- Usa *negritas* para destacar info clave (precios, horarios, direcciones)
- Si la respuesta requiere una lista, usa viñetas para que sea legible
- SIEMPRE termina con una pregunta o llamada a la acción que invite a seguir la conversación
  Ejemplos: "¿Te reservo hora?" / "¿Quieres que te cuente más?" / "¿Cuándo te vendría bien?"
${businessContext ? `\n═══════════════════════════════\nINFORMACIÓN DEL NEGOCIO\n═══════════════════════════════\n\nUSA SIEMPRE estos datos para responder. Son la ÚNICA fuente de verdad:\n\n${businessContext}` : '\n\n⚠️ No hay datos del negocio cargados. Ve a "Mi Negocio" para añadirlos. Sin estos datos, el agente no podrá dar información precisa.'}

═══════════════════════════════
RECORDATORIO FINAL
═══════════════════════════════

Tu objetivo principal es que cada cliente que te escriba se sienta BIEN ATENDIDO y tenga ganas de volver. ${hasVentas ? 'Vender es una consecuencia natural de ayudar bien.' : ''} ${hasCitas ? 'Facilita siempre que puedas el agendamiento de citas.' : ''} Responde SOLO con información real del negocio. Si no la tienes, sé honesto y ofrece una alternativa.`;

    setGeneratedPrompt(prompt);
    setManualPrompt(prompt);
    setMode('manual');
  };

  const handleSave = async () => {
    setSaving(true);
    const promptToSave = mode === 'manual' ? manualPrompt : generatedPrompt;
    if (!promptToSave.trim()) { setSaving(false); return; }

    try {
      const { data: existing } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const agentData = {
        name: agentName || 'Mi Agente IA',
        system_prompt: promptToSave,
        personality,
        language,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('agents').update(agentData).eq('id', existing.id);
      } else {
        await supabase.from('agents').insert({ user_id: user.id, ...agentData });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const copyPrompt = () => {
    const text = mode === 'manual' ? manualPrompt : generatedPrompt;
    navigator.clipboard.writeText(text);
  };

  const businessFieldCount = businessData
    ? Object.values(businessData).filter(v => v && typeof v === 'string' && v.trim()).length
    : 0;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Prompt del Agente IA</h1>
        <p>El prompt es el "cerebro" de tu agente. Define cómo responde, qué sabe y cómo se comporta.</p>
      </div>

      {/* Mode Tabs */}
      <div className="prompt-tabs">
        <button className={`prompt-tab ${mode === 'manual' ? 'prompt-tab--active' : ''}`} onClick={() => setMode('manual')}>
          <Edit3 size={14} /> Mi prompt
        </button>
        <button className={`prompt-tab ${mode === 'generator' ? 'prompt-tab--active' : ''}`} onClick={() => setMode('generator')}>
          <Sparkles size={14} /> Generar con IA
        </button>
      </div>

      {/* AI Booking Toggle - PROMINENT */}
      <div className={`cal-booking-toggle ${bookingEnabled ? 'cal-booking-toggle--on' : ''}`} style={{ marginBottom: '1rem' }}>
        <div className="cal-booking-toggle__info">
          <div className="cal-booking-toggle__icon">
            <Calendar size={22} />
          </div>
          <div>
            <h3>Agendamiento automático por IA</h3>
            <p>{bookingEnabled
              ? 'La IA agenda citas automáticamente cuando un cliente lo solicita por WhatsApp.'
              : 'Activa para que la IA pueda agendar citas y reservas desde las conversaciones de WhatsApp.'
            }</p>
          </div>
        </div>
        <button
          className={`cal-booking-toggle__switch ${bookingEnabled ? 'cal-booking-toggle__switch--on' : ''}`}
          onClick={toggleBooking}
          disabled={togglingBooking || !activeAgent}
        >
          {togglingBooking ? <Loader2 size={14} className="spin" /> : <Power size={14} />}
          {bookingEnabled ? 'Activado' : 'Desactivado'}
        </button>
      </div>

      {/* Business Data Status */}
      <div className={`prompt-business-status ${businessFieldCount > 5 ? 'prompt-business-status--good' : businessFieldCount > 0 ? 'prompt-business-status--partial' : 'prompt-business-status--empty'}`}>
        <Info size={14} />
        <span>
          {loadingBusiness ? 'Cargando datos del negocio...' :
           businessFieldCount > 5 ? `Datos del negocio cargados (${businessFieldCount} campos). El prompt usará esta información.` :
           businessFieldCount > 0 ? `Tienes ${businessFieldCount} campos rellenados en "Mi Negocio". Añade más para mejores respuestas.` :
           'No hay datos del negocio. Ve a "Mi Negocio" para que el agente sepa de qué va tu empresa.'}
        </span>
      </div>

      {/* ══ MANUAL MODE ══ */}
      {mode === 'manual' && (
        <div className="card">
          <h3 className="card__section-title">Tu prompt</h3>
          <p className="card__section-desc">
            Escribe directamente las instrucciones para tu agente. Este texto define todo su comportamiento.
            Los datos de "Mi Negocio" se añadirán automáticamente al final.
          </p>
          <div className="form-field form-field--full">
            <textarea
              className="prompt-manual-textarea"
              placeholder={`Escribe aquí las instrucciones para tu agente. Por ejemplo:\n\nEres el asistente virtual de [tu negocio]. Eres amable y profesional.\n\nResponde preguntas sobre nuestros servicios, precios y horarios.\nSi alguien quiere reservar, pídele nombre y teléfono.\nNunca inventes información.\n\nSi no sabes algo, di que contacten al número +34 600 000 000.`}
              value={manualPrompt}
              onChange={e => { setManualPrompt(e.target.value); setSaved(false); }}
              rows={16}
            />
          </div>
          <div className="prompt-manual-footer">
            <span className="prompt-manual-count">{manualPrompt.length} caracteres</span>
            <div className="form-actions">
              <button className="btn btn--outline btn--sm" onClick={copyPrompt}><Copy size={14} /> Copiar</button>
              <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                {saved ? <><Check size={16} /> Guardado</> : saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar prompt</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ GENERATOR MODE ══ */}
      {mode === 'generator' && (
        <>
          {/* Identity */}
          <div className="card">
            <h3 className="card__section-title">Identidad del agente</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Nombre del agente *</label>
                <input type="text" placeholder="Ej: Asistente de Peluquería María" value={agentName} onChange={e => setAgentName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Idioma</label>
                <div className="chips">
                  {LANGUAGES.map(l => (
                    <button key={l.id} className={`chip ${language === l.id ? 'chip--active' : ''}`} onClick={() => setLanguage(l.id)}>{l.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Personality */}
          <div className="card">
            <h3 className="card__section-title">Personalidad</h3>
            <p className="card__section-desc">¿Cómo quieres que hable tu agente?</p>
            <div className="personality-grid">
              {PERSONALITIES.map(p => (
                <button key={p.id} className={`personality-card ${personality === p.id ? 'personality-card--active' : ''}`} onClick={() => setPersonality(p.id)}>
                  <span className="personality-card__label">{p.label}</span>
                  <span className="personality-card__desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="card">
            <h3 className="card__section-title">Capacidades</h3>
            <p className="card__section-desc">¿Qué puede hacer tu agente?</p>
            <div className="capability-grid">
              {CAPABILITIES.map(c => (
                <button key={c.id} className={`capability-card ${capabilities.includes(c.id) ? 'capability-card--active' : ''}`} onClick={() => toggleList(capabilities, setCapabilities, c.id)}>
                  <span className="capability-card__label">{c.label}</span>
                  <span className="capability-card__desc">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Restrictions */}
          <div className="card">
            <h3 className="card__section-title">Restricciones</h3>
            <p className="card__section-desc">¿Qué NO debe hacer tu agente?</p>
            <div className="chips">
              {RESTRICTIONS.map(r => (
                <button key={r.id} className={`chip ${restrictions.includes(r.id) ? 'chip--active chip--warning' : ''}`} onClick={() => toggleList(restrictions, setRestrictions, r.id)}>
                  <AlertCircle size={12} /> {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="card">
            <h3 className="card__section-title">Mensajes personalizados</h3>
            <div className="form-grid">
              <div className="form-field form-field--full">
                <label>Saludo inicial</label>
                <textarea placeholder="Ej: ¡Hola! 👋 Soy el asistente virtual de [Negocio]. ¿En qué puedo ayudarte?" value={greeting} onChange={e => setGreeting(e.target.value)} rows={2} />
              </div>
              <div className="form-field form-field--full">
                <label>Despedida</label>
                <textarea placeholder="Ej: ¡Gracias por contactar! Si necesitas algo más, aquí estaré. ¡Buen día! 😊" value={farewell} onChange={e => setFarewell(e.target.value)} rows={2} />
              </div>
              <div className="form-field form-field--full">
                <label>Reglas adicionales</label>
                <textarea placeholder="Ej: Siempre ofrecer la cita más próxima, mencionar la oferta del mes..." value={customRules} onChange={e => setCustomRules(e.target.value)} rows={3} />
              </div>
            </div>
          </div>

          {/* Generate */}
          <div className="generate-section">
            <button className="btn btn--primary btn--lg" onClick={generatePrompt}>
              <Sparkles size={18} /> Generar prompt con datos de mi negocio
            </button>
          </div>

          {/* Generated Result */}
          {generatedPrompt && (
            <div className="card card--highlight">
              <div className="prompt-result__header">
                <h3><Brain size={16} /> Prompt generado</h3>
                <div className="prompt-result__actions">
                  <button className="btn btn--outline btn--sm" onClick={generatePrompt}><RefreshCw size={14} /> Regenerar</button>
                </div>
              </div>
              <pre className="prompt-result__code">{generatedPrompt}</pre>
              <div className="prompt-generated-info">
                <Check size={14} />
                <span>Copiado a <strong>"Mi prompt"</strong>. Puedes editarlo desde ahí.</span>
              </div>
              <div className="form-actions" style={{ marginTop: '1rem', gap: '0.5rem' }}>
                <button className="btn btn--primary" onClick={() => { handleSave(); }}>
                  {saved ? <><Check size={16} /> Guardado y activo</> : saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Save size={16} /> Guardar y activar</>}
                </button>
                <button className="btn btn--outline" onClick={() => setMode('manual')}>
                  <Edit3 size={14} /> Ir a Mi prompt para editar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
