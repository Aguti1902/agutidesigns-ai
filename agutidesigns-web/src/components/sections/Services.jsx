import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Globe, Bot, Search, Shield, Zap,
  Smartphone, Paintbrush, ShoppingCart, FileText,
  MessageCircle, Mail, BarChart3, ArrowRight
} from 'lucide-react';
import { fadeInUp, staggerContainer } from '../../hooks/useScrollAnimation';
import './Services.css';

const services = [
  {
    icon: <Paintbrush size={24} />,
    title: 'Diseño Web a Medida',
    desc: 'Landing pages, webs corporativas, portfolios y tiendas online. Cada diseño es único, moderno y pensado para convertir.',
  },
  {
    icon: <Smartphone size={24} />,
    title: 'Responsive + Rápida',
    desc: 'Tu web se ve perfecta en cualquier dispositivo. Optimizada para velocidad de carga y experiencia de usuario.',
  },
  {
    icon: <Bot size={24} />,
    title: 'Chatbot IA en tu Web',
    desc: 'Asistente virtual 24/7 que atiende a tus clientes, responde dudas y capta leads mientras duermes.',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'WhatsApp Automatizado',
    desc: 'Atención al cliente por WhatsApp con IA. Respuestas automáticas, seguimiento y cierre de ventas.',
  },
  {
    icon: <Mail size={24} />,
    title: 'Emails Automáticos',
    desc: 'Secuencias de bienvenida, seguimiento y nurturing. Cada email personalizado con IA según el cliente.',
  },
  {
    icon: <ShoppingCart size={24} />,
    title: 'E-commerce',
    desc: 'Tiendas online completas con pasarela de pago, catálogo de productos y gestión de pedidos.',
  },
  {
    icon: <Search size={24} />,
    title: 'SEO + Analytics',
    desc: 'Posicionamiento en Google desde el primer día. Informes de rendimiento para tomar decisiones.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Mantenimiento y Soporte',
    desc: 'Hosting, dominio, copias de seguridad, actualizaciones y soporte continuo. Todo incluido.',
  },
];

export default function Services() {
  const [ref, inView] = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <section id="servicios" className="services section" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="services__header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="badge badge--primary">
            <Zap size={12} />
            Servicios
          </span>
          <h2 className="services__title">
            Todo lo que necesitas,
            <span className="text-primary"> en un solo sitio</span>
          </h2>
          <p className="services__subtitle">
            Diseño web profesional, inteligencia artificial integrada,
            automatizaciones y soporte continuo. Sin complicaciones.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="services__grid"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {services.map((service, i) => (
            <motion.div
              key={i}
              className="services__item"
              variants={fadeInUp}
            >
              <div className="services__item-icon">{service.icon}</div>
              <div className="services__item-content">
                <h3 className="services__item-title">{service.title}</h3>
                <p className="services__item-desc">{service.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
