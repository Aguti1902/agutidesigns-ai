import { useState, useEffect } from 'react';
import { Brain, Sparkles, Save, Check, Copy, RefreshCw, AlertCircle, Edit3, Zap, Info, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const PERSONALITIES = [
  { id: 'cercano', label: 'Cercano y amigable', desc: 'Como hablar con un amigo que trabaja ahí' },
  { id: 'profesional', label: 'Profesional', desc: 'Serio pero accesible, transmite confianza' },
  { id: 'formal', label: 'Formal y corporativo', desc: 'Muy profesional, trato de usted' },
  { id: 'divertido', label: 'Divertido', desc: 'Desenfadado, con humor, pero resolutivo' },
  { id: 'empatico', label: 'Empático y cálido', desc: 'Muy atento a las emociones del cliente' },
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
  { id: 'citas', label: 'Gestionar citas y reservas', desc: 'Programar, cambiar y cancelar citas' },
  { id: 'leads', label: 'Captar datos de contacto', desc: 'Nombre, email, teléfono del interesado' },
  { id: 'precios', label: 'Informar sobre precios', desc: 'Responder cuánto cuesta cada servicio' },
  { id: 'recomendaciones', label: 'Recomendar servicios', desc: 'Sugerir lo mejor según la necesidad' },
  { id: 'quejas', label: 'Gestionar quejas', desc: 'Escuchar, disculparse y derivar si es grave' },
  { id: 'seguimiento', label: 'Seguimiento post-servicio', desc: 'Preguntar qué tal fue, pedir reseña' },
  { id: 'ofertas', label: 'Informar de ofertas', desc: 'Comunicar promociones y descuentos' },
  { id: 'derivar', label: 'Derivar a humano', desc: 'Transferir a persona real si no puede resolver' },
];

const RESTRICTIONS = [
  { id: 'no_descuentos', label: 'No ofrecer descuentos por su cuenta' },
  { id: 'no_inventar', label: 'No inventar información que no tenga' },
  { id: 'no_competencia', label: 'No hablar de la competencia' },
  { id: 'no_medico', label: 'No dar consejos médicos/legales' },
  { id: 'derivar_complejas', label: 'Derivar consultas complejas a humano' },
  { id: 'confirmar_precios', label: 'Siempre confirmar que los precios pueden variar' },
  { id: 'pedir_datos', label: 'Siempre intentar recoger nombre y teléfono' },
];

export default function PromptBuilder() {
  const { user } = useAuth();
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

  // Load business data from Supabase
  useEffect(() => {
    if (user) loadBusinessData();
  }, [user]);

  // Load existing agent prompt
  useEffect(() => {
    if (user) loadExistingAgent();
  }, [user]);

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

    const prompt = `Eres "${agentName || 'Asistente Virtual'}", el agente de atención al cliente por WhatsApp.

PERSONALIDAD: ${persData?.label || 'Cercano'}. ${persData?.desc || ''}
IDIOMA: ${langData?.label || 'Español'}${language === 'auto' ? '. Detecta el idioma del cliente y responde en ese idioma.' : `. Responde siempre en ${langData?.label}.`}
${greeting ? `\nSALUDO INICIAL: Cuando un cliente te escribe por primera vez, salúdale así: "${greeting}"` : ''}

LO QUE PUEDES HACER:
${capsLabels.map(c => `- ${c.label}: ${c.desc}`).join('\n')}

LO QUE NO DEBES HACER:
${restLabels.map(r => `- ${r.label}`).join('\n')}

REGLAS GENERALES:
- Sé conciso: máximo 2-3 párrafos por respuesta
- Usa emojis con moderación (1-2 por mensaje máximo)
- Si no sabes algo, dilo honestamente y ofrece contactar con un humano
- Mantén el tono ${personality} en todo momento
- Responde SOLO con información que tengas del negocio
- PROHIBIDO hablar de temas que no tengan relación con el negocio
- Si alguien pregunta sobre política, religión, temas personales u otros temas NO relacionados con el negocio, responde amablemente: "Solo puedo ayudarte con temas relacionados con nuestro negocio. ¿En qué puedo asistirte?"
- NUNCA des opiniones personales sobre temas que no sean del negocio
${customRules ? `\nREGLAS PERSONALIZADAS:\n${customRules}` : ''}
${farewell ? `\nDESPEDIDA: Cuando el cliente se despide, responde: "${farewell}"` : ''}
${businessContext ? `\n\n========== INFORMACIÓN DEL NEGOCIO ==========\n\n${businessContext}` : '\n\n(No hay datos del negocio cargados. Ve a "Mi Negocio" para añadirlos.)'}

Usa SIEMPRE la información del negocio proporcionada para responder con datos reales y precisos. NUNCA inventes datos que no estén aquí arriba. Si no tienes la respuesta, di que no lo sabes y ofrece contactar directamente con el negocio.`;

    setGeneratedPrompt(prompt);
    setManualPrompt(prompt);
    // Auto-switch to "Mi prompt" tab
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
