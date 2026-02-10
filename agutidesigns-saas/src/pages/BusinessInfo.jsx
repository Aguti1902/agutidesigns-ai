import { useState } from 'react';
import { Building, Save, Check } from 'lucide-react';
import './DashboardPages.css';

const initialData = {
  name: '', sector: '', description: '', services: '',
  prices: '', schedule: '', address: '', phone: '', email: '', website: '', faq: '', extra_context: ''
};

const fields = [
  { key: 'name', label: 'Nombre del negocio', placeholder: 'Ej: Peluquería María', required: true },
  { key: 'sector', label: 'Sector', placeholder: 'Ej: Peluquería, Restaurante, Clínica...' },
  { key: 'description', label: 'Descripción del negocio', placeholder: 'Cuéntale a la IA de qué va tu negocio...', textarea: true },
  { key: 'services', label: 'Servicios que ofreces', placeholder: 'Lista tus servicios principales...', textarea: true },
  { key: 'prices', label: 'Precios', placeholder: 'Corte: 15€, Tinte: 30€, Mechas: 45€...', textarea: true },
  { key: 'schedule', label: 'Horarios', placeholder: 'L-V: 9:00-20:00, S: 10:00-14:00...' },
  { key: 'address', label: 'Dirección', placeholder: 'Calle Ejemplo 123, Madrid' },
  { key: 'phone', label: 'Teléfono', placeholder: '+34 600 000 000' },
  { key: 'email', label: 'Email', placeholder: 'info@minegocio.com' },
  { key: 'website', label: 'Web', placeholder: 'https://minegocio.com' },
  { key: 'faq', label: 'Preguntas frecuentes', placeholder: '¿Aceptáis reservas? Sí, por WhatsApp.\n¿Parking? Sí, gratuito...', textarea: true },
  { key: 'extra_context', label: 'Contexto extra', placeholder: 'Cualquier info adicional que quieras que la IA sepa...', textarea: true },
];

export default function BusinessInfo() {
  const [data, setData] = useState(initialData);
  const [saved, setSaved] = useState(false);

  const update = (key, val) => { setData(p => ({ ...p, [key]: val })); setSaved(false); };

  const handleSave = () => {
    // En producción: guardar en Supabase
    console.log('[Supabase] Guardar negocio:', data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h1>Mi Negocio</h1>
        <p>Esta información la usará tu agente IA para responder con contexto. Cuanta más info, mejores respuestas.</p>
      </div>

      <div className="card">
        <div className="form-grid">
          {fields.map(f => (
            <div key={f.key} className={`form-field ${f.textarea ? 'form-field--full' : ''}`}>
              <label>{f.label} {f.required && <span className="required">*</span>}</label>
              {f.textarea ? (
                <textarea
                  placeholder={f.placeholder}
                  value={data[f.key]}
                  onChange={e => update(f.key, e.target.value)}
                  rows={4}
                />
              ) : (
                <input
                  type="text"
                  placeholder={f.placeholder}
                  value={data[f.key]}
                  onChange={e => update(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="btn btn--primary" onClick={handleSave}>
            {saved ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar cambios</>}
          </button>
        </div>
      </div>
    </div>
  );
}
