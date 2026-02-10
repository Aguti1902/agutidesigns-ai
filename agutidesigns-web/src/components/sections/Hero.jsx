import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, Zap, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      {/* Background Elements */}
      <div className="hero__bg">
        <div className="hero__grid-overlay" />
        <div className="hero__glow hero__glow--1" />
        <div className="hero__glow hero__glow--2" />
      </div>

      <div className="container hero__container">
        {/* Badge */}
        <motion.div
          className="hero__badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles size={14} />
          <span>Diseño Web + Inteligencia Artificial</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="hero__title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Tu web con
          <br />
          <span className="hero__title-highlight">superpoderes</span>
          <br />
          de IA
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="hero__subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Creamos páginas web profesionales con inteligencia artificial integrada
          que captan clientes, responden automáticamente y hacen crecer tu negocio.
          <strong> Tú pones la idea, la IA hace el resto.</strong>
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="hero__ctas"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Button
            variant="primary"
            size="lg"
            href="#packs"
            icon={<Zap size={18} />}
            iconRight={<ArrowRight size={16} />}
          >
            Ver Packs
          </Button>
          <Button
            variant="secondary"
            size="lg"
            href="#presupuesto"
          >
            Pedir Presupuesto
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="hero__stats"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="hero__stat">
            <span className="hero__stat-number">50+</span>
            <span className="hero__stat-label">Proyectos entregados</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-number">24/7</span>
            <span className="hero__stat-label">IA atendiendo</span>
          </div>
          <div className="hero__stat-divider" />
          <div className="hero__stat">
            <span className="hero__stat-number">100%</span>
            <span className="hero__stat-label">Clientes satisfechos</span>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ArrowDown size={20} />
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="hero__float hero__float--1"
        animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      >
        &lt;/&gt;
      </motion.div>
      <motion.div
        className="hero__float hero__float--2"
        animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: 'easeInOut' }}
      >
        AI
      </motion.div>
      <motion.div
        className="hero__float hero__float--3"
        animate={{ y: [-8, 12, -8], rotate: [0, 3, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
      >
        ✦
      </motion.div>
    </section>
  );
}
