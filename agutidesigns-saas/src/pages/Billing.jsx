import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap, Check, AlertTriangle, ArrowRight, MessageCircle,
  Smartphone, Loader2, ExternalLink, CreditCard, Shield,
  Star, Sparkles, FileText, Download, Calendar, XCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

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

const BRAND_ICONS = { visa: '💳', mastercard: '💳', amex: '💳' };

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmount(cents, currency = 'eur') {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: currency.toUpperCase() });
}

export default function Billing() {
  const navigate = useNavigate();
  const { user, profile, isTrialActive, isSubscribed } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at) - new Date()) / 86400000))
    : 0;

  // Load customer info for subscribed users
  useEffect(() => {
    if (isSubscribed && profile?.stripe_customer_id && API_URL) {
      setLoadingInfo(true);
      fetch(`${API_URL}/stripe-customer-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profile.stripe_customer_id }),
      })
        .then(r => r.json())
        .then(data => { if (!data.error) setCustomerInfo(data); })
        .catch(() => {})
        .finally(() => setLoadingInfo(false));
    }
  }, [isSubscribed, profile?.stripe_customer_id]);

  async function handleManageSubscription() {
    if (!profile?.stripe_customer_id || !API_URL) return;
    setLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/stripe-portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ customerId: profile.stripe_customer_id, returnUrl: `${window.location.origin}/app/billing` }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) window.location.href = data.url;
      else alert('Error: ' + (data.error || `Error ${res.status}`));
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoadingPortal(false); }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const [showSuccess, setShowSuccess] = useState(urlParams.get('success') === 'true');
  const [showStatus, setShowStatus] = useState(true);
  const activatedRef = useRef(false);

  // Fallback: when returning from Stripe checkout with success, poll profile until active
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
          window.location.href = '/app/billing?success=true';
        }
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [showSuccess, isSubscribed, user?.id]);

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><CreditCard size={24} /> Suscripción</h1>
          <p>Gestiona tu plan, métodos de pago y facturación.</p>
        </div>
        {isSubscribed && profile?.stripe_customer_id && (
          <button className="btn btn--outline btn--sm" onClick={handleManageSubscription} disabled={loadingPortal} style={{ marginTop: '0.25rem' }}>
            {loadingPortal ? <Loader2 size={14} className="spin" /> : <ExternalLink size={14} />}
            Gestionar facturación
          </button>
        )}
      </div>

      {/* Single notification banner */}
      {showStatus && (() => {
        if (showSuccess && !isSubscribed) return (
          <div className="billing-status billing-status--trial" style={{ position: 'relative' }}>
            <div className="billing-status__icon"><Loader2 size={20} className="spin" /></div>
            <div><h3>Activando tu suscripción...</h3><p>Estamos procesando tu pago. Esto puede tardar unos segundos.</p></div>
            <button onClick={() => { setShowStatus(false); setShowSuccess(false); }} className="billing-status__close"><XCircle size={18} /></button>
          </div>
        );
        if (showSuccess && isSubscribed) return (
          <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
            <div className="billing-status__icon"><Check size={20} /></div>
            <div><h3>¡Suscripción activada!</h3><p>Tu plan está activo. Ya puedes disfrutar de todas las funcionalidades.</p></div>
            <button onClick={() => { setShowStatus(false); setShowSuccess(false); }} className="billing-status__close"><XCircle size={18} /></button>
          </div>
        );
        return (
          <div className={`billing-status ${isTrialActive ? 'billing-status--trial' : isSubscribed ? 'billing-status--active' : 'billing-status--expired'}`} style={{ position: 'relative' }}>
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
            <button onClick={() => setShowStatus(false)} className="billing-status__close"><XCircle size={18} /></button>
          </div>
        );
      })()}

      {/* Subscription & Payment Management */}
      {isSubscribed && profile?.stripe_customer_id && (
        <div className="billing-cards-grid">
          {/* Subscription details */}
          <div className="billing-card">
            <h4><Calendar size={15} /> Tu plan actual</h4>
            {customerInfo?.subscription ? (
              <>
                <div className="billing-card__detail">
                  <span>Estado</span>
                  <strong className="billing-card__badge billing-card__badge--green">Activo</strong>
                </div>
                <div className="billing-card__detail">
                  <span>Próxima factura</span>
                  <strong>{formatDate(customerInfo.subscription.currentPeriodEnd)}</strong>
                </div>
                {customerInfo.subscription.cancelAtPeriodEnd && (
                  <div className="billing-card__alert"><AlertTriangle size={13} /> Se cancela al final del periodo</div>
                )}
              </>
            ) : loadingInfo ? (
              <div className="billing-card__loading"><Loader2 size={16} className="spin" /></div>
            ) : (
              <p className="billing-card__empty">Plan activo</p>
            )}
            <button className="btn btn--outline btn--sm" onClick={handleManageSubscription} disabled={loadingPortal} style={{ marginTop: '0.75rem' }}>
              {loadingPortal ? <Loader2 size={12} className="spin" /> : <ExternalLink size={12} />} Gestionar plan
            </button>
          </div>

          {/* Payment methods */}
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
            <button className="btn btn--outline btn--sm" onClick={handleManageSubscription} disabled={loadingPortal} style={{ marginTop: '0.75rem' }}>
              <CreditCard size={12} /> Cambiar tarjeta
            </button>
          </div>

          {/* Usage link */}
          <div className="billing-card">
            <h4><BarChart3 size={15} /> Mensajes</h4>
            <p className="billing-card__desc">Consulta tu uso de mensajes y añade packs extra.</p>
            <Link to="/app/mensajes" className="btn btn--primary btn--sm" style={{ marginTop: '0.75rem' }}>
              <MessageCircle size={12} /> Ver uso de mensajes
            </Link>
          </div>
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
                </div>
                <div className="invoice-row__right">
                  <span className="invoice-row__amount">{formatAmount(inv.amount, inv.currency)}</span>
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener" className="btn btn--outline btn--xs"><Download size={12} /> PDF</a>
                  )}
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
                <button className="btn btn--primary btn--full" disabled style={{ opacity: 0.6 }}>
                  <Check size={14} /> Plan activo
                </button>
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
