import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, Building, FileText, Bot, MessageCircle, Check, ArrowRight,
  ArrowLeft, CheckCircle, Circle, Zap, Target, Euro, Clock, Globe, Users
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import './OnboardingFlow.css';

const PERSONALITIES = [
  { id: 'cercano', label: 'Cercano', emoji: '😊' },
  { id: 'profesional', label: 'Profesional', emoji: '💼' },
  { id: 'vendedor', label: 'Comercial', emoji: '🚀' },
];

const CLIENTES_TIPO = [
  { id: 'pymes', label: 'PYMEs locales' },
  { id: 'autonomos', label: 'Autónomos' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'empresas', label: 'Empresas medianas' },
  { id: 'startups', label: 'Startups' },
];

const OBJETIVOS = [
  { id: 'agendar', label: 'Agendar discovery call', desc: 'La IA siempre termina proponiendo una llamada de 20 min' },
  { id: 'cerrar', label: 'Cerrar directo', desc: 'La IA intenta cerrar el proyecto por WhatsApp sin llamada' },
  { id: 'cualificar', label: 'Filtrar y cualificar', desc: 'La IA solo cualifica y pasa los buenos leads a ti' },
];

function ProgressBar({ step, total }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="ob-progress">
      <div className="ob-progress__top">
        <span className="ob-progress__label">Paso {step} de {total}</span>
        <span className="ob-progress__pct">{pct}%</span>
      </div>
      <div className="ob-progress__track">
        <motion.div
          className="ob-progress__fill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function OnboardingFlow({ onComplete }) {
  const { updateProfile, user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 2 — Datos fiscales
  const [fiscalName, setFiscalName] = useState('');
  const [fiscalNif, setFiscalNif] = useState('');
  const [fiscalAddress, setFiscalAddress] = useState('');
  const [fiscalCity, setFiscalCity] = useState('');
  const [negocioPhone, setNegocioPhone] = useState('');
  const [negocioEmail, setNegocioEmail] = useState('');

  // Step 3 — Servicios y precios
  const [servicios, setServicios] = useState('');
  const [precios, setPrecios] = useState('');

  // Step 4 — Estrategia comercial
  const [presupuestoMin, setPresupuestoMin] = useState('400');
  const [clienteIdeal, setClienteIdeal] = useState([]);
  const [objetivo, setObjetivo] = useState('agendar');

  // Step 5 — WhatsApp (informativo)
  const [whatsappConfirm, setWhatsappConfirm] = useState(false);

  // Step 6 — Activar IA
  const [agentName, setAgentName] = useState('');
  const [personality, setPersonality] = useState('cercano');

  const TOTAL_STEPS = 6;

  const toggleClienteTipo = (id) => {
    setClienteIdeal(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);
  };

  async function saveFiscal() {
    if (!user) return;
    setSaving(true);
    try {
      const extraData = {
        fiscal_name: fiscalName,
        fiscal_nif: fiscalNif,
        fiscal_address: fiscalAddress,
        fiscal_city: fiscalCity,
      };
      const { data: existing } = await supabase.from('businesses').select('id, extra_context').eq('user_id', user.id).maybeSingle();
      const prevExtra = (() => { try { return existing?.extra_context ? JSON.parse(existing.extra_context) : {}; } catch { return {}; } })();
      const merged = { ...prevExtra, ...extraData };
      if (existing) {
        await supabase.from('businesses').update({ name: fiscalName || 'Mi Negocio', phone: negocioPhone, email: negocioEmail, extra_context: JSON.stringify(merged), updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('businesses').insert({ user_id: user.id, name: fiscalName || 'Mi Negocio', phone: negocioPhone, email: negocioEmail, extra_context: JSON.stringify(merged) });
      }
    } catch {}
    setSaving(false);
  }

  async function saveServicios() {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase.from('businesses').select('id, extra_context').eq('user_id', user.id).maybeSingle();
      const prevExtra = (() => { try { return existing?.extra_context ? JSON.parse(existing.extra_context) : {}; } catch { return {}; } })();
      const merged = { ...prevExtra, web_services_detail: servicios, prices_list: precios };
      if (existing) {
        await supabase.from('businesses').update({ extra_context: JSON.stringify(merged), updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('businesses').insert({ user_id: user.id, name: 'Mi Negocio', extra_context: JSON.stringify(merged) });
      }
    } catch {}
    setSaving(false);
  }

  async function saveEstrategia() {
    if (!user) return;
    setSaving(true);
    try {
      const cfg = { presupuestoMinimo: presupuestoMin, clienteIdeal, objetivoIA: objetivo, capabilities: ['leads', 'precios', 'ventas', 'citas', 'objeciones', 'derivar'], restrictions: ['no_inventar', 'no_descuentos', 'no_competencia', 'no_presionar', 'no_prometer', 'derivar_complejas', 'confirmar_precios', 'pedir_datos'] };
      const { data: existing } = await supabase.from('agents').select('id, config').eq('user_id', user.id).maybeSingle();
      const prevCfg = (() => { try { return existing?.config ? JSON.parse(existing.config) : {}; } catch { return {}; } })();
      const mergedCfg = { ...prevCfg, ...cfg };
      if (existing) {
        await supabase.from('agents').update({ config: JSON.stringify(mergedCfg), updated_at: new Date().toISOString() }).eq('id', existing.id);
      } else {
        await supabase.from('agents').insert({ user_id: user.id, name: 'Asistente', config: JSON.stringify(mergedCfg) });
      }
    } catch {}
    setSaving(false);
  }

  async function saveAgent() {
    if (!user) return;
    setSaving(true);
    try {
      const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single();
      const extra = (() => { try { return biz?.extra_context ? JSON.parse(biz.extra_context) : {}; } catch { return {}; } })();
      const prompt = buildBasicPrompt({ agentName, personality, biz, extra, presupuestoMin, clienteIdeal, objetivo });

      const { data: existing } = await supabase.from('agents').select('id, config').eq('user_id', user.id).maybeSingle();
      const prevCfg = (() => { try { return existing?.config ? JSON.parse(existing.config) : {}; } catch { return {}; } })();
      const agentData = { name: agentName || 'Asistente', personality, language: 'es', system_prompt: prompt, config: JSON.stringify({ ...prevCfg, presupuestoMinimo: presupuestoMin, clienteIdeal, objetivoIA: objetivo }), updated_at: new Date().toISOString() };
      if (existing) {
        await supabase.from('agents').update(agentData).eq('id', existing.id);
      } else {
        await supabase.from('agents').insert({ user_id: user.id, ...agentData });
      }
    } catch {}
    setSaving(false);
  }

  function buildBasicPrompt({ agentName, personality, biz, extra, presupuestoMin, clienteIdeal, objetivo }) {
    const persMap = { cercano: 'Cercano y amigable, como un colega del sector.', profesional: 'Profesional y seguro, transmite confianza.', vendedor: 'Orientado a convertir, proactivo y persuasivo sin ser agresivo.' };
    const objMap = { agendar: 'Tu objetivo principal es proponer una llamada de discovery de 20 minutos al final de cada conversación con interés real.', cerrar: 'Tu objetivo es cerrar el proyecto directamente por WhatsApp cuando sea posible.', cualificar: 'Tu objetivo es cualificar al lead (presupuesto, tipo de proyecto, urgencia) y pasarlo al profesional humano.' };
    return `Eres "${agentName || 'Asistente'}", el agente comercial de IA de ${biz?.name || 'el negocio'}. Especializado en vender servicios de diseño web y desarrollo freelance.\n\nPERSONALIDAD: ${persMap[personality] || persMap.cercano}\nIDIOMA: Español.\n\n${objMap[objetivo] || objMap.agendar}\n\nPRESUPUESTO MÍNIMO: ${presupuestoMin ? `No aceptes proyectos por debajo de ${presupuestoMin}€. Gestiona con tacto si el cliente menciona menos.` : ''}\n\n${extra.web_services_detail ? `SERVICIOS:\n${extra.web_services_detail}` : ''}\n${extra.prices_list ? `PRECIOS:\n${extra.prices_list}` : ''}\n${biz?.phone ? `TELÉFONO: ${biz.phone}` : ''}\n${biz?.email ? `EMAIL: ${biz.email}` : ''}\n\nNUNCA inventes información. SIEMPRE intenta recoger nombre y contacto del lead. Mensajes cortos (WhatsApp, no email).`;
  }

  async function goNext() {
    if (step === 2) await saveFiscal();
    if (step === 3) await saveServicios();
    if (step === 4) await saveEstrategia();
    setStep(s => s + 1);
  }

  async function handleFinish() {
    await saveAgent();
    await updateProfile({ onboarding_completed: true });
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1';
      await fetch(`${API_URL}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.email, subject: '¡Bienvenido a Wasapy! 🚀', template: 'welcome', data: { name: profile?.full_name || 'ahí', trialDays: 7 } })
      }).catch(() => {});
    } catch {}
    onComplete();
    navigate('/app');
  }

  const steps = [
    { icon: <Rocket size={28} />, label: 'Bienvenida', color: '#25D366' },
    { icon: <Building size={28} />, label: 'Datos fiscales', color: '#3b82f6' },
    { icon: <FileText size={28} />, label: 'Servicios', color: '#8b5cf6' },
    { icon: <Target size={28} />, label: 'Estrategia', color: '#f59e0b' },
    { icon: <MessageCircle size={28} />, label: 'WhatsApp', color: '#25D366' },
    { icon: <Bot size={28} />, label: 'Activar IA', color: '#25D366' },
  ];

  return (
    <div className="onboard">
      {/* Logo */}
      <div className="onboard__logo">
        <span className="onboard__logo-text">wasap<span className="onboard__logo-y">y</span></span>
        <span className="onboard__logo-badge">.io</span>
      </div>

      <div className="onboard__card onboard__card--wide">
        {/* Steps indicator */}
        <div className="ob-steps">
          {steps.map((s, i) => (
            <div key={i} className={`ob-step ${i < step ? 'ob-step--done' : i === step ? 'ob-step--active' : ''}`}>
              <div className="ob-step__dot" style={i === step ? { borderColor: s.color, color: s.color } : {}}>
                {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <span className="ob-step__label">{s.label}</span>
            </div>
          ))}
        </div>

        {step > 0 && <ProgressBar step={step} total={TOTAL_STEPS - 1} />}

        <AnimatePresence mode="wait">
          <motion.div key={step} className="ob-body" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>

            {/* ── Paso 0: Bienvenida ── */}
            {step === 0 && (
              <div className="ob-welcome">
                <div className="ob-welcome__icon"><Rocket size={40} /></div>
                <h2>¡Bienvenido a Wasapy!</h2>
                <p>Vamos a configurar tu agente comercial de IA en 5 pasos. Al terminar, la IA conocerá tu negocio, tus precios y podrá cualificar leads por WhatsApp.</p>
                <div className="ob-welcome__steps">
                  {[
                    { icon: <Building size={16} />, t: 'Datos fiscales', d: 'Para tus presupuestos y facturas PDF' },
                    { icon: <FileText size={16} />, t: 'Servicios y precios', d: 'Para que la IA responda con tus tarifas reales' },
                    { icon: <Target size={16} />, t: 'Estrategia comercial', d: 'Objetivo de la IA y cliente ideal' },
                    { icon: <MessageCircle size={16} />, t: 'WhatsApp', d: 'Conecta el número que usará la IA' },
                    { icon: <Bot size={16} />, t: 'Activar IA', d: 'Nombre y personalidad de tu agente' },
                  ].map((s, i) => (
                    <div key={i} className="ob-welcome__step">
                      <span className="ob-welcome__step-ico">{s.icon}</span>
                      <div><b>{s.t}</b><span>{s.d}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Paso 1: Datos fiscales ── */}
            {step === 1 && (
              <div className="ob-form">
                <div className="ob-form__head">
                  <span className="ob-form__ico" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><Building size={22} /></span>
                  <div>
                    <h2>Datos de tu negocio</h2>
                    <p>Aparecerán en todos tus presupuestos y facturas PDF.</p>
                  </div>
                </div>
                <div className="ob-grid">
                  <div className="ob-field ob-field--full">
                    <label>Nombre fiscal / Razón social *</label>
                    <input value={fiscalName} onChange={e => setFiscalName(e.target.value)} placeholder="Ej: Guti Design S.L. o Gustavo López García" autoFocus />
                  </div>
                  <div className="ob-field">
                    <label>NIF / CIF</label>
                    <input value={fiscalNif} onChange={e => setFiscalNif(e.target.value)} placeholder="12345678A" />
                  </div>
                  <div className="ob-field">
                    <label>Ciudad y provincia</label>
                    <input value={fiscalCity} onChange={e => setFiscalCity(e.target.value)} placeholder="Barcelona, Barcelona" />
                  </div>
                  <div className="ob-field ob-field--full">
                    <label>Dirección fiscal</label>
                    <input value={fiscalAddress} onChange={e => setFiscalAddress(e.target.value)} placeholder="Calle Mayor 12, 2ºA" />
                  </div>
                  <div className="ob-field">
                    <label>Teléfono / WhatsApp de contacto</label>
                    <input value={negocioPhone} onChange={e => setNegocioPhone(e.target.value)} placeholder="+34 600 000 000" />
                  </div>
                  <div className="ob-field">
                    <label>Email de contacto</label>
                    <input type="email" value={negocioEmail} onChange={e => setNegocioEmail(e.target.value)} placeholder="hola@gutidiseno.com" />
                  </div>
                </div>
                <div className="ob-hint"><Zap size={13} /> Puedes completar o editar esto más tarde en <strong>Mi Negocio</strong>.</div>
              </div>
            )}

            {/* ── Paso 2: Servicios y precios ── */}
            {step === 2 && (
              <div className="ob-form">
                <div className="ob-form__head">
                  <span className="ob-form__ico" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}><FileText size={22} /></span>
                  <div>
                    <h2>Servicios y precios</h2>
                    <p>Esto es lo más importante. La IA usará estos datos para responder "¿cuánto cuesta?" con tus tarifas reales.</p>
                  </div>
                </div>
                <div className="ob-field ob-field--full">
                  <label>Servicios que ofreces *</label>
                  <textarea
                    value={servicios}
                    onChange={e => setServicios(e.target.value)}
                    rows={5}
                    placeholder={`WEB CORPORATIVA: Diseño + desarrollo WordPress. Desde 800€. Incluye diseño responsive, SEO básico, 1 año soporte.
LANDING PAGE: Desde 500€. Captación de leads, formulario, integración email marketing.
TIENDA ONLINE: WooCommerce/Shopify desde 1.500€. Gestión de productos, pasarela de pago.
MANTENIMIENTO: Desde 50€/mes. Actualizaciones, seguridad y soporte.`}
                  />
                </div>
                <div className="ob-field ob-field--full">
                  <label>Rangos de precio orientativos *</label>
                  <textarea
                    value={precios}
                    onChange={e => setPrecios(e.target.value)}
                    rows={4}
                    placeholder={`Web corporativa: 800€ - 2.500€
Landing page: 500€ - 1.200€
Ecommerce: 1.500€ - 5.000€
Mantenimiento: 50€ - 200€/mes
SEO: 300€ - 800€`}
                  />
                </div>
                <div className="ob-hint"><Zap size={13} /> La IA nunca inventará precios. Usará exactamente lo que escribas aquí.</div>
              </div>
            )}

            {/* ── Paso 3: Estrategia comercial ── */}
            {step === 3 && (
              <div className="ob-form">
                <div className="ob-form__head">
                  <span className="ob-form__ico" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><Target size={22} /></span>
                  <div>
                    <h2>Estrategia comercial</h2>
                    <p>Define cómo debe comportarse tu IA para maximizar conversiones.</p>
                  </div>
                </div>
                <div className="ob-field">
                  <label><Euro size={14} /> Presupuesto mínimo de proyecto (€)</label>
                  <input type="number" value={presupuestoMin} onChange={e => setPresupuestoMin(e.target.value)} placeholder="400" />
                  <span className="ob-field__hint">Si un cliente menciona menos, la IA lo gestiona con tacto y no acepta el proyecto.</span>
                </div>
                <div className="ob-field ob-field--full">
                  <label><Users size={14} /> Cliente ideal (selecciona todos los que apliquen)</label>
                  <div className="ob-chips">
                    {CLIENTES_TIPO.map(c => (
                      <button key={c.id} type="button" className={`ob-chip ${clienteIdeal.includes(c.id) ? 'ob-chip--on' : ''}`} onClick={() => toggleClienteTipo(c.id)}>
                        {clienteIdeal.includes(c.id) && <Check size={11} />} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ob-field ob-field--full">
                  <label><Target size={14} /> Objetivo principal de la IA</label>
                  <div className="ob-objetivo-list">
                    {OBJETIVOS.map(o => (
                      <div key={o.id} className={`ob-objetivo ${objetivo === o.id ? 'ob-objetivo--on' : ''}`} onClick={() => setObjetivo(o.id)}>
                        <div className="ob-objetivo__radio">
                          {objetivo === o.id ? <CheckCircle size={18} /> : <Circle size={18} />}
                        </div>
                        <div>
                          <b>{o.label}</b>
                          <span>{o.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Paso 4: WhatsApp ── */}
            {step === 4 && (
              <div className="ob-form">
                <div className="ob-form__head">
                  <span className="ob-form__ico" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}><MessageCircle size={22} /></span>
                  <div>
                    <h2>Conecta tu WhatsApp</h2>
                    <p>Tu agente IA necesita un número de WhatsApp para atender a los clientes.</p>
                  </div>
                </div>
                <div className="ob-wa-info">
                  <div className="ob-wa-step"><div className="ob-wa-num">1</div><span>Ve a la sección <strong>WhatsApp</strong> del dashboard</span></div>
                  <div className="ob-wa-step"><div className="ob-wa-num">2</div><span>Escanea el código QR con tu teléfono</span></div>
                  <div className="ob-wa-step"><div className="ob-wa-num">3</div><span>La IA empezará a responder en segundos</span></div>
                </div>
                <div className="ob-wa-confirm">
                  <button
                    type="button"
                    className={`ob-wa-btn ${whatsappConfirm ? 'ob-wa-btn--done' : ''}`}
                    onClick={() => setWhatsappConfirm(v => !v)}
                  >
                    {whatsappConfirm ? <><CheckCircle size={16} /> WhatsApp conectado</> : <><Circle size={16} /> Marcar como conectado</>}
                  </button>
                  <p className="ob-wa-skip">¿No tienes el teléfono ahora? Puedes conectarlo más tarde desde el dashboard.</p>
                </div>
              </div>
            )}

            {/* ── Paso 5: Activar IA ── */}
            {step === 5 && (
              <div className="ob-form">
                <div className="ob-form__head">
                  <span className="ob-form__ico" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}><Bot size={22} /></span>
                  <div>
                    <h2>Activa tu agente IA</h2>
                    <p>Último paso. Dale nombre y personalidad a tu comercial de IA.</p>
                  </div>
                </div>
                <div className="ob-field">
                  <label>Nombre de tu agente</label>
                  <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Ej: Alex, Sofia, Asistente Guti..." autoFocus />
                  <span className="ob-field__hint">Este nombre usará la IA para presentarse: "¡Hola! Soy Alex, el asistente de..."</span>
                </div>
                <div className="ob-field ob-field--full">
                  <label>Personalidad</label>
                  <div className="ob-personality-grid">
                    {PERSONALITIES.map(p => (
                      <button key={p.id} type="button" className={`ob-pers-card ${personality === p.id ? 'ob-pers-card--active' : ''}`} onClick={() => setPersonality(p.id)}>
                        <span className="ob-pers-card__emoji">{p.emoji}</span>
                        <strong>{p.label}</strong>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ob-ready">
                  <CheckCircle size={20} />
                  <div>
                    <b>Todo listo para activar</b>
                    <span>Tu IA ya conoce tus servicios, precios y estrategia comercial. Puedes ajustar todo en <strong>Configuración IA</strong>.</span>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navegación */}
        <div className="ob-nav">
          {step > 0 ? (
            <button className="ob-btn ob-btn--ghost" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={15} /> Anterior
            </button>
          ) : (
            <div />
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button className="ob-btn ob-btn--primary" onClick={goNext} disabled={saving}>
              {saving ? 'Guardando...' : <>Siguiente <ArrowRight size={15} /></>}
            </button>
          ) : (
            <button className="ob-btn ob-btn--success" onClick={handleFinish} disabled={saving}>
              {saving ? 'Activando...' : <><Zap size={15} /> Activar mi IA</>}
            </button>
          )}
        </div>

        {step < TOTAL_STEPS - 1 && (
          <button className="onboard__skip" onClick={handleFinish}>
            Saltar y configurar más tarde →
          </button>
        )}
      </div>
    </div>
  );
}
