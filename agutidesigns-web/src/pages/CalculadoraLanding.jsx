import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Globe, Smartphone, ShoppingCart, FileText,
  Bot, MessageCircle, Mail, Search, BarChart3, Shield, Zap,
  User, Phone, Building, Send, Loader2, CheckCircle, RefreshCw,
  Sparkles, Lock
} from 'lucide-react';
import { sendAutomatedEmail } from '../services/aiService';
import { calculatePrice, formatPrice } from '../services/priceCalculator';
import AIChatbot from '../components/chat/AIChatbot';
import './CalculadoraLanding.css';


/* ── Step Data ── */
const WEB_TYPES = [
  { id: 'landing', label: 'Landing Page', desc: '1 página enfocada a convertir', icon: <FileText size={20} /> },
  { id: 'corporativa', label: 'Web Corporativa', desc: '3-7 páginas para tu negocio', icon: <Globe size={20} /> },
  { id: 'ecommerce', label: 'Tienda Online', desc: 'Vende productos online', icon: <ShoppingCart size={20} /> },
  { id: 'portfolio', label: 'Portfolio', desc: 'Muestra tus trabajos', icon: <Smartphone size={20} /> },
];

const PAGE_OPTIONS = ['1', '1-3', '3-5', '5-10', '10+'];

const AI_FEATURES = [
  { id: 'chatbot-web', label: 'Chatbot IA en la web', icon: <Bot size={16} /> },
  { id: 'chatbot-wa', label: 'WhatsApp IA automatizado', icon: <MessageCircle size={16} /> },
  { id: 'emails', label: 'Automatización de emails', icon: <Mail size={16} /> },
  { id: 'seo', label: 'SEO con IA', icon: <Search size={16} /> },
  { id: 'analytics', label: 'Dashboard analytics', icon: <BarChart3 size={16} /> },
  { id: 'presupuestos', label: 'Presupuestos automáticos', icon: <Zap size={16} /> },
];

const EXTRA_FEATURES = [
  'Multiidioma',
  'Sistema de reservas',
  'Pasarela de pago',
  'Área de miembros',
  'Blog',
  'Galería avanzada',
  'Mapa / Localización',
  'Formularios avanzados',
];

const TIMELINES = [
  { id: 'urgente', label: 'Lo antes posible' },
  { id: 'normal', label: '2-4 semanas' },
  { id: 'flexible', label: '1-2 meses' },
  { id: 'sin-prisa', label: 'Sin prisa' },
];

const TOTAL_STEPS = 5;

export default function CalculadoraLanding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    webType: '',
    pages: '1-3',
    aiFeatures: [],
    extraFeatures: [],
    timeline: '',
    description: '',
    name: '',
    email: '',
    phone: '',
    business: '',
    sector: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const validate = () => {
    setError('');
    switch (step) {
      case 1:
        if (!formData.webType) return setError('Selecciona un tipo de web');
        break;
      case 2: break; // AI features optional
      case 3:
        if (!formData.timeline) return setError('Selecciona un plazo');
        break;
      case 4: break; // extras optional
      case 5:
        if (!formData.name.trim()) return setError('Introduce tu nombre');
        if (!formData.email.trim() || !formData.email.includes('@')) return setError('Introduce un email válido');
        if (!formData.phone.trim()) return setError('Introduce tu WhatsApp');
        break;
    }
    return true;
  };

  const next = () => { if (validate() === true) setStep(s => Math.min(s + 1, TOTAL_STEPS)); };
  const prev = () => { setStep(s => Math.max(s - 1, 1)); setError(''); };

  const handleSubmit = async () => {
    if (validate() !== true) return;
    setIsSubmitting(true);
    setError('');

    try {
      const priceData = calculatePrice(formData);
      setQuote(priceData);

      await sendAutomatedEmail('quote', {
        name: formData.name,
        email: formData.email,
        quoteContent: `Presupuesto para ${formData.business || formData.name}:\n\n${priceData.breakdown.map(b => `${b.label}: ${formatPrice(b.price)}€`).join('\n')}\n\nTOTAL: ${formatPrice(priceData.total)}€\nMantenimiento: ${formatPrice(priceData.monthly)}€/mes`,
      });
    } catch {
      setError('Ha habido un error. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFormData({ webType: '', pages: '1-3', aiFeatures: [], extraFeatures: [], timeline: '', description: '', name: '', email: '', phone: '', business: '', sector: '' });
    setStep(1);
    setQuote(null);
    setError('');
  };

  return (
    <div className="calc-landing">
      {/* Header */}
      <header className="calc-header">
        <a href="/" className="calc-header__logo">
          <img src="/images/Logo.png" alt="Agutidesigns" className="calc-header__logo-img" />
        </a>
      </header>

      <main className="calc-main">
        <AnimatePresence mode="wait">
          {quote ? (
            /* ── Result with real price ── */
            <motion.div
              className="calc-result"
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="calc-result__header">
                <CheckCircle size={40} className="calc-result__icon" />
                <h1>Tu presupuesto, {formData.name}</h1>
                <p>Calculado en base a tus necesidades</p>
              </div>

              {/* Price Hero */}
              <div className="calc-result__price-hero">
                <span className="calc-result__price-label">Precio total del proyecto</span>
                <div className="calc-result__price-amount">
                  {formatPrice(quote.total)}<span>€</span>
                </div>
                <span className="calc-result__price-monthly">+ {formatPrice(quote.monthly)}€/mes mantenimiento</span>
              </div>

              {/* Breakdown */}
              <div className="calc-result__breakdown">
                <h4>Desglose</h4>
                <ul>
                  {quote.breakdown.map((item, i) => (
                    <li key={i}>
                      <span>{item.label}</span>
                      <span className={item.price < 0 ? 'calc-result__discount' : ''}>{item.price >= 0 ? '+' : ''}{formatPrice(item.price)}€</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="calc-result__email">
                <Mail size={14} />
                <span>Presupuesto enviado a <strong>{formData.email}</strong></span>
              </div>

              {/* Action Buttons */}
              <div className="calc-result__actions">
                <button className="calc-btn calc-btn--pay" onClick={() => alert('Integrar pasarela de pago (Stripe)')}>
                  <Zap size={18} />
                  Pagar y empezar — {formatPrice(quote.total)}€
                </button>
                <a
                  href={`https://wa.me/34600000000?text=${encodeURIComponent(`¡Hola Guti! He recibido mi presupuesto de ${formatPrice(quote.total)}€ para "${formData.business || 'mi negocio'}" y me gustaría hablar antes de empezar.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calc-btn calc-btn--whatsapp"
                >
                  <MessageCircle size={18} />
                  Hablar contigo antes de empezar
                </a>
              </div>

              <button className="calc-btn calc-btn--ghost calc-result__reset" onClick={reset}>
                <RefreshCw size={14} /> Calcular otro presupuesto
              </button>
            </motion.div>
          ) : (
            /* ── Form ── */
            <motion.div
              className="calc-form"
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Top */}
              <div className="calc-form__top">
                <span className="calc-badge"><Sparkles size={12} /> Calculadora IA</span>
                <h1 className="calc-form__title">
                  Calcula el precio de tu
                  <span className="text-primary"> web + IA</span>
                </h1>
                <p className="calc-form__subtitle">
                  Configura lo que necesitas en {TOTAL_STEPS} pasos y recibe un presupuesto personalizado al instante.
                </p>
              </div>

              {/* Progress */}
              <div className="calc-progress">
                <div className="calc-progress__bar">
                  <div className="calc-progress__fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="calc-progress__label">Paso {step} de {TOTAL_STEPS}</span>
              </div>

              {/* Steps */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="calc-step"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Step 1: Web Type */}
                  {step === 1 && (
                    <>
                      <h2 className="calc-step__title">¿Qué tipo de web necesitas?</h2>
                      <div className="calc-options calc-options--2col">
                        {WEB_TYPES.map(t => (
                          <button
                            key={t.id}
                            className={`calc-option ${formData.webType === t.id ? 'calc-option--active' : ''}`}
                            onClick={() => updateField('webType', t.id)}
                          >
                            <div className="calc-option__icon">{t.icon}</div>
                            <div>
                              <span className="calc-option__label">{t.label}</span>
                              <span className="calc-option__desc">{t.desc}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="calc-field">
                        <label>Número de páginas</label>
                        <div className="calc-pills">
                          {PAGE_OPTIONS.map(p => (
                            <button
                              key={p}
                              className={`calc-pill ${formData.pages === p ? 'calc-pill--active' : ''}`}
                              onClick={() => updateField('pages', p)}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 2: AI Features */}
                  {step === 2 && (
                    <>
                      <h2 className="calc-step__title">¿Qué funcionalidades IA quieres?</h2>
                      <p className="calc-step__desc">Selecciona las que te interesen. Son opcionales.</p>
                      <div className="calc-chips">
                        {AI_FEATURES.map(f => (
                          <button
                            key={f.id}
                            className={`calc-chip ${formData.aiFeatures.includes(f.id) ? 'calc-chip--active' : ''}`}
                            onClick={() => toggleArray('aiFeatures', f.id)}
                          >
                            {f.icon} {f.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Step 3: Timeline */}
                  {step === 3 && (
                    <>
                      <h2 className="calc-step__title">¿Para cuándo lo necesitas?</h2>
                      <div className="calc-options calc-options--2col">
                        {TIMELINES.map(t => (
                          <button
                            key={t.id}
                            className={`calc-option calc-option--compact ${formData.timeline === t.id ? 'calc-option--active' : ''}`}
                            onClick={() => updateField('timeline', t.id)}
                          >
                            <span className="calc-option__label">{t.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="calc-field">
                        <label>Extras (opcional)</label>
                        <div className="calc-chips">
                          {EXTRA_FEATURES.map(f => (
                            <button
                              key={f}
                              className={`calc-chip calc-chip--sm ${formData.extraFeatures.includes(f) ? 'calc-chip--active' : ''}`}
                              onClick={() => toggleArray('extraFeatures', f)}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Step 4: Description */}
                  {step === 4 && (
                    <>
                      <h2 className="calc-step__title">Cuéntanos más sobre tu proyecto</h2>
                      <p className="calc-step__desc">Opcional pero nos ayuda a darte un presupuesto más preciso.</p>
                      <div className="calc-field">
                        <label>Sector de tu negocio</label>
                        <input
                          type="text"
                          className="calc-input"
                          placeholder="Ej: Hostelería, Salud, Inmobiliaria..."
                          value={formData.sector}
                          onChange={e => updateField('sector', e.target.value)}
                        />
                      </div>
                      <div className="calc-field">
                        <label>Descripción del proyecto</label>
                        <textarea
                          className="calc-textarea"
                          placeholder="¿Algo específico que debamos saber? Funcionalidades especiales, referencia de webs que te gusten..."
                          rows={4}
                          value={formData.description}
                          onChange={e => updateField('description', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {/* Step 5: Contact */}
                  {step === 5 && (
                    <>
                      <h2 className="calc-step__title">Último paso: tus datos</h2>
                      <p className="calc-step__desc">Para enviarte el presupuesto detallado por email y WhatsApp.</p>
                      <div className="calc-field">
                        <label><User size={14} /> Nombre *</label>
                        <input type="text" className="calc-input" placeholder="Tu nombre" value={formData.name} onChange={e => updateField('name', e.target.value)} />
                      </div>
                      <div className="calc-field">
                        <label><Mail size={14} /> Email *</label>
                        <input type="email" className="calc-input" placeholder="tu@email.com" value={formData.email} onChange={e => updateField('email', e.target.value)} />
                      </div>
                      <div className="calc-field">
                        <label><Phone size={14} /> WhatsApp *</label>
                        <input type="tel" className="calc-input" placeholder="+34 600 000 000" value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                      </div>
                      <div className="calc-field">
                        <label><Building size={14} /> Nombre de tu negocio</label>
                        <input type="text" className="calc-input" placeholder="Ej: Mi Restaurante..." value={formData.business} onChange={e => updateField('business', e.target.value)} />
                      </div>
                      <div className="calc-privacy">
                        <Lock size={12} />
                        <span>Tus datos están seguros. No compartimos información con terceros.</span>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Error */}
              {error && <p className="calc-error">{error}</p>}

              {/* Navigation */}
              <div className="calc-nav">
                {step > 1 && (
                  <button className="calc-btn calc-btn--ghost" onClick={prev}>
                    <ArrowLeft size={16} /> Anterior
                  </button>
                )}
                <div className="calc-nav__spacer" />
                {step < TOTAL_STEPS ? (
                  <button className="calc-btn calc-btn--primary" onClick={next}>
                    Siguiente <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="calc-btn calc-btn--primary calc-btn--lg"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={18} className="spin" /> Generando presupuesto...</>
                    ) : (
                      <><Bot size={18} /> Ver mi presupuesto</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer mini */}
      <footer className="calc-footer">
        <span>© {new Date().getFullYear()} Agutidesigns · <a href="/">Volver a la web</a></span>
      </footer>

      <AIChatbot />
    </div>
  );
}
