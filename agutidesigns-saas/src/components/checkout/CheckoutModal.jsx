import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { X, ShieldCheck, Lock } from 'lucide-react';
import './CheckoutModal.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

export default function CheckoutModal({ plan, mode, userId, userEmail, onClose, onSuccess }) {
  const [error, setError] = useState(null);

  const fetchClientSecret = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId,
          userEmail,
          mode: mode || 'subscription',
          embedded: true,
          returnUrl: `${window.location.origin}/app/billing?success=true`,
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
  }, [plan, mode, userId, userEmail]);

  const handleComplete = useCallback(() => {
    if (onSuccess) onSuccess();
    setTimeout(() => onClose(), 1500);
  }, [onClose, onSuccess]);

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>
        <div className="checkout-modal__header">
          <div className="checkout-modal__header-left">
            <ShieldCheck size={18} />
            <span>Pago seguro</span>
          </div>
          <div className="checkout-modal__plan-info">
            <strong>{plan.name}</strong>
            {plan.price && <span className="checkout-modal__price">{plan.price}€{mode !== 'payment' ? '/mes' : ''}</span>}
          </div>
          <button className="checkout-modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="checkout-modal__body">
          {error ? (
            <div className="checkout-modal__error">
              <p>{error}</p>
              <button className="btn btn--primary btn--sm" onClick={() => setError(null)}>Reintentar</button>
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

        <div className="checkout-modal__footer">
          <Lock size={12} />
          <span>Procesado de forma segura por Stripe. Tus datos están encriptados.</span>
        </div>
      </div>
    </div>
  );
}
