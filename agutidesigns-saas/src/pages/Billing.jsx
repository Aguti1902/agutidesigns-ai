import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Zap, Check, AlertTriangle, ArrowRight, MessageCircle,
  Smartphone, Loader2, CreditCard, Shield,
  Star, Sparkles, FileText, Download, Calendar, XCircle,
  BarChart3, Lock, Clock, FileText as FileTextIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_URL = import.meta.env.VITE_API_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: '29',
    priceId: 'price_1T0RlfC3QI1AmukvNi6TCABc',
    agents: '1 número de WhatsApp', messages: '500 mensajes/mes',
    features: ['1 agente IA (1 número WhatsApp)', '500 mensajes/mes incluidos', '1 prompt personalizado', 'Datos de negocio', 'Soporte por email', 'Dashboard básico'],
  },
  {
    id: 'pro', name: 'Pro', price: '79',
    priceId: 'price_1T0RlgC3QI1Amukv4Pq4kpBh', popular: true,
    agents: '3 números de WhatsApp', messages: '5.000 mensajes/mes',
    features: ['3 agentes IA (3 números WhatsApp)', '5.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Datos de negocio por agente', 'Soporte prioritario', 'Dashboard avanzado', 'Estadísticas por agente'],
  },
  {
    id: 'business', name: 'Business', price: '199',
    priceId: 'price_1T0RliC3QI1AmukvBqxU8Qnu',
    agents: 'Números ilimitados', messages: '20.000 mensajes/mes',
    features: ['Agentes ilimitados (WhatsApp ilimitados)', '20.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Datos de negocio por agente', 'Soporte 24/7', 'Dashboard completo', 'API personalizada', 'Marca blanca'],
  },
];

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatAmount(cents, currency = 'eur') {
  if (!cents && cents !== 0) return '—';
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: currency.toUpperCase() });
}
function daysUntil(ts) {
  if (!ts) return 0;
  return Math.max(0, Math.ceil((ts * 1000 - Date.now()) / 86400000));
}

const STATUS_MAP = { paid: 'Pagada', open: 'Pendiente', draft: 'Borrador', void: 'Anulada', uncollectible: 'Impagada' };

/* ── Card Update Form ── */
function CardUpdateForm({ customerId, subscriptionId, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const siRes = await fetch(`${API_URL}/stripe-create-setup-intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const siData = await siRes.json();
      if (!siRes.ok || !siData.clientSecret) throw new Error(siData.error || 'Error creando setup');
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(siData.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (stripeError) throw new Error(stripeError.message);
      const pmRes = await fetch(`${API_URL}/stripe-update-payment-method`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, paymentMethodId: setupIntent.payment_method, subscriptionId }),
      });
      const pmData = await pmRes.json();
      if (!pmRes.ok || !pmData.success) throw new Error(pmData.error || 'Error actualizando tarjeta');
      onSuccess(pmData.card);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-update-form">
      <div className="card-update-form__field">
        <CardElement options={{ style: { base: { fontSize: '15px', color: '#e4e4e7', fontFamily: 'IBM Plex Sans, system-ui, sans-serif', '::placeholder': { color: '#555' } }, invalid: { color: '#ef4444' } } }} />
      </div>
      {error && <p className="card-update-form__error"><AlertTriangle size={12} /> {error}</p>}
      <div className="card-update-form__actions">
        <button type="button" className="btn btn--outline btn--sm" onClick={onCancel} disabled={loading}>Cancelar</button>
        <button type="submit" className="btn btn--primary btn--sm" disabled={loading || !stripe}>
          {loading ? <Loader2 size={12} className="spin" /> : <Lock size={12} />}
          {loading ? 'Guardando...' : 'Guardar tarjeta'}
        </button>
      </div>
    </form>
  );
}

/* ── Main Billing Page ── */
export default function Billing() {
  const navigate = useNavigate();
  const { user, profile, isTrialActive, isSubscribed } = useAuth();
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardSuccess, setCardSuccess] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  // loadingPortal removed - no longer needed

  // Persist status banner dismiss in localStorage
  const [statusDismissed, setStatusDismissed] = useState(() => {
    try { return localStorage.getItem('billing_status_dismissed') === 'true'; } catch { return false; }
  });
  function dismissStatus() {
    setStatusDismissed(true);
    try { localStorage.setItem('billing_status_dismissed', 'true'); } catch {}
  }

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000))
    : 0;

  const loadCustomerInfo = useCallback(() => {
    if (!isSubscribed || !profile?.stripe_customer_id || !API_URL) return;
    setLoadingInfo(true);
    fetch(`${API_URL}/stripe-customer-info`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: profile.stripe_customer_id }),
    })
      .then(r => r.json())
      .then(data => { if (!data.error) setCustomerInfo(data); })
      .catch(() => {})
      .finally(() => setLoadingInfo(false));
  }, [isSubscribed, profile?.stripe_customer_id]);

  useEffect(() => { loadCustomerInfo(); }, [loadCustomerInfo]);

  async function handleCancelSubscription() {
    if (!profile?.stripe_subscription_id) return;
    setCancellingSubscription(true);
    try {
      const res = await fetch(`${API_URL}/stripe-cancel-subscription`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: profile.stripe_subscription_id, userId: user?.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setShowCancelConfirm(false);
        setJustCancelled(true);
        loadCustomerInfo();
      } else {
        alert('Error: ' + (data.error || 'No se pudo cancelar'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCancellingSubscription(false);
    }
  }

  async function handleReactivate() {
    if (!profile?.stripe_subscription_id) return;
    setReactivating(true);
    try {
      const res = await fetch(`${API_URL}/stripe-cancel-subscription`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: profile.stripe_subscription_id, reactivate: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setJustCancelled(false);
        loadCustomerInfo();
      } else {
        alert('Error: ' + (data.error || 'No se pudo reactivar'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setReactivating(false);
    }
  }

  function handleCardUpdated() {
    setShowCardForm(false);
    setCardSuccess(true);
    setTimeout(() => setCardSuccess(false), 4000);
    loadCustomerInfo();
  }

  // Handle ?success=true from checkout return
  const urlParams = new URLSearchParams(window.location.search);
  const [showSuccess, setShowSuccess] = useState(urlParams.get('success') === 'true');
  const activatedRef = useRef(false);

  useEffect(() => {
    if (!showSuccess || isSubscribed || activatedRef.current) return;
    activatedRef.current = true;
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      if (attempts > 15) { clearInterval(poll); return; }
      if (user?.id) {
        const { data } = await supabase.from('profiles').select('subscription_status').eq('id', user.id).single();
        if (data?.subscription_status === 'active') {
          clearInterval(poll);
          // Clear the dismissed flag so the success banner shows
          try { localStorage.removeItem('billing_status_dismissed'); } catch {}
          window.location.href = '/app/billing?success=true';
        }
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [showSuccess, isSubscribed, user?.id]);

  const isCancelling = customerInfo?.subscription?.cancelAtPeriodEnd;
  const cancelDaysLeft = isCancelling ? daysUntil(customerInfo.subscription.currentPeriodEnd) : 0;

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><CreditCard size={24} /> Suscripción</h1>
          <p>Gestiona tu plan, métodos de pago y facturación.</p>
        </div>
        {isSubscribed && profile?.stripe_customer_id && (
          <button className="btn btn--outline btn--sm" onClick={() => navigate('/app/facturacion')} style={{ marginTop: '0.25rem' }}>
            <FileTextIcon size={14} /> Datos de facturación
          </button>
        )}
      </div>

      {/* ── PERMANENT banner: subscription cancelling (NOT dismissable) ── */}
      {isCancelling && (
        <div className="billing-status billing-status--warning">
          <div className="billing-status__icon"><Clock size={20} /></div>
          <div style={{ flex: 1 }}>
            <h3>Tu plan se cancela en {cancelDaysLeft} día{cancelDaysLeft !== 1 ? 's' : ''}</h3>
            <p>Tienes acceso hasta el {formatDate(customerInfo.subscription.currentPeriodEnd)}. Después tu agente se desactivará.</p>
          </div>
          <button className="btn btn--sm" onClick={handleReactivate} disabled={reactivating} style={{ background: '#f59e0b', color: '#000', fontWeight: 700, flexShrink: 0 }}>
            {reactivating ? <Loader2 size={12} className="spin" /> : <Zap size={12} />}
            Reactivar plan
          </button>
        </div>
      )}

      {/* ── One-time banner: just cancelled successfully (dismissable, once) ── */}
      {justCancelled && (
        <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>Suscripción cancelada</h3><p>Tu plan seguirá activo hasta el final del periodo de facturación.</p></div>
          <button onClick={() => setJustCancelled(false)} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {/* ── Activation processing banner ── */}
      {showSuccess && !isSubscribed && (
        <div className="billing-status billing-status--trial" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Loader2 size={20} className="spin" /></div>
          <div><h3>Activando tu suscripción...</h3><p>Estamos procesando tu pago. Esto puede tardar unos segundos.</p></div>
        </div>
      )}

      {/* ── Activation success banner (dismissable once, then gone forever) ── */}
      {showSuccess && isSubscribed && !statusDismissed && (
        <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>¡Suscripción activada!</h3><p>Tu plan está activo. Ya puedes disfrutar de todas las funcionalidades.</p></div>
          <button onClick={() => { setShowSuccess(false); dismissStatus(); }} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {/* ── Trial / expired banner (dismissable forever) ── */}
      {!showSuccess && !statusDismissed && !isCancelling && (isTrialActive || !isSubscribed) && (
        <div className={`billing-status ${isTrialActive ? 'billing-status--trial' : 'billing-status--expired'}`} style={{ position: 'relative' }}>
          <div className="billing-status__icon">
            {isTrialActive ? <Zap size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div>
            <h3>{isTrialActive ? `Periodo de prueba — ${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} restante${trialDaysLeft !== 1 ? 's' : ''}` : 'Suscripción expirada'}</h3>
            <p>{isTrialActive ? 'Disfruta de todas las funcionalidades. Elige un plan antes de que acabe.' : 'Tu periodo de prueba ha terminado. Elige un plan para continuar.'}</p>
          </div>
          <button onClick={dismissStatus} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {/* Card success banner */}
      {cardSuccess && (
        <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>Tarjeta actualizada</h3><p>Tu nuevo método de pago se ha guardado correctamente.</p></div>
          <button onClick={() => setCardSuccess(false)} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {/* Subscription & Payment Management */}
      {isSubscribed && profile?.stripe_customer_id && (
        <div className="billing-cards-grid">
          <div className="billing-card">
            <h4><Calendar size={15} /> Tu plan actual</h4>
            {customerInfo?.subscription ? (
              <>
                <div className="billing-card__detail">
                  <span>Estado</span>
                  <strong className={`billing-card__badge ${isCancelling ? 'billing-card__badge--yellow' : 'billing-card__badge--green'}`}>
                    {isCancelling ? 'Cancela pronto' : 'Activo'}
                  </strong>
                </div>
                <div className="billing-card__detail">
                  <span>{isCancelling ? 'Activo hasta' : 'Próxima factura'}</span>
                  <strong>{formatDate(customerInfo.subscription.currentPeriodEnd)}</strong>
                </div>
              </>
            ) : loadingInfo ? (
              <div className="billing-card__loading"><Loader2 size={16} className="spin" /></div>
            ) : (
              <p className="billing-card__empty">Plan activo</p>
            )}
          </div>

          <div className="billing-card">
            <h4><CreditCard size={15} /> Método de pago</h4>
            {customerInfo?.paymentMethods?.length > 0 ? (
              customerInfo.paymentMethods.map(pm => (
                <div key={pm.id} className="billing-card__pm">
                  <span className="billing-card__pm-brand">{pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)}</span>
                  <span className="billing-card__pm-num">•••• {pm.last4}</span>
                  <span className="billing-card__pm-exp">{pm.expMonth}/{pm.expYear}</span>
                </div>
              ))
            ) : loadingInfo ? (
              <div className="billing-card__loading"><Loader2 size={16} className="spin" /></div>
            ) : (
              <p className="billing-card__empty">No hay tarjeta</p>
            )}
            {!showCardForm ? (
              <button className="btn btn--outline btn--sm" onClick={() => setShowCardForm(true)} style={{ marginTop: '0.75rem' }}>
                <CreditCard size={12} /> {customerInfo?.paymentMethods?.length > 0 ? 'Cambiar tarjeta' : 'Añadir tarjeta'}
              </button>
            ) : (
              <div style={{ marginTop: '0.75rem' }}>
                <Elements stripe={stripePromise}>
                  <CardUpdateForm customerId={profile.stripe_customer_id} subscriptionId={profile.stripe_subscription_id} onSuccess={handleCardUpdated} onCancel={() => setShowCardForm(false)} />
                </Elements>
              </div>
            )}
          </div>

          <div className="billing-card">
            <h4><BarChart3 size={15} /> Mensajes</h4>
            <p className="billing-card__desc">Consulta tu uso de mensajes y añade packs extra.</p>
            <Link to="/app/mensajes" className="btn btn--primary btn--sm" style={{ marginTop: '0.75rem' }}>
              <MessageCircle size={12} /> Ver uso de mensajes
            </Link>
          </div>
        </div>
      )}

      {/* Cancel Subscription button (only if NOT already cancelling) */}
      {isSubscribed && profile?.stripe_customer_id && !isCancelling && (
        <div style={{ marginBottom: '1.5rem' }}>
          {!showCancelConfirm ? (
            <button className="btn btn--outline btn--sm" onClick={() => setShowCancelConfirm(true)} style={{ color: '#888', borderColor: '#333' }}>
              <XCircle size={12} /> Cancelar suscripción
            </button>
          ) : (
            <div className="billing-status billing-status--expired" style={{ position: 'relative' }}>
              <div className="billing-status__icon"><AlertTriangle size={20} /></div>
              <div style={{ flex: 1 }}>
                <h3>¿Seguro que quieres cancelar?</h3>
                <p>Tu agente de WhatsApp IA dejará de funcionar al final del periodo de facturación actual.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button className="btn btn--outline btn--sm" onClick={() => setShowCancelConfirm(false)}>No, mantener plan</button>
                  <button className="btn btn--sm" onClick={handleCancelSubscription} disabled={cancellingSubscription} style={{ background: 'var(--color-error)', color: '#fff' }}>
                    {cancellingSubscription ? <Loader2 size={12} className="spin" /> : <XCircle size={12} />}
                    Sí, cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      {customerInfo?.invoices?.length > 0 && (
        <>
          <h3 className="page__section-title"><FileText size={16} /> Facturas</h3>
          <div className="invoices-list">
            {customerInfo.invoices.map(inv => (
              <div key={inv.id} className="invoice-row">
                <div className="invoice-row__info">
                  <span className="invoice-row__number">{inv.number || inv.id.slice(-8)}</span>
                  <span className="invoice-row__date">{formatDate(inv.date)}</span>
                  {inv.description && <span className="invoice-row__desc">{inv.description}</span>}
                </div>
                <div className="invoice-row__right">
                  <span className={`invoice-row__status invoice-row__status--${inv.status}`}>{STATUS_MAP[inv.status] || inv.status}</span>
                  <span className="invoice-row__amount">{formatAmount(inv.amount, inv.currency)}</span>
                  {inv.pdfUrl && <a href={inv.pdfUrl} target="_blank" rel="noopener" className="btn btn--outline btn--xs"><Download size={12} /> PDF</a>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Plans */}
      <div className="billing-section-header">
        <h3 className="page__section-title"><Sparkles size={18} /> {isSubscribed ? 'Cambiar plan' : 'Elige tu plan'}</h3>
        <div className="billing-section-badges">
          <span className="billing-badge"><Shield size={12} /> Pago 100% seguro</span>
          <span className="billing-badge"><Zap size={12} /> Cancela cuando quieras</span>
        </div>
      </div>

      <div className="plans-grid">
        {PLANS.map(plan => {
          const isCurrent = customerInfo?.subscription?.items?.some(item => item.priceId === plan.priceId);
          return (
            <div key={plan.id} className={`plan-card ${plan.popular ? 'plan-card--popular' : ''} ${isCurrent ? 'plan-card--current' : ''}`}>
              {isCurrent && <span className="plan-card__badge plan-card__badge--current"><Check size={11} /> Tu plan actual</span>}
              {!isCurrent && plan.popular && <span className="plan-card__badge"><Star size={11} /> Más popular</span>}
              <h3>{plan.name}</h3>
              <div className="plan-card__price"><span>{plan.price}€</span>/mes</div>
              <div className="plan-card__highlights">
                <div className="plan-card__highlight"><Smartphone size={13} /><span>{plan.agents}</span></div>
                <div className="plan-card__highlight"><MessageCircle size={13} /><span>{plan.messages}</span></div>
              </div>
              <ul>{plan.features.map((f, i) => (<li key={i}><Check size={14} /> {f}</li>))}</ul>
              {isCurrent ? (
                <button className="btn btn--primary btn--full" disabled style={{ opacity: 0.6 }}><Check size={14} /> Plan activo</button>
              ) : (
                <button className="btn btn--outline btn--full" onClick={() => navigate(`/app/checkout?plan=${plan.id}&mode=subscription`)}>
                  Elegir {plan.name} <ArrowRight size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
