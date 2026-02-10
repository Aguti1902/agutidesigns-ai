import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Send, Bot, FileText, ArrowRight, ArrowLeft,
  User, Building, Globe, Brain, Clock, Euro,
  CheckCircle, Loader2, Sparkles, Download, RefreshCw,
  MessageCircle, Mail
} from 'lucide-react';
import { sendAutomatedEmail } from '../../services/aiService';
import { calculatePrice, formatPrice } from '../../services/priceCalculator';
import Button from '../ui/Button';
import './QuoteForm.css';

const STEPS = [
  { id: 1, title: 'Tus datos', icon: <User size={18} /> },
  { id: 2, title: 'Tu negocio', icon: <Building size={18} /> },
  { id: 3, title: 'Tu proyecto', icon: <Globe size={18} /> },
  { id: 4, title: 'IA y extras', icon: <Brain size={18} /> },
  { id: 5, title: 'Detalles', icon: <FileText size={18} /> },
];

const webTypes = [
  { value: 'landing', label: 'Landing Page', desc: '1 página' },
  { value: 'corporativa', label: 'Web Corporativa', desc: '3-5 páginas' },
  { value: 'ecommerce', label: 'Tienda Online', desc: 'E-commerce' },
  { value: 'blog', label: 'Blog / Magazine', desc: 'Contenido' },
  { value: 'portfolio', label: 'Portfolio', desc: 'Trabajos' },
  { value: 'webapp', label: 'Web App', desc: 'Aplicación' },
  { value: 'otra', label: 'Otra', desc: 'Personalizado' },
];

const aiFeaturesList = [
  { value: 'chatbot', label: 'Chatbot IA 24/7' },
  { value: 'emails', label: 'Automatización de emails' },
  { value: 'quotes', label: 'Presupuestos automáticos' },
  { value: 'crm', label: 'CRM inteligente' },
  { value: 'analytics', label: 'Dashboard analytics' },
  { value: 'seo', label: 'SEO con IA' },
  { value: 'content', label: 'Generación de contenido IA' },
  { value: 'translations', label: 'Traducciones automáticas' },
];

const extraFeaturesList = [
  { value: 'multilang', label: 'Multiidioma' },
  { value: 'booking', label: 'Sistema de reservas' },
  { value: 'payments', label: 'Pasarela de pago' },
  { value: 'members', label: 'Área de miembros' },
  { value: 'social', label: 'Integración redes sociales' },
  { value: 'maps', label: 'Mapa / Localización' },
  { value: 'gallery', label: 'Galería avanzada' },
  { value: 'forms', label: 'Formularios avanzados' },
];

const budgetRanges = [
  { value: '500-1000', label: '500€ - 1.000€' },
  { value: '1000-2000', label: '1.000€ - 2.000€' },
  { value: '2000-5000', label: '2.000€ - 5.000€' },
  { value: '5000+', label: '5.000€+' },
  { value: 'no-se', label: 'No estoy seguro' },
];

const timelines = [
  { value: 'urgente', label: 'Lo antes posible (1-2 semanas)' },
  { value: 'normal', label: 'Normal (2-4 semanas)' },
  { value: 'flexible', label: 'Flexible (1-2 meses)' },
  { value: 'sin-prisa', label: 'Sin prisa' },
];

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  business: '',
  sector: '',
  hasCurrentWeb: false,
  currentWebUrl: '',
  webType: '',
  pages: '1-3',
  aiFeatures: [],
  extraFeatures: [],
  budgetRange: '',
  timeline: '',
  description: '',
};

export default function QuoteForm() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }));
  };

  const validateStep = () => {
    setError('');
    switch (step) {
      case 1:
        if (!formData.name.trim()) return setError('Por favor, introduce tu nombre');
        if (!formData.email.trim() || !formData.email.includes('@')) return setError('Por favor, introduce un email válido');
        break;
      case 2:
        if (!formData.business.trim()) return setError('Por favor, introduce el nombre de tu negocio');
        if (!formData.sector.trim()) return setError('Por favor, indica tu sector');
        break;
      case 3:
        if (!formData.webType) return setError('Por favor, selecciona el tipo de web');
        break;
      case 4:
        // AI features are optional
        break;
      case 5:
        if (!formData.budgetRange) return setError('Por favor, selecciona un rango de presupuesto');
        if (!formData.timeline) return setError('Por favor, selecciona un plazo');
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep() === true) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async () => {
    if (validateStep() !== true) return;
    
    setIsGenerating(true);
    setError('');

    try {
      const priceData = calculatePrice(formData);
      setQuote(priceData);

      await sendAutomatedEmail('quote', {
        name: formData.name,
        email: formData.email,
        quoteContent: `Presupuesto para ${formData.business || formData.name}:\n\n${priceData.breakdown.map(b => `${b.label}: ${formatPrice(b.price)}€`).join('\n')}\n\nTOTAL: ${formatPrice(priceData.total)}€\nMantenimiento: ${formatPrice(priceData.monthly)}€/mes`,
      });
    } catch (err) {
      setError('Ha habido un error generando el presupuesto. Por favor, inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
    setQuote(null);
    setError('');
  };

  return (
    <section id="presupuesto" className="quote section" ref={ref}>
      <div className="container container--narrow">
        {/* Header */}
        <motion.div
          className="quote__header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge--primary">
            <Sparkles size={12} />
            Proyecto Personalizado
          </span>
          <h2 className="quote__title">
            Tu proyecto a medida,
            <span className="text-primary"> presupuesto al instante</span>
          </h2>
          <p className="quote__subtitle">
            ¿Necesitas algo que no encaja en nuestros packs? Cuéntanos tu proyecto
            y nuestra IA genera un presupuesto detallado en segundos. Sin compromisos.
          </p>
        </motion.div>

        {/* Quote Result */}
        <AnimatePresence mode="wait">
          {quote ? (
            <motion.div
              className="quote__result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="result"
            >
              <div className="quote__result-header">
                <div className="quote__result-icon">
                  <CheckCircle size={24} />
                </div>
                <h3>Tu presupuesto, {formData.name}</h3>
                <p>Calculado en base a tus necesidades</p>
              </div>

              {/* Price Hero */}
              <div className="quote__result-price-hero">
                <span className="quote__result-price-label">Precio total del proyecto</span>
                <div className="quote__result-price-amount">
                  {formatPrice(quote.total)}<span>€</span>
                </div>
                <span className="quote__result-price-monthly">+ {formatPrice(quote.monthly)}€/mes mantenimiento</span>
              </div>

              {/* Breakdown */}
              <div className="quote__result-breakdown">
                <h4>Desglose</h4>
                <ul>
                  {quote.breakdown.map((item, i) => (
                    <li key={i}>
                      <span>{item.label}</span>
                      <span className={item.price < 0 ? 'quote__result-discount' : ''}>{item.price >= 0 ? '+' : ''}{formatPrice(item.price)}€</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="quote__result-note">
                <Mail size={16} />
                <span>Presupuesto enviado a <strong>{formData.email}</strong></span>
              </div>

              <div className="quote__result-actions quote__result-actions--stacked">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => alert('Integrar pasarela de pago (Stripe)')}
                  icon={<Sparkles size={16} />}
                >
                  Pagar y empezar — {formatPrice(quote.total)}€
                </Button>
                <a
                  href={`https://wa.me/34600000000?text=${encodeURIComponent(`¡Hola Guti! He recibido mi presupuesto de ${formatPrice(quote.total)}€ para "${formData.business}" y me gustaría hablar antes de empezar.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quote__result-whatsapp"
                >
                  <MessageCircle size={16} />
                  Hablar contigo antes de empezar
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  icon={<RefreshCw size={14} />}
                >
                  Calcular otro presupuesto
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="quote__form-wrapper"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              key="form"
            >
              {/* Progress Steps */}
              <div className="quote__progress">
                {STEPS.map((s) => (
                  <div
                    key={s.id}
                    className={`quote__progress-step ${
                      s.id === step ? 'quote__progress-step--active' : ''
                    } ${s.id < step ? 'quote__progress-step--done' : ''}`}
                  >
                    <div className="quote__progress-icon">{s.icon}</div>
                    <span className="quote__progress-label">{s.title}</span>
                  </div>
                ))}
                <div className="quote__progress-bar">
                  <div
                    className="quote__progress-fill"
                    style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Form Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  className="quote__step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {step === 1 && (
                    <div className="quote__fields">
                      <h3 className="quote__step-title">¿Cómo te llamas?</h3>
                      <p className="quote__step-desc">Cuéntanos un poco sobre ti para personalizar tu presupuesto.</p>
                      <div className="quote__field">
                        <label>Nombre completo *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => updateField('name', e.target.value)}
                          placeholder="Tu nombre"
                          className="quote__input"
                        />
                      </div>
                      <div className="quote__field">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => updateField('email', e.target.value)}
                          placeholder="tu@email.com"
                          className="quote__input"
                        />
                      </div>
                      <div className="quote__field">
                        <label>Teléfono (opcional)</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => updateField('phone', e.target.value)}
                          placeholder="+34 600 000 000"
                          className="quote__input"
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="quote__fields">
                      <h3 className="quote__step-title">Háblanos de tu negocio</h3>
                      <p className="quote__step-desc">Esto nos ayuda a entender tu sector y adaptar la propuesta.</p>
                      <div className="quote__field">
                        <label>Nombre del negocio / empresa *</label>
                        <input
                          type="text"
                          value={formData.business}
                          onChange={e => updateField('business', e.target.value)}
                          placeholder="Ej: Mi Restaurante, Clínica Dental López..."
                          className="quote__input"
                        />
                      </div>
                      <div className="quote__field">
                        <label>Sector *</label>
                        <input
                          type="text"
                          value={formData.sector}
                          onChange={e => updateField('sector', e.target.value)}
                          placeholder="Ej: Hostelería, Salud, Inmobiliaria, Fitness..."
                          className="quote__input"
                        />
                      </div>
                      <div className="quote__field">
                        <label className="quote__checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.hasCurrentWeb}
                            onChange={e => updateField('hasCurrentWeb', e.target.checked)}
                            className="quote__checkbox"
                          />
                          Ya tengo una web actualmente
                        </label>
                      </div>
                      {formData.hasCurrentWeb && (
                        <div className="quote__field">
                          <label>URL de tu web actual</label>
                          <input
                            type="url"
                            value={formData.currentWebUrl}
                            onChange={e => updateField('currentWebUrl', e.target.value)}
                            placeholder="https://..."
                            className="quote__input"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="quote__fields">
                      <h3 className="quote__step-title">¿Qué tipo de web necesitas?</h3>
                      <p className="quote__step-desc">Selecciona el que más se acerque a lo que buscas.</p>
                      <div className="quote__options-grid">
                        {webTypes.map(type => (
                          <button
                            key={type.value}
                            className={`quote__option ${formData.webType === type.value ? 'quote__option--selected' : ''}`}
                            onClick={() => updateField('webType', type.value)}
                          >
                            <span className="quote__option-label">{type.label}</span>
                            <span className="quote__option-desc">{type.desc}</span>
                          </button>
                        ))}
                      </div>
                      <div className="quote__field">
                        <label>Número de páginas estimado</label>
                        <select
                          value={formData.pages}
                          onChange={e => updateField('pages', e.target.value)}
                          className="quote__select"
                        >
                          <option value="1">1 página (Landing)</option>
                          <option value="1-3">1 - 3 páginas</option>
                          <option value="3-5">3 - 5 páginas</option>
                          <option value="5-10">5 - 10 páginas</option>
                          <option value="10+">Más de 10</option>
                          <option value="no-se">No estoy seguro</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="quote__fields">
                      <h3 className="quote__step-title">¿Qué funcionalidades IA quieres?</h3>
                      <p className="quote__step-desc">Selecciona las que te interesen. Puedes elegir varias.</p>
                      <div className="quote__chips">
                        {aiFeaturesList.map(f => (
                          <button
                            key={f.value}
                            className={`quote__chip ${formData.aiFeatures.includes(f.value) ? 'quote__chip--selected' : ''}`}
                            onClick={() => toggleArrayField('aiFeatures', f.value)}
                          >
                            <Brain size={14} />
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <h4 className="quote__step-subtitle">Funcionalidades extra</h4>
                      <div className="quote__chips">
                        {extraFeaturesList.map(f => (
                          <button
                            key={f.value}
                            className={`quote__chip ${formData.extraFeatures.includes(f.value) ? 'quote__chip--selected' : ''}`}
                            onClick={() => toggleArrayField('extraFeatures', f.value)}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="quote__fields">
                      <h3 className="quote__step-title">Últimos detalles</h3>
                      <p className="quote__step-desc">Casi terminamos. Esto nos ayuda a ajustar el presupuesto.</p>
                      <div className="quote__field">
                        <label>Presupuesto aproximado *</label>
                        <div className="quote__radio-group">
                          {budgetRanges.map(b => (
                            <label
                              key={b.value}
                              className={`quote__radio ${formData.budgetRange === b.value ? 'quote__radio--selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name="budget"
                                value={b.value}
                                checked={formData.budgetRange === b.value}
                                onChange={e => updateField('budgetRange', e.target.value)}
                              />
                              {b.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="quote__field">
                        <label>Plazo de entrega *</label>
                        <div className="quote__radio-group">
                          {timelines.map(t => (
                            <label
                              key={t.value}
                              className={`quote__radio ${formData.timeline === t.value ? 'quote__radio--selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name="timeline"
                                value={t.value}
                                checked={formData.timeline === t.value}
                                onChange={e => updateField('timeline', e.target.value)}
                              />
                              {t.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="quote__field">
                        <label>¿Algo más que debamos saber?</label>
                        <textarea
                          value={formData.description}
                          onChange={e => updateField('description', e.target.value)}
                          placeholder="Cuéntanos cualquier detalle adicional sobre tu proyecto..."
                          className="quote__textarea"
                          rows={4}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Error */}
              {error && (
                <motion.p
                  className="quote__error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}

              {/* Actions */}
              <div className="quote__actions">
                {step > 1 && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={prevStep}
                    icon={<ArrowLeft size={16} />}
                  >
                    Anterior
                  </Button>
                )}
                <div className="quote__actions-spacer" />
                {step < 5 ? (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={nextStep}
                    iconRight={<ArrowRight size={16} />}
                  >
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isGenerating}
                    icon={isGenerating ? <Loader2 size={18} className="spin" /> : <Bot size={18} />}
                  >
                    {isGenerating ? 'Generando presupuesto...' : 'Generar presupuesto con IA'}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
