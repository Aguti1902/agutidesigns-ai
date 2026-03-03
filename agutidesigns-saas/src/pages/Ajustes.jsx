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
  { id: 'web_corp',      label: 'Web corporativa' },
  { id: 'landing',       label: 'Landing page' },
  { id: 'ecommerce',     label: 'Ecommerce' },
  { id: 'rediseno',      label: 'Rediseño web' },
  { id: 'mantenimiento', label: 'Mantenimiento mensual' },
  { id: 'seo',           label: 'SEO' },
  { id: 'copy',          label: 'Copy / Branding' },
  { id: 'apps',          label: 'Apps / Web app' },
];

const NICHOS = ['Restaurantes', 'Clínicas / Salud', 'Inmobiliarias', 'Moda / Retail', 'Consultoras', 'Educación', 'Hostelería', 'Otros'];
const ANTICIPOS = ['30%', '50%', '70%', '100%'];
const IVA_OPTS = ['0', '4', '10', '21'];
const IRPF_OPTS = ['0', '7', '15', '19'];
const DURACIONES = ['15 min', '20 min', '30 min', '45 min', '1 hora'];
const BUFFERS = ['0 min', '10 min', '15 min', '30 min'];
const SEGUIMIENTOS = ['1', '2', '3'];

/* ══ WIZARD STEPS ══ */
const STEPS = [
  { id: 'perfil',     label: 'Perfil',      icon: <Building size={15} />, desc: 'Nombre, web y logo' },
  { id: 'servicios',  label: 'Servicios',   icon: <Zap size={15} />,      desc: 'Qué ofreces' },
  { id: 'precios',    label: 'Precios',     icon: <Euro size={15} />,     desc: 'Tarifas y condiciones' },
  { id: 'agenda',     label: 'Agenda',      icon: <Calendar size={15} />, desc: 'Disponibilidad' },
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

  // Step 1 — Perfil + Fiscal
  const [nombre, setNombre] = useState(initialData.name || '');
  const [web, setWeb] = useState(initialData.website || '');
  const [logo, setLogo] = useState(initialData.logo || '');
  const [timezone, setTimezone] = useState(initialData.timezone || 'Europe/Madrid');
  const [nif, setNif] = useState(initialData.fiscal_nif || '');
  const [direccionFiscal, setDireccionFiscal] = useState(initialData.fiscal_address || '');
  const [cp, setCp] = useState(initialData.fiscal_cp || '');
  const [ciudad, setCiudad] = useState(initialData.fiscal_city || '');
  const [iban, setIban] = useState(initialData.fiscal_iban || '');

  // Step 2 — Servicios
  const [servicios, setServicios] = useState(() => {
    try { return Array.isArray(initialData.servicios_toggles) ? initialData.servicios_toggles : JSON.parse(initialData.servicios_toggles || '[]'); } catch { return []; }
  });
  const [nicho, setNicho] = useState(initialData.nicho || '');
  const [descripcionServicios, setDescripcionServicios] = useState(initialData.web_services_detail || '');

  // Step 3 — Precios + IVA/IRPF
  // Rangos de precio dinámicos por servicio (clave = service ID)
  const [preciosRangos, setPreciosRangos] = useState(() => {
    // Primero cargamos rango_servicios (nuevo formato)
    let base = {};
    try { base = initialData.rango_servicios ? JSON.parse(initialData.rango_servicios) : {}; } catch {}
    // Migramos campos legacy si el nuevo objeto no los tiene aún
    if (!base.web_corp  && initialData.rango_web)       base.web_corp     = initialData.rango_web;
    if (!base.landing   && initialData.rango_landing)   base.landing      = initialData.rango_landing;
    if (!base.ecommerce && initialData.rango_ecommerce) base.ecommerce    = initialData.rango_ecommerce;
    return base;
  });
  const [anticipo, setAnticipo] = useState(initialData.anticipo || '50%');
  const [ivaDefault, setIvaDefault] = useState(initialData.iva_default || '21');
  const [irpfDefault, setIrpfDefault] = useState(initialData.irpf_default || '0');
  const [precioMensual, setPrecioMensual] = useState(initialData.precio_mensual || '');
  const [cuandoMensual, setCuandoMensual] = useState(initialData.cuando_mensual || 'si_pregunta');
  const [plazosServicios, setPlazosServicios] = useState(() => {
    try {
      const v = initialData.plazos_servicios;
      return (v && typeof v === 'object') ? v : JSON.parse(v || '{}');
    } catch { return {}; }
  });

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
      // Nuevo formato dinámico
      rango_servicios: JSON.stringify(preciosRangos),
      // Campos legacy para retrocompatibilidad con PromptBuilder y exports
      rango_web:       preciosRangos.web_corp     || '',
      rango_landing:   preciosRangos.landing      || '',
      rango_ecommerce: preciosRangos.ecommerce    || '',
      anticipo,
      precio_mensual: precioMensual, cuando_mensual: cuandoMensual,
      plazos_servicios: JSON.stringify(plazosServicios),
      iva_default: ivaDefault, irpf_default: irpfDefault,
      fiscal_nif: nif, fiscal_address: direccionFiscal, fiscal_cp: cp, fiscal_city: ciudad, fiscal_iban: iban,
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
    !!(Object.values(preciosRangos).some(v => !!v) || precioMensual),
    !!horariosDisp,
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

        {/* ── Paso 1: Perfil + Fiscal ── */}
        {step === 0 && (
          <div className="wz-form">
            <div className="wz-form__head"><h3>Perfil y datos fiscales</h3><p>Aparecerán en tus presupuestos y facturas PDF.</p></div>
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

            <div className="wz-section-divider"><span>Datos fiscales (para PDFs)</span></div>
            <div className="form-grid">
              <div className="form-field">
                <label>NIF / CIF *</label>
                <input value={nif} onChange={e => setNif(e.target.value)} placeholder="12345678A o B12345678" />
                <span className="form-field__hint">Aparece en todos los presupuestos y facturas</span>
              </div>
              <div className="form-field">
                <label>IBAN (datos de pago)</label>
                <input value={iban} onChange={e => setIban(e.target.value)} placeholder="ES00 0000 0000 0000 0000 0000" />
              </div>
              <div className="form-field form-field--full">
                <label>Dirección fiscal</label>
                <input value={direccionFiscal} onChange={e => setDireccionFiscal(e.target.value)} placeholder="Calle Mayor 12, 2ºA" />
              </div>
              <div className="form-field">
                <label>Código postal</label>
                <input value={cp} onChange={e => setCp(e.target.value)} placeholder="28001" />
              </div>
              <div className="form-field">
                <label>Ciudad y provincia</label>
                <input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Madrid, Madrid" />
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

            {/* Anticipo */}
            <div className="form-grid">
              <div className="form-field form-field--full">
                <label>Anticipo al inicio del proyecto</label>
                <div className="chips">
                  {ANTICIPOS.map(a => <button key={a} type="button" className={`chip ${anticipo === a ? 'chip--active' : ''}`} onClick={() => setAnticipo(a)}>{a}</button>)}
                </div>
              </div>
            </div>

            {/* Rangos de precio dinámicos por servicio */}
            <div className="wz-section-divider"><span>Rangos de precio por servicio</span></div>
            {servicios.filter(id => id !== 'mantenimiento').length === 0 ? (
              <div style={{ padding: '1rem', background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: 'var(--radius-lg)', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                Activa primero los servicios en el paso <strong>Servicios</strong> para configurar sus precios.
              </div>
            ) : (
              <div className="form-grid">
                {SERVICIOS_OPS.filter(s => servicios.includes(s.id) && s.id !== 'mantenimiento').map(s => (
                  <div key={s.id} className="form-field">
                    <label>{s.label}</label>
                    <input
                      value={preciosRangos[s.id] || ''}
                      onChange={e => setPreciosRangos(p => ({ ...p, [s.id]: e.target.value }))}
                      placeholder="Ej: 800€ – 2.500€"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="wz-section-divider"><span>Mensualidad / Mantenimiento</span></div>
            <div className="form-grid">
              <div className="form-field">
                <label><Euro size={13} /> Precio mensual de mantenimiento (€/mes)</label>
                <input type="number" value={precioMensual} onChange={e => setPrecioMensual(e.target.value)} placeholder="Ej: 79" />
                <span className="form-field__hint">Cuota mensual que cobras por mantener la web activa</span>
              </div>
              <div className="form-field">
                <label>¿Cuándo lo menciona la IA?</label>
                <div className="chips" style={{ flexWrap: 'wrap' }}>
                  {[
                    { v: 'siempre', l: 'Siempre que sea relevante' },
                    { v: 'si_pregunta', l: 'Solo si el cliente pregunta' },
                    { v: 'proactivo', l: 'Proactivamente al hablar de precios' },
                    { v: 'nunca', l: 'No mencionar' },
                  ].map(({ v, l }) => (
                    <button key={v} type="button" className={`chip ${cuandoMensual === v ? 'chip--active' : ''}`} onClick={() => setCuandoMensual(v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="wz-section-divider"><span>Plazos de entrega por servicio</span></div>
            {servicios.length === 0 ? (
              <div style={{ padding: '1rem', background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)', borderRadius: 'var(--radius-lg)', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                Selecciona primero los servicios que ofreces en el paso <strong>Servicios</strong>.
              </div>
            ) : (
              <div className="form-grid">
                {SERVICIOS_OPS.filter(s => servicios.includes(s.id)).map(s => (
                  <div key={s.id} className="form-field">
                    <label><Clock size={13} /> {s.label}</label>
                    <input
                      value={plazosServicios[s.id] || ''}
                      onChange={e => setPlazosServicios(p => ({ ...p, [s.id]: e.target.value }))}
                      placeholder="Ej: 2–3 semanas"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="wz-section-divider"><span>Impuestos por defecto en presupuestos</span></div>
            <div className="form-grid">
              <div className="form-field">
                <label>IVA por defecto (%)</label>
                <div className="chips">
                  {IVA_OPTS.map(v => (
                    <button key={v} type="button" className={`chip ${ivaDefault === v ? 'chip--active' : ''}`} onClick={() => setIvaDefault(v)}>
                      {v}%{v === '21' ? ' (general)' : v === '10' ? ' (reducido)' : v === '4' ? ' (superreducido)' : ' (exento)'}
                    </button>
                  ))}
                </div>
                <span className="form-field__hint">Se aplicará automáticamente al crear nuevos presupuestos</span>
              </div>
              <div className="form-field">
                <label>IRPF por defecto (retención %)</label>
                <div className="chips">
                  {IRPF_OPTS.map(v => (
                    <button key={v} type="button" className={`chip ${irpfDefault === v ? 'chip--active' : ''}`} onClick={() => setIrpfDefault(v)}>
                      {v}%{v === '15' ? ' (general)' : v === '7' ? ' (nuevo autónomo)' : v === '0' ? ' (no aplica)' : ''}
                    </button>
                  ))}
                </div>
                <span className="form-field__hint">El cliente retiene este % y lo ingresa a Hacienda. Reduce lo que cobras.</span>
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

        {/* ── Paso 5: Canales ── */}
        {step === 4 && (
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
  const [bizLoaded, setBizLoaded] = useState(false);

  useEffect(() => { if (user?.id) loadBiz(); }, [user?.id]);

  async function loadBiz() {
    setLoading(true);
    const { data } = await supabase.from('businesses').select('*').eq('user_id', user.id).single();
    if (data) {
      const extra = (() => { try { return data.extra_context ? JSON.parse(data.extra_context) : {}; } catch { return {}; } })();

      // Migrar precios del onboarding (servicios_precios) → campos rango_* si aún no existen
      const sp = (() => { try { return extra.servicios_precios ? JSON.parse(extra.servicios_precios) : {}; } catch { return {}; } })();
      if (sp && Object.keys(sp).length > 0) {
        extra.rango_web      = extra.rango_web      || sp.web_corp?.rango      || sp.web_info?.rango      || '';
        extra.rango_landing  = extra.rango_landing  || sp.landing?.rango       || '';
        extra.rango_ecommerce= extra.rango_ecommerce|| sp.ecommerce?.rango     || '';
      }

      // Migrar web_info → web_corp en servicios_toggles si viene de versión antigua
      if (extra.servicios_toggles) {
        try {
          const toggles = JSON.parse(extra.servicios_toggles);
          extra.servicios_toggles = JSON.stringify(toggles.map((id) => id === 'web_info' ? 'web_corp' : id));
        } catch {}
      }

      setBizData({ ...data, ...extra });
    }
    setBizLoaded(true);
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
    // Actualizar estado local sin re-fetch para evitar que WizardNegocio se desmonte y resetee el paso actual
    setBizData(prev => ({ ...prev, name, website, email, phone, ...extra }));
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
        !bizLoaded ? (
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
