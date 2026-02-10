import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Code, Palette, Brain, Heart, ArrowRight } from 'lucide-react';
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer } from '../../hooks/useScrollAnimation';
import './About.css';

const values = [
  {
    icon: <Palette size={24} />,
    title: 'Perfeccionismo',
    desc: 'Cada pixel importa. Creamos webs que destacan por su precisión y calidad visual.',
  },
  {
    icon: <Heart size={24} />,
    title: 'Cercanía',
    desc: 'Somos tu aliado, no tu proveedor. Trabajamos como equipo en cada proyecto.',
  },
  {
    icon: <Brain size={24} />,
    title: 'Innovación IA',
    desc: 'Integramos inteligencia artificial para que tu web trabaje por ti 24/7.',
  },
  {
    icon: <Code size={24} />,
    title: 'Sencillez',
    desc: 'Hacemos que lo complejo sea simple. Sin tecnicismos, sin complicaciones.',
  },
];

export default function About() {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section id="sobre-mi" className="about section" ref={ref}>
      <div className="container">
        <motion.div
          className="about__grid"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Left - Image */}
          <motion.div className="about__image-wrapper" variants={fadeInLeft}>
            <div className="about__image-container">
              <img
                src="/images/ImagenGuti.png"
                alt="Guti — Diseñador web de Agutidesigns"
                className="about__image"
              />
              <div className="about__image-badge">
                <span className="about__image-badge-dot" />
                Disponible para proyectos
              </div>
            </div>
          </motion.div>

          {/* Right - Info */}
          <motion.div className="about__content" variants={fadeInRight}>
            <span className="badge badge--primary">Sobre Guti</span>
            <h2 className="about__title">
              Soy Guti, diseñador web
              <span className="text-primary"> obsesionado</span> con que
              tu negocio crezca
            </h2>
            <p className="about__text">
              Trabajo como diseñador web freelance especializado en crear sitios
              web personalizados y únicos. Me encanta diseñar interfaces con una
              experiencia de usuario hermosa y sólida, pero sobre todo...
            </p>
            <p className="about__highlight">
              ¡QUE CONVIERTA!
            </p>
            <p className="about__text">
              Ahora con IA integrada, tu web no solo será bonita — será inteligente.
              Atenderá clientes, generará presupuestos y cerrará ventas mientras tú
              te centras en lo que mejor sabes hacer.
            </p>
            <motion.a
              href="#proceso"
              className="about__link"
              whileHover={{ x: 5 }}
            >
              Ver cómo trabajo <ArrowRight size={16} />
            </motion.a>

            {/* Values Grid */}
            <div className="about__values">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  className="about__value"
                  variants={fadeInUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="about__value-icon">{value.icon}</div>
                  <div>
                    <h4 className="about__value-title">{value.title}</h4>
                    <p className="about__value-desc">{value.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
