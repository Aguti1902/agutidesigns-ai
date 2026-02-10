import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Sparkles, ArrowRight, Bot } from 'lucide-react';
import Button from '../ui/Button';
import './CustomBridge.css';

export default function CustomBridge({ onShowQuoteForm }) {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  const handleClick = (e) => {
    e.preventDefault();
    if (onShowQuoteForm) onShowQuoteForm();
  };

  return (
    <section className="bridge section" ref={ref}>
      <div className="bridge__glow" />
      <div className="container">
        <motion.div
          className="bridge__card"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="bridge__icon">
            <Bot size={32} />
          </div>
          <h2 className="bridge__title">
            ¿Tu proyecto no encaja en un pack?
          </h2>
          <p className="bridge__subtitle">
            Sin problema. Cuéntanos qué necesitas y nuestra <strong>IA genera un presupuesto
            a medida en segundos</strong>. Sin esperas, sin compromisos.
          </p>
          <Button
            variant="primary"
            size="xl"
            onClick={handleClick}
            icon={<Sparkles size={18} />}
            iconRight={<ArrowRight size={18} />}
          >
            Pedir presupuesto personalizado
          </Button>
          <p className="bridge__hint">
            Formulario de 5 pasos + presupuesto generado por IA al instante
          </p>
        </motion.div>
      </div>
    </section>
  );
}
