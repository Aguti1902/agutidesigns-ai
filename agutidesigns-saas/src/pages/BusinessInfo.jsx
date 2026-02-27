import { useState, useEffect, useRef } from 'react';
import { Building, Save, Check, ChevronDown, ChevronUp, Upload, X, ImageIcon, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const SECTIONS = [
  {
    id: 'fiscal',
    title: 'Datos fiscales y logo',
    desc: 'Aparecerán en todos tus presupuestos y facturas PDF. NIF/CIF, razón social, dirección...',
    fields: [
      { key: 'fiscal_name', label: 'Razón social / Nombre fiscal', placeholder: 'Ej: Gustavo López García o Guti Design S.L.' },
      { key: 'fiscal_nif', label: 'NIF / CIF', placeholder: 'Ej: 12345678A o B-12345678' },
      { key: 'fiscal_address', label: 'Dirección fiscal', placeholder: 'Ej: Calle Mayor 12, 2ºA' },
      { key: 'fiscal_cp', label: 'Código postal', placeholder: 'Ej: 08001' },
      { key: 'fiscal_city', label: 'Ciudad y provincia', placeholder: 'Ej: Barcelona, Barcelona' },
      { key: 'fiscal_country', label: 'País', placeholder: 'España' },
      { key: 'fiscal_iban', label: 'IBAN bancario (opcional, aparece en facturas)', placeholder: 'ES12 1234 5678 9012 3456 7890' },
      { key: 'logo', label: 'Logo del negocio', type: 'logo' },
    ],
  },
  {
    id: 'pagos',
    title: 'Métodos de pago y condiciones',
    desc: 'Qué métodos aceptas, IBAN, condiciones de pago y plazos. Aparece en todos los presupuestos y facturas PDF.',
    fields: [
      { key: 'payment_methods_list', label: 'Métodos de pago que aceptas', type: 'payment_methods' },
      { key: 'fiscal_iban', label: 'IBAN para transferencias bancarias', placeholder: 'ES12 1234 5678 9012 3456 7890' },
      { key: 'payment_bizum', label: 'Número Bizum', placeholder: 'Ej: +34 600 000 000' },
      { key: 'payment_paypal', label: 'Email de PayPal', placeholder: 'pagos@gutidiseno.com' },
      { key: 'payment_stripe_link', label: 'Link de pago Stripe / pasarela', placeholder: 'https://buy.stripe.com/...' },
      { key: 'payment_terms', label: 'Condiciones de pago', type: 'payment_terms' },
      { key: 'payment_custom_terms', label: 'Condiciones personalizadas (texto libre, aparecerá en PDFs)', placeholder: 'Ej: 50% al inicio del proyecto y 50% en la entrega final. En proyectos de mantenimiento, pago mensual los primeros 5 días del mes.', textarea: true, rows: 3 },
      { key: 'payment_notes', label: 'Notas adicionales de pago (para la IA)', placeholder: 'Ej: No aceptamos pagos en efectivo para proyectos superiores a 1.000€. Los presupuestos tienen validez de 30 días.', textarea: true, rows: 2 },
    ],
  },
  {
    id: 'webpage',
    title: 'Tu página web',
    desc: 'La IA lee esta info directamente para responder preguntas sobre tus servicios, portfolio y valores.',
    fields: [
      { key: 'website', label: 'URL de tu web', placeholder: 'https://gutidiseno.com' },
      { key: 'web_description', label: 'Descripción completa de tu web (para la IA)', placeholder: 'Escribe aquí el texto principal de tu web: quién eres, qué haces, a quién ayudas y por qué elegiirte. La IA usará esto para responder a los clientes con tu propia voz.\n\nEj: Soy Guti, diseñador web freelance con 7 años de experiencia. Creo webs profesionales para negocios locales: restaurantes, clínicas, tiendas y consultorías. Me especializo en WordPress y Webflow. Cada proyecto tiene precio cerrado y entrego en 3-4 semanas.', textarea: true, rows: 8 },
      { key: 'web_services_detail', label: 'Servicios detallados de tu web', placeholder: 'Copia aquí el contenido de servicios de tu web. La IA lo usará para responder exactamente lo que ofreces.\n\nEj:\nWEB CORPORATIVA — Diseño + desarrollo WordPress. Desde 800€. Incluye: diseño responsive, formulario de contacto, SEO básico, 1 año de soporte.\nLANDING PAGE — Página de captación de leads. Desde 500€. Incluye: diseño, formulario, integración email marketing.\nTIENDA ONLINE — WooCommerce o Shopify. Desde 1.500€...', textarea: true, rows: 10 },
      { key: 'web_portfolio', label: 'Portfolio / trabajos realizados', placeholder: 'Describe tus proyectos más relevantes. La IA los usará como ejemplos cuando los clientes pidan ver trabajos.\n\nEj:\n• Bar Mediterráneo (Barcelona) — Web corporativa + carta online + reservas. WordPress.\n• Clínica Salud+ (Madrid) — Landing page + formulario de citas. Aumentó un 40% las consultas.\n• Tienda ModaMujer — Ecommerce WooCommerce con 200+ productos.', textarea: true, rows: 6 },
      { key: 'web_testimonials', label: 'Testimonios / reseñas de clientes', placeholder: 'Añade testimonios reales. La IA los usará para generar confianza.\n\nEj:\n★★★★★ "Guti nos hizo la web en 3 semanas, exactamente lo que necesitábamos. Muy profesional y atento." — María López, Restaurante El Rincón.\n★★★★★ "El ecommerce funciona perfecto y ya estamos vendiendo online. Recomendadísimo." — Carlos Ruiz, Tienda Deportes.', textarea: true, rows: 5 },
      { key: 'web_faqs', label: 'FAQs de tu web (preguntas frecuentes)', placeholder: '¿Cuánto cuesta una web?\nDepende del tipo. Web corporativa desde 800€, landing desde 500€. Pide presupuesto sin compromiso.\n\n¿Cuánto tardas?\nWeb corporativa: 3-4 semanas. Landing: 1-2 semanas. Ecommerce: 5-8 semanas.\n\n¿Incluye hosting?\nNo está incluido, pero te asesoro y ayudo a contratarlo (desde 60€/año).\n\n¿Puedo modificar la web yo solo?\nSí, WordPress es muy intuitivo. Incluye formación para que seas autónomo.', textarea: true, rows: 8 },
      { key: 'web_about', label: 'Sobre mí / Equipo (sección "Quién soy")', placeholder: 'Texto sobre ti o tu equipo tal como aparece en tu web.\n\nEj: Soy Gustavo López (Guti), diseñador web freelance desde 2017. He trabajado con más de 80 negocios en España. Me licencié en Diseño Gráfico y me formé en desarrollo web. Trabajo de forma 100% remota pero con trato muy personal y cercano.' , textarea: true, rows: 4 },
    ],
  },
  {
    id: 'general',
    title: 'Tu estudio / freelance',
    desc: 'Cómo se presenta tu negocio de diseño web. La IA usará esto para identificarse.',
    fields: [
      { key: 'name', label: 'Nombre de tu estudio o marca freelance', placeholder: 'Ej: Guti Design, Studio Pixel, María López Diseño Web', required: true },
      { key: 'sector', label: 'Especialidad principal', placeholder: 'Ej: Diseño web freelance, UX/UI, Desarrollo web WordPress' },
      { key: 'slogan', label: 'Tu propuesta de valor', placeholder: 'Ej: Webs que convierten visitas en clientes' },
      { key: 'description', label: 'Descripción para la IA', placeholder: 'Cuéntale a la IA quién eres, qué haces y qué te diferencia de otros diseñadores...\n\nEj: Soy diseñador web freelance con 7 años de experiencia especializado en negocios locales. Creo webs con WordPress y Webflow. Me diferencio por mi atención personalizada y porque entrego proyectos en 3-4 semanas.', textarea: true },
    ],
  },
  {
    id: 'contact',
    title: 'Contacto y portfolio',
    desc: 'Cómo pueden contactarte y ver tu trabajo.',
    fields: [
      { key: 'phone', label: 'Teléfono / WhatsApp', placeholder: '+34 600 000 000' },
      { key: 'email', label: 'Email de contacto', placeholder: 'hola@gutidiseno.com' },
      { key: 'website', label: 'Tu web / portfolio', placeholder: 'https://gutidiseno.com' },
      { key: 'portfolio', label: 'Link al portfolio (Behance, Dribbble, etc.)', placeholder: 'https://behance.net/guti' },
      { key: 'address', label: 'Ciudad donde trabajas', placeholder: 'Ej: Barcelona (trabajo en remoto para toda España)' },
      { key: 'social_media', label: 'Redes sociales', placeholder: 'Instagram: @gutidiseno\nLinkedIn: linkedin.com/in/guti\nTwitter: @gutidiseno' },
    ],
  },
  {
    id: 'schedule',
    title: 'Disponibilidad y horarios',
    desc: 'La IA informará a los clientes de cuándo puedes atenderles.',
    fields: [
      { key: 'schedule_weekdays', label: 'Lunes a Viernes', placeholder: 'Ej: 9:00 - 18:00' },
      { key: 'schedule_saturday', label: 'Sábado', placeholder: 'Cerrado' },
      { key: 'schedule_sunday', label: 'Domingo', placeholder: 'Cerrado' },
      { key: 'schedule_notes', label: 'Notas sobre disponibilidad', placeholder: 'Ej: Puedo hacer videollamadas de discovery de lunes a jueves. Actualmente tengo agenda libre para nuevos proyectos...' },
    ],
  },
  {
    id: 'services',
    title: 'Servicios y tarifas',
    desc: 'La información más importante. La IA la usará para responder "¿cuánto cuesta?" y cualificar leads.',
    fields: [
      { key: 'services_list', label: 'Tipos de proyectos que haces', placeholder: 'Lista tus servicios con descripción y precio orientativo:\n\nWEB CORPORATIVA: Diseño + desarrollo WordPress para empresas y profesionales. Desde 800€.\n\nLANDING PAGE: Página de captación de leads o ventas. Desde 500€.\n\nTIENDA ONLINE (ECOMMERCE): WooCommerce o Shopify. Desde 1.500€.\n\nREDISEÑO WEB: Mejora visual y técnica de web existente. Desde 600€.\n\nMANTENIMIENTO MENSUAL: Actualizaciones, seguridad y soporte. Desde 50€/mes.\n\nSEO ON-PAGE: Optimización para buscadores. Desde 300€.', textarea: true, rows: 12 },
      { key: 'prices_list', label: 'Rangos de precio (para que la IA los use al responder)', placeholder: 'Web corporativa: 800€ - 2.500€\nLanding page: 500€ - 1.200€\nEcommerce: 1.500€ - 5.000€\nRediseño: 600€ - 1.800€\nMantenimiento: 50€ - 200€/mes\nSEO: 300€ - 800€', textarea: true, rows: 8 },
      { key: 'offers', label: 'Promociones o descuentos actuales', placeholder: 'Ej: -15% para proyectos cerrados en enero, pack web + SEO con descuento...' },
    ],
  },
  {
    id: 'process',
    title: 'Proceso de trabajo',
    desc: 'Cómo trabajas con los clientes. La IA lo explicará cuando pregunten.',
    fields: [
      { key: 'work_process', label: 'Tu proceso paso a paso', placeholder: '1. LLAMADA DE DISCOVERY (gratis, 30 min): Hablamos de tu proyecto, objetivos y presupuesto.\n2. PROPUESTA Y PRESUPUESTO: En 48h envío propuesta detallada con precio cerrado.\n3. DISEÑO (1-2 semanas): Maqueta visual para tu aprobación.\n4. DESARROLLO (1-2 semanas): Programación y maquetación.\n5. ENTREGA Y FORMACIÓN: Te enseño a gestionar tu web.', textarea: true, rows: 8 },
      { key: 'delivery_time', label: 'Tiempo de entrega típico', placeholder: 'Ej: Web corporativa: 3-4 semanas. Landing page: 1-2 semanas. Ecommerce: 5-8 semanas.' },
      { key: 'payment_methods', label: 'Forma de pago', placeholder: 'Ej: 50% al inicio del proyecto, 50% a la entrega. Aceptamos transferencia y PayPal.' },
    ],
  },
  {
    id: 'technology',
    title: 'Tecnologías y especialidades',
    desc: 'Qué tecnologías dominas. Los clientes suelen preguntar.',
    fields: [
      { key: 'technologies', label: 'Tecnologías que usas', placeholder: 'CMS: WordPress, Webflow, Wix\nEcommerce: WooCommerce, Shopify, PrestaShop\nDiseño: Figma, Adobe XD\nFront-end: HTML, CSS, JavaScript\nHosting: SiteGround, Hostinger, Vercel' },
      { key: 'specialties', label: 'Sectores en los que tienes más experiencia', placeholder: 'Ej: Restaurantes y hostelería, clínicas y salud, tiendas de moda, consultorías...' },
      { key: 'not_doing', label: 'Lo que NO haces (importante para la IA)', placeholder: 'Ej: No hago apps móviles nativas, no hago desarrollos a medida muy complejos, no hago diseño gráfico de logos...' },
    ],
  },
  {
    id: 'faq',
    title: 'Preguntas frecuentes de clientes',
    desc: 'Las preguntas que te hacen siempre. La IA las responderá en segundos.',
    fields: [
      { key: 'faq_list', label: 'Preguntas y respuestas', placeholder: '¿Cuánto cuesta una web?\nDepende del tipo de proyecto. Una web corporativa básica está desde 800€. Dame más detalles de lo que necesitas y te preparo un presupuesto sin compromiso.\n\n¿Cuánto tiempo tardas?\nUna web corporativa suele estar lista en 3-4 semanas. Una landing page en 1-2 semanas.\n\n¿Incluyes el hosting?\nNo, el hosting no está incluido, pero te asesoro y ayudo a contratarlo. Cuesta entre 60€ y 150€/año.\n\n¿Puedo modificar la web yo solo después?\nSí, WordPress es muy intuitivo. Te doy formación para que puedas actualizar textos, fotos y blog.\n\n¿Haces webs en inglés?\nSí, puedo crear webs en cualquier idioma.\n\n¿Tienes portfolio?\nSí, puedes ver mis trabajos en mi web: [tu web]', textarea: true, rows: 14 },
    ],
  },
  {
    id: 'extra',
    title: 'Contexto adicional para la IA',
    desc: 'Todo lo que quieras que la IA sepa sobre ti y tu forma de trabajar.',
    fields: [
      { key: 'target_clients', label: 'Cliente ideal / público objetivo', placeholder: 'Ej: Negocios locales con 1-10 empleados que quieren tener presencia online profesional. Autónomos y pymes que valoran la calidad y la atención personalizada.' },
      { key: 'differentiators', label: '¿Por qué elegirte a ti y no a otro?', placeholder: 'Ej: Precio cerrado sin sorpresas, entrego en plazo, soporte incluido 1 año, más de 50 proyectos entregados...' },
      { key: 'team', label: 'Información sobre ti / tu equipo', placeholder: 'Ej: Soy diseñador web con 7 años de experiencia. Trabajo solo pero con una red de colaboradores para proyectos grandes.' },
      { key: 'extra_context', label: 'Cualquier otro contexto para la IA', placeholder: 'Ej: Si alguien pregunta por una app, deriva a llamada de discovery. Si el presupuesto es menor de 400€, explica que no puedo ayudar en ese rango...', textarea: true },
    ],
  },
];

const PAYMENT_METHODS_OPTIONS = [
  { id: 'transferencia', label: 'Transferencia bancaria', emoji: '🏦' },
  { id: 'bizum', label: 'Bizum', emoji: '📱' },
  { id: 'paypal', label: 'PayPal', emoji: '🅿️' },
  { id: 'tarjeta', label: 'Tarjeta (Stripe)', emoji: '💳' },
  { id: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { id: 'facturacion_30', label: 'Facturación a 30 días', emoji: '📅' },
  { id: 'facturacion_60', label: 'Facturación a 60 días', emoji: '📅' },
];

const PAYMENT_TERMS_PRESETS = [
  { id: '50_50', label: '50% al inicio · 50% a la entrega' },
  { id: '30_70', label: '30% reserva · 70% a la entrega' },
  { id: '100_inicio', label: '100% por adelantado' },
  { id: '100_entrega', label: '100% a la entrega' },
  { id: 'mensual', label: 'Pago mensual (mantenimiento)' },
  { id: 'personalizado', label: 'Personalizado' },
];

function PaymentMethodsSelector({ value, onChange }) {
  const selected = (() => { try { return Array.isArray(value) ? value : (value ? JSON.parse(value) : []); } catch { return []; } })();
  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id];
    onChange(JSON.stringify(next));
  };
  return (
    <div className="payment-methods-grid">
      {PAYMENT_METHODS_OPTIONS.map(m => (
        <button key={m.id} type="button" className={`pm-chip ${selected.includes(m.id) ? 'pm-chip--on' : ''}`} onClick={() => toggle(m.id)}>
          <span>{m.emoji}</span> {m.label}
          {selected.includes(m.id) && <Check size={12} />}
        </button>
      ))}
    </div>
  );
}

function PaymentTermsSelector({ value, onChange }) {
  return (
    <div className="payment-terms-list">
      {PAYMENT_TERMS_PRESETS.map(t => (
        <button key={t.id} type="button" className={`pt-option ${value === t.id ? 'pt-option--on' : ''}`} onClick={() => onChange(t.id)}>
          <span className={`pt-option__radio ${value === t.id ? 'pt-option__radio--on' : ''}`} />
          {t.label}
        </button>
      ))}
    </div>
  );
}

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
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
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
          <button type="button" className="logo-upload__remove" onClick={() => onChange('')} title="Eliminar logo">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button type="button" className="logo-upload__btn" onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          <ImageIcon size={24} />
          <span>Subir logo</span>
          <small>PNG, JPG · máx 2MB</small>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />
      {value && (
        <button type="button" className="logo-upload__change" onClick={() => inputRef.current?.click()}>
          <Upload size={12} /> Cambiar logo
        </button>
      )}
    </div>
  );
}

export default function BusinessInfo() {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState(['fiscal']);

  const update = (key, val) => { setData(p => ({ ...p, [key]: val })); setSaved(false); };

  const toggleSection = (id) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  // Load existing data on mount
  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    const { data: existing } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (existing) {
      // Load all fields, including extra_context which stores JSON of extra fields
      const loaded = { ...existing };
      // Parse extra fields from extra_context if stored as JSON
      if (existing.extra_context) {
        try {
          const extra = JSON.parse(existing.extra_context);
          Object.assign(loaded, extra);
        } catch {}
      }
      setData(loaded);
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // All data goes into a simple object with only valid DB columns
      const dbColumns = ['name', 'sector', 'description', 'services', 'prices', 'schedule', 'address', 'phone', 'email', 'website', 'faq', 'extra_context'];
      const saveData = {};
      const extraData = {};

      for (const [key, value] of Object.entries(data)) {
        if (key === 'name' || key === 'sector' || key === 'description' || key === 'services' || 
            key === 'prices' || key === 'schedule' || key === 'address' || key === 'phone' || 
            key === 'email' || key === 'website' || key === 'faq') {
          saveData[key] = value || null;
        } else if (!['id', 'user_id', 'created_at', 'updated_at', 'extra_context'].includes(key)) {
          // Handle strings and JSON arrays/objects
          if (value !== undefined && value !== null && value !== '') {
            if (typeof value === 'string' && value.trim()) {
              extraData[key] = value;
            } else if (typeof value === 'object') {
              extraData[key] = value;
            }
          }
        }
      }

      saveData.extra_context = Object.keys(extraData).length > 0 ? JSON.stringify(extraData) : null;
      saveData.updated_at = new Date().toISOString();

      console.log('[Business] Saving data:', saveData);

      // Check if exists
      const { data: existing, error: selectErr } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[Business] Existing record:', existing, 'Error:', selectErr);

      if (existing) {
        const { error } = await supabase.from('businesses').update(saveData).eq('id', existing.id);
        console.log('[Business] Update error:', error);
        if (error) throw error;
      } else {
        saveData.name = saveData.name || 'Mi Negocio'; // name is required
        const { error } = await supabase.from('businesses').insert({ user_id: user.id, ...saveData });
        console.log('[Business] Insert error:', error);
        if (error) throw error;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[Business] Save error:', err);
      alert('Error guardando: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const filledCount = Object.values(data).filter(v => v && v.trim()).length;
  const totalFields = SECTIONS.reduce((sum, s) => sum + s.fields.length, 0);
  const completionPercent = Math.round((filledCount / totalFields) * 100);

  return (
    <div className="page">
      <div className="page__header">
        <h1>Mi Negocio</h1>
        <p>Cuanta más información añadas, mejores y más precisas serán las respuestas de tu agente IA.</p>
      </div>

      {/* Completion bar */}
      <div className="completion-bar">
        <div className="completion-bar__info">
          <span>Completado: <strong>{completionPercent}%</strong></span>
          <span className="completion-bar__count">{filledCount}/{totalFields} campos</span>
        </div>
        <div className="completion-bar__track">
          <div className="completion-bar__fill" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const isOpen = openSections.includes(section.id);
        return (
          <div key={section.id} className={`card card--collapsible ${isOpen ? 'card--open' : ''}`}>
            <button className="card__toggle" onClick={() => toggleSection(section.id)}>
              <div>
                <h3 className="card__toggle-title">{section.title}</h3>
                <p className="card__toggle-desc">{section.desc}</p>
              </div>
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && (
              <div className="card__body">
                <div className="form-grid">
                  {section.fields.map(f => (
                    <div key={f.key} className={`form-field ${f.textarea || f.type === 'logo' || f.type === 'payment_methods' || f.type === 'payment_terms' ? 'form-field--full' : ''}`}>
                      <label>{f.label} {f.required && <span className="required">*</span>}</label>
                      {f.type === 'logo' ? (
                        <LogoUpload value={data[f.key] || ''} onChange={val => update(f.key, val)} />
                      ) : f.type === 'payment_methods' ? (
                        <PaymentMethodsSelector value={data[f.key] || '[]'} onChange={val => update(f.key, val)} />
                      ) : f.type === 'payment_terms' ? (
                        <PaymentTermsSelector value={data[f.key] || ''} onChange={val => update(f.key, val)} />
                      ) : f.textarea ? (
                        <textarea
                          placeholder={f.placeholder}
                          value={data[f.key] || ''}
                          onChange={e => update(f.key, e.target.value)}
                          rows={f.rows || 4}
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={f.placeholder}
                          value={data[f.key] || ''}
                          onChange={e => update(f.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Save */}
      <div className="sticky-save">
        <button className="btn btn--primary btn--lg" onClick={handleSave} disabled={saving}>
          {saved ? <><Check size={16} /> Guardado</> : saving ? 'Guardando...' : <><Save size={16} /> Guardar toda la información</>}
        </button>
      </div>
    </div>
  );
}
