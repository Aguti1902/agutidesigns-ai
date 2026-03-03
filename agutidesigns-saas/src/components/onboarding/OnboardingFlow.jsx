import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, Building, FileText, Bot, MessageCircle, Check, ArrowRight,
  ArrowLeft, CheckCircle, Circle, Zap, Target, Euro, Globe, Users,
  Smile, Briefcase, TrendingUp, ShoppingCart, Wrench, Search, Pen,
  RefreshCw, Code, QrCode, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import './OnboardingFlow.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
function apiHeaders() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` }; }

const SERVICIOS_WEB = [
  { id: 'web_corp',      label: 'Web corporativa',      desc: 'WordPress + diseño responsive',       icon: Globe,        placeholder: '800€ – 2.500€' },
  { id: 'landing',       label: 'Landing page',          desc: 'Captación de leads / ventas',         icon: Target,       placeholder: '500€ – 1.200€' },
  { id: 'ecommerce',     label: 'Tienda online',          desc: 'WooCommerce / Shopify',               icon: ShoppingCart, placeholder: '1.500€ – 5.000€' },
  { id: 'rediseno',      label: 'Rediseño web',           desc: 'Mejora de sitio existente',           icon: RefreshCw,    placeholder: '600€ – 2.000€' },
  { id: 'mantenimiento', label: 'Mantenimiento mensual',  desc: 'Actualizaciones y soporte continuo',  icon: Wrench,       placeholder: '50€ – 200€/mes' },
  { id: 'seo',           label: 'SEO',                    desc: 'Posicionamiento en buscadores',       icon: Search,       placeholder: '300€ – 800€' },
  { id: 'copy',          label: 'Copy / Branding',        desc: 'Contenido y diseño de marca',         icon: Pen,          placeholder: '400€ – 1.500€' },
  { id: 'apps',          label: 'Apps / Web app',         desc: 'Desarrollo a medida',                 icon: Code,         placeholder: '2.000€ – 10.000€' },
];

const PERSONALITIES = [
  { id: 'cercano',      label: 'Cercano',     icon: Smile },
  { id: 'profesional',  label: 'Profesional', icon: Briefcase },
  { id: 'vendedor',     label: 'Comercial',   icon: TrendingUp },
];

const CLIENTES_TIPO = [
  { id: 'pymes',     label: 'PYMEs locales' },
  { id: 'autonomos', label: 'Autónomos' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'empresas',  label: 'Empresas medianas' },
  { id: 'startups',  label: 'Startups' },
];

const OBJETIVOS = [
  { id: 'agendar',   label: 'Agendar discovery call', desc: 'La IA siempre termina proponiendo una llamada de 20 min' },
  { id: 'cerrar',    label: 'Cerrar directo',          desc: 'La IA intenta cerrar el proyecto por WhatsApp sin llamada' },
  { id: 'cualificar',label: 'Filtrar y cualificar',    desc: 'La IA solo cualifica y pasa los buenos leads a ti' },
];

/* ─────────────────────────────────────────────
   WhatsApp mini-connector embedded in onboarding
───────────────────────────────────────────── */
function OBWhatsAppConnector({ userId, onConnected }) {
  const [qrCode, setQrCode]         = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected]   = useState(false);
  const [error, setError]           = useState('');
  const pollRef = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function getOrCreateAgentId() {
    const { data } = await supabase.from('agents').select('id').eq('user_id', userId).maybeSingle();
    if (data?.id) return data.id;
    const { data: created, error } = await supabase.from('agents').insert({ user_id: userId, name: 'Asistente', booking_enabled: true }).select('id').single();
    if (error) throw new Error('No se pudo preparar el agente. Inténtalo de nuevo.');
    return created?.id;
  }

  async function connectQR() {
    setConnecting(true); setError(''); setQrCode(null);
    try {
      const agentId = await getOrCreateAgentId();
      const res  = await fetch(`${API_URL}/evolution-create`, { method: 'POST', headers: apiHeaders(), body: JSON.stringify({ agentId, userId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando QR');
      const qr = data.qrcode?.base64 || data.base64;
      if (qr) { setQrCode(qr); setConnecting(false); startPolling(agentId); }
      else    { setError('No se recibió QR. Inténtalo de nuevo.'); setConnecting(false); }
    } catch (e) { setError(e.message); setConnecting(false); }
  }

  function startPolling(agentId) {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res  = await fetch(`${API_URL}/evolution-status/${agentId}`, { headers: apiHeaders() });
        const data = await res.json();
        if (data.connected) {
          setQrCode(null); setConnected(true);
          clearInterval(pollRef.current);
          onConnected?.();
        }
      } catch {}
      if (attempts > 24) clearInterval(pollRef.current);
    }, 5000);
  }

  if (connected) return (
    <div className="ob-wa-ok">
      <CheckCircle size={36} className="ob-wa-ok__ico" />
      <b>¡WhatsApp conectado!</b>
      <span>Tu agente ya está activo y listo para responder.</span>
    </div>
  );

  return (
    <div className="ob-wa-connector">
      <div className="ob-wa-qr">
        {!qrCode && !connecting && (
          <>
            <button type="button" className="ob-btn ob-btn--primary ob-wa-action-btn" onClick={connectQR}>
              <QrCode size={15} /> Generar código QR
            </button>
            <p className="ob-wa-mobile-hint">⚠️ Si estás en móvil, accede desde un ordenador para poder escanear el QR</p>
          </>
        )}
        {connecting && (
          <div className="ob-wa-loading">
            <Loader2 size={22} className="ob-spin" />
            <span>Generando QR...</span>
          </div>
        )}
        {qrCode && (
          <div className="ob-wa-qr-box">
            <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR WhatsApp" className="ob-wa-qr-img" />
            <p>Abre WhatsApp → <strong>Dispositivos vinculados</strong> → escanea</p>
            <button type="button" className="ob-wa-refresh" onClick={connectQR}>
              <RefreshCw size={12} /> Refrescar QR
            </button>
          </div>
        )}
      </div>
      {error && (
        <div className="ob-wa-error">
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Activation loading screen
───────────────────────────────────────────── */
function ActivationScreen() {
  const [stage, setStage] = useState(0);
  const STAGES = [
    'Analizando tu negocio...',
    'Configurando servicios y precios...',
    'Programando estrategia comercial...',
    'Activando tu agente IA...',
    '¡Todo listo!',
  ];
  useEffect(() => {
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ob-activation">
      <div className="ob-activation__orb" />
      <div className="ob-activation__orb ob-activation__orb--2" />
      <div className="ob-activation__content">
        <div className="ob-activation__bot-wrap">
          <Bot size={44} className="ob-activation__bot" />
        </div>
        <h2 className="ob-activation__title">Creando tu agente IA</h2>
        <p className="ob-activation__sub">Tu comercial personal se está configurando…</p>
        <div className="ob-activation__stages">
          {STAGES.map((s, i) => (
            <motion.div
              key={i}
              className={`ob-activation__stage ${i < stage ? 'ob-as--done' : i === stage ? 'ob-as--active' : ''}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: i <= stage ? 1 : 0.25, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              {i < stage
                ? <CheckCircle size={14} />
                : i === stage
                  ? <Loader2 size={14} className="ob-spin" />
                  : <Circle size={14} />
              }
              <span>{s}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Progress bar
───────────────────────────────────────────── */
function ProgressBar({ step, total }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="ob-progress">
      <div className="ob-progress__top">
        <span className="ob-progress__label">Paso {step} de {total}</span>
        <span className="ob-progress__pct">{pct}%</span>
      </div>
      <div className="ob-progress__track">
        <motion.div className="ob-progress__fill" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main onboarding flow
───────────────────────────────────────────── */
export default function OnboardingFlow({ onComplete }) {
  const { updateProfile, user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [validErr, setValidErr]   = useState('');

  // Step 1 — Datos fiscales
  const [fiscalName, setFiscalName]       = useState('');
  const [fiscalNif, setFiscalNif]         = useState('');
  const [fiscalAddress, setFiscalAddress] = useState('');
  const [fiscalCity, setFiscalCity]       = useState('');
  const [negocioPhone, setNegocioPhone]   = useState('');
  const [negocioEmail, setNegocioEmail]   = useState('');

  // Step 2 — Servicios
  const [serviciosActivos, setServiciosActivos] = useState([]);
  const [servicioPrecios, setServicioPrecios]   = useState({});
  const toggleServicio  = (id) => setServiciosActivos(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  const setPrecioRango  = (id, val) => setServicioPrecios(p => ({ ...p, [id]: { ...p[id], rango: val } }));

  // Step 3 — Estrategia
  const [presupuestoMin, setPresupuestoMin] = useState('400');
  const [clienteIdeal, setClienteIdeal]     = useState([]);
  const [objetivo, setObjetivo]             = useState('agendar');
  const toggleClienteTipo = (id) => setClienteIdeal(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]);

  // Step 4 — WhatsApp
  const [waConnected, setWaConnected] = useState(false);

  // Step 5 — Activar IA
  const [agentName, setAgentName]   = useState('');
  const [personality, setPersonality] = useState('cercano');

  const TOTAL_STEPS = 6;

  // ── Validation per step ──────────────────────
  function getValidError() {
    if (step === 1 && !fiscalName.trim()) return 'El nombre de tu negocio es obligatorio para continuar.';
    if (step === 2 && serviciosActivos.length === 0) return 'Activa al menos un servicio para continuar.';
    if (step === 5 && !agentName.trim()) return 'Ponle un nombre a tu agente para continuar.';
    return '';
  }

  // ── Save helpers ─────────────────────────────
  async function saveFiscal() {
    if (!user) return;
    setSaving(true);
    try {
      const extraData = { fiscal_name: fiscalName, fiscal_nif: fiscalNif, fiscal_address: fiscalAddress, fiscal_city: fiscalCity };
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
      const serviciosText = serviciosActivos.map(id => {
        const s = SERVICIOS_WEB.find(s => s.id === id);
        const rango = servicioPrecios[id]?.rango;
        return `${s?.label?.toUpperCase()}: ${s?.desc}${rango ? `. Precio: ${rango}` : ''}.`;
      }).join('\n');
      const preciosText = serviciosActivos.map(id => {
        const s = SERVICIOS_WEB.find(s => s.id === id);
        const rango = servicioPrecios[id]?.rango;
        return rango ? `${s?.label}: ${rango}` : null;
      }).filter(Boolean).join('\n');
      const { data: existing } = await supabase.from('businesses').select('id, extra_context').eq('user_id', user.id).maybeSingle();
      const prevExtra = (() => { try { return existing?.extra_context ? JSON.parse(existing.extra_context) : {}; } catch { return {}; } })();
      const merged = { ...prevExtra, servicios_toggles: JSON.stringify(serviciosActivos), servicios_precios: JSON.stringify(servicioPrecios), web_services_detail: serviciosText, prices_list: preciosText };
      if (existing) { await supabase.from('businesses').update({ extra_context: JSON.stringify(merged), updated_at: new Date().toISOString() }).eq('id', existing.id); }
      else { await supabase.from('businesses').insert({ user_id: user.id, name: 'Mi Negocio', extra_context: JSON.stringify(merged) }); }
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
      if (existing) { await supabase.from('agents').update({ config: JSON.stringify(mergedCfg), updated_at: new Date().toISOString() }).eq('id', existing.id); }
      else { await supabase.from('agents').insert({ user_id: user.id, name: 'Asistente', booking_enabled: true, config: JSON.stringify(mergedCfg) }); }
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
      if (existing) { await supabase.from('agents').update(agentData).eq('id', existing.id); }
      else { await supabase.from('agents').insert({ user_id: user.id, booking_enabled: true, ...agentData }); }
    } catch {}
    setSaving(false);
  }

  function buildBasicPrompt({ agentName, personality, biz, extra, presupuestoMin, clienteIdeal, objetivo }) {
    const persMap = { cercano: 'Cercano y amigable, como un colega del sector.', profesional: 'Profesional y seguro, transmite confianza.', vendedor: 'Orientado a convertir, proactivo y persuasivo sin ser agresivo.' };
    const objMap  = { agendar: 'Tu objetivo principal es proponer una llamada de discovery de 20 minutos al final de cada conversación con interés real.', cerrar: 'Tu objetivo es cerrar el proyecto directamente por WhatsApp cuando sea posible.', cualificar: 'Tu objetivo es cualificar al lead (presupuesto, tipo de proyecto, urgencia) y pasarlo al profesional humano.' };
    return `Eres "${agentName || 'Asistente'}", el agente comercial de IA de ${biz?.name || 'el negocio'}. Especializado en vender servicios de diseño web y desarrollo freelance.\n\nPERSONALIDAD: ${persMap[personality] || persMap.cercano}\nIDIOMA: Español.\n\n${objMap[objetivo] || objMap.agendar}\n\nPRESUPUESTO MÍNIMO: ${presupuestoMin ? `No aceptes proyectos por debajo de ${presupuestoMin}€. Gestiona con tacto si el cliente menciona menos.` : ''}\n\n${extra.web_services_detail ? `SERVICIOS:\n${extra.web_services_detail}` : ''}\n${extra.prices_list ? `PRECIOS:\n${extra.prices_list}` : ''}\n${biz?.phone ? `TELÉFONO: ${biz.phone}` : ''}\n${biz?.email ? `EMAIL: ${biz.email}` : ''}\n\nNUNCA inventes información. SIEMPRE intenta recoger nombre y contacto del lead. Mensajes cortos (WhatsApp, no email).`;
  }

  async function goNext() {
    const err = getValidError();
    if (err) { setValidErr(err); return; }
    setValidErr('');
    if (step === 1) await saveFiscal();
    if (step === 2) await saveServicios();
    if (step === 3) await saveEstrategia();
    setStep(s => s + 1);
  }

  async function handleFinish() {
    const err = getValidError();
    if (err) { setValidErr(err); return; }
    setFinishing(true);
    const t0 = Date.now();

    // Save data in background (don't await here to not block animation)
    saveAgent().then(() => {
      fetch(`${API_URL}/send-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.email, subject: '¡Bienvenido a Wasapy!', template: 'welcome', data: { name: profile?.full_name || 'ahí', trialDays: 7 } })
      }).catch(() => {});
    }).catch(() => {});

    // Always wait at least 4.5s before redirecting — updateProfile last to avoid unmounting early
    setTimeout(async () => {
      await updateProfile({ onboarding_completed: true });
      onComplete();
      navigate('/app');
    }, 4500);
  }

  const steps = [
    { icon: <Rocket size={28} />,       label: 'Bienvenida',     color: '#25D366' },
    { icon: <Building size={28} />,     label: 'Datos fiscales', color: '#3b82f6' },
    { icon: <FileText size={28} />,     label: 'Servicios',      color: '#8b5cf6' },
    { icon: <Target size={28} />,       label: 'Estrategia',     color: '#f59e0b' },
    { icon: <MessageCircle size={28} />,label: 'WhatsApp',       color: '#25D366' },
    { icon: <Bot size={28} />,          label: 'Activar IA',     color: '#25D366' },
  ];

  // Show activation loading screen
  if (finishing) return <ActivationScreen />;

  return (
    <div className="onboard">
      <div className="onboard__logo">
        <span className="onboard__logo-text">wasap<span className="onboard__logo-y">y</span></span>
        <span className="onboard__logo-badge">.io</span>
      </div>

      <div className="onboard__card onboard__card--wide">
        {/* Step indicators */}
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
                    { icon: <Building size={16} />,      t: 'Datos fiscales',      d: 'Para tus presupuestos y facturas PDF' },
                    { icon: <FileText size={16} />,      t: 'Servicios y precios', d: 'Para que la IA responda con tus tarifas reales' },
                    { icon: <Target size={16} />,        t: 'Estrategia comercial',d: 'Objetivo de la IA y cliente ideal' },
                    { icon: <MessageCircle size={16} />, t: 'WhatsApp',            d: 'Conecta el número que usará la IA' },
                    { icon: <Bot size={16} />,           t: 'Activar IA',          d: 'Nombre y personalidad de tu agente' },
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
                  <div><h2>Datos de tu negocio</h2><p>Aparecerán en todos tus presupuestos y facturas PDF.</p></div>
                </div>
                <div className="ob-grid">
                  <div className="ob-field ob-field--full">
                    <label>Nombre fiscal / Razón social <span className="ob-req">*</span></label>
                    <input value={fiscalName} onChange={e => { setFiscalName(e.target.value); setValidErr(''); }} placeholder="Ej: Guti Design S.L. o Gustavo López García" autoFocus />
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
                  <div><h2>Servicios y precios</h2><p>Activa los servicios que ofreces y añade tu rango de precio. La IA usará exactamente estos datos.</p></div>
                </div>
                <div className="ob-services">
                  {SERVICIOS_WEB.map(svc => {
                    const active = serviciosActivos.includes(svc.id);
                    const Icon = svc.icon;
                    return (
                      <div key={svc.id} className={`ob-svc ${active ? 'ob-svc--on' : ''}`}>
                        <div className="ob-svc__row" onClick={() => { toggleServicio(svc.id); setValidErr(''); }}>
                          <div className="ob-svc__left">
                            <div className="ob-svc__icon"><Icon size={16} /></div>
                            <div className="ob-svc__info">
                              <span className="ob-svc__name">{svc.label}</span>
                              <span className="ob-svc__desc">{svc.desc}</span>
                            </div>
                          </div>
                          <div className={`ob-svc__toggle ${active ? 'ob-svc__toggle--on' : ''}`}><span className="ob-svc__knob" /></div>
                        </div>
                        {active && (
                          <div className="ob-svc__price">
                            <Euro size={12} />
                            <input type="text" value={servicioPrecios[svc.id]?.rango || ''} onChange={e => setPrecioRango(svc.id, e.target.value)} placeholder={`Ej: ${svc.placeholder}`} onClick={e => e.stopPropagation()} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="ob-hint" style={{ marginTop: '1rem' }}><Zap size={13} /> La IA nunca inventará precios. Usará exactamente lo que configures aquí.</div>
              </div>
            )}

            {/* ── Paso 3: Estrategia comercial ── */}
            {step === 3 && (
              <div className="ob-form">
                <div className="ob-form__head">
                  <span className="ob-form__ico" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><Target size={22} /></span>
                  <div><h2>Estrategia comercial</h2><p>Define cómo debe comportarse tu IA para maximizar conversiones.</p></div>
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
                        <div className="ob-objetivo__radio">{objetivo === o.id ? <CheckCircle size={18} /> : <Circle size={18} />}</div>
                        <div><b>{o.label}</b><span>{o.desc}</span></div>
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
                  <div><h2>Conecta tu WhatsApp</h2><p>Tu agente IA necesita un número de WhatsApp para atender a los clientes.</p></div>
                </div>
                {!waConnected && (
                  <OBWhatsAppConnector userId={user?.id} onConnected={() => setWaConnected(true)} />
                )}
                {waConnected && (
                  <div className="ob-wa-ok">
                    <CheckCircle size={36} className="ob-wa-ok__ico" />
                    <b>¡WhatsApp conectado!</b>
                    <span>Tu agente ya está activo y listo para responder.</span>
                  </div>
                )}
                {!waConnected && (
                  <div className="ob-wa-later">
                    <button type="button" className="ob-wa-later__btn" onClick={() => setStep(s => s + 1)}>
                      Conectar más tarde →
                    </button>
                    <p>Podrás hacerlo desde el dashboard en cualquier momento</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Paso 5: Activar IA ── */}
            {step === 5 && (
              <div className="ob-form">
                <div className="ob-form__head">
                  <span className="ob-form__ico" style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}><Bot size={22} /></span>
                  <div><h2>Activa tu agente IA</h2><p>Último paso. Dale nombre y personalidad a tu comercial de IA.</p></div>
                </div>
                <div className="ob-field">
                  <label>Nombre de tu agente <span className="ob-req">*</span></label>
                  <input value={agentName} onChange={e => { setAgentName(e.target.value); setValidErr(''); }} placeholder="Ej: Alex, Sofia, Asistente Guti..." autoFocus />
                  <span className="ob-field__hint">La IA se presentará: "¡Hola! Soy {agentName || 'Alex'}, el asistente de…"</span>
                </div>
                <div className="ob-field ob-field--full">
                  <label>Personalidad</label>
                  <div className="ob-personality-grid">
                    {PERSONALITIES.map(p => (
                      <button key={p.id} type="button" className={`ob-pers-card ${personality === p.id ? 'ob-pers-card--active' : ''}`} onClick={() => setPersonality(p.id)}>
                        <span className="ob-pers-card__ico"><p.icon size={22} /></span>
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

        {/* Validation error */}
        {validErr && (
          <div className="ob-valid-err">
            <AlertCircle size={13} /> {validErr}
          </div>
        )}

        {/* Navigation */}
        <div className="ob-nav">
          {step > 0 ? (
            <button className="ob-btn ob-btn--ghost" onClick={() => { setStep(s => s - 1); setValidErr(''); }}>
              <ArrowLeft size={15} /> Anterior
            </button>
          ) : <div />}

          {step < TOTAL_STEPS - 1 ? (
            <button className="ob-btn ob-btn--primary" onClick={goNext} disabled={saving}>
              {saving ? 'Guardando...' : <>Siguiente <ArrowRight size={15} /></>}
            </button>
          ) : (
            <button className="ob-btn ob-btn--success" onClick={handleFinish} disabled={saving}>
              {saving ? 'Creando...' : <><Zap size={15} /> Crear mi IA</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
