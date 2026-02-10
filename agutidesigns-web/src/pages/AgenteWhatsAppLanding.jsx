import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  MessageCircle, Bot, Zap, Clock, Users, Shield, BarChart3,
  Brain, ArrowRight, Check, Star, Send, Sparkles,
  Phone, Mail, User, Building, CheckCircle, Globe,
  Settings, Layers, Lock
} from 'lucide-react';
import AIChatbot from '../components/chat/AIChatbot';
import './AgenteWhatsAppLanding.css';

/* ── Demo Chat Data ── */
const DEMO_CONVERSATION = [
  { role: 'user', text: 'Hola, quiero información sobre vuestros servicios' },
  { role: 'agent', text: '¡Hola! 👋 Encantado de atenderte. Ofrecemos cortes de pelo, coloración, tratamientos capilares y barbería. ¿Qué te interesa?' },
  { role: 'user', text: 'Quiero pedir cita para un corte este viernes' },
  { role: 'agent', text: 'Perfecto, el viernes tengo disponible:\n\n🕐 10:00\n🕐 12:30\n🕐 16:00\n🕐 18:30\n\n¿Cuál te viene mejor?' },
  { role: 'user', text: 'Las 12:30' },
  { role: 'agent', text: '✅ Cita confirmada:\n📅 Viernes 12:30\n✂️ Corte de pelo\n\nTe enviaré un recordatorio el jueves. ¿Algo más?' },
];

const FEATURES = [
  { icon: <Clock size={22} />, title: 'Disponible 24/7', desc: 'Tu agente nunca duerme. Atiende clientes a cualquier hora, cualquier día.' },
  { icon: <Brain size={22} />, title: 'Entrenado con tu info', desc: 'Conoce tus servicios, precios, horarios y políticas. Responde como tú lo harías.' },
  { icon: <Users size={22} />, title: 'Capta leads automáticamente', desc: 'Recoge datos de contacto, cualifica clientes y los clasifica por interés.' },
  { icon: <BarChart3 size={22} />, title: 'Panel de estadísticas', desc: 'Ve cuántas conversaciones tiene, leads captados y preguntas frecuentes.' },
  { icon: <Settings size={22} />, title: 'Sin código', desc: 'Configúralo desde un panel visual. Sin programación, sin complicaciones.' },
  { icon: <Shield size={22} />, title: 'Seguro y privado', desc: 'Tus datos y los de tus clientes siempre protegidos y encriptados.' },
];

const STEPS = [
  { number: '01', title: 'Conecta tu WhatsApp', desc: 'Vincula tu número de WhatsApp Business en menos de 2 minutos.' },
  { number: '02', title: 'Entrena a tu agente', desc: 'Sube la info de tu negocio: servicios, precios, horarios, FAQs. La IA aprende al instante.' },
  { number: '03', title: 'Actívalo y listo', desc: 'Tu agente empieza a atender clientes automáticamente. Tú solo supervisa.' },
];

const USECASES = [
  'Restaurantes y hostelería',
  'Clínicas y centros de salud',
  'Peluquerías y estética',
  'Inmobiliarias',
  'Tiendas y e-commerce',
  'Academias y formación',
  'Gimnasios y fitness',
  'Cualquier negocio con clientes',
];

export default function AgenteWhatsAppLanding() {
  const [demoStep, setDemoStep] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', business: '' });
  const [submitted, setSubmitted] = useState(false);

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featRef, featInView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [stepsRef, stepsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.1, triggerOnce: true });

  const visibleMessages = DEMO_CONVERSATION.slice(0, demoStep + 1);

  const nextDemoMsg = () => {
    setDemoStep(s => s < DEMO_CONVERSATION.length - 1 ? s + 1 : 0);
  };

  const updateField = (f, v) => setFormData(prev => ({ ...prev, [f]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) return;
    setSubmitted(true);
  };

  return (
    <div className="wa-landing">
      {/* ── Nav ── */}
      <nav className="wa-nav">
        <a href="/" className="wa-nav__logo">
          <img src="/images/Logo.png" alt="Agutidesigns" className="wa-nav__logo-img" />
        </a>
        <a href="#empezar" className="wa-nav__cta">
          <Zap size={14} /> Crear mi agente
        </a>
      </nav>

      {/* ══════════════════════════════════
          HERO
         ══════════════════════════════════ */}
      <section className="wa-hero" ref={heroRef}>
        <div className="wa-hero__bg">
          <div className="wa-hero__glow" />
        </div>
        <div className="wa-container">
          <motion.div
            className="wa-hero__grid"
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            {/* Left */}
            <div className="wa-hero__content">
              <span className="wa-badge">
                <MessageCircle size={14} /> Agente WhatsApp IA
              </span>
              <h1 className="wa-hero__title">
                Tu negocio atendido
                <span className="wa-highlight"> 24/7 por IA</span>
                en WhatsApp
              </h1>
              <p className="wa-hero__subtitle">
                Crea un agente inteligente que responde a tus clientes por WhatsApp
                automáticamente. Sin código, en minutos. Capta leads, resuelve dudas
                y cierra ventas mientras duermes.
              </p>
              <div className="wa-hero__ctas">
                <a href="#empezar" className="wa-btn wa-btn--green wa-btn--lg">
                  <Zap size={18} /> Crear mi agente gratis <ArrowRight size={16} />
                </a>
                <a href="#demo" className="wa-btn wa-btn--outline">
                  Ver demo en vivo
                </a>
              </div>
              <div className="wa-hero__trust">
                <Check size={14} /> Sin tarjeta de crédito
                <span className="wa-hero__trust-sep">·</span>
                <Check size={14} /> Activo en 5 minutos
                <span className="wa-hero__trust-sep">·</span>
                <Check size={14} /> Sin código
              </div>
            </div>

            {/* Right - Phone mockup with chat */}
            <div className="wa-hero__phone" id="demo">
              <div className="wa-phone">
                <div className="wa-phone__header">
                  <div className="wa-phone__header-avatar"><Bot size={16} /></div>
                  <div>
                    <span className="wa-phone__header-name">Tu Agente IA</span>
                    <span className="wa-phone__header-status">en línea</span>
                  </div>
                </div>
                <div className="wa-phone__chat">
                  {visibleMessages.map((msg, i) => (
                    <motion.div
                      key={`${demoStep}-${i}`}
                      className={`wa-phone__msg wa-phone__msg--${msg.role}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.2 }}
                    >
                      {msg.text.split('\n').map((line, j) => (
                        <span key={j}>{line}<br/></span>
                      ))}
                    </motion.div>
                  ))}
                </div>
                <button className="wa-phone__next" onClick={nextDemoMsg}>
                  {demoStep < DEMO_CONVERSATION.length - 1 ? 'Siguiente mensaje →' : 'Reiniciar demo ↺'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURES
         ══════════════════════════════════ */}
      <section className="wa-features" ref={featRef}>
        <div className="wa-container">
          <motion.div
            className="wa-section-header"
            initial={{ opacity: 0, y: 20 }}
            animate={featInView ? { opacity: 1, y: 0 } : {}}
          >
            <h2>Todo lo que tu agente <span className="wa-highlight">puede hacer</span></h2>
            <p>Un asistente IA completo que trabaja para tu negocio sin descanso.</p>
          </motion.div>
          <div className="wa-features__grid">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="wa-feature"
                initial={{ opacity: 0, y: 20 }}
                animate={featInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08 }}
              >
                <div className="wa-feature__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════ */}
      <section className="wa-steps" ref={stepsRef}>
        <div className="wa-container">
          <motion.div
            className="wa-section-header"
            initial={{ opacity: 0, y: 20 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
          >
            <h2>Activo en <span className="wa-highlight">3 pasos</span></h2>
            <p>Crear tu agente es más fácil de lo que piensas.</p>
          </motion.div>
          <div className="wa-steps__grid">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                className="wa-step"
                initial={{ opacity: 0, y: 20 }}
                animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15 }}
              >
                <span className="wa-step__number">{s.number}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          USE CASES
         ══════════════════════════════════ */}
      <section className="wa-usecases">
        <div className="wa-container">
          <div className="wa-section-header">
            <h2>Perfecto para <span className="wa-highlight">tu sector</span></h2>
          </div>
          <div className="wa-usecases__grid">
            {USECASES.map((u, i) => (
              <div key={i} className="wa-usecase">
                <Check size={16} /> {u}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA / FORM
         ══════════════════════════════════ */}
      <section className="wa-cta" id="empezar" ref={ctaRef}>
        <div className="wa-container">
          <motion.div
            className="wa-cta__card"
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          >
            {submitted ? (
              <div className="wa-cta__success">
                <CheckCircle size={48} />
                <h2>¡Genial, {formData.name}!</h2>
                <p>Te contactaremos en menos de 24h para activar tu agente de WhatsApp IA.</p>
                <a
                  href={`https://wa.me/34600000000?text=${encodeURIComponent(`¡Hola Guti! Quiero activar mi agente de WhatsApp IA para "${formData.business}".`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-btn wa-btn--green"
                >
                  <MessageCircle size={16} /> Escribir por WhatsApp ahora
                </a>
              </div>
            ) : (
              <>
                <div className="wa-cta__header">
                  <Sparkles size={24} />
                  <h2>Crea tu agente de WhatsApp IA</h2>
                  <p>Déjanos tus datos y lo activamos para ti. Sin compromiso.</p>
                </div>
                <form className="wa-cta__form" onSubmit={handleSubmit}>
                  <div className="wa-cta__field">
                    <label><User size={14} /> Nombre *</label>
                    <input type="text" placeholder="Tu nombre" value={formData.name} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div className="wa-cta__field">
                    <label><Mail size={14} /> Email *</label>
                    <input type="email" placeholder="tu@email.com" value={formData.email} onChange={e => updateField('email', e.target.value)} />
                  </div>
                  <div className="wa-cta__field">
                    <label><Phone size={14} /> WhatsApp *</label>
                    <input type="tel" placeholder="+34 600 000 000" value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                  </div>
                  <div className="wa-cta__field">
                    <label><Building size={14} /> Tu negocio</label>
                    <input type="text" placeholder="Ej: Peluquería, Restaurante..." value={formData.business} onChange={e => updateField('business', e.target.value)} />
                  </div>
                  <button type="submit" className="wa-btn wa-btn--green wa-btn--lg wa-btn--full">
                    <Zap size={18} /> Quiero mi agente IA
                  </button>
                  <div className="wa-cta__privacy">
                    <Lock size={11} /> Sin compromiso · Tus datos están seguros
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="wa-footer">
        <span>© {new Date().getFullYear()} Agutidesigns · <a href="/">Volver a la web</a></span>
      </footer>

      <AIChatbot />
    </div>
  );
}
