import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ArrowUp, Send, MessageCircle, Loader2,
  CheckCircle, Phone, Mail, User, Building, Zap
} from 'lucide-react';
import { sendAutomatedEmail } from '../../services/aiService';
import Button from '../ui/Button';
import './PackCheckout.css';

const WHATSAPP_NUMBER = '34600000000'; // Cambiar por tu número real

export default function PackCheckout({ selectedPack, onChangePack, whatsappPlan = null }) {
  const sectionRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    business: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedPack && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    setIsSubmitted(false);
    setError('');
  }, [selectedPack]);

  if (!selectedPack) return null;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) return setError('Introduce tu nombre');
    if (!formData.email.trim() || !formData.email.includes('@')) return setError('Introduce un email válido');
    if (!formData.phone.trim()) return setError('Introduce tu WhatsApp para contactarte');

    setIsSubmitting(true);

    try {
      await sendAutomatedEmail('price_request', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        business: formData.business,
        packName: selectedPack.name,
        whatsappPlan: whatsappPlan ? `${whatsappPlan.label} (${whatsappPlan.messages} msgs/mes)` : 'No',
      });

      setIsSubmitted(true);
    } catch (err) {
      setError('Ha habido un error. Inténtalo de nuevo o contáctanos por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppUrl = () => {
    const waPart = whatsappPlan
      ? `\n+ WhatsApp IA: ${whatsappPlan.label} (${whatsappPlan.messages.toLocaleString('es-ES')} msgs/mes)`
      : '';
    const message = encodeURIComponent(
      `¡Hola Guti! Me interesa el ${selectedPack.name} para mi negocio${formData.business ? ` "${formData.business}"` : ''}.${waPart}\n\n¿Puedes pasarme el precio?`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  };

  return (
    <section id="contratar" className="checkout section" ref={sectionRef}>
      <div className="container">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              className="checkout__success"
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="checkout__success-icon">
                <CheckCircle size={48} />
              </div>
              <h3 className="checkout__success-title">
                ¡Genial, {formData.name}!
              </h3>
              <p className="checkout__success-text">
                Te enviaremos el precio personalizado de tu <strong>{selectedPack.name}</strong>
                {whatsappPlan && <> + WhatsApp IA</>} a tu email y WhatsApp en menos de 24h.
              </p>
              <p className="checkout__success-email">
                Revisa <strong>{formData.email}</strong> y tu WhatsApp <strong>{formData.phone}</strong>
              </p>
              <div className="checkout__success-actions">
                <Button
                  variant="primary"
                  size="md"
                  href={getWhatsAppUrl()}
                  icon={<MessageCircle size={16} />}
                >
                  Escribir por WhatsApp ahora
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="checkout__wrapper"
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header */}
              <div className="checkout__header">
                <h2 className="checkout__title">
                  Consultar precio de
                  <span className="text-primary"> {selectedPack.name}</span>
                </h2>
                <p className="checkout__subtitle">
                  Déjanos tus datos y te enviamos un precio personalizado sin compromiso.
                  O si prefieres, escríbenos directamente por WhatsApp.
                </p>
              </div>

              <div className="checkout__grid">
                {/* Left - Summary */}
                <div className="checkout__summary">
                  <div className="checkout__summary-header">
                    <div className="checkout__summary-icon">{selectedPack.icon}</div>
                    <div>
                      <h3 className="checkout__summary-name">{selectedPack.name}</h3>
                      <p className="checkout__summary-desc">{selectedPack.description}</p>
                    </div>
                  </div>

                  <h4 className="checkout__summary-includes">Incluye:</h4>
                  <ul className="checkout__summary-features">
                    {selectedPack.features.map((feature, i) => (
                      <li key={i}>
                        <Check size={14} className="checkout__check" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* WhatsApp IA Plan */}
                  {whatsappPlan && (
                    <div className="checkout__wa-plan">
                      <div className="checkout__wa-plan-header">
                        <MessageCircle size={14} />
                        <span>+ WhatsApp IA</span>
                      </div>
                      <div className="checkout__wa-plan-detail">
                        <span>{whatsappPlan.label} — {whatsappPlan.messages.toLocaleString('es-ES')} msgs/mes</span>
                      </div>
                    </div>
                  )}

                  <button className="checkout__change-pack" onClick={onChangePack}>
                    <ArrowUp size={14} />
                    Cambiar de pack
                  </button>
                </div>

                {/* Right - Form */}
                <div className="checkout__form-container">
                  <div className="checkout__form-header">
                    <Zap size={16} />
                    <span>Recibe tu precio en menos de 24h</span>
                  </div>

                  <form className="checkout__form" onSubmit={handleSubmit}>
                    <div className="checkout__field">
                      <label><User size={14} /> Nombre completo *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => updateField('name', e.target.value)}
                        placeholder="Tu nombre"
                        className="checkout__input"
                      />
                    </div>

                    <div className="checkout__field">
                      <label><Mail size={14} /> Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        placeholder="tu@email.com"
                        className="checkout__input"
                      />
                    </div>

                    <div className="checkout__field">
                      <label><Phone size={14} /> WhatsApp *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => updateField('phone', e.target.value)}
                        placeholder="+34 600 000 000"
                        className="checkout__input"
                      />
                    </div>

                    <div className="checkout__field">
                      <label><Building size={14} /> Nombre de tu negocio</label>
                      <input
                        type="text"
                        value={formData.business}
                        onChange={e => updateField('business', e.target.value)}
                        placeholder="Ej: Mi Restaurante, Clínica López..."
                        className="checkout__input"
                      />
                    </div>

                    {error && (
                      <motion.p
                        className="checkout__error"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.p>
                    )}

                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      type="submit"
                      disabled={isSubmitting}
                      icon={isSubmitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                    >
                      {isSubmitting ? 'Enviando...' : 'Quiero mi precio personalizado'}
                    </Button>
                  </form>

                  {/* WhatsApp Alternative */}
                  <div className="checkout__whatsapp">
                    <div className="checkout__whatsapp-divider">
                      <span>o consulta directamente</span>
                    </div>
                    <a
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="checkout__whatsapp-btn"
                    >
                      <MessageCircle size={20} />
                      <div>
                        <span className="checkout__whatsapp-label">Preguntar precio por WhatsApp</span>
                        <span className="checkout__whatsapp-hint">Respondo en minutos</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
