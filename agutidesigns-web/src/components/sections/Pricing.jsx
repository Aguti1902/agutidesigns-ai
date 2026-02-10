import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Check, Star, Zap, ArrowRight, Crown, Rocket } from 'lucide-react';
import Button from '../ui/Button';
import { fadeInUp, staggerContainer } from '../../hooks/useScrollAnimation';
import './Pricing.css';

const packs = [
  {
    id: 'starter',
    name: 'Pack Starter',
    icon: <Zap size={24} />,
    price: '497',
    monthly: '35',
    description: 'Perfecto para autónomos que necesitan una landing page profesional.',
    features: [
      'Landing page profesional (1 página)',
      'Diseño responsive (móvil, tablet, desktop)',
      'Chatbot IA básico integrado en la web',
      'Formulario inteligente de contacto',
      'SEO básico optimizado',
      'Hosting + dominio incluido',
      'Copias de seguridad semanales',
      'Soporte por email',
    ],
    cta: 'Me interesa',
    popular: false,
  },
  {
    id: 'business',
    name: 'Pack Business',
    icon: <Rocket size={24} />,
    price: '997',
    monthly: '55',
    description: 'Ideal para negocios que quieren una web completa con chatbot avanzado.',
    features: [
      'Web multipágina (hasta 5 páginas)',
      'Diseño responsive premium',
      'Chatbot IA avanzado (entrenado con tu info)',
      'Formulario inteligente + captación de leads',
      'SEO avanzado + informes mensuales',
      'Hosting + dominio incluido',
      'Copias de seguridad diarias',
      'Soporte por chat prioritario',
    ],
    cta: 'Me interesa',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Pack Premium',
    icon: <Crown size={24} />,
    price: '1.997',
    monthly: '95',
    description: 'La solución completa para negocios que quieren el máximo.',
    features: [
      'Web completa (hasta 10 páginas)',
      'Diseño premium + animaciones',
      'Chatbot IA personalizado (tu marca y tono)',
      'Presupuestos automáticos con IA',
      'SEO avanzado + informes semanales',
      'Hosting premium + dominio incluido',
      'Copias de seguridad diarias',
      'Soporte 24/7 + videollamadas',
    ],
    cta: 'Me interesa',
    popular: false,
  },
];

export { packs };

export default function Pricing({ onSelectPack }) {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <section id="packs" className="pricing section" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="pricing__header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge--primary">
            <Star size={12} />
            Packs Web + Chatbot IA
          </span>
          <h2 className="pricing__title">
            Elige el pack que mejor
            <span className="text-primary"> se adapte a ti</span>
          </h2>
          <p className="pricing__subtitle">
            Cada pack incluye diseño web profesional + chatbot IA integrado.
            Selecciona el tuyo y te damos un precio personalizado.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="pricing__grid"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {packs.map((pack) => (
            <motion.div
              key={pack.id}
              className={`pricing__card ${pack.popular ? 'pricing__card--popular' : ''}`}
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              {pack.popular && (
                <div className="pricing__card-badge">
                  <Star size={12} />
                  Más popular
                </div>
              )}

              <div className="pricing__card-header">
                <div className="pricing__card-icon">{pack.icon}</div>
                <h3 className="pricing__card-name">{pack.name}</h3>
                <p className="pricing__card-desc">{pack.description}</p>
              </div>

              <ul className="pricing__card-features">
                {pack.features.map((feature, i) => (
                  <li key={i} className="pricing__feature">
                    <Check size={16} className="pricing__feature-check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={pack.popular ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={() => onSelectPack && onSelectPack(pack)}
                iconRight={<ArrowRight size={16} />}
              >
                {pack.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
