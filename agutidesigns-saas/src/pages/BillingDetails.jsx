import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  ArrowLeft, FileText, Save, Loader2, Check, AlertTriangle,
  CreditCard, Lock, Building, User, Mail, Phone, MapPin, Hash
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_URL = import.meta.env.VITE_API_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

/* ── Inline Card Form ── */
function CardForm({ customerId, subscriptionId, onSuccess, onCancel }) {
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
      if (!siRes.ok || !siData.clientSecret) throw new Error(siData.error || 'Error');
      const { error: stripeErr, setupIntent } = await stripe.confirmCardSetup(siData.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (stripeErr) throw new Error(stripeErr.message);
      const pmRes = await fetch(`${API_URL}/stripe-update-payment-method`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, paymentMethodId: setupIntent.payment_method, subscriptionId }),
      });
      const pmData = await pmRes.json();
      if (!pmRes.ok || !pmData.success) throw new Error(pmData.error || 'Error');
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

/* ── Main Page ── */
export default function BillingDetails() {
  const navigate = useNavigate();
  const { profile, isSubscribed } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardUpdated, setCardUpdated] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', taxId: '',
    line1: '', line2: '', city: '', state: '', postalCode: '', country: 'ES',
  });
  const [paymentMethods, setPaymentMethods] = useState([]);

  const loadData = useCallback(async () => {
    if (!profile?.stripe_customer_id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/stripe-customer-info`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: profile.stripe_customer_id }),
      });
      const data = await res.json();
      if (data.billingDetails) {
        const b = data.billingDetails;
        setForm({
          name: b.name || '', email: b.email || '', phone: b.phone || '', taxId: b.taxId || '',
          line1: b.address?.line1 || '', line2: b.address?.line2 || '',
          city: b.address?.city || '', state: b.address?.state || '',
          postalCode: b.address?.postalCode || '', country: b.address?.country || 'ES',
        });
      }
      if (data.paymentMethods) setPaymentMethods(data.paymentMethods);
    } catch {} finally {
      setLoading(false);
    }
  }, [profile?.stripe_customer_id]);

  useEffect(() => { loadData(); }, [loadData]);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!profile?.stripe_customer_id) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_URL}/stripe-update-customer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: profile.stripe_customer_id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          taxId: form.taxId,
          address: {
            line1: form.line1, line2: form.line2,
            city: form.city, state: form.state,
            postalCode: form.postalCode, country: form.country,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al guardar');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCardSuccess(card) {
    setShowCardForm(false);
    setCardUpdated(true);
    setTimeout(() => setCardUpdated(false), 3000);
    loadData();
  }

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <Loader2 size={24} className="spin" style={{ color: '#555' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/app/billing')}>
        <ArrowLeft size={16} /> Volver a Suscripción
      </button>

      <div className="page__header">
        <h1><FileText size={24} /> Datos de facturación</h1>
        <p>Estos datos aparecerán en tus facturas y recibos.</p>
      </div>

      {/* Success / Error banners */}
      {success && (
        <div className="billing-status billing-status--active" style={{ position: 'relative', marginBottom: '1rem' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>Datos guardados</h3><p>Tus datos de facturación se han actualizado correctamente.</p></div>
        </div>
      )}
      {cardUpdated && (
        <div className="billing-status billing-status--active" style={{ position: 'relative', marginBottom: '1rem' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>Tarjeta actualizada</h3><p>Tu nuevo método de pago se ha guardado.</p></div>
        </div>
      )}
      {error && (
        <div className="billing-status billing-status--expired" style={{ position: 'relative', marginBottom: '1rem' }}>
          <div className="billing-status__icon"><AlertTriangle size={20} /></div>
          <div><h3>Error</h3><p>{error}</p></div>
        </div>
      )}

      <div className="bd-grid">
        {/* Left: Billing info form */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 className="bd-section-title"><Building size={16} /> Información de facturación</h3>

          <div className="form-grid">
            <div className="form-field">
              <label><User size={12} /> Nombre o empresa</label>
              <input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Nombre completo o razón social" />
            </div>
            <div className="form-field">
              <label><Hash size={12} /> NIF / CIF / VAT</label>
              <input value={form.taxId} onChange={e => handleChange('taxId', e.target.value)} placeholder="B12345678 o ESB12345678" />
            </div>
            <div className="form-field">
              <label><Mail size={12} /> Email de facturación</label>
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} placeholder="facturacion@empresa.com" />
            </div>
            <div className="form-field">
              <label><Phone size={12} /> Teléfono</label>
              <input value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+34 600 000 000" />
            </div>
            <div className="form-field form-field--full">
              <label><MapPin size={12} /> Dirección (línea 1)</label>
              <input value={form.line1} onChange={e => handleChange('line1', e.target.value)} placeholder="Calle, número, piso" />
            </div>
            <div className="form-field form-field--full">
              <label><MapPin size={12} /> Dirección (línea 2)</label>
              <input value={form.line1 ? form.line2 : ''} onChange={e => handleChange('line2', e.target.value)} placeholder="Complemento (opcional)" />
            </div>
            <div className="form-field">
              <label>Ciudad</label>
              <input value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="Madrid" />
            </div>
            <div className="form-field">
              <label>Provincia</label>
              <input value={form.state} onChange={e => handleChange('state', e.target.value)} placeholder="Madrid" />
            </div>
            <div className="form-field">
              <label>Código postal</label>
              <input value={form.postalCode} onChange={e => handleChange('postalCode', e.target.value)} placeholder="28001" />
            </div>
            <div className="form-field">
              <label>País</label>
              <select value={form.country} onChange={e => handleChange('country', e.target.value)} style={{ width: '100%', padding: '0.65rem 0.9rem', background: '#0a0a0a', border: '1px solid #222', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.9rem' }}>
                <option value="ES">España</option>
                <option value="MX">México</option>
                <option value="AR">Argentina</option>
                <option value="CO">Colombia</option>
                <option value="CL">Chile</option>
                <option value="PE">Perú</option>
                <option value="US">Estados Unidos</option>
                <option value="GB">Reino Unido</option>
                <option value="FR">Francia</option>
                <option value="DE">Alemania</option>
                <option value="IT">Italia</option>
                <option value="PT">Portugal</option>
                <option value="BR">Brasil</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
              {saving ? 'Guardando...' : 'Guardar datos'}
            </button>
          </div>
        </div>

        {/* Right: Payment method */}
        <div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="bd-section-title"><CreditCard size={16} /> Método de pago</h3>

            {paymentMethods.length > 0 ? (
              paymentMethods.map(pm => (
                <div key={pm.id} className="billing-card__pm" style={{ padding: '0.75rem 0' }}>
                  <span className="billing-card__pm-brand">{pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1)}</span>
                  <span className="billing-card__pm-num">•••• {pm.last4}</span>
                  <span className="billing-card__pm-exp">{pm.expMonth}/{pm.expYear}</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.75rem' }}>No hay tarjeta guardada</p>
            )}

            {!showCardForm ? (
              <button className="btn btn--outline btn--sm" onClick={() => setShowCardForm(true)} style={{ marginTop: '0.5rem' }}>
                <CreditCard size={12} /> {paymentMethods.length > 0 ? 'Cambiar tarjeta' : 'Añadir tarjeta'}
              </button>
            ) : (
              <div style={{ marginTop: '0.75rem' }}>
                <Elements stripe={stripePromise}>
                  <CardForm
                    customerId={profile.stripe_customer_id}
                    subscriptionId={profile.stripe_subscription_id}
                    onSuccess={handleCardSuccess}
                    onCancel={() => setShowCardForm(false)}
                  />
                </Elements>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.25rem', marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#555', lineHeight: 1.5 }}>
              <Lock size={11} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
              Tus datos se almacenan de forma segura en Stripe. No guardamos datos de tarjeta en nuestros servidores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
