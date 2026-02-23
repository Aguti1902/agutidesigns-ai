import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Zap, Clock, Users, TrendingUp, CheckCircle,
  ArrowRight, Shield, Brain, BarChart3, ChevronDown, Bot,
  CalendarCheck, ShoppingCart, Headphones, Smartphone, Lock,
  Star, Play, Sparkles, MessageSquare
} from 'lucide-react';
import './SaasLanding.css';

const DEMO_MSGS = [
  { from: 'user', text: 'Hola, quiero reservar para mañana' },
  { from: 'bot', text: '¡Hola! 👋 Tengo disponible mañana:\n\n• *10:00*\n• *12:30*\n• *16:00*\n\n¿Cuál te viene mejor?' },
  { from: 'user', text: 'A las 16:00' },
  { from: 'bot', text: '✅ Cita *confirmada* para mañana a las *16:00*.\n\n¡Te esperamos!' },
];

const PAIN_POINTS = [
  {
    icon: <Clock size={24} />,
    pain: '¿Pierdes clientes fuera de horario?',
    title: 'Atiende 24/7 sin esfuerzo',
    desc: 'Tu agente IA responde a cualquier hora. Nunca pierdas un cliente por no estar disponible.',
  },
  {
    icon: <Users size={24} />,
    pain: '¿Olvidas recoger datos de contacto?',
    title: 'Capta leads automáticamente',
    desc: 'Recopila nombre, teléfono y email de cada persona interesada sin mover un dedo.',
  },
  {
    icon: <TrendingUp size={24} />,
    pain: '¿Tus clientes se van con la competencia?',
    title: 'Responde antes que nadie',
    desc: 'Respuestas instantáneas = más conversiones. El que responde primero, gana.',
  },
  {
    icon: <CalendarCheck size={24} />,
    pain: '¿Pierdes tiempo agendando citas?',
    title: 'Agenda citas automáticamente',
    desc: 'La IA propone huecos libres, confirma reservas y las añade a tu calendario.',
  },
];

const FEATURES_DATA = [
  {
    icon: <Bot size={28} />,
    title: 'Asistente IA entrenado con TU negocio',
    desc: 'Dale tus servicios, precios, horarios y FAQ. La IA responde como si fueras tú, con la personalidad que elijas.',
    bullets: [
      'Aprende de tu información en segundos',
      'Personalidad configurable (formal, cercano, divertido...)',
      'Responde solo con datos reales de tu negocio',
      'Deriva a humano cuando no sabe responder',
    ],
  },
  {
    icon: <CalendarCheck size={28} />,
    title: 'Agendamiento inteligente de citas',
    desc: 'Tu agente ve la disponibilidad real de tu agenda y propone huecos libres al cliente. Confirma y guarda la cita automáticamente.',
    bullets: [
      'Ve tu calendario en tiempo real',
      'Propone 2-3 horarios disponibles',
      'Confirma y guarda la cita sin intervención',
      'El cliente recibe confirmación por WhatsApp',
    ],
  },
  {
    icon: <ShoppingCart size={28} />,
    title: 'Vende más sin esfuerzo',
    desc: 'La IA detecta oportunidades de venta, recomienda servicios y supera objeciones de forma natural.',
    bullets: [
      'Recomienda el servicio que mejor encaja',
      'Upselling y cross-selling inteligente',
      'Supera objeciones con datos reales',
      'Facilita el siguiente paso (reservar, visitar, comprar)',
    ],
  },
];

const STEPS = [
  { num: '1', title: 'Conecta tu WhatsApp', desc: 'Escaneas un QR. 10 segundos.', time: '10 seg' },
  { num: '2', title: 'Entrena a la IA', desc: 'Le das tus servicios, precios y horarios.', time: '3 min' },
  { num: '3', title: 'Activa y listo', desc: 'Tu agente empieza a atender clientes.', time: '¡Ya!' },
];

const TESTIMONIALS = [
  { quote: 'Desde que activamos Wasapy, no perdemos ni una consulta fuera de horario. Las citas se agendan solas.', name: 'Laura M.', role: 'Clínica dental', stars: 5 },
  { quote: 'Mis clientes no notan que hablan con una IA. Responde con mis precios, mis horarios, todo perfecto.', name: 'Carlos R.', role: 'Peluquería', stars: 5 },
  { quote: 'En la primera semana ya se agendaron 12 citas sin que yo tocara el teléfono. Increíble.', name: 'Ana G.', role: 'Estudio de yoga', stars: 5 },
];

const FAQ_DATA = [
  { q: '¿Es difícil de configurar?', a: 'No. Sin código, en 5 minutos está funcionando. Te guiamos paso a paso.' },
  { q: '¿Qué pasa si la IA responde mal?', a: 'Solo responde con la información de TU negocio. Si no sabe algo, avisa y deriva a ti directamente.' },
  { q: '¿Funciona con mi tipo de negocio?', a: 'Si atiendes clientes por WhatsApp, te sirve. Restaurantes, clínicas, peluquerías, tiendas, servicios...' },
  { q: '¿Puedo seguir usando WhatsApp yo?', a: 'Sí. Si tú respondes manualmente, el agente se quita de en medio. Solo actúa cuando no estás.' },
  { q: '¿Cuánto cuesta?', a: 'Desde 29€/mes. Tienes 2 días gratis sin tarjeta para probarlo.' },
  { q: '¿Necesito la API de WhatsApp?', a: 'No. Funciona con tu WhatsApp normal. Solo escaneas un QR y listo.' },
];

const SECTORS = ['Peluquerías', 'Clínicas', 'Restaurantes', 'Gimnasios', 'Estudios', 'Tiendas', 'Servicios', 'Consultorías'];

function CountUp({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function ChatDemo() {
  const [vis, setVis] = useState(0);
  useEffect(() => {
    if (vis < DEMO_MSGS.length) {
      const t = setTimeout(() => setVis(v => v + 1), vis === 0 ? 1000 : 1400);
      return () => clearTimeout(t);
    }
  }, [vis]);

  return (
    <div className="chat-demo">
      <div className="chat-demo__bar">
        <div className="chat-demo__dot chat-demo__dot--r" />
        <div className="chat-demo__dot chat-demo__dot--y" />
        <div className="chat-demo__dot chat-demo__dot--g" />
      </div>
      <div className="chat-demo__header">
        <div className="chat-demo__avatar"><Bot size={18} /></div>
        <div>
          <span className="chat-demo__name">Tu Negocio IA</span>
          <span className="chat-demo__status">en línea</span>
        </div>
      </div>
      <div className="chat-demo__body">
        {DEMO_MSGS.slice(0, vis).map((m, i) => (
          <motion.div key={i} className={`chat-demo__msg chat-demo__msg--${m.from}`}
            initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }}
          >
            <span dangerouslySetInnerHTML={{ __html: m.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
          </motion.div>
        ))}
        {vis < DEMO_MSGS.length && <div className="chat-demo__typing"><span /><span /><span /></div>}
      </div>
    </div>
  );
}

function FeatureBlock({ feature, index }) {
  const [open, setOpen] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  const isReversed = index % 2 !== 0;

  return (
    <motion.div ref={ref} className={`feat ${isReversed ? 'feat--reverse' : ''}`}
      initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
    >
      <div className="feat__icon-wrap">{feature.icon}</div>
      <div className="feat__content">
        <h3>{feature.title}</h3>
        <p>{feature.desc}</p>
        <button className={`feat__toggle ${open ? 'feat__toggle--open' : ''}`} onClick={() => setOpen(!open)}>
          {open ? 'Ver menos' : 'Ver más'} <ChevronDown size={14} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul className="feat__bullets"
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            >
              {feature.bullets.map((b, i) => <li key={i}><CheckCircle size={14} /> {b}</li>)}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [painRef, painInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [stepsRef, stepsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [testRef, testInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [faqRef, faqInView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <div className="landing">
      {/* ═══ NAV ═══ */}
      <nav className="landing-nav">
        <Link to="/" className="landing-nav__logo">
          <span className="logo-text">wasap<span className="logo-y">y</span></span>
          <span className="logo-io">.io</span>
        </Link>
        <div className="landing-nav__center">
          <a href="#features" className="landing-nav__link">Funciones</a>
          <a href="#pricing" className="landing-nav__link">Precios</a>
          <a href="#faq" className="landing-nav__link">FAQ</a>
        </div>
        <div className="landing-nav__right">
          <Link to="/auth" className="landing-nav__login">Iniciar sesión</Link>
          <Link to="/auth?mode=register" className="landing-nav__cta">Prueba gratis</Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="landing-container hero__grid">
          <motion.div className="hero__content"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <motion.div className="hero__badge" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Sparkles size={12} /> Agente WhatsApp IA para negocios
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              Automatiza tu WhatsApp<br /><span className="hero__gradient">en 5 minutos</span>
            </motion.h1>
            <motion.p className="hero__sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              Un agente IA que atiende clientes, agenda citas y cierra ventas por WhatsApp. <strong>24/7. Sin código.</strong>
            </motion.p>
            <motion.div className="hero__ctas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Link to="/auth?mode=register" className="btn btn--primary btn--xl">
                <Zap size={18} /> Empezar gratis <ArrowRight size={16} />
              </Link>
              <a href="#features" className="btn btn--ghost btn--xl">
                <Play size={16} /> Ver cómo funciona
              </a>
            </motion.div>
            <motion.div className="hero__trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              <CheckCircle size={14} /> 2 días gratis · Sin tarjeta · Cancela cuando quieras
            </motion.div>
          </motion.div>
          <motion.div className="hero__demo"
            initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          >
            <ChatDemo />
          </motion.div>
        </div>
      </section>

      {/* ═══ LOGOS / SECTORS ═══ */}
      <section className="sectors">
        <div className="landing-container">
          <p className="sectors__label">Negocios que ya automatizan su WhatsApp</p>
          <div className="sectors__track">
            <div className="sectors__scroll">
              {[...SECTORS, ...SECTORS].map((s, i) => <span key={i} className="sectors__item">{s}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="stats" ref={statsRef}>
        <div className="landing-container stats__grid">
          <div className="stat">
            <span className="stat__num"><CountUp end={5} suffix=" min" /></span>
            <span className="stat__label">configuración</span>
          </div>
          <div className="stat__sep" />
          <div className="stat">
            <span className="stat__num">24/7</span>
            <span className="stat__label">atención automática</span>
          </div>
          <div className="stat__sep" />
          <div className="stat">
            <span className="stat__num"><CountUp end={95} suffix="%" /></span>
            <span className="stat__label">respuestas correctas</span>
          </div>
          <div className="stat__sep" />
          <div className="stat">
            <span className="stat__num"><CountUp end={29} suffix="€" /></span>
            <span className="stat__label">/mes todo incluido</span>
          </div>
        </div>
      </section>

      {/* ═══ PAIN POINTS — "Wasapy es perfecto si..." ═══ */}
      <section className="pain" ref={painRef}>
        <div className="landing-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 20 }} animate={painInView ? { opacity: 1, y: 0 } : {}}>
            <h2>Wasapy es perfecto si...</h2>
            <p className="section-sub">Si alguno de estos problemas te suena, Wasapy lo resuelve.</p>
          </motion.div>
          <div className="pain__grid">
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={i} className="pain__card"
                initial={{ opacity: 0, y: 25 }} animate={painInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}
              >
                <div className="pain__icon">{p.icon}</div>
                <span className="pain__question">{p.pain}</span>
                <div className="pain__divider" />
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="features" id="features">
        <div className="landing-container">
          <div className="section-header">
            <h2>Lo que hace posible el cambio</h2>
            <p className="section-sub">Las funcionalidades que convierten tu WhatsApp en una máquina de atender, vender y agendar.</p>
          </div>
          {FEATURES_DATA.map((f, i) => <FeatureBlock key={i} feature={f} index={i} />)}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="how" ref={stepsRef}>
        <div className="landing-container">
          <div className="section-header">
            <h2>Activo en <span className="hero__gradient">3 pasos</span></h2>
          </div>
          <div className="how__grid">
            {STEPS.map((s, i) => (
              <motion.div key={i} className="how__step"
                initial={{ opacity: 0, y: 25 }} animate={stepsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.15 }}
              >
                <div className="how__num">{s.num}</div>
                <div className="how__line" />
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <span className="how__time">{s.time}</span>
              </motion.div>
            ))}
          </div>
          <div className="how__cta">
            <Link to="/auth?mode=register" className="btn btn--primary btn--lg">
              <Zap size={16} /> Empezar ahora — Es gratis <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="testi" ref={testRef}>
        <div className="landing-container">
          <div className="section-header">
            <h2>Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="testi__grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} className="testi__card"
                initial={{ opacity: 0, y: 20 }} animate={testInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.12 }}
              >
                <div className="testi__stars">
                  {Array.from({ length: t.stars }).map((_, si) => <Star key={si} size={14} />)}
                </div>
                <p className="testi__quote">"{t.quote}"</p>
                <div className="testi__author">
                  <div className="testi__avatar">{t.name[0]}</div>
                  <div>
                    <span className="testi__name">{t.name}</span>
                    <span className="testi__role">{t.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="pricing" id="pricing">
        <div className="landing-container">
          <div className="section-header">
            <h2>Precio claro. Sin sorpresas.</h2>
          </div>
          <div className="pricing__card">
            <div className="pricing__trial">
              <Sparkles size={22} />
              <div>
                <h3>2 días gratis</h3>
                <p>Todo incluido. Sin tarjeta. Sin compromiso.</p>
              </div>
            </div>
            <div className="pricing__divider" />
            <div className="pricing__price">
              <span className="pricing__amount">29€</span>
              <span className="pricing__period">/mes</span>
            </div>
            <ul className="pricing__list">
              <li><CheckCircle size={14} /> Agente IA para WhatsApp</li>
              <li><CheckCircle size={14} /> Agendamiento automático de citas</li>
              <li><CheckCircle size={14} /> Técnicas de venta integradas</li>
              <li><CheckCircle size={14} /> Dashboard con estadísticas</li>
              <li><CheckCircle size={14} /> Soporte incluido</li>
              <li><CheckCircle size={14} /> Sin permanencia, cancela cuando quieras</li>
            </ul>
            <Link to="/auth?mode=register" className="btn btn--primary btn--xl btn--full">
              <Zap size={18} /> Empezar prueba gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="faq" id="faq" ref={faqRef}>
        <div className="landing-container">
          <div className="section-header">
            <h2>Preguntas frecuentes</h2>
          </div>
          <div className="faq__list">
            {FAQ_DATA.map((item, i) => (
              <motion.div key={i} className={`faq__item ${faqOpen === i ? 'faq__item--open' : ''}`}
                initial={{ opacity: 0 }} animate={faqInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.05 }}
              >
                <button className="faq__q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{item.q}</span>
                  <ChevronDown size={18} />
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div className="faq__a"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="final-cta">
        <div className="final-cta__glow" />
        <div className="landing-container">
          <h2>Tu competencia ya usa IA.<br />¿Y tú?</h2>
          <p>Empieza gratis en 5 minutos. Sin tarjeta. Sin riesgo.</p>
          <Link to="/auth?mode=register" className="btn btn--primary btn--xl">
            <Zap size={20} /> Automatizar mi WhatsApp ahora <ArrowRight size={18} />
          </Link>
          <span className="final-cta__note">2 días gratis · Sin tarjeta de crédito · Cancela cuando quieras</span>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <div className="landing-footer__brand">
            <span className="logo-text logo-text--sm">wasap<span className="logo-y">y</span></span>
            <span className="logo-io">.io</span>
          </div>
          <p>© 2026 Wasapy. Todos los derechos reservados.</p>
          <div className="landing-footer__links">
            <a href="https://agutidesigns.io/privacidad.html" target="_blank" rel="noopener">Privacidad</a>
            <span>·</span>
            <a href="https://agutidesigns.io/terminos.html" target="_blank" rel="noopener">Términos</a>
            <span>·</span>
            <a href="mailto:soporte@agutidesigns.io">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
