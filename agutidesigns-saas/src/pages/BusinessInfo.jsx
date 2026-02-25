import { useState, useEffect } from 'react';
import { Building, Save, Check, Plus, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const SECTIONS = [
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

export default function BusinessInfo() {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState(['general']);

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
          if (value && typeof value === 'string' && value.trim()) {
            extraData[key] = value;
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
                    <div key={f.key} className={`form-field ${f.textarea ? 'form-field--full' : ''}`}>
                      <label>{f.label} {f.required && <span className="required">*</span>}</label>
                      {f.textarea ? (
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
