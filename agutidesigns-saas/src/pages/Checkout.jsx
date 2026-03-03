import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import {
  ArrowLeft, Shield, Lock, Check, Loader2, Zap,
  MessageCircle, Smartphone, Crown, Package, Infinity
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Checkout.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_URL = import.meta.env.VITE_API_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: '29', priceAnnual: '24',
    priceId: 'price_1T1qSzFjBSJ299OpJBLCMTrn',
    icon: <Package size={22} />, color: '#60a5fa',
    highlight: '1 agente IA · 1.000 msgs/mes',
    features: ['1 agente IA (1 número WhatsApp)', '1.000 mensajes/mes incluidos', '1 prompt personalizado', 'Presupuestos en PDF', 'Soporte por email'],
  },
  {
    id: 'pro', name: 'Pro', price: '79', priceAnnual: '66',
    priceId: 'price_1T1qTcFjBSJ299OpSxVO6ZFM', popular: true,
    icon: <Crown size={22} />, color: '#25D366',
    highlight: '3 agentes IA · 3.000 msgs/mes',
    features: ['3 agentes IA (3 números WhatsApp)', '3.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Presupuestos + facturas PDF', 'Soporte prioritario'],
  },
  {
    id: 'agency', name: 'Agency', price: '149', priceAnnual: '124',
    priceId: 'price_1T1qU1FjBSJ299OpTOdjIRya',
    icon: <Infinity size={22} />, color: '#a78bfa',
    highlight: 'Agentes ilimitados · 8.000 msgs/mes',
    features: ['Agentes ilimitados', '8.000 mensajes/mes', 'API personalizada', 'Marca blanca', 'Soporte 24/7'],
  },
];

const MSG_PACKS = [
  { id: 'pack-500', name: '+500 mensajes', price: '9', priceId: 'price_1T1qUMFjBSJ299OprGXORk0J' },
  { id: 'pack-1000', name: '+1.000 mensajes', price: '15', priceId: 'price_1T1qUNFjBSJ299OpBO38XWfG' },
  { id: 'pack-2500', name: '+2.500 mensajes', price: '29', priceId: 'price_1T1qUOFjBSJ299OpY8sL9IBL' },
  { id: 'pack-5000', name: '+5.000 mensajes', price: '49', priceId: 'price_1T1qUPFjBSJ299OpTTZodJ3B' },
  { id: 'pack-10000', name: '+10.000 mensajes', price: '79', priceId: 'price_1T1qUPFjBSJ299OpqtaOMyK3' },
];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);

  const planParam  = searchParams.get('plan') || '';
  const modeParam  = searchParams.get('mode') || 'subscription';
  const priceIdParam = searchParams.get('priceId') || ''; // priceId anual si viene en URL
  const cycleParam = searchParams.get('cycle') || 'monthly';

  const item = modeParam === 'payment'
    ? MSG_PACKS.find(p => p.id === planParam)
    : PLANS.find(p => p.id === planParam);

  // Si viene priceId explícito en la URL (plan anual) úsalo; si no, el del plan
  const resolvedPriceId = priceIdParam || item?.priceId;

  const returnUrl = `${window.location.origin}/app/billing?success=true${modeParam === 'payment' ? '&pack=true' : ''}`;

  const fetchClientSecret = useCallback(async () => {
    if (!item || !user?.id) return null;
    try {
      setError(null);
      const isPayment = modeParam === 'payment';
      const res = await fetch(`${API_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: isPayment ? undefined : resolvedPriceId,
          amount: isPayment ? item.price : undefined,
          productName: isPayment ? item.name : undefined,
          userId: user.id,
          userEmail: user.email,
          mode: modeParam,
          embedded: true,
          returnUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) throw new Error(data.error || 'No se pudo iniciar el checkout');
      return data.clientSecret;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [item, user?.id, user?.email, modeParam, returnUrl]);

  const handleComplete = useCallback(() => {
    window.location.href = returnUrl;
  }, [returnUrl]);

  if (!item) {
    navigate('/app/billing', { replace: true });
    return null;
  }

  const isPlan = modeParam !== 'payment';
  const planData = isPlan ? item : null;

  return (
    <div className="co-page">

      {/* Header minimalista */}
      <header className="co-header">
        <button className="co-back" onClick={() => navigate('/app/billing')}>
          <ArrowLeft size={15} /> Volver
        </button>
        <div className="co-header__trust">
          <span><Lock size={11} /> SSL seguro</span>
          <span><Shield size={11} /> Stripe</span>
        </div>
      </header>

      <div className="co-grid">

        {/* ── Panel izquierdo ── */}
        <aside className="co-left">
          {/* Icono y nombre del plan */}
          <div className="co-plan-icon" style={{ '--c': planData?.color || '#25D366' }}>
            {planData?.icon || <Zap size={22} />}
          </div>

          <div className="co-plan-type">
            {isPlan ? 'Suscripción mensual' : 'Pack de mensajes · pago único'}
          </div>
          <h1 className="co-plan-name">{item.name}</h1>

          <div className="co-plan-price">
            <span className="co-plan-price__amount">{cycleParam === 'annual' && item.priceAnnual ? item.priceAnnual : item.price}€</span>
            {isPlan && <span className="co-plan-price__period">/mes{cycleParam === 'annual' ? ' · facturado anualmente' : ''}</span>}
          </div>

          {planData?.highlight && (
            <p className="co-plan-highlight">{planData.highlight}</p>
          )}

          {/* Features */}
          {item.features?.length > 0 && (
            <ul className="co-features">
              {item.features.map((f, i) => (
                <li key={i}>
                  <span className="co-features__dot" style={{ background: planData?.color || '#25D366' }} />
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* Trust */}
          <div className="co-trust">
            <div className="co-trust__row">
              <Check size={13} />
              <span>Cancela cuando quieras</span>
            </div>
            <div className="co-trust__row">
              <Check size={13} />
              <span>Sin permanencia ni penalización</span>
            </div>
            <div className="co-trust__row">
              <Check size={13} />
              <span>Datos encriptados · PCI compliant</span>
            </div>
          </div>
        </aside>

        {/* ── Panel derecho (Stripe) ── */}
        <main className="co-right">
          {error ? (
            <div className="co-error">
              <p>{error}</p>
              <button className="btn btn--primary" onClick={() => window.location.reload()}>
                <Loader2 size={14} className="spin" /> Reintentar
              </button>
            </div>
          ) : (
            <div className="co-stripe-wrap">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret, onComplete: handleComplete }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
