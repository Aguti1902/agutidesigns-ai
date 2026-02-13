import { useState } from 'react';
import { CreditCard, Zap, Check, AlertTriangle, ArrowRight, Plus, MessageCircle, Smartphone, Package, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const API_URL = import.meta.env.VITE_API_URL || '';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '29',
    priceId: 'price_1T0PJrC3QI1Amukvx91hMZHq',
    agents: '1 número de WhatsApp',
    messages: '500 mensajes/mes',
    features: ['1 agente IA (1 número WhatsApp)', '500 mensajes/mes incluidos', '1 prompt personalizado', 'Datos de negocio', 'Soporte por email', 'Dashboard básico'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '79',
    priceId: 'price_1T0PJrC3QI1Amukvy1zWDKae',
    popular: true,
    agents: '3 números de WhatsApp',
    messages: '5.000 mensajes/mes',
    features: ['3 agentes IA (3 números WhatsApp)', '5.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Datos de negocio por agente', 'Soporte prioritario', 'Dashboard avanzado', 'Estadísticas por agente'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '199',
    priceId: 'price_1T0PJsC3QI1Amukvfl8lWDXO',
    agents: 'Números ilimitados',
    messages: '20.000 mensajes/mes',
    features: ['Agentes ilimitados (WhatsApp ilimitados)', '20.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Datos de negocio por agente', 'Soporte 24/7', 'Dashboard completo', 'API personalizada', 'Marca blanca'],
  },
];

const MSG_PACKS = [
  { id: 'pack-500', messages: 500, price: 9, priceId: 'price_1T0PJBC3QI1AmukvvJ7nDgIv' },
  { id: 'pack-1000', messages: 1000, price: 15, priceId: 'price_1T0PJCC3QI1AmukvC2dY4I6e' },
  { id: 'pack-2500', messages: 2500, price: 29, priceId: 'price_1T0PJCC3QI1AmukvzFy5U3ar' },
  { id: 'pack-5000', messages: 5000, price: 49, priceId: 'price_1T0PJDC3QI1AmukvebqfCiFt' },
  { id: 'pack-10000', messages: 10000, price: 79, priceId: 'price_1T0PJEC3QI1Amukv6ZLNNZhG' },
];

const fmt = (n) => n.toLocaleString('es-ES');

export default function Billing() {
  const { user, profile, isTrialActive, isSubscribed } = useAuth();
  const [selectedPack, setSelectedPack] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000))
    : 0;

  async function handleSubscribe(plan) {
    setLoadingPlan(plan.id);
    try {
      const res = await fetch(`${API_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          userEmail: user.email,
          mode: 'subscription',
          successUrl: `${window.location.origin}/app/billing?success=true`,
          cancelUrl: `${window.location.origin}/app/billing?cancelled=true`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Error: ' + (data.error || 'No se pudo crear la sesión de pago'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleBuyPack() {
    if (!selectedPack) return;
    const pack = MSG_PACKS.find(p => p.id === selectedPack);
    if (!pack) return;

    setLoadingPack(true);
    try {
      const res = await fetch(`${API_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          priceId: pack.priceId,
          userId: user.id,
          userEmail: user.email,
          mode: 'payment',
          successUrl: `${window.location.origin}/app/billing?pack=true`,
          cancelUrl: `${window.location.origin}/app/billing`,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert('Error: ' + (data.error || 'No se pudo crear la sesión'));
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoadingPack(false);
    }
  }

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id) return;
    setLoadingPortal(true);
    try {
      const res = await fetch(`${API_URL}/stripe-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          customerId: profile.stripe_customer_id,
          returnUrl: `${window.location.origin}/app/billing`,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoadingPortal(false);
    }
  }

  // Success message
  const urlParams = new URLSearchParams(window.location.search);
  const showSuccess = urlParams.get('success') === 'true';
  const showPackSuccess = urlParams.get('pack') === 'true';

  return (
    <div className="page">
      <div className="page__header">
        <h1>Suscripción</h1>
        <p>Gestiona tu plan, agentes y mensajes.</p>
      </div>

      {/* Success messages */}
      {showSuccess && (
        <div className="billing-status billing-status--active">
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>¡Suscripción activada!</h3><p>Tu plan está activo. Ya puedes disfrutar de todas las funcionalidades.</p></div>
        </div>
      )}
      {showPackSuccess && (
        <div className="billing-status billing-status--active">
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>¡Pack de mensajes comprado!</h3><p>Los mensajes extra se han añadido a tu cuenta.</p></div>
        </div>
      )}

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
        {isSubscribed && profile?.stripe_customer_id && (
          <button className="btn btn--outline btn--sm" onClick={handleManageSubscription} disabled={loadingPortal} style={{ marginLeft: 'auto' }}>
            {loadingPortal ? <Loader2 size={14} className="spin" /> : <ExternalLink size={14} />}
            Gestionar suscripción
          </button>
        )}
      </div>

      {/* Plans */}
      <h3 className="page__section-title">Elige tu plan</h3>
      <div className="plans-grid">
        {PLANS.map(plan => (
          <div key={plan.id} className={`plan-card ${plan.popular ? 'plan-card--popular' : ''}`}>
            {plan.popular && <span className="plan-card__badge">Más popular</span>}
            <h3>{plan.name}</h3>
            <div className="plan-card__price"><span>{plan.price}€</span>/mes</div>
            <div className="plan-card__highlights">
              <div className="plan-card__highlight"><Smartphone size={13} /><span>{plan.agents}</span></div>
              <div className="plan-card__highlight"><MessageCircle size={13} /><span>{plan.messages}</span></div>
            </div>
            <ul>
              {plan.features.map((f, i) => (<li key={i}><Check size={14} /> {f}</li>))}
            </ul>
            <button
              className={`btn ${plan.popular ? 'btn--primary' : 'btn--outline'} btn--full`}
              onClick={() => handleSubscribe(plan)}
              disabled={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? <><Loader2 size={14} className="spin" /> Procesando...</> : <>Elegir {plan.name} <ArrowRight size={14} /></>}
            </button>
          </div>
        ))}
      </div>

      {/* Message Packs */}
      <h3 className="page__section-title"><Package size={16} /> ¿Necesitas más mensajes?</h3>
      <p className="page__section-desc">Compra packs de mensajes extra que se suman a los de tu plan.</p>

      <div className="msg-packs">
        {MSG_PACKS.map(pack => (
          <button
            key={pack.id}
            className={`msg-pack ${selectedPack === pack.id ? 'msg-pack--selected' : ''}`}
            onClick={() => setSelectedPack(selectedPack === pack.id ? null : pack.id)}
          >
            <span className="msg-pack__messages">+{fmt(pack.messages)}</span>
            <span className="msg-pack__unit">mensajes</span>
            <span className="msg-pack__price">{pack.price}€</span>
          </button>
        ))}
      </div>

      {selectedPack && (
        <div className="msg-packs__action">
          <button className="btn btn--primary" onClick={handleBuyPack} disabled={loadingPack}>
            {loadingPack ? <><Loader2 size={14} className="spin" /> Procesando...</> : <><Plus size={14} /> Comprar pack de +{fmt(MSG_PACKS.find(p => p.id === selectedPack)?.messages)} mensajes — {MSG_PACKS.find(p => p.id === selectedPack)?.price}€</>}
          </button>
        </div>
      )}
    </div>
  );
}
