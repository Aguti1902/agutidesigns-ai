import { MessageCircle, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

const MOCK_STATS = [
  { icon: MessageCircle, value: 24, label: 'Mensajes hoy', trend: '+12%' },
  { icon: Users, value: 8, label: 'Leads captados', trend: '+3' },
  {
    icon: MessageSquare,
    value: 12,
    label: 'Conversaciones activas',
    trend: '—',
  },
  { icon: TrendingUp, value: '98%', label: 'Tasa de respuesta', trend: '+2%' },
];

const MOCK_CONVERSATIONS = [
  { name: 'María García', preview: '¡Hola! Quería información sobre...', time: 'hace 5 min' },
  { name: 'Carlos López', preview: '¿Tienen disponibilidad mañana?', time: 'hace 12 min' },
  { name: 'Ana Martínez', preview: 'Gracias por la respuesta rápida', time: 'hace 25 min' },
  { name: 'Pedro Sánchez', preview: '¿Cuál es el precio del servicio?', time: 'hace 1 hora' },
  { name: 'Laura Fernández', preview: 'Perfecto, reservo para el viernes', time: 'hace 2 horas' },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || 'Usuario';

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Hola, {displayName} 👋</h1>
        <p className="dashboard-subtitle">
          Aquí tienes el resumen de tu agente IA
        </p>
      </header>

      {/* Stats grid */}
      <section className="dashboard-stats">
        {MOCK_STATS.map(({ icon: Icon, value, label, trend }) => (
          <div key={label} className="stat-card">
            <div className="stat-card-icon">
              <Icon size={24} strokeWidth={2} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{value}</span>
              <span className="stat-card-label">{label}</span>
              {trend !== '—' && (
                <span className="stat-card-trend">{trend}</span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Agent status */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Estado del agente</h2>
        <div className="agent-status agent-status--active">
          <span className="agent-status-dot" />
          <span>Activo</span>
        </div>
      </section>

      {/* Latest conversations */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Últimas conversaciones</h2>
        <ul className="conversation-list">
          {MOCK_CONVERSATIONS.map(({ name, preview, time }) => (
            <li key={name} className="conversation-item">
              <div className="conversation-avatar">
                {name.charAt(0)}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <span className="conversation-name">{name}</span>
                  <span className="conversation-time">{time}</span>
                </div>
                <p className="conversation-preview">{preview}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
