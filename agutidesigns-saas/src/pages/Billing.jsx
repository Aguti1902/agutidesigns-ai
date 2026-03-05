import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Zap, Check, AlertTriangle, ArrowRight, MessageCircle,
  Smartphone, Loader2, CreditCard, Shield,
  Star, Sparkles, FileText, Download, Calendar, XCircle,
  BarChart3, Lock, Clock, ChevronDown, ChevronUp,
  Package, Crown, Infinity, RefreshCw, Trash2,
  Flame, Lightbulb, Rocket
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_URL = import.meta.env.VITE_API_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

const PLANS = [
  {
    id: 'starter', name: 'Starter',
    price: '29',       priceId: 'price_1T1qSzFjBSJ299OpJBLCMTrn',
    priceAnnual: '24', priceIdAnnual: 'price_1T6ioWFjBSJ299OpXuEpXFbj',
    icon: <Package size={20} />,
    color: '#60a5fa',
    agents: '1 número de WhatsApp', messages: '1.000 mensajes/mes',
    features: ['1 agente IA (1 número WhatsApp)', '1.000 mensajes/mes incluidos', '1 prompt personalizado', 'Presupuestos en PDF', 'Soporte por email', 'Dashboard básico'],
  },
  {
    id: 'pro', name: 'Pro',
    price: '79',       priceId: 'price_1T1qTcFjBSJ299OpSxVO6ZFM', popular: true,
    priceAnnual: '66', priceIdAnnual: 'price_1T6ioXFjBSJ299OpDFsxfPMr',
    icon: <Crown size={20} />,
    color: '#25D366',
    agents: '3 números de WhatsApp', messages: '3.000 mensajes/mes',
    features: ['3 agentes IA (3 números WhatsApp)', '3.000 mensajes/mes incluidos', 'Prompt independiente por agente', 'Presupuestos + facturas PDF', 'Soporte prioritario', 'Dashboard avanzado', 'CRM completo + etiquetas'],
  },
  {
    id: 'agency', name: 'Agency',
    price: '149',       priceId: 'price_1T1qU1FjBSJ299OpTOdjIRya',
    priceAnnual: '124', priceIdAnnual: 'price_1T6ioXFjBSJ299OpVkAwU2Ds',
    icon: <Infinity size={20} />,
    color: '#a78bfa',
    agents: 'Agentes ilimitados', messages: '8.000 mensajes/mes',
    features: ['Agentes ilimitados (WhatsApp ilimitados)', '8.000 mensajes/mes incluidos', 'Todo lo de Pro', 'Marca blanca', 'API personalizada', 'Soporte 24/7 dedicado', 'Onboarding personalizado'],
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
  const [showInvoices, setShowInvoices] = useState(true);

  const [annual, setAnnual] = useState(false);

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

  const urlParams = new URLSearchParams(window.location.search);
  const [showSuccess, setShowSuccess] = useState(urlParams.get('success') === 'true');
  const activatedRef = useRef(false);
  const conversionFiredRef = useRef(false);

  useEffect(() => {
    if (showSuccess && isSubscribed && !conversionFiredRef.current) {
      conversionFiredRef.current = true;
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: 'AW-17960619497/JBIpCN6ayPobEOmbpfRC',
          value: 1.0, currency: 'EUR', transaction_id: user?.id || '',
        });
      }
    }
  }, [showSuccess, isSubscribed]);

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
          try { localStorage.removeItem('billing_status_dismissed'); } catch {}
          window.location.href = '/app/billing?success=true';
        }
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [showSuccess, isSubscribed, user?.id]);

  const isCancelling = customerInfo?.subscription?.cancelAtPeriodEnd;
  const cancelDaysLeft = isCancelling ? daysUntil(customerInfo.subscription.currentPeriodEnd) : 0;

  // Determine current plan and billing cycle
  const currentPlan = PLANS.find(p =>
    customerInfo?.subscription?.items?.some(item => item.priceId === p.priceId || item.priceId === p.priceIdAnnual)
  ) || (isSubscribed ? PLANS[1] : null);

  // Check if current subscription is annual or monthly
  const currentCycle = customerInfo?.subscription?.items?.some(item =>
    PLANS.some(p => item.priceId === p.priceIdAnnual)
  ) ? 'annual' : 'monthly';

  const pm = customerInfo?.paymentMethods?.[0];

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1><CreditCard size={24} /> Suscripción</h1>
          <p>Gestiona tu plan, métodos de pago y facturación.</p>
        </div>
      </div>

      {/* ── Banners ── */}
      {isCancelling && (
        <div className="billing-status billing-status--warning">
          <div className="billing-status__icon"><Clock size={20} /></div>
          <div style={{ flex: 1 }}>
            <h3>Tu plan se cancela en {cancelDaysLeft} día{cancelDaysLeft !== 1 ? 's' : ''}</h3>
            <p>Tienes acceso hasta el {formatDate(customerInfo.subscription.currentPeriodEnd)}. Después tu agente se desactivará.</p>
          </div>
          <button className="btn btn--sm" onClick={handleReactivate} disabled={reactivating}
            style={{ background: '#f59e0b', color: '#000', fontWeight: 700, flexShrink: 0 }}>
            {reactivating ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
            Reactivar plan
          </button>
        </div>
      )}

      {justCancelled && (
        <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>Suscripción cancelada</h3><p>Tu plan seguirá activo hasta el final del periodo de facturación.</p></div>
          <button onClick={() => setJustCancelled(false)} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {showSuccess && !isSubscribed && (
        <div className="billing-status billing-status--trial">
          <div className="billing-status__icon"><Loader2 size={20} className="spin" /></div>
          <div><h3>Activando tu suscripción...</h3><p>Estamos procesando tu pago. Esto puede tardar unos segundos.</p></div>
        </div>
      )}

      {showSuccess && isSubscribed && !statusDismissed && (
        <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>¡Suscripción activada!</h3><p>Tu plan está activo. Ya puedes disfrutar de todas las funcionalidades.</p></div>
          <button onClick={() => { setShowSuccess(false); dismissStatus(); }} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {!showSuccess && !statusDismissed && !isCancelling && !isSubscribed && (
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

      {cardSuccess && (
        <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>Tarjeta actualizada</h3><p>Tu nuevo método de pago se ha guardado correctamente.</p></div>
          <button onClick={() => setCardSuccess(false)} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {/* ══ TU SUSCRIPCIÓN ACTUAL ══ */}
      {isSubscribed && (
        <>
          <h3 className="page__section-title" style={{ marginBottom: '0.75rem' }}>
            <Crown size={16} /> Tu suscripción activa
          </h3>

          {/* Plan hero */}
          <div className="sub-hero" style={{ '--plan-color': currentPlan?.color || '#25D366' }}>
            {loadingInfo && !currentPlan ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={22} className="spin" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ) : (
              <>
                <div className="sub-hero__left">
                  <div className="sub-hero__icon" style={{ background: `${currentPlan?.color || '#25D366'}20`, color: currentPlan?.color || '#25D366' }}>
                    {currentPlan?.icon || <Crown size={22} />}
                  </div>
                  <div>
                    <div className="sub-hero__label">Plan actual</div>
                    <div className="sub-hero__name">{currentPlan?.name || 'Pro'}</div>
                    <div className="sub-hero__price">{currentPlan?.price || '79'}€<span>/mes</span></div>
                  </div>
                  <div className={`sub-hero__status ${isCancelling ? 'sub-hero__status--cancelling' : 'sub-hero__status--active'}`}>
                    {isCancelling ? <><Clock size={11} /> Cancela pronto</> : <><Check size={11} /> Activo</>}
                  </div>
                </div>

                <div className="sub-hero__divider" />

                <div className="sub-hero__features">
                  {currentPlan?.features?.slice(0, 4).map((f, i) => (
                    <div key={i} className="sub-hero__feature">
                      <Check size={13} style={{ color: currentPlan?.color || '#25D366', flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div className="sub-hero__divider" />

                <div className="sub-hero__meta">
                  <div className="sub-hero__meta-row">
                    <Calendar size={13} />
                    <span>{isCancelling ? 'Acceso hasta' : 'Próxima factura'}</span>
                    <strong>{formatDate(customerInfo?.subscription?.currentPeriodEnd)}</strong>
                  </div>
                  {pm && (
                    <div className="sub-hero__meta-row">
                      <CreditCard size={13} />
                      <span>Método de pago</span>
                      <strong>{pm.brand?.charAt(0).toUpperCase() + pm.brand?.slice(1)} •••• {pm.last4}</strong>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Gestión: cambiar tarjeta + cancelar */}
          <div className="sub-actions">
            <div className="sub-actions__group">
              <span className="sub-actions__label">Gestionar suscripción</span>
              <div className="sub-actions__btns">
                <button className="btn btn--outline btn--sm" onClick={() => setShowCardForm(v => !v)}>
                  <CreditCard size={13} /> {showCardForm ? 'Cancelar' : pm ? 'Cambiar tarjeta' : 'Añadir tarjeta'}
                </button>
                {!isCancelling && (
                  <button className="btn btn--outline btn--sm sub-actions__cancel-btn"
                    onClick={() => setShowCancelConfirm(v => !v)}>
                    <Trash2 size={13} /> Cancelar plan
                  </button>
                )}
                {isCancelling && (
                  <button className="btn btn--sm" onClick={handleReactivate} disabled={reactivating}
                    style={{ background: '#f59e0b', color: '#000', fontWeight: 700 }}>
                    {reactivating ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />}
                    Reactivar plan
                  </button>
                )}
              </div>
            </div>

            {showCardForm && (
              <div className="sub-actions__form">
                <Elements stripe={stripePromise}>
                  <CardUpdateForm
                    customerId={profile.stripe_customer_id}
                    subscriptionId={profile.stripe_subscription_id}
                    onSuccess={handleCardUpdated}
                    onCancel={() => setShowCardForm(false)}
                  />
                </Elements>
              </div>
            )}

            {showCancelConfirm && (
              <div className="sub-actions__confirm">
                <div className="sub-actions__confirm-icon"><AlertTriangle size={18} /></div>
                <div style={{ flex: 1 }}>
                  <p className="sub-actions__confirm-title">¿Seguro que quieres cancelar?</p>
                  <p className="sub-actions__confirm-desc">Tu agente dejará de funcionar al final del periodo actual ({formatDate(customerInfo?.subscription?.currentPeriodEnd)}).</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn--outline btn--sm" onClick={() => setShowCancelConfirm(false)}>No, mantener plan</button>
                    <button className="btn btn--sm" onClick={handleCancelSubscription} disabled={cancellingSubscription}
                      style={{ background: 'var(--color-error)', color: '#fff' }}>
                      {cancellingSubscription ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                      Sí, cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ FACTURAS ══ */}
      {isSubscribed && (
        <div className="invoices-section">
          <button className="invoices-section__header" onClick={() => setShowInvoices(v => !v)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} />
              <span>Facturas y recibos</span>
              {customerInfo?.invoices?.length > 0 && (
                <span className="invoices-section__count">{customerInfo.invoices.length}</span>
              )}
            </div>
            {showInvoices ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showInvoices && (
            <div className="invoices-section__body">
              {loadingInfo ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader2 size={18} className="spin" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              ) : customerInfo?.invoices?.length > 0 ? (
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th>Importe</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInfo.invoices.map(inv => (
                      <tr key={inv.id}>
                        <td><span className="invoices-table__num">{inv.number || inv.id.slice(-8)}</span></td>
                        <td><span className="invoices-table__date">{formatDate(inv.date)}</span></td>
                        <td><span className="invoices-table__desc">{inv.description || '—'}</span></td>
                        <td>
                          <span className={`invoice-row__status invoice-row__status--${inv.status}`}>
                            {STATUS_MAP[inv.status] || inv.status}
                          </span>
                        </td>
                        <td><strong className="invoices-table__amount">{formatAmount(inv.amount, inv.currency)}</strong></td>
                        <td>
                          {inv.pdfUrl ? (
                            <a href={inv.pdfUrl} target="_blank" rel="noopener" className="btn btn--outline btn--xs invoices-table__dl">
                              <Download size={12} /> PDF
                            </a>
                          ) : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="invoices-section__empty">
                  Aún no hay facturas. Las recibirás tras cada renovación de suscripción.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ COMPRAR MENSAJES EXTRA ══ */}
      <div className="billing-section-header" style={{ marginTop: '2rem' }}>
        <h3 className="page__section-title"><MessageCircle size={18} /> Comprar mensajes extra</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Si tu agente IA alcanza el límite mensual, se pausa automáticamente. Los packs se suman a tu cuota y no caducan hasta agotar.
        </p>
      </div>

      {!isSubscribed ? (
        <div className="msg-packs-locked">
          <Lock size={22} />
          <b>Solo disponible con suscripción activa</b>
          <p>Suscríbete a un plan para poder comprar packs de mensajes extra.</p>
          <button className="btn btn--primary" onClick={() => document.getElementById('planes-section')?.scrollIntoView({ behavior: 'smooth' })}>
            Ver planes <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <div className="msg-packs">
          {[
            { id: 'pack-500',   label: '500 mensajes',    price: '9€',  tag: null,                                credits: 500,   perMsg: '1,8 ct/msg' },
            { id: 'pack-1000',  label: '1.000 mensajes',  price: '15€', tag: { Icon: Flame,     text: 'Popular' },    credits: 1000,  perMsg: '1,5 ct/msg' },
            { id: 'pack-5000',  label: '5.000 mensajes',  price: '49€', tag: { Icon: Lightbulb, text: 'Mejor precio'}, credits: 5000,  perMsg: '0,98 ct/msg' },
            { id: 'pack-10000', label: '10.000 mensajes', price: '79€', tag: { Icon: Rocket,    text: 'Agencias' },   credits: 10000, perMsg: '0,79 ct/msg' },
          ].map(pack => (
            <div key={pack.id} className={`msg-pack-card ${pack.tag ? 'msg-pack-card--featured' : ''}`}>
              {pack.tag && <span className="msg-pack-card__tag"><pack.tag.Icon size={11} /> {pack.tag.text}</span>}
              <div className="msg-pack-card__label">{pack.label}</div>
              <div className="msg-pack-card__price">{pack.price}</div>
              <div className="msg-pack-card__per">{pack.perMsg}</div>
              <button className="btn btn--primary btn--full"
                onClick={() => navigate(`/app/checkout?plan=${pack.id}&mode=payment`)}>
                <Zap size={13} /> Comprar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ══ PLANES ══ */}
      <div id="planes-section" className="billing-section-header" style={{ marginTop: '2rem' }}>
        <h3 className="page__section-title"><Sparkles size={18} /> {isSubscribed ? 'Cambiar plan' : 'Elige tu plan'}</h3>
        <div className="billing-section-badges">
          <span className="billing-badge"><Shield size={12} /> Pago 100% seguro</span>
          <span className="billing-badge"><Zap size={12} /> Cancela cuando quieras</span>
        </div>
      </div>

      {/* Toggle mensual / anual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.88rem', color: annual ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: annual ? 400 : 600 }}>Mensual</span>
        <button
          onClick={() => setAnnual(v => !v)}
          style={{
            width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative',
            background: annual ? '#25D366' : 'var(--bg-input)', transition: 'background 0.2s',
          }}
          aria-label="Toggle anual"
        >
          <span style={{
            position: 'absolute', top: '3px', left: annual ? '23px' : '3px',
            width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s', display: 'block',
          }} />
        </button>
        <span style={{ fontSize: '0.88rem', color: annual ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: annual ? 600 : 400 }}>
          Anual <span style={{ fontSize: '0.75rem', background: 'rgba(37,211,102,0.15)', color: '#25D366', padding: '1px 7px', borderRadius: '20px', fontWeight: 700 }}>2 meses gratis</span>
        </span>
      </div>

      <div className="plans-grid">
        {PLANS.map(plan => {
          const selectedCycle = annual ? 'annual' : 'monthly';
          // isCurrent = same plan tier AND same billing cycle
          const isCurrent = isSubscribed && plan.id === currentPlan?.id && currentCycle === selectedCycle;
          // isSamePlanDifferentCycle = same plan but switching cycle (e.g. monthly→annual)
          const isSamePlanDifferentCycle = isSubscribed && plan.id === currentPlan?.id && currentCycle !== selectedCycle;
          const displayPrice = annual ? plan.priceAnnual : plan.price;
          const activePriceId = annual ? plan.priceIdAnnual : plan.priceId;

          let btnLabel, btnClass;
          if (isCurrent) {
            btnLabel = <><Check size={14} /> Tu plan actual</>;
            btnClass = 'btn btn--primary btn--full';
          } else if (isSamePlanDifferentCycle) {
            btnLabel = annual
              ? <><Sparkles size={14} /> Cambiar a anual (2 meses gratis) <ArrowRight size={14} /></>
              : <><ArrowRight size={14} /> Cambiar a mensual</>;
            btnClass = annual ? 'btn btn--primary btn--full' : 'btn btn--outline btn--full';
          } else {
            btnLabel = <>{isSubscribed ? `Cambiar a ${plan.name}` : `Elegir ${plan.name}`} <ArrowRight size={14} /></>;
            btnClass = 'btn btn--outline btn--full';
          }

          return (
            <div key={plan.id} className={`plan-card ${plan.popular && !isCurrent ? 'plan-card--popular' : ''} ${isCurrent ? 'plan-card--current' : ''}`}>
              {isCurrent && <span className="plan-card__badge plan-card__badge--current"><Check size={11} /> Plan seleccionado</span>}
              {!isCurrent && plan.popular && <span className="plan-card__badge"><Star size={11} /> Más popular</span>}
              <h3>{plan.name}</h3>
              <div className="plan-card__price">
                <span>{displayPrice}€</span>/mes
                {annual && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>({Math.round(displayPrice * 12)}€ facturado anualmente)</div>}
              </div>
              <div className="plan-card__highlights">
                <div className="plan-card__highlight"><Smartphone size={13} /><span>{plan.agents}</span></div>
                <div className="plan-card__highlight"><MessageCircle size={13} /><span>{plan.messages}</span></div>
              </div>
              <ul>{plan.features.map((f, i) => (<li key={i}><Check size={14} /> {f}</li>))}</ul>
              <button
                className={btnClass}
                disabled={isCurrent}
                style={isCurrent ? { opacity: 0.55, cursor: 'default' } : {}}
                onClick={isCurrent ? undefined : () => navigate(`/app/checkout?plan=${plan.id}&priceId=${activePriceId}&mode=subscription&cycle=${selectedCycle}`)}>
                {btnLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
