import { MessageCircle, Users, BarChart3, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const stats = [
  { label: 'Mensajes hoy', value: '0', icon: <MessageCircle size={18} />, color: '#25D366' },
  { label: 'Leads captados', value: '0', icon: <Users size={18} />, color: '#E5FC63' },
  { label: 'Conversaciones', value: '0', icon: <BarChart3 size={18} />, color: '#EC6746' },
  { label: 'Agente', value: 'Inactivo', icon: <Zap size={18} />, color: '#666' },
];

const quickActions = [
  { label: 'Conectar WhatsApp', to: '/app/whatsapp', desc: 'Vincula tu número' },
  { label: 'Datos del negocio', to: '/app/negocio', desc: 'Contexto para la IA' },
  { label: 'Configurar prompt', to: '/app/agente', desc: 'Personaliza tu agente' },
  { label: 'Ver tutoriales', to: '/app/tutoriales', desc: 'Aprende a usarlo' },
];

export default function DashboardHome() {
  const { profile } = useAuth();

  return (
    <div className="page">
      <div className="page__header">
        <h1>¡Hola, {profile?.full_name || 'ahí'}!</h1>
        <p>Aquí tienes un resumen de tu agente de WhatsApp IA.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card__icon" style={{ color: s.color, background: `${s.color}15` }}>{s.icon}</div>
            <div>
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h3 className="page__section-title">Acciones rápidas</h3>
      <div className="actions-grid">
        {quickActions.map((a, i) => (
          <Link key={i} to={a.to} className="action-card">
            <div>
              <span className="action-card__label">{a.label}</span>
              <span className="action-card__desc">{a.desc}</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </div>
  );
}
