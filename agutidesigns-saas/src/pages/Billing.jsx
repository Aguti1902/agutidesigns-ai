import { CreditCard, Zap, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '29',
    features: ['500 mensajes/mes', '1 agente IA', 'Soporte por email', 'Dashboard básico'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '79',
    popular: true,
    features: ['5.000 mensajes/mes', '3 agentes IA', 'Soporte prioritario', 'Dashboard avanzado', 'Estadísticas detalladas'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '199',
    features: ['20.000 mensajes/mes', 'Agentes ilimitados', 'Soporte 24/7', 'Dashboard completo', 'API personalizada', 'Marca blanca'],
  },
];

export default function Billing() {
  const { profile, isTrialActive, isSubscribed } = useAuth();

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000))
    : 0;

  return (
    <div className="page">
      <div className="page__header">
        <h1>Suscripción</h1>
        <p>Gestiona tu plan y método de pago.</p>
      </div>

      {/* Status */}
      <div className={`billing-status ${isTrialActive ? 'billing-status--trial' : isSubscribed ? 'billing-status--active' : 'billing-status--expired'}`}>
        <div className="billing-status__icon">
          {isTrialActive ? <Zap size={20} /> : isSubscribed ? <Check size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div>
          <h3>
            {isTrialActive ? `Periodo de prueba — ${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} restante${trialDaysLeft !== 1 ? 's' : ''}` :
             isSubscribed ? 'Suscripción activa' : 'Suscripción expirada'}
          </h3>
          <p>
            {isTrialActive ? 'Disfruta de todas las funcionalidades. Elige un plan antes de que acabe.' :
             isSubscribed ? 'Tienes acceso completo a todas las funcionalidades.' :
             'Tu periodo de prueba ha terminado. Elige un plan para continuar.'}
          </p>
        </div>
      </div>

      {/* Plans */}
      <h3 className="page__section-title">Elige tu plan</h3>
      <div className="plans-grid">
        {PLANS.map(plan => (
          <div key={plan.id} className={`plan-card ${plan.popular ? 'plan-card--popular' : ''}`}>
            {plan.popular && <span className="plan-card__badge">Más popular</span>}
            <h3>{plan.name}</h3>
            <div className="plan-card__price">
              <span>{plan.price}€</span>/mes
            </div>
            <ul>
              {plan.features.map((f, i) => (
                <li key={i}><Check size={14} /> {f}</li>
              ))}
            </ul>
            <button
              className={`btn ${plan.popular ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => alert('Integrar Stripe Checkout')}
            >
              Elegir {plan.name} <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
