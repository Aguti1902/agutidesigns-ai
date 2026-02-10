import { BookOpen, Play, MessageCircle, Building, Brain, CreditCard, ExternalLink } from 'lucide-react';
import './DashboardPages.css';

const tutorials = [
  {
    icon: <MessageCircle size={20} />,
    title: 'Cómo conectar tu WhatsApp',
    desc: 'Aprende a vincular tu número de WhatsApp Business con tu agente IA paso a paso.',
    duration: '2 min',
    steps: [
      'Ve a la sección "WhatsApp" en el menú lateral',
      'Abre WhatsApp en tu teléfono',
      'Ve a Configuración → Dispositivos vinculados',
      'Escanea el código QR que aparece en pantalla',
      '¡Listo! Tu agente ya está conectado',
    ],
  },
  {
    icon: <Building size={20} />,
    title: 'Añadir datos de tu negocio',
    desc: 'Cómo dar contexto a la IA para que responda con información real de tu negocio.',
    duration: '5 min',
    steps: [
      'Ve a "Mi Negocio" en el menú lateral',
      'Rellena el nombre, sector y descripción',
      'Añade tus servicios con precios',
      'Indica horarios y dirección',
      'Añade preguntas frecuentes de tus clientes',
      'Guarda los cambios',
    ],
  },
  {
    icon: <Brain size={20} />,
    title: 'Configurar el prompt de tu agente',
    desc: 'Define la personalidad y capacidades de tu asistente IA.',
    duration: '3 min',
    steps: [
      'Ve a "Prompt IA" en el menú lateral',
      'Pon un nombre a tu agente',
      'Elige la personalidad (cercano, profesional, etc.)',
      'Selecciona lo que puede hacer (FAQs, citas, leads...)',
      'Añade reglas adicionales si necesitas',
      'Genera el prompt y guárdalo',
    ],
  },
  {
    icon: <CreditCard size={20} />,
    title: 'Gestionar tu suscripción',
    desc: 'Cómo funciona el trial y cómo suscribirte para seguir usando el servicio.',
    duration: '1 min',
    steps: [
      'Tienes 2 días de prueba gratis al registrarte',
      'Ve a "Suscripción" para ver el estado de tu plan',
      'Cuando acabe el trial, elige un plan para continuar',
      'El pago se gestiona de forma segura con Stripe',
    ],
  },
];

export default function Tutorials() {
  return (
    <div className="page">
      <div className="page__header">
        <h1>Tutoriales</h1>
        <p>Aprende a sacar el máximo partido a tu agente de WhatsApp IA.</p>
      </div>

      <div className="tutorials-grid">
        {tutorials.map((t, i) => (
          <div key={i} className="tutorial-card">
            <div className="tutorial-card__header">
              <div className="tutorial-card__icon">{t.icon}</div>
              <span className="tutorial-card__duration">{t.duration}</span>
            </div>
            <h3>{t.title}</h3>
            <p>{t.desc}</p>
            <ol className="tutorial-card__steps">
              {t.steps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
