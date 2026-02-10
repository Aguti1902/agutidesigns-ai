import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { MessageCircle, Check, Plus, Zap } from 'lucide-react';
import Button from '../ui/Button';
import './WhatsAppCalculator.css';

const TIERS = [
  { id: 'wa-500', messages: 500, label: 'Básico', desc: 'Negocios pequeños', price: 50 },
  { id: 'wa-1000', messages: 1000, label: 'Estándar', desc: 'En crecimiento', price: 75 },
  { id: 'wa-2500', messages: 2500, label: 'Pro', desc: 'Alto volumen', price: 120 },
  { id: 'wa-5000', messages: 5000, label: 'Business', desc: 'Volumen alto', price: 180 },
  { id: 'wa-10000', messages: 10000, label: 'Scale', desc: 'Gran escala', price: 260 },
  { id: 'wa-20000', messages: 20000, label: 'Enterprise', desc: 'Máximo volumen', price: 350 },
];

export { TIERS };

const fmt = (n) => n.toLocaleString('es-ES');

const FEATURES = [
  'Respuestas automáticas 24/7 con IA',
  'Entrenado con la info de tu negocio',
  'Cualificación de leads automática',
  'Seguimiento de conversaciones',
  'Integración con tu web y CRM',
  'Panel de control y estadísticas',
];

export default function WhatsAppCalculator({ whatsappPlan, onSelectPlan }) {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [selectedTier, setSelectedTier] = useState(2);

  const currentTier = TIERS[selectedTier];
  const isAdded = whatsappPlan !== null;

  const handleAdd = () => {
    onSelectPlan(currentTier);
  };

  const handleRemove = () => {
    onSelectPlan(null);
  };

  return (
    <section id="whatsapp-ia" className="wacalc section" ref={ref}>
      <div className="container">
        <motion.div
          className="wacalc__wrapper"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="wacalc__header">
            <div className="wacalc__header-icon">
              <MessageCircle size={28} />
            </div>
            <div>
              <span className="badge badge--primary" style={{ marginBottom: '8px', display: 'inline-flex' }}>
                <Zap size={12} /> Complemento
              </span>
              <h2 className="wacalc__title">
                WhatsApp IA
                <span className="text-primary"> para tu negocio</span>
              </h2>
              <p className="wacalc__subtitle">
                Atiende a tus clientes por WhatsApp con inteligencia artificial.
                Respuestas automáticas 24/7. Añádelo a cualquier pack.
              </p>
            </div>
          </div>

          <div className="wacalc__content">
            {/* Left - Selector */}
            <div className="wacalc__calculator">
              <h3 className="wacalc__calc-title">Elige tu volumen de mensajes</h3>
              <p className="wacalc__calc-desc">
                Selecciona el tramo que se adapte a tu negocio
              </p>

              {/* Tier Selector */}
              <div className="wacalc__tiers">
                {TIERS.map((tier, i) => (
                  <button
                    key={i}
                    className={`wacalc__tier ${selectedTier === i ? 'wacalc__tier--active' : ''}`}
                    onClick={() => setSelectedTier(i)}
                  >
                    <span className="wacalc__tier-messages">{fmt(tier.messages)}</span>
                    <span className="wacalc__tier-unit">msgs/mes</span>
                    <span className="wacalc__tier-label">{tier.label}</span>
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="wacalc__slider-wrapper">
                <input
                  type="range"
                  min={0}
                  max={TIERS.length - 1}
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(Number(e.target.value))}
                  className="wacalc__slider"
                />
                <div className="wacalc__slider-labels">
                  <span>500 msgs</span>
                  <span>20.000 msgs</span>
                </div>
              </div>

              {/* Selected Result */}
              <div className="wacalc__result">
                <div className="wacalc__result-plan">
                  <span className="wacalc__result-label">{currentTier.label}</span>
                  <span className="wacalc__result-desc">{fmt(currentTier.messages)} mensajes/mes · {currentTier.desc}</span>
                </div>
                <div className="wacalc__result-price">
                  <span className="wacalc__result-consult">Precio a consultar</span>
                </div>
              </div>

              {/* Add/Remove Button */}
              {!isAdded ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleAdd}
                  icon={<Plus size={18} />}
                >
                  Añadir WhatsApp IA a mi presupuesto
                </Button>
              ) : (
                <div className="wacalc__added">
                  <div className="wacalc__added-info">
                    <Check size={18} />
                    <span>WhatsApp IA añadido — <strong>{currentTier.label} ({fmt(whatsappPlan.messages)} msgs/mes)</strong></span>
                  </div>
                  <button className="wacalc__added-remove" onClick={handleRemove}>
                    Quitar
                  </button>
                </div>
              )}
            </div>

            {/* Right - Features */}
            <div className="wacalc__features">
              <h4 className="wacalc__features-title">Qué incluye</h4>
              <ul className="wacalc__features-list">
                {FEATURES.map((feature, i) => (
                  <li key={i}>
                    <Check size={16} className="wacalc__features-check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="wacalc__features-note">
                <MessageCircle size={14} />
                <span>¿Necesitas más de 20.000 mensajes? Pide un presupuesto personalizado.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
