import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building, Bot, CreditCard, Check, ChevronRight, ArrowLeft, ArrowRight,
  Upload, ImageIcon, X, Zap, Globe, Euro, Clock, Calendar, MessageCircle,
  ToggleLeft, ToggleRight, Shield, Phone, Mail, Loader2, Save, CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const PromptBuilder = lazy(() => import('./PromptBuilder'));
const Billing = lazy(() => import('./Billing'));

/* ══ SERVICIOS TOGGLES ══ */
const SERVICIOS_OPS = [
  { id: 'web_info', label: 'Web informativa' },
  { id: 'landing', label: 'Landing page' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'mantenimiento', label: 'Mantenimiento mensual' },
  { id: 'seo', label: 'SEO básico' },
  { id: 'copy', label: 'Copy / Branding' },
];

const NICHOS = ['Restaurantes', 'Clínicas / Salud', 'Inmobiliarias', 'Moda / Retail', 'Consultoras', 'Educación', 'Hostelería', 'Otros'];
const ANTICIPOS = ['30%', '50%', '70%', '100%'];
const DURACIONES = ['15 min', '20 min', '30 min', '45 min', '1 hora'];
const BUFFERS = ['0 min', '10 min', '15 min', '30 min'];
const SEGUIMIENTOS = ['1', '2', '3'];

/* ══ WIZARD STEPS ══ */
const STEPS = [
  { id: 'perfil',     label: 'Perfil',      icon: <Building size={15} />, desc: 'Nombre, web y logo' },
  { id: 'servicios',  label: 'Servicios',   icon: <Zap size={15} />,      desc: 'Qué ofreces' },
  { id: 'precios',    label: 'Precios',     icon: <Euro size={15} />,     desc: 'Tarifas y condiciones' },
  { id: 'agenda',     label: 'Agenda',      icon: <Calendar size={15} />, desc: 'Disponibilidad' },
  { id: 'politica',   label: 'Política',    icon: <Shield size={15} />,   desc: 'Reglas comerciales' },
  { id: 'canales',    label: 'Canales',     icon: <MessageCircle size={15} />, desc: 'WhatsApp y contacto' },
];

/* ── Logo Upload mini ── */
function LogoUpload({ value, onChange }) {
  const inputRef = useRef();
  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        onChange(canvas.toDataURL('image/png', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className="logo-upload">
      {value ? (
        <div className="logo-upload__preview">
          <img src={value} alt="Logo" />
          <button type="button" className="logo-upload__remove" onClick={() => onChange('')}><X size={14} /></button>
        </div>
      ) : (
        <button type="button" className="logo-upload__btn" onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          <ImageIcon size={22} /><span>Subir logo</span><small>PNG/JPG · máx 2MB</small>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      {value && <button type="button" className="logo-upload__change" onClick={() => inputRef.current?.click()}><Upload size={12} /> Cambiar</button>}
    </div>
  );
}

/* ══ WIZARD MI NEGOCIO ══ */
function WizardNegocio({ initialData, onSave }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Step 1 — Perfil
  const [nombre, setNombre] = useState(initialData.name || '');
  const [web, setWeb] = useState(initialData.website || '');
  const [logo, setLogo] = useState(initialData.logo || '');
  const [timezone, setTimezone] = useState(initialData.timezone || 'Europe/Madrid');

  // Step 2 — Servicios
  const [servicios, setServicios] = useState(() => {
    try { return Array.isArray(initialData.servicios_toggles) ? initialData.servicios_toggles : JSON.parse(initialData.servicios_toggles || '[]'); } catch { return []; }
  });
  const [nicho, setNicho] = useState(initialData.nicho || '');
  const [descripcionServicios, setDescripcionServicios] = useState(initialData.web_services_detail || '');

  // Step 3 — Precios
  const [precioMin, setPrecioMin] = useState(initialData.precio_minimo || '');
  const [rangoWeb, setRangoWeb] = useState(initialData.rango_web || '');
  const [rangoLanding, setRangoLanding] = useState(initialData.rango_landing || '');
  const [rangoEcommerce, setRangoEcommerce] = useState(initialData.rango_ecommerce || '');
  const [anticipo, setAnticipo] = useState(initialData.anticipo || '50%');
  const [plazoEntrega, setPlazoEntrega] = useState(initialData.delivery_time || '');

  // Step 4 — Agenda
  const [duracionCall, setDuracionCall] = useState(initialData.duracion_call || '30 min');
  const [horariosDisp, setHorariosDisp] = useState(initialData.schedule_weekdays || 'Lunes a Viernes, 9:00 – 18:00');
  const [buffer, setBuffer] = useState(initialData.buffer_reuniones || '15 min');

  // Step 5 — Política
  const [cerrarSinLlamada, setCerrarSinLlamada] = useState(initialData.cerrar_sin_llamada === 'si');
  const [puedeDescuento, setPuedeDescuento] = useState(initialData.puede_descuento === 'si');
  const [maxDescuento, setMaxDescuento] = useState(initialData.max_descuento || '10');
  const [numSeguimientos, setNumSeguimientos] = useState(initialData.num_seguimientos || '2');
  const [umbralHumano, setUmbralHumano] = useState(initialData.umbral_humano || '10');

  // Step 6 — Canales
  const [emailContacto, setEmailContacto] = useState(initialData.email || '');
  const [telefono, setTelefono] = useState(initialData.phone || '');
  const [webForm, setWebForm] = useState(initialData.web_form_url || '');

  const toggleServicio = (id) => setServicios(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  async function handleSave() {
    setSaving(true);
    const extra = {
      logo, timezone, servicios_toggles: JSON.stringify(servicios), nicho,
      web_services_detail: descripcionServicios,
      precio_minimo: precioMin, rango_web: rangoWeb, rango_landing: rangoLanding, rango_ecommerce: rangoEcommerce,
      anticipo, delivery_time: plazoEntrega,
      duracion_call: duracionCall, schedule_weekdays: horariosDisp, buffer_reuniones: buffer,
      cerrar_sin_llamada: cerrarSinLlamada ? 'si' : 'no',
      puede_descuento: puedeDescuento ? 'si' : 'no', max_descuento: maxDescuento,
      num_seguimientos: numSeguimientos, umbral_humano: umbralHumano,
      web_form_url: webForm,
    };
    await onSave({ name: nombre, website: web, email: emailContacto, phone: telefono, extra });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  }

  const isLast = step === STEPS.length - 1;
  const completedSteps = [
    !!nombre,
    servicios.length > 0,
    !!precioMin,
    !!horariosDisp,
    true,
    !!(emailContacto || telefono),
  ];
  const totalDone = completedSteps.filter(Boolean).length;
  const pct = Math.round((totalDone / STEPS.length) * 100);

  return (
    <div className="wizard">
      {/* Steps nav */}
      <div className="wizard__steps">
        {STEPS.map((s, i) => (
          <button key={s.id} type="button" className={`wizard__step ${i === step ? 'wizard__step--active' : ''} ${completedSteps[i] ? 'wizard__step--done' : ''}`} onClick={() => setStep(i)}>
            <span className="wizard__step-dot">{completedSteps[i] ? <Check size={10} /> : <span>{i + 1}</span>}</span>
            <div className="wizard__step-info">
              <b>{s.label}</b>
              <small>{s.desc}</small>
            </div>
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="wizard__prog">
        <div className="wizard__prog-bar">
          <div className="wizard__prog-fill" style={{ width: `${pct}%` }} />
        </div>
        <span>{totalDone}/{STEPS.length} pasos completados · {pct}%</span>
      </div>

      {/* Content */}
      <div className="wizard__body">

        {/* ── Paso 1: Perfil ── */}
        {step === 0 && (
          <div className="wz-form">
            <div className="wz-form__head"><h3>Perfil y marca</h3><p>Cómo apareces tú y tu estudio.</p></div>
            <div className="form-grid">
              <div className="form-field form-field--full">
                <label>Nombre de tu estudio / freelance *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Guti Design, Studio Pixel, Ana López Web..." autoFocus />
              </div>
              <div className="form-field form-field--full">
                <label>Tu web / portfolio</label>
                <input value={web} onChange={e => setWeb(e.target.value)} placeholder="https://gutidiseno.com" />
              </div>
              <div className="form-field">
                <label>Zona horaria</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ width: '100%', padding: '0.65rem 0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  <option value="Europe/Madrid">Europa/Madrid (UTC+1)</option>
                  <option value="America/Mexico_City">México (UTC-6)</option>
                  <option value="America/Argentina/Buenos_Aires">Argentina (UTC-3)</option>
                  <option value="America/Bogota">Colombia (UTC-5)</option>
                  <option value="Europe/London">Londres (UTC)</option>
                </select>
              </div>
              <div className="form-field form-field--full">
                <label>Logo del negocio (opcional)</label>
                <LogoUpload value={logo} onChange={setLogo} />
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 2: Servicios ── */}
        {step === 1 && (
          <div className="wz-form">
            <div className="wz-form__head"><h3>Servicios que ofreces</h3><p>La IA solo hablará de estos servicios. Selecciona todos los que apliquen.</p></div>
            <div className="wz-toggles">
              {SERVICIOS_OPS.map(s => (
                <div key={s.id} className={`wz-toggle-row ${servicios.includes(s.id) ? 'wz-toggle-row--on' : ''}`} onClick={() => toggleServicio(s.id)}>
                  <span>{s.label}</span>
                  <div className={`ai-toggle ${servicios.includes(s.id) ? 'ai-toggle--on' : ''}`} onClick={e => { e.stopPropagation(); toggleServicio(s.id); }}>
                    <span className="ai-toggle__knob" />
                  </div>
                </div>
              ))}
            </div>
            <div className="form-field form-field--full" style={{ marginTop: '1.25rem' }}>
              <label>Nicho en el que más trabajas</label>
              <div className="chips" style={{ flexWrap: 'wrap' }}>
                {NICHOS.map(n => <button key={n} type="button" className={`chip ${nicho === n ? 'chip--active' : ''}`} onClick={() => setNicho(n)}>{n}</button>)}
              </div>
            </div>
            <div className="form-field form-field--full" style={{ marginTop: '1.25rem' }}>
              <label>Descripción de servicios para la IA (opcional, mejora mucho las respuestas)</label>
              <textarea value={descripcionServicios} onChange={e => setDescripcionServicios(e.target.value)} rows={4} placeholder="Ej: Web corporativa — WordPress, diseño responsivo, SEO básico. Desde 800€. Entrega 3-4 semanas. Landing page — desde 500€..." />
            </div>
          </div>
        )}

        {/* ── Paso 3: Precios ── */}
        {step === 2 && (
          <div className="wz-form">
            <div className="wz-form__head"><h3>Precios y condiciones</h3><p>La IA usará estos datos para responder "¿cuánto cuesta?" con tus tarifas reales.</p></div>
            <div className="form-grid">
              <div className="form-field">
                <label>Precio mínimo de proyecto (€) *</label>
                <input type="number" value={precioMin} onChange={e => setPrecioMin(e.target.value)} placeholder="400" />
                <span className="form-field__hint">Si alguien menciona menos, la IA lo gestiona con tacto</span>
              </div>
              <div className="form-field">
                <label>Anticipo al inicio del proyecto</label>
                <div className="chips">
                  {ANTICIPOS.map(a => <button key={a} type="button" className={`chip ${anticipo === a ? 'chip--active' : ''}`} onClick={() => setAnticipo(a)}>{a}</button>)}
                </div>
              </div>
              <div className="form-field">
                <label>Rango web informativa</label>
                <input value={rangoWeb} onChange={e => setRangoWeb(e.target.value)} placeholder="Ej: 800€ – 2.500€" />
              </div>
              <div className="form-field">
                <label>Rango landing page</label>
                <input value={rangoLanding} onChange={e => setRangoLanding(e.target.value)} placeholder="Ej: 500€ – 1.200€" />
              </div>
              <div className="form-field">
                <label>Rango ecommerce</label>
                <input value={rangoEcommerce} onChange={e => setRangoEcommerce(e.target.value)} placeholder="Ej: 1.500€ – 5.000€" />
              </div>
              <div className="form-field">
                <label>Plazo de entrega típico</label>
                <input value={plazoEntrega} onChange={e => setPlazoEntrega(e.target.value)} placeholder="Ej: Web: 3-4 semanas · Landing: 1-2 semanas" />
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 4: Agenda ── */}
        {step === 3 && (
          <div className="wz-form">
            <div className="wz-form__head"><h3>Agenda y disponibilidad</h3><p>La IA usará estos datos para proponer citas reales en tu calendario.</p></div>
            <div className="form-grid">
              <div className="form-field">
                <label>Duración de la discovery call</label>
                <div className="chips">
                  {DURACIONES.map(d => <button key={d} type="button" className={`chip ${duracionCall === d ? 'chip--active' : ''}`} onClick={() => setDuracionCall(d)}>{d}</button>)}
                </div>
              </div>
              <div className="form-field">
                <label>Buffer entre reuniones</label>
                <div className="chips">
                  {BUFFERS.map(b => <button key={b} type="button" className={`chip ${buffer === b ? 'chip--active' : ''}`} onClick={() => setBuffer(b)}>{b}</button>)}
                </div>
              </div>
              <div className="form-field form-field--full">
                <label>Horarios disponibles para reuniones</label>
                <input value={horariosDisp} onChange={e => setHorariosDisp(e.target.value)} placeholder="Ej: Lunes a Viernes, 9:00 – 18:00" />
              </div>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 'var(--radius-lg)', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#25D366' }}>Conectar calendario →</strong> Ve a <strong>Citas</strong> en el menú para conectar Google Calendar o Calendly y que la IA proponga horarios reales en tiempo real.
            </div>
          </div>
        )}

        {/* ── Paso 5: Política ── */}
        {step === 4 && (
          <div className="wz-form">
            <div className="wz-form__head"><h3>Política comercial</h3><p>Define cuándo y cómo actúa la IA en el proceso de venta.</p></div>
            <div className="wz-toggles">
              <div className={`wz-toggle-row ${cerrarSinLlamada ? 'wz-toggle-row--on' : ''}`} onClick={() => setCerrarSinLlamada(v => !v)}>
                <div>
                  <b>¿Puede cerrar proyectos sin llamada?</b>
                  <span>La IA intentará cerrar directamente por WhatsApp sin necesidad de discovery call</span>
                </div>
                <div className={`ai-toggle ${cerrarSinLlamada ? 'ai-toggle--on' : ''}`} onClick={e => { e.stopPropagation(); setCerrarSinLlamada(v => !v); }}>
                  <span className="ai-toggle__knob" />
                </div>
              </div>
              <div className={`wz-toggle-row ${puedeDescuento ? 'wz-toggle-row--on' : ''}`} onClick={() => setPuedeDescuento(v => !v)}>
                <div>
                  <b>¿Puede ofrecer descuento?</b>
                  <span>Autoriza a la IA a negociar hasta un porcentaje máximo</span>
                </div>
                <div className={`ai-toggle ${puedeDescuento ? 'ai-toggle--on' : ''}`} onClick={e => { e.stopPropagation(); setPuedeDescuento(v => !v); }}>
                  <span className="ai-toggle__knob" />
                </div>
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: '1.25rem' }}>
              {puedeDescuento && (
                <div className="form-field">
                  <label>Descuento máximo (%)</label>
                  <input type="number" min="1" max="50" value={maxDescuento} onChange={e => setMaxDescuento(e.target.value)} placeholder="10" />
                </div>
              )}
              <div className="form-field">
                <label>Número de seguimientos si no responde</label>
                <div className="chips">
                  {SEGUIMIENTOS.map(n => <button key={n} type="button" className={`chip ${numSeguimientos === n ? 'chip--active' : ''}`} onClick={() => setNumSeguimientos(n)}>{n} seguimiento{n !== '1' ? 's' : ''}</button>)}
                </div>
              </div>
              <div className="form-field">
                <label>Pasar a humano si el cliente no decide después de</label>
                <div className="chips">
                  {['5 mensajes', '8 mensajes', '10 mensajes', '15 mensajes'].map(u => (
                    <button key={u} type="button" className={`chip ${umbralHumano === u.split(' ')[0] ? 'chip--active' : ''}`} onClick={() => setUmbralHumano(u.split(' ')[0])}>{u}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 6: Canales ── */}
        {step === 5 && (
          <div className="wz-form">
            <div className="wz-form__head"><h3>Conectar canales</h3><p>Cómo te contactan los clientes y cómo los atiende la IA.</p></div>
            <div className="form-grid">
              <div className="form-field form-field--full">
                <label><MessageCircle size={13} /> WhatsApp</label>
                <div style={{ padding: '0.85rem', background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Para activar la IA en WhatsApp ve a la sección <strong>WhatsApp</strong> del menú.</span>
                  <a href="/app/whatsapp" className="btn btn--primary btn--sm"><Zap size={12} /> Conectar</a>
                </div>
              </div>
              <div className="form-field">
                <label><Mail size={13} /> Email de contacto</label>
                <input type="email" value={emailContacto} onChange={e => setEmailContacto(e.target.value)} placeholder="hola@gutidiseno.com" />
              </div>
              <div className="form-field">
                <label><Phone size={13} /> Teléfono / WhatsApp</label>
                <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+34 600 000 000" />
              </div>
              <div className="form-field form-field--full">
                <label><Globe size={13} /> URL formulario de contacto web (opcional)</label>
                <input value={webForm} onChange={e => setWebForm(e.target.value)} placeholder="https://gutidiseno.com/contacto" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard__nav">
        <button type="button" className="btn btn--outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft size={14} /> Anterior
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn--outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="spin" /> : saved ? <><CheckCircle size={14} /> Guardado</> : <><Save size={14} /> Guardar</>}
          </button>
          {!isLast ? (
            <button type="button" className="btn btn--primary" onClick={() => { handleSave(); setStep(s => s + 1); }}>
              Siguiente <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : <><CheckCircle size={14} /> Guardar ajustes</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ PÁGINA AJUSTES (tabs) ══ */
export default function Ajustes() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'negocio';
  const setTab = (t) => setSearchParams({ tab: t });

  const [bizData, setBizData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadBiz(); }, [user]);

  async function loadBiz() {
    setLoading(true);
    const { data } = await supabase.from('businesses').select('*').eq('user_id', user.id).single();
    if (data) {
      const extra = (() => { try { return data.extra_context ? JSON.parse(data.extra_context) : {}; } catch { return {}; } })();
      setBizData({ ...data, ...extra });
    }
    setLoading(false);
  }

  async function handleSaveBiz({ name, website, email, phone, extra }) {
    const { data: existing } = await supabase.from('businesses').select('id, extra_context').eq('user_id', user.id).maybeSingle();
    const prevExtra = (() => { try { return existing?.extra_context ? JSON.parse(existing.extra_context) : {}; } catch { return {}; } })();
    const merged = { ...prevExtra, ...extra };
    const payload = { name, website, email, phone, extra_context: JSON.stringify(merged), updated_at: new Date().toISOString() };
    if (existing) {
      await supabase.from('businesses').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('businesses').insert({ user_id: user.id, ...payload });
    }
    loadBiz();
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1>Ajustes</h1>
        <p>Configura tu negocio, la IA y tu suscripción.</p>
      </div>

      {/* Tabs */}
      <div className="aj-tabs">
        <button className={`aj-tab ${tab === 'negocio' ? 'aj-tab--on' : ''}`} onClick={() => setTab('negocio')}>
          <Building size={15} /> Mi Negocio
        </button>
        <button className={`aj-tab ${tab === 'ia' ? 'aj-tab--on' : ''}`} onClick={() => setTab('ia')}>
          <Bot size={15} /> Configuración IA
        </button>
        <button className={`aj-tab ${tab === 'billing' ? 'aj-tab--on' : ''}`} onClick={() => setTab('billing')}>
          <CreditCard size={15} /> Suscripción
        </button>
      </div>

      {/* Tab: Mi Negocio */}
      {tab === 'negocio' && (
        loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>
        ) : (
          <WizardNegocio initialData={bizData} onSave={handleSaveBiz} />
        )
      )}

      {/* Tab: Config IA */}
      {tab === 'ia' && (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" /></div>}>
          <PromptBuilder />
        </Suspense>
      )}

      {/* Tab: Suscripción */}
      {tab === 'billing' && (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" /></div>}>
          <Billing />
        </Suspense>
      )}
    </div>
  );
}
