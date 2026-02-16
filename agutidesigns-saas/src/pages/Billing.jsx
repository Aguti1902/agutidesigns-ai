import { useState } from 'react';
import {
  Zap, Check, AlertTriangle, ArrowRight, Plus, MessageCircle,
  Smartphone, Package, Loader2, ExternalLink, CreditCard, Shield,
  Star, Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import CheckoutModal from '../components/checkout/CheckoutModal';
import './DashboardPages.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_URL = import.meta.env.VITE_API_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '29',
    priceId: 'price_1T0RlfC3QI1AmukvNi6TCABc',
    agents: '1 número de WhatsApp',
    messages: '500 mensajes/mes',
    features: ['1 agente IA (1 número WhatsApp)', '500 mensajes/mes incluidos', '1 prompt personalizado', 'Datos de negocio', 'Soporte por email', 'Dashboard básico'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '79',
    priceId: 'price_1T0RlgC3QI1Amukv4Pq4kpBh',
    popular: true,
    agents: '3 números de WhatsApp',
    messages: '5.000 mensajes/mes',
    features: ['3 agentes IA (3 números WhatsApp)', '5.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Datos de negocio por agente', 'Soporte prioritario', 'Dashboard avanzado', 'Estadísticas por agente'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '199',
    priceId: 'price_1T0RliC3QI1AmukvBqxU8Qnu',
    agents: 'Números ilimitados',
    messages: '20.000 mensajes/mes',
    features: ['Agentes ilimitados (WhatsApp ilimitados)', '20.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Datos de negocio por agente', 'Soporte 24/7', 'Dashboard completo', 'API personalizada', 'Marca blanca'],
  },
];

const MSG_PACKS = [
  { id: 'pack-500', name: '+500 mensajes', messages: 500, price: '9', priceId: 'price_1T0RliC3QI1Amukvz8BJx96a' },
  { id: 'pack-1000', name: '+1.000 mensajes', messages: 1000, price: '15', priceId: 'price_1T0RljC3QI1AmukvfBI04iTh' },
  { id: 'pack-2500', name: '+2.500 mensajes', messages: 2500, price: '29', priceId: 'price_1T0RlkC3QI1AmukvaMakldlD' },
  { id: 'pack-5000', name: '+5.000 mensajes', messages: 5000, price: '49', priceId: 'price_1T0RllC3QI1Amukvpm1oLS0r' },
  { id: 'pack-10000', name: '+10.000 mensajes', messages: 10000, price: '79', priceId: 'price_1T0RlmC3QI1Amukv5Ha2LNhR' },
];

const fmt = (n) => n.toLocaleString('es-ES');

export default function Billing() {
  const { user, profile, isTrialActive, isSubscribed } = useAuth();
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [checkoutMode, setCheckoutMode] = useState('subscription');
  const [selectedPack, setSelectedPack] = useState(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000))
    : 0;

  function openCheckout(plan, mode = 'subscription') {
    setCheckoutPlan(plan);
    setCheckoutMode(mode);
  }

  function handleBuyPack() {
    if (!selectedPack) return;
    const pack = MSG_PACKS.find(p => p.id === selectedPack);
    if (!pack) return;
    openCheckout(pack, 'payment');
  }

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id || !API_URL) return;
    setLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/stripe-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          customerId: profile.stripe_customer_id,
          returnUrl: `${window.location.origin}/app/billing`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) window.location.href = data.url;
      else alert('Error: ' + (data.error || `Error ${res.status}`));
    } catch (err) {
      alert('Error: ' + (err.message || 'No se pudo conectar.'));
    } finally {
      setLoadingPortal(false);
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const showSuccess = urlParams.get('success') === 'true';
  const showPackSuccess = urlParams.get('pack') === 'true';

  return (
    <div className="page">
      <div className="page__header">
        <h1><CreditCard size={24} /> Suscripción</h1>
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
      </div>

      {/* Payment Methods & Manage */}
      {isSubscribed && profile?.stripe_customer_id && (
        <div className="billing-manage">
          <div className="billing-manage__info">
            <CreditCard size={18} />
            <div>
              <h4>Métodos de pago y facturación</h4>
              <p>Gestiona tus tarjetas, cambia de plan, consulta facturas o cancela la suscripción.</p>
            </div>
          </div>
          <button className="btn btn--outline" onClick={handleManageSubscription} disabled={loadingPortal}>
            {loadingPortal ? <Loader2 size={14} className="spin" /> : <ExternalLink size={14} />}
            Gestionar pagos
          </button>
        </div>
      )}

      {/* Plans */}
      <div className="billing-section-header">
        <h3 className="page__section-title"><Sparkles size={18} /> Elige tu plan</h3>
        <div className="billing-section-badges">
          <span className="billing-badge"><Shield size={12} /> Pago 100% seguro</span>
          <span className="billing-badge"><Zap size={12} /> Cancela cuando quieras</span>
        </div>
      </div>

      <div className="plans-grid">
        {PLANS.map(plan => (
          <div key={plan.id} className={`plan-card ${plan.popular ? 'plan-card--popular' : ''}`}>
            {plan.popular && <span className="plan-card__badge"><Star size={11} /> Más popular</span>}
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
              onClick={() => openCheckout(plan, 'subscription')}
            >
              Elegir {plan.name} <ArrowRight size={14} />
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
          <button className="btn btn--primary" onClick={handleBuyPack}>
            <Plus size={14} /> Comprar pack de +{fmt(MSG_PACKS.find(p => p.id === selectedPack)?.messages)} mensajes — {MSG_PACKS.find(p => p.id === selectedPack)?.price}€
          </button>
        </div>
      )}

      {/* Embedded Checkout Modal */}
      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          mode={checkoutMode}
          userId={user?.id}
          userEmail={user?.email}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => window.location.search = '?success=true'}
        />
      )}
    </div>
  );
}
