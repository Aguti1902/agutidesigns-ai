import { useState, useEffect } from 'react';
import { Building, Save, Check, Plus, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const SECTIONS = [
  {
    id: 'general',
    title: 'Información general',
    desc: 'Datos básicos de tu negocio que la IA usará para presentarse.',
    fields: [
      { key: 'name', label: 'Nombre del negocio', placeholder: 'Ej: Peluquería María', required: true },
      { key: 'sector', label: 'Sector / Tipo de negocio', placeholder: 'Ej: Peluquería, Restaurante, Clínica dental...' },
      { key: 'slogan', label: 'Eslogan o frase principal', placeholder: 'Ej: Tu peluquería de confianza en Madrid' },
      { key: 'description', label: 'Descripción del negocio', placeholder: 'Cuéntale a la IA de qué va tu negocio, qué os diferencia, vuestra historia...', textarea: true },
    ],
  },
  {
    id: 'contact',
    title: 'Contacto y ubicación',
    desc: 'Para que la IA pueda dar información de contacto a los clientes.',
    fields: [
      { key: 'phone', label: 'Teléfono principal', placeholder: '+34 600 000 000' },
      { key: 'email', label: 'Email de contacto', placeholder: 'info@minegocio.com' },
      { key: 'website', label: 'Página web', placeholder: 'https://minegocio.com' },
      { key: 'address', label: 'Dirección', placeholder: 'Calle Ejemplo 123, 28001 Madrid' },
      { key: 'google_maps', label: 'Link de Google Maps', placeholder: 'https://maps.google.com/...' },
    ],
  },
  {
    id: 'schedule',
    title: 'Horarios',
    desc: 'La IA informará a los clientes de cuándo estás abierto.',
    fields: [
      { key: 'schedule_weekdays', label: 'Lunes a Viernes', placeholder: 'Ej: 9:00 - 20:00' },
      { key: 'schedule_saturday', label: 'Sábado', placeholder: 'Ej: 10:00 - 14:00' },
      { key: 'schedule_sunday', label: 'Domingo', placeholder: 'Cerrado' },
      { key: 'schedule_notes', label: 'Notas sobre horarios', placeholder: 'Ej: Cerrados festivos nacionales, agosto cerrado del 1-15...' },
    ],
  },
  {
    id: 'services',
    title: 'Servicios y precios',
    desc: 'Lista detallada para que la IA pueda informar con precisión.',
    fields: [
      { key: 'services_list', label: 'Servicios que ofreces', placeholder: 'Lista todos tus servicios, uno por línea:\n\n- Corte de pelo caballero\n- Corte de pelo señora\n- Tinte\n- Mechas\n- Tratamiento keratina\n- Barba', textarea: true, rows: 8 },
      { key: 'prices_list', label: 'Precios', placeholder: 'Lista precios junto a cada servicio:\n\n- Corte caballero: 15€\n- Corte señora: 20€\n- Tinte: 30€\n- Mechas: 45€\n- Keratina: 60€\n- Barba: 8€', textarea: true, rows: 8 },
      { key: 'offers', label: 'Ofertas o promociones actuales', placeholder: 'Ej: 10% descuento primera visita, pack corte+barba 20€, martes 2x1 en tintes...', textarea: true },
    ],
  },
  {
    id: 'faq',
    title: 'Preguntas frecuentes',
    desc: 'Las preguntas que más hacen tus clientes. La IA las responderá al instante.',
    fields: [
      { key: 'faq_list', label: 'Preguntas y respuestas', placeholder: 'Escribe pregunta y respuesta:\n\n¿Aceptáis reservas?\nSí, por WhatsApp o teléfono.\n\n¿Tenéis parking?\nSí, parking gratuito en la puerta.\n\n¿Aceptáis tarjeta?\nSí, efectivo y tarjeta.\n\n¿Hacéis a domicilio?\nNo, solo en nuestro local.', textarea: true, rows: 10 },
    ],
  },
  {
    id: 'policies',
    title: 'Políticas del negocio',
    desc: 'Reglas importantes que la IA debe conocer.',
    fields: [
      { key: 'cancellation_policy', label: 'Política de cancelación', placeholder: 'Ej: Cancelación gratuita hasta 2h antes de la cita. Cancelaciones tardías pueden tener cargo de 5€.' },
      { key: 'payment_methods', label: 'Métodos de pago aceptados', placeholder: 'Ej: Efectivo, tarjeta de crédito/débito, Bizum' },
      { key: 'return_policy', label: 'Política de devoluciones', placeholder: 'Ej: Devoluciones en 30 días con ticket. Productos abiertos no se devuelven.' },
      { key: 'other_policies', label: 'Otras políticas', placeholder: 'Cualquier regla adicional: mascotas, niños, requisitos especiales...', textarea: true },
    ],
  },
  {
    id: 'extra',
    title: 'Información adicional',
    desc: 'Todo lo que quieras que la IA sepa y que no encaje en las otras secciones.',
    fields: [
      { key: 'team', label: 'Equipo / Personal', placeholder: 'Ej: María (fundadora y estilista), Carlos (barbero), Ana (colorista)...' },
      { key: 'specialties', label: 'Especialidades o diferenciadores', placeholder: '¿Qué os hace únicos? ¿Premios, certificaciones, especialidades?' },
      { key: 'social_media', label: 'Redes sociales', placeholder: 'Instagram: @minegocio, Facebook: /minegocio, TikTok: @minegocio' },
      { key: 'extra_context', label: 'Contexto libre', placeholder: 'Cualquier otra información relevante que quieras que la IA tenga en cuenta...', textarea: true },
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
