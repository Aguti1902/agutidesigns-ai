import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Zap, Clock, Users, TrendingUp, CheckCircle,
  ArrowRight, Star, Shield, Smartphone, Brain, BarChart3,
  DollarSign, Lock, ChevronDown, Sparkles, Bot, CalendarCheck,
  ShoppingCart, HeadphonesIcon
} from 'lucide-react';
import './SaasLanding.css';

const DEMO_MESSAGES = [
  { from: 'user', text: 'Hola, quiero pedir cita para mañana' },
  { from: 'bot', text: '¡Hola! 👋 Claro, tengo disponible mañana:\n\n• *10:00*\n• *12:30*\n• *16:00*\n\n¿Cuál te viene mejor?' },
  { from: 'user', text: 'A las 16:00 perfecto' },
  { from: 'bot', text: '¡Listo! ✅ Tu cita queda *confirmada* para mañana a las *16:00*.\n\nSi necesitas cambiarla, avísame. ¡Te esperamos!' },
];

const USE_CASES = [
  { icon: <CalendarCheck size={22} />, title: 'Agenda citas', desc: 'La IA propone horarios libres y confirma reservas automáticamente.', tag: 'AUTOMÁTICO' },
  { icon: <HeadphonesIcon size={22} />, title: 'Atiende clientes', desc: 'Responde preguntas sobre servicios, precios y horarios al instante.', tag: '24/7' },
  { icon: <ShoppingCart size={22} />, title: 'Cierra ventas', desc: 'Recomienda servicios, supera objeciones y facilita la compra.', tag: '+VENTAS' },
  { icon: <Users size={22} />, title: 'Capta leads', desc: 'Recoge nombre y teléfono de cada persona interesada sin esfuerzo.', tag: 'LEADS' },
];

const STEPS = [
  { num: '1', title: 'Conecta tu WhatsApp', desc: 'Escaneas un QR code. 10 segundos.', time: '10 seg' },
  { num: '2', title: 'Entrena a la IA', desc: 'Dale tus servicios, precios y horarios. Aprende al instante.', time: '3 min' },
  { num: '3', title: 'Activa y listo', desc: 'Tu agente empieza a atender clientes automáticamente.', time: '¡Ya!' },
];

const FEATURES = [
  { icon: <Smartphone size={18} />, text: 'Funciona con tu WhatsApp actual' },
  { icon: <Brain size={18} />, text: 'IA que aprende de TU negocio' },
  { icon: <CalendarCheck size={18} />, text: 'Agenda citas automáticamente' },
  { icon: <BarChart3 size={18} />, text: 'Dashboard con estadísticas' },
  { icon: <MessageCircle size={18} />, text: 'Historial de conversaciones' },
  { icon: <Shield size={18} />, text: 'Datos 100% seguros' },
  { icon: <Lock size={18} />, text: 'Sin permanencia' },
  { icon: <Bot size={18} />, text: 'Personalidad configurable' },
];

const FAQ = [
  { q: '¿Es difícil de configurar?', a: 'No. Sin código, en 5 minutos está funcionando. Te guiamos paso a paso.' },
  { q: '¿Qué pasa si la IA responde mal?', a: 'Solo responde con la información de TU negocio. Si no sabe algo, deriva a ti directamente.' },
  { q: '¿Funciona con mi tipo de negocio?', a: 'Si atiendes clientes por WhatsApp, te sirve. Restaurantes, clínicas, peluquerías, tiendas, servicios...' },
  { q: '¿Puedo seguir usando WhatsApp yo?', a: 'Sí. Si tú respondes manualmente, el agente se quita de en medio.' },
  { q: '¿Cuánto cuesta?', a: 'Desde 29€/mes. 2 días gratis sin tarjeta para que lo pruebes.' },
];

function ChatDemo() {
  const [visibleMsgs, setVisibleMsgs] = useState(0);
  useEffect(() => {
    if (visibleMsgs < DEMO_MESSAGES.length) {
      const timer = setTimeout(() => setVisibleMsgs(v => v + 1), visibleMsgs === 0 ? 800 : 1200);
      return () => clearTimeout(timer);
    }
  }, [visibleMsgs]);

  return (
    <div className="chat-demo">
      <div className="chat-demo__header">
        <div className="chat-demo__avatar"><Bot size={18} /></div>
        <div>
          <span className="chat-demo__name">Tu Negocio IA</span>
          <span className="chat-demo__status">en línea</span>
        </div>
      </div>
      <div className="chat-demo__body">
        {DEMO_MESSAGES.slice(0, visibleMsgs).map((msg, i) => (
          <motion.div
            key={i}
            className={`chat-demo__msg chat-demo__msg--${msg.from}`}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
          </motion.div>
        ))}
        {visibleMsgs < DEMO_MESSAGES.length && (
          <div className="chat-demo__typing">
            <span /><span /><span />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [casesRef, casesInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [stepsRef, stepsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [faqRef, faqInView] = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav__logo">
          <img src="/images/Logoverde.png" alt="Agutidesigns" className="landing-nav__logo-img" />
          <span className="landing-nav__badge">IA</span>
        </div>
        <div className="landing-nav__right">
          <Link to="/auth" className="landing-nav__login">Iniciar sesión</Link>
          <Link to="/auth" className="landing-nav__cta">
            <Zap size={14} /> Prueba gratis
          </Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero__content">
            <div className="landing-hero__trust-bar">
              <CheckCircle size={14} /> 2 días gratis · Sin tarjeta · Activo en 5 min
            </div>
            <h1 className="landing-hero__title">
              Automatiza tu WhatsApp
              <span className="landing-highlight"> en 5 minutos</span>
            </h1>
            <p className="landing-hero__subtitle">
              Un agente IA que atiende clientes, agenda citas y cierra ventas por WhatsApp. <strong>24 horas, 7 días.</strong> Sin código.
            </p>
            <div className="landing-hero__ctas">
              <Link to="/auth" className="landing-btn landing-btn--primary landing-btn--xl">
                <Zap size={18} /> Empezar gratis ahora <ArrowRight size={16} />
              </Link>
            </div>
            <div className="landing-hero__proof">
              <div className="landing-hero__proof-item">
                <span className="landing-hero__proof-num">5 min</span>
                <span>configuración</span>
              </div>
              <div className="landing-hero__proof-sep" />
              <div className="landing-hero__proof-item">
                <span className="landing-hero__proof-num">24/7</span>
                <span>atención</span>
              </div>
              <div className="landing-hero__proof-sep" />
              <div className="landing-hero__proof-item">
                <span className="landing-hero__proof-num">29€</span>
                <span>/mes después</span>
              </div>
            </div>
          </div>

          <div className="landing-hero__demo">
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section className="landing-cases" ref={casesRef}>
        <div className="landing-container">
          <h2 className="landing-section__title">¿Qué hace tu agente IA?</h2>
          <div className="landing-cases__grid">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={i}
                className="landing-case"
                initial={{ opacity: 0, y: 20 }}
                animate={casesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
              >
                <div className="landing-case__top">
                  <div className="landing-case__icon">{uc.icon}</div>
                  <span className="landing-case__tag">{uc.tag}</span>
                </div>
                <h3>{uc.title}</h3>
                <p>{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="landing-how" ref={stepsRef}>
        <div className="landing-container">
          <h2 className="landing-section__title">Activo en <span className="landing-highlight">3 pasos</span></h2>
          <div className="landing-how__grid">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                className="landing-how__step"
                initial={{ opacity: 0, y: 20 }}
                animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15 }}
              >
                <div className="landing-how__step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <span className="landing-how__step-time">{step.time}</span>
              </motion.div>
            ))}
          </div>
          <div className="landing-how__cta">
            <Link to="/auth" className="landing-btn landing-btn--primary landing-btn--lg">
              <Zap size={16} /> Empezar ahora — Es gratis <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-section__title">Todo incluido</h2>
          <div className="landing-features__grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature">
                {f.icon}
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="landing-pricing">
        <div className="landing-container">
          <h2 className="landing-section__title">Precio claro. Sin sorpresas.</h2>
          <div className="landing-pricing__card">
            <div className="landing-pricing__free">
              <Sparkles size={20} />
              <div>
                <h3>2 días gratis</h3>
                <p>Todo incluido. Sin tarjeta. Sin compromiso.</p>
              </div>
            </div>
            <div className="landing-pricing__divider" />
            <div className="landing-pricing__price">
              <span className="landing-pricing__amount">29€</span>
              <span className="landing-pricing__period">/mes</span>
            </div>
            <ul className="landing-pricing__includes">
              <li><CheckCircle size={14} /> Agente IA para WhatsApp</li>
              <li><CheckCircle size={14} /> Agendamiento automático de citas</li>
              <li><CheckCircle size={14} /> Dashboard con estadísticas</li>
              <li><CheckCircle size={14} /> Soporte incluido</li>
              <li><CheckCircle size={14} /> Cancela cuando quieras</li>
            </ul>
            <Link to="/auth" className="landing-btn landing-btn--primary landing-btn--xl landing-btn--full">
              <Zap size={18} /> Empezar prueba gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="landing-faq" ref={faqRef}>
        <div className="landing-container">
          <h2 className="landing-section__title">Preguntas frecuentes</h2>
          <div className="landing-faq__list">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                className={`landing-faq__item ${faqOpen === i ? 'landing-faq__item--open' : ''}`}
                initial={{ opacity: 0 }}
                animate={faqInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.05 }}
              >
                <button className="landing-faq__question" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={faqOpen === i ? 'rotate' : ''} />
                </button>
                {faqOpen === i && <div className="landing-faq__answer"><p>{item.a}</p></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="landing-final">
        <div className="landing-container">
          <h2>Tu competencia ya usa IA.<br />¿Y tú?</h2>
          <p>Empieza gratis en 5 minutos. Sin tarjeta. Sin riesgo.</p>
          <Link to="/auth" className="landing-btn landing-btn--primary landing-btn--xl">
            <Zap size={20} /> Automatizar mi WhatsApp ahora <ArrowRight size={18} />
          </Link>
          <span className="landing-final__note">2 días gratis · Sin tarjeta de crédito · Cancela cuando quieras</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 Agutidesigns IA</p>
        <div className="landing-footer__links">
          <a href="https://agutidesigns.io/privacidad.html" target="_blank" rel="noopener">Privacidad</a>
          <span>·</span>
          <a href="https://agutidesigns.io/terminos.html" target="_blank" rel="noopener">Términos</a>
          <span>·</span>
          <a href="mailto:soporte@agutidesigns.io">Contacto</a>
        </div>
      </footer>
    </div>
  );
}
