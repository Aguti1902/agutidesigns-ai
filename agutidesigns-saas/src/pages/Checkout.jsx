import { useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { ArrowLeft, Shield, Lock, Check, Loader2, HelpCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './Checkout.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_URL = import.meta.env.VITE_API_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

// Planes (mismos datos que Billing, formato simplificado)
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '29',
    priceId: 'price_1T1qSzFjBSJ299OpJBLCMTrn',
    features: ['1 agente IA', '500 msgs/mes', 'Dashboard básico'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '79',
    priceId: 'price_1T1qTcFjBSJ299OpSxVO6ZFM',
    features: ['3 agentes IA', '5.000 msgs/mes', 'Dashboard avanzado', 'Soporte prioritario'],
  },
  {
    id: 'business',
    name: 'Business',
    price: '199',
    priceId: 'price_1T1qU1FjBSJ299OpTOdjIRya',
    features: ['Agentes ilimitados', '20.000 msgs/mes', 'API personalizada', 'Marca blanca'],
  },
];

// Packs de mensajes
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

  const planParam = searchParams.get('plan') || '';
  const modeParam = searchParams.get('mode') || 'subscription';

  // Resolver item: plan o pack de mensajes
  const item = modeParam === 'payment'
    ? MSG_PACKS.find((p) => p.id === planParam)
    : PLANS.find((p) => p.id === planParam);

  const returnUrl = `${window.location.origin}/app/billing?success=true${modeParam === 'payment' ? '&pack=true' : ''}`;

  const fetchClientSecret = useCallback(async () => {
    if (!item || !user?.id) return null;
    try {
      setError(null);
      const res = await fetch(`${API_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: item.priceId,
          userId: user.id,
          userEmail: user.email,
          mode: modeParam,
          embedded: true,
          returnUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || 'No se pudo iniciar el checkout');
      }
      return data.clientSecret;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [item, user?.id, user?.email, modeParam, returnUrl]);

  const handleComplete = useCallback(() => {
    window.location.href = returnUrl;
  }, [returnUrl]);

  const handleRetry = () => {
    setError(null);
    // Forzar re-render del provider para reintentar
    window.location.reload();
  };

  // Sin plan/pack válido → redirigir a billing
  if (!item) {
    navigate('/app/billing', { replace: true });
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-page__grid">
        {/* Columna izquierda (40%) */}
        <aside className="checkout-page__left">
          <button className="checkout-page__back" onClick={() => navigate('/app/billing')}>
            <ArrowLeft size={16} /> Volver a Suscripción
          </button>

          <div className="checkout-page__summary">
            <h1 className="checkout-page__title">{item.name}</h1>
            <div className="checkout-page__price">
              <span>{item.price}€</span>
              {modeParam !== 'payment' && <span className="checkout-page__period">/mes</span>}
            </div>

            {item.features && (
              <ul className="checkout-page__features">
                {item.features.map((f, i) => (
                  <li key={i}>
                    <Check size={16} /> {f}
                  </li>
                ))}
              </ul>
            )}

            <div className="checkout-page__badges">
              <span className="checkout-page__badge">
                <Shield size={12} /> 100% seguro
              </span>
              <span className="checkout-page__badge">
                <Lock size={12} /> Procesado por Stripe
              </span>
            </div>

            <p className="checkout-page__note">
              100% seguro · Procesado por Stripe · Cancela cuando quieras
            </p>

            <div className="checkout-page__faq">
              <h3><HelpCircle size={14} /> Preguntas frecuentes</h3>
              <div className="checkout-page__faq-item">
                <strong>¿Puedo cancelar en cualquier momento?</strong>
                <p>Sí. Puedes cancelar tu suscripción cuando quieras desde el panel de facturación.</p>
              </div>
              <div className="checkout-page__faq-item">
                <strong>¿Qué métodos de pago aceptáis?</strong>
                <p>Aceptamos tarjetas Visa, Mastercard y American Express de forma segura con Stripe.</p>
              </div>
              <div className="checkout-page__faq-item">
                <strong>¿Los datos están protegidos?</strong>
                <p>Sí. Todos los pagos se procesan de forma encriptada. No almacenamos datos de tarjeta.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Columna derecha (60%) */}
        <main className="checkout-page__right">
          <div className="checkout-page__stripe">
            {error ? (
              <div className="checkout-page__error">
                <p>{error}</p>
                <button className="btn btn--primary" onClick={handleRetry}>
                  <Loader2 size={14} className="spin" /> Reintentar
                </button>
              </div>
            ) : (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret, onComplete: handleComplete }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
