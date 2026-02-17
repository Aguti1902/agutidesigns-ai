import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Zap, Clock, Users, TrendingUp, CheckCircle,
  ArrowRight, X, Star, Shield, Smartphone, Brain, BarChart3,
  DollarSign, Lock, Play, ChevronDown, AlertCircle, Sparkles
} from 'lucide-react';
import './SaasLanding.css';

const benefits = [
  {
    icon: <Clock size={24} />,
    title: 'Atiende 24/7',
    desc: 'Tu agente IA responde a cualquier hora. Nunca pierdas un cliente por no estar disponible.',
    pain: '¿Pierdes clientes porque no puedes atender fuera de horario?',
  },
  {
    icon: <Users size={24} />,
    title: 'Capta leads automáticamente',
    desc: 'Recopila nombre, email y teléfono de cada persona interesada sin que muevas un dedo.',
    pain: '¿Olvidas pedir datos de contacto a clientes potenciales?',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Cierra más ventas',
    desc: 'Respuestas instantáneas = más conversiones. El que responde primero, gana el cliente.',
    pain: '¿Tus clientes se van con la competencia porque tardas en responder?',
  },
  {
    icon: <Brain size={24} />,
    title: 'Conoce tu negocio',
    desc: 'Entrenas al agente con tu info: servicios, precios, horarios. Responde como tú lo harías.',
    pain: '¿Necesitas contratar a alguien solo para responder WhatsApp?',
  },
];

const objections = [
  { q: '¿Es difícil de configurar?', a: 'No. Sin código, en 5 minutos está funcionando. Nosotros te guiamos paso a paso.' },
  { q: '¿Qué pasa si la IA responde mal?', a: 'La entrenas tú con la info de tu negocio. Solo responde lo que tú le digas. Si no sabe algo, deriva a ti.' },
  { q: '¿Es caro?', a: 'Desde 29€/mes. Mucho más barato que contratar a alguien. Y tienes 2 días gratis para probar sin tarjeta.' },
  { q: '¿Funciona con mi tipo de negocio?', a: 'Funciona con cualquier negocio que use WhatsApp: restaurantes, clínicas, tiendas, servicios... Si atiendes clientes, te sirve.' },
  { q: '¿Puedo seguir usando WhatsApp yo?', a: 'Sí. Si tú respondes manualmente, el agente se quita de en medio. Solo actúa cuando no estás.' },
];

const features = [
  { icon: <Smartphone size={18} />, text: 'Multi-dispositivo: varios números WhatsApp' },
  { icon: <BarChart3 size={18} />, text: 'Dashboard con estadísticas en tiempo real' },
  { icon: <Brain size={18} />, text: 'Personaliza la personalidad de tu agente' },
  { icon: <Shield size={18} />, text: 'Tus datos y los de tus clientes 100% seguros' },
  { icon: <MessageCircle size={18} />, text: 'Historial completo de conversaciones' },
  { icon: <Lock size={18} />, text: 'Sin permanencia, cancela cuando quieras' },
];

export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [painRef, painInView] = useInView({ threshold: 0.1, triggerOnce: true });
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
          <div className="landing-nav__links">
            <a href="/privacidad.html" target="_blank" rel="noopener">Privacidad</a>
            <a href="/terminos.html" target="_blank" rel="noopener">Términos</a>
          </div>
          <Link to="/auth" className="landing-nav__cta">
            <Zap size={14} /> Probar gratis 2 días
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" ref={heroRef}>
        <div className="landing-container">
          <motion.div
            className="landing-hero__content"
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <span className="landing-badge">
              <Sparkles size={12} /> Agente WhatsApp IA
            </span>
            <h1 className="landing-hero__title">
              Tu negocio atendido
              <span className="landing-highlight"> 24/7</span>
              <br />
              sin contratar a nadie
            </h1>
            <p className="landing-hero__subtitle">
              Crea un agente de WhatsApp con IA que responde a tus clientes automáticamente,
              capta leads y cierra ventas. <strong>Sin código. En 5 minutos.</strong>
            </p>
            <div className="landing-hero__ctas">
              <Link to="/auth" className="landing-btn landing-btn--primary landing-btn--lg">
                <Zap size={18} /> Empezar prueba gratis <ArrowRight size={16} />
              </Link>
              <button className="landing-btn landing-btn--outline landing-btn--lg">
                <Play size={16} /> Ver cómo funciona
              </button>
            </div>
            <div className="landing-hero__trust">
              <CheckCircle size={14} /> 2 días gratis · Sin tarjeta · Cancela cuando quieras
            </div>
          </motion.div>

          <motion.div
            className="landing-hero__image"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={heroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="landing-hero__image-wrapper">
              <img src="/images/ImagenGuti.png" alt="Guti - Creador de Agutidesigns" />
              <div className="landing-hero__image-badge">
                <span className="landing-hero__image-dot" />
                Creado por Guti
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="landing-pain" ref={painRef}>
        <div className="landing-container">
          <motion.h2
            className="landing-section__title"
            initial={{ opacity: 0, y: 20 }}
            animate={painInView ? { opacity: 1, y: 0 } : {}}
          >
            ¿Te suena familiar?
          </motion.h2>
          <div className="landing-pain__grid">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                className="landing-pain__card"
                initial={{ opacity: 0, y: 20 }}
                animate={painInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
              >
                <div className="landing-pain__card-icon">{b.icon}</div>
                <h3 className="landing-pain__card-pain"><AlertCircle size={14} /> {b.pain}</h3>
                <div className="landing-pain__card-divider" />
                <h4>{b.title}</h4>
                <p>{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="landing-how">
        <div className="landing-container">
          <h2 className="landing-section__title">Activo en <span className="landing-highlight">3 pasos</span></h2>
          <div className="landing-how__grid">
            {['Conectas tu WhatsApp', 'Entrenas al agente', 'Activas y listo'].map((step, i) => (
              <div key={i} className="landing-how__step">
                <div className="landing-how__step-number">{i + 1}</div>
                <h3>{step}</h3>
                <p>{i === 0 ? 'Escaneas un QR. Tarda 10 segundos.' : i === 1 ? 'Le das tus servicios, precios y horarios. La IA aprende al instante.' : 'Tu agente empieza a responder automáticamente. Tú solo supervisa.'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="landing-social">
        <div className="landing-container">
          <div className="landing-stats">
            <div className="landing-stat">
              <span className="landing-stat__number">95%</span>
              <span className="landing-stat__label">Respuestas correctas</span>
            </div>
            <div className="landing-stat__sep" />
            <div className="landing-stat">
              <span className="landing-stat__number">24/7</span>
              <span className="landing-stat__label">Siempre disponible</span>
            </div>
            <div className="landing-stat__sep" />
            <div className="landing-stat">
              <span className="landing-stat__number">5 min</span>
              <span className="landing-stat__label">Setup completo</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-section__title">Todo lo que incluye</h2>
          <div className="landing-features__grid">
            {features.map((f, i) => (
              <div key={i} className="landing-feature">
                {f.icon}
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="landing-pricing">
        <div className="landing-container">
          <div style={{ textAlign: 'center' }}>
            <span className="landing-badge"><DollarSign size={12} /> Precios claros</span>
          </div>
          <h2 className="landing-section__title">Empieza gratis. Sin trampa.</h2>
          <div className="landing-pricing__card">
            <div className="landing-pricing__trial">
              <Zap size={20} />
              <div>
                <h3>2 días de prueba gratis</h3>
                <p>Todo incluido. Sin tarjeta. Sin compromiso.</p>
              </div>
            </div>
            <div className="landing-pricing__divider" />
            <p className="landing-pricing__then">Después, desde <strong>29€/mes</strong>. Cancela cuando quieras.</p>
            <Link to="/" className="landing-btn landing-btn--primary landing-btn--xl landing-btn--full">
              <Zap size={18} /> Empezar mi prueba gratis ahora
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-faq" ref={faqRef}>
        <div className="landing-container">
          <h2 className="landing-section__title">Preguntas frecuentes</h2>
          <div className="landing-faq__list">
            {objections.map((item, i) => (
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
                {faqOpen === i && (
                  <div className="landing-faq__answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-final">
        <div className="landing-container">
          <h2>¿Listo para que tu negocio<br />atienda clientes mientras duermes?</h2>
          <p>Únete a cientos de negocios que ya usan IA para crecer más rápido.</p>
            <Link to="/auth" className="landing-btn landing-btn--primary landing-btn--xl">
            <Zap size={20} /> Probar gratis 2 días <ArrowRight size={18} />
          </Link>
          <span className="landing-final__note">No se requiere tarjeta de crédito</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 Agutidesigns IA · Hecho con Inteligencia Artificial</p>
        <div className="landing-footer__links">
          <a href="/privacidad.html" target="_blank" rel="noopener">Privacidad</a>
          <span>·</span>
          <a href="/terminos.html" target="_blank" rel="noopener">Términos</a>
          <span>·</span>
          <a href="mailto:soporte@agutidesigns.io">Contacto</a>
        </div>
      </footer>
    </div>
  );
}
