import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Zap, Clock, Users, TrendingUp, CheckCircle,
  ArrowRight, Shield, Brain, BarChart3, ChevronDown, Bot,
  CalendarCheck, ShoppingCart, Headphones, Smartphone, Lock,
  Star, Play, Sparkles, Sun, Moon, X, Check,
  Scissors, Stethoscope, UtensilsCrossed, Dumbbell, Store, Briefcase, GraduationCap, Wrench
} from 'lucide-react';
import './SaasLanding.css';

const DEMO_MSGS = [
  { from: 'user', text: 'Hola, quiero reservar para mañana' },
  { from: 'bot', text: '¡Hola! 👋 Tengo disponible mañana:\n\n• *10:00*\n• *12:30*\n• *16:00*\n\n¿Cuál te viene mejor?' },
  { from: 'user', text: 'A las 16:00' },
  { from: 'bot', text: '✅ Cita *confirmada* para mañana a las *16:00*.\n\n¡Te esperamos!' },
];

const PAIN_POINTS = [
  { icon: <Clock size={24} />, pain: '¿Pierdes clientes fuera de horario?', title: 'Atiende 24/7 sin esfuerzo', desc: 'Tu agente IA responde a cualquier hora. Nunca pierdas un cliente por no estar disponible.' },
  { icon: <Users size={24} />, pain: '¿Olvidas recoger datos de contacto?', title: 'Capta leads automáticamente', desc: 'Recopila nombre, teléfono y email de cada persona interesada sin mover un dedo.' },
  { icon: <TrendingUp size={24} />, pain: '¿Tus clientes se van con la competencia?', title: 'Responde antes que nadie', desc: 'Respuestas instantáneas = más conversiones. El que responde primero, gana.' },
  { icon: <CalendarCheck size={24} />, pain: '¿Pierdes tiempo agendando citas?', title: 'Agenda citas automáticamente', desc: 'La IA propone huecos libres, confirma reservas y las añade a tu calendario.' },
];

const FEATURES_GRID = [
  { icon: <Bot size={22} />, title: 'IA entrenada con TU negocio', desc: 'Dale tus servicios, precios y horarios. Responde como si fueras tú.' },
  { icon: <CalendarCheck size={22} />, title: 'Agendamiento automático', desc: 'Propone horarios libres y confirma citas sin intervención humana.' },
  { icon: <ShoppingCart size={22} />, title: 'Técnicas de venta', desc: 'Recomienda servicios, hace upselling y supera objeciones de forma natural.' },
  { icon: <Users size={22} />, title: 'Captación de leads', desc: 'Recoge nombre y teléfono de cada persona interesada automáticamente.' },
  { icon: <BarChart3 size={22} />, title: 'Dashboard completo', desc: 'Estadísticas en tiempo real: mensajes, leads, conversaciones activas.' },
  { icon: <MessageCircle size={22} />, title: 'Historial de chats', desc: 'Revisa cada conversación que la IA ha tenido con tus clientes.' },
  { icon: <Brain size={22} />, title: 'Personalidad configurable', desc: 'Cercano, profesional, formal, divertido... Tú eliges cómo habla.' },
  { icon: <Shield size={22} />, title: 'Seguro y privado', desc: 'Tus datos y los de tus clientes protegidos. Sin permanencia.' },
];

const STEPS = [
  { num: '1', title: 'Conecta tu WhatsApp', desc: 'Escaneas un QR code desde tu móvil. Solo tarda 10 segundos.', time: '10 seg' },
  { num: '2', title: 'Entrena a la IA', desc: 'Añade tus servicios, precios y horarios. La IA aprende al instante.', time: '3 min' },
  { num: '3', title: 'Activa y listo', desc: 'Tu agente empieza a atender clientes automáticamente por WhatsApp.', time: '¡Ya!' },
];

const SECTORS = [
  { icon: <Scissors size={20} />, name: 'Peluquerías' },
  { icon: <Stethoscope size={20} />, name: 'Clínicas' },
  { icon: <UtensilsCrossed size={20} />, name: 'Restaurantes' },
  { icon: <Dumbbell size={20} />, name: 'Gimnasios' },
  { icon: <Store size={20} />, name: 'Tiendas' },
  { icon: <Briefcase size={20} />, name: 'Consultorías' },
  { icon: <GraduationCap size={20} />, name: 'Academias' },
  { icon: <Wrench size={20} />, name: 'Servicios' },
];

const COMPARE = [
  { without: 'Pierdes clientes fuera de horario', with: 'Atención automática 24/7' },
  { without: 'Tardas horas en responder', with: 'Respuesta instantánea en segundos' },
  { without: 'Agendas citas manualmente', with: 'La IA agenda citas sola' },
  { without: 'Olvidas recoger datos de contacto', with: 'Captación de leads automática' },
  { without: 'Pierdes ventas por no responder', with: 'La IA recomienda y vende por ti' },
];

const FAQ_DATA = [
  { q: '¿Es difícil de configurar?', a: 'No. Sin código, en 5 minutos está funcionando. Te guiamos paso a paso con tutoriales incluidos.' },
  { q: '¿Qué pasa si la IA responde mal?', a: 'Solo responde con la información de TU negocio. Si no sabe algo, avisa y deriva a ti directamente. Nunca inventa datos.' },
  { q: '¿Funciona con mi tipo de negocio?', a: 'Si atiendes clientes por WhatsApp, te sirve. Restaurantes, clínicas, peluquerías, tiendas, servicios, consultorías...' },
  { q: '¿Puedo seguir usando WhatsApp yo?', a: 'Sí. Si tú respondes manualmente, el agente se quita de en medio. Solo actúa cuando no estás.' },
  { q: '¿Cuánto cuesta?', a: 'Desde 29€/mes. Tienes 2 días gratis sin tarjeta para probarlo sin riesgo.' },
  { q: '¿Necesito la API de WhatsApp Business?', a: 'No. Funciona con tu WhatsApp normal. Solo escaneas un QR y listo.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin permanencia, sin penalizaciones. Cancelas y listo.' },
];

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
      <div className="chat-demo__bar"><div className="chat-demo__dot chat-demo__dot--r" /><div className="chat-demo__dot chat-demo__dot--y" /><div className="chat-demo__dot chat-demo__dot--g" /></div>
      <div className="chat-demo__header">
        <div className="chat-demo__avatar"><Bot size={18} /></div>
        <div><span className="chat-demo__name">Tu Negocio IA</span><span className="chat-demo__status">en linea</span></div>
      </div>
      <div className="chat-demo__body">
        {DEMO_MSGS.slice(0, vis).map((m, i) => (
          <motion.div key={i} className={`chat-demo__msg chat-demo__msg--${m.from}`} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }}>
            <span dangerouslySetInnerHTML={{ __html: m.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
          </motion.div>
        ))}
        {vis < DEMO_MSGS.length && <div className="chat-demo__typing"><span /><span /><span /></div>}
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="mockup">
      <div className="mockup__bar"><div className="mockup__dot" /><div className="mockup__dot" /><div className="mockup__dot" /></div>
      <div className="mockup__body">
        <div className="mockup__sidebar">
          <div className="mockup__logo">wasap<span>y</span></div>
          <div className="mockup__nav-item mockup__nav-item--active" />
          <div className="mockup__nav-item" />
          <div className="mockup__nav-item" />
          <div className="mockup__nav-item" />
          <div className="mockup__nav-item" />
        </div>
        <div className="mockup__content">
          <div className="mockup__stats">
            <div className="mockup__stat"><span className="mockup__stat-num">247</span><span className="mockup__stat-label">Mensajes</span></div>
            <div className="mockup__stat"><span className="mockup__stat-num">18</span><span className="mockup__stat-label">Leads</span></div>
            <div className="mockup__stat"><span className="mockup__stat-num">12</span><span className="mockup__stat-label">Citas</span></div>
            <div className="mockup__stat"><span className="mockup__stat-num">95%</span><span className="mockup__stat-label">Precisión</span></div>
          </div>
          <div className="mockup__cards">
            <div className="mockup__card" />
            <div className="mockup__card" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [painRef, painInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featRef, featInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [stepsRef, stepsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [secRef, secInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [compRef, compInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [faqRef, faqInView] = useInView({ threshold: 0.05, triggerOnce: true });

  function toggleTheme() {
    const curr = document.documentElement.getAttribute('data-theme');
    if (curr === 'dark') { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', ''); }
    else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
  }

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="lnav">
        <div className="lnav__inner">
          <Link to="/" className="lnav__logo"><span className="logo-text">wasap<span className="logo-y">y</span></span><span className="logo-io">.io</span></Link>
          <div className="lnav__center">
            <a href="#features" className="lnav__link">Funciones</a>
            <a href="#pricing" className="lnav__link">Precios</a>
            <a href="#faq" className="lnav__link">FAQ</a>
          </div>
          <div className="lnav__right">
            <button className="lnav__theme" onClick={toggleTheme}><Sun size={16} className="lnav__icon--light" /><Moon size={16} className="lnav__icon--dark" /></button>
            <Link to="/auth" className="lnav__login">Iniciar sesión</Link>
            <Link to="/auth?mode=register" className="lnav__cta">Prueba gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="lcontainer hero__grid">
          <motion.div className="hero__content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.div className="hero__badge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <Sparkles size={12} /> Agente WhatsApp IA para negocios
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              Automatiza tu WhatsApp<br /><span className="hero__gradient">en 5 minutos</span>
            </motion.h1>
            <motion.p className="hero__sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              Un agente IA que atiende clientes, agenda citas y cierra ventas por WhatsApp. <strong>24 horas, 7 días.</strong> Sin código. Sin complicaciones.
            </motion.p>
            <motion.div className="hero__ctas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Link to="/auth?mode=register" className="lbtn lbtn--primary lbtn--xl"><Zap size={18} /> Empezar gratis <ArrowRight size={16} /></Link>
              <a href="#features" className="lbtn lbtn--outline lbtn--xl"><Play size={16} /> Ver cómo funciona</a>
            </motion.div>
            <motion.div className="hero__trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              <CheckCircle size={14} /> 2 días gratis · Sin tarjeta · Cancela cuando quieras
            </motion.div>
          </motion.div>
          <motion.div className="hero__demo" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}>
            <ChatDemo />
          </motion.div>
        </div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section className="mockup-section">
        <div className="lcontainer">
          <div className="section-header">
            <h2>Tu panel de control completo</h2>
            <p className="section-sub">Visualiza todos tus mensajes, leads, citas y estadísticas desde un solo lugar. Todo en tiempo real.</p>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="pain" ref={painRef}>
        <div className="lcontainer">
          <div className="section-header">
            <h2>Wasapy es perfecto si...</h2>
            <p className="section-sub">Si alguno de estos problemas te suena, Wasapy lo resuelve automáticamente.</p>
          </div>
          <div className="pain__grid">
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={i} className="pain__card" initial={{ opacity: 0, y: 25 }} animate={painInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}>
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

      {/* ═══ FEATURE SHOWCASES WITH MOCKUPS ═══ */}
      <section className="showcases" id="features">
        <div className="lcontainer">
          {/* Showcase 1: Conversaciones IA */}
          <div className="showcase">
            <div className="showcase__text">
              <span className="showcase__tag"><Bot size={14} /> Asistente IA</span>
              <h2>Tu agente IA atiende como si fueras tú</h2>
              <p>Entrena a la IA con la informacion de tu negocio: servicios, precios, horarios, FAQ. Responde a tus clientes de forma natural, con la personalidad que elijas.</p>
              <ul className="showcase__list">
                <li><CheckCircle size={14} /> Respuestas instantaneas 24/7</li>
                <li><CheckCircle size={14} /> Solo usa datos reales de tu negocio</li>
                <li><CheckCircle size={14} /> Deriva a humano si no sabe responder</li>
                <li><CheckCircle size={14} /> Personalidad configurable</li>
              </ul>
            </div>
            <div className="showcase__visual">
              <div className="showcase-mock showcase-mock--chat">
                <div className="showcase-mock__bar"><div className="showcase-mock__dot" /><div className="showcase-mock__dot" /><div className="showcase-mock__dot" /></div>
                <div className="showcase-mock__content">
                  <div className="smock-msg smock-msg--in">Hola, ¿cuanto cuesta un corte de pelo?</div>
                  <div className="smock-msg smock-msg--out">¡Hola! El corte de caballero es <strong>15€</strong> y el de señora <strong>20€</strong>. ¿Te gustaría reservar cita?</div>
                  <div className="smock-msg smock-msg--in">Si, para mañana por la tarde</div>
                  <div className="smock-msg smock-msg--out">Tengo disponible mañana a las <strong>16:00</strong> y a las <strong>17:30</strong>. ¿Cual prefieres?</div>
                </div>
              </div>
            </div>
          </div>

          {/* Showcase 2: Calendario de citas */}
          <div className="showcase showcase--reverse">
            <div className="showcase__text">
              <span className="showcase__tag"><CalendarCheck size={14} /> Citas automaticas</span>
              <h2>La IA agenda citas por ti</h2>
              <p>Tu agente ve la disponibilidad real de tu agenda, propone horarios libres al cliente y confirma la cita automaticamente. Todo sin que toques el telefono.</p>
              <ul className="showcase__list">
                <li><CheckCircle size={14} /> Ve tu calendario en tiempo real</li>
                <li><CheckCircle size={14} /> Propone 2-3 horarios disponibles</li>
                <li><CheckCircle size={14} /> Confirma y guarda la cita sola</li>
                <li><CheckCircle size={14} /> Respeta tus horarios de apertura</li>
              </ul>
            </div>
            <div className="showcase__visual">
              <div className="showcase-mock showcase-mock--calendar">
                <div className="showcase-mock__bar"><div className="showcase-mock__dot" /><div className="showcase-mock__dot" /><div className="showcase-mock__dot" /></div>
                <div className="showcase-mock__content">
                  <div className="smock-cal__header">
                    <span>Febrero 2026</span>
                  </div>
                  <div className="smock-cal__days">
                    <span>LUN</span><span>MAR</span><span>MIE</span><span>JUE</span><span>VIE</span>
                  </div>
                  <div className="smock-cal__grid">
                    <div className="smock-cal__day">17</div>
                    <div className="smock-cal__day smock-cal__day--today">18</div>
                    <div className="smock-cal__day">19</div>
                    <div className="smock-cal__day">20</div>
                    <div className="smock-cal__day">21</div>
                  </div>
                  <div className="smock-cal__events">
                    <div className="smock-cal__event"><span>10:00</span> Maria G. - Corte</div>
                    <div className="smock-cal__event smock-cal__event--ai"><span>14:00</span> Carlos R. - Tinte</div>
                    <div className="smock-cal__event"><span>16:30</span> Ana M. - Mechas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Showcase 3: Dashboard */}
          <div className="showcase">
            <div className="showcase__text">
              <span className="showcase__tag"><BarChart3 size={14} /> Dashboard</span>
              <h2>Todo tu negocio en un vistazo</h2>
              <p>Visualiza mensajes, leads, citas y conversaciones desde un panel intuitivo. Estadisticas en tiempo real para que sepas exactamente como rinde tu agente IA.</p>
              <ul className="showcase__list">
                <li><CheckCircle size={14} /> Estadisticas de mensajes y leads</li>
                <li><CheckCircle size={14} /> Historial completo de conversaciones</li>
                <li><CheckCircle size={14} /> Configuracion del prompt IA</li>
                <li><CheckCircle size={14} /> Gestion de citas y reservas</li>
              </ul>
            </div>
            <div className="showcase__visual">
              <div className="showcase-mock showcase-mock--dash">
                <div className="showcase-mock__bar"><div className="showcase-mock__dot" /><div className="showcase-mock__dot" /><div className="showcase-mock__dot" /></div>
                <div className="showcase-mock__content">
                  <div className="smock-dash__sidebar">
                    <div className="smock-dash__logo">wasap<span>y</span></div>
                    <div className="smock-dash__nav"><div className="smock-dash__nav-item smock-dash__nav-item--active" /><div className="smock-dash__nav-item" /><div className="smock-dash__nav-item" /><div className="smock-dash__nav-item" /></div>
                  </div>
                  <div className="smock-dash__main">
                    <div className="smock-dash__stats">
                      <div className="smock-dash__stat"><strong>247</strong><span>Mensajes</span></div>
                      <div className="smock-dash__stat"><strong>18</strong><span>Leads</span></div>
                      <div className="smock-dash__stat"><strong>12</strong><span>Citas</span></div>
                    </div>
                    <div className="smock-dash__cards"><div className="smock-dash__card" /><div className="smock-dash__card" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GREEN CTA BANNER ═══ */}
      <section className="green-cta">
        <div className="lcontainer green-cta__inner">
          <div className="green-cta__content">
            <h2>Empieza a automatizar tu WhatsApp hoy</h2>
            <p>2 dias gratis. Sin tarjeta. Sin compromiso. Configura tu agente IA en menos de 5 minutos y empieza a atender clientes automaticamente.</p>
          </div>
          <Link to="/auth?mode=register" className="lbtn lbtn--white lbtn--xl">
            <Zap size={18} /> Prueba gratis ahora <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="feat-grid" ref={featRef}>
        <div className="lcontainer">
          <div className="section-header">
            <h2>Todo lo que necesitas para automatizar tu WhatsApp</h2>
            <p className="section-sub">Cada función está diseñada para que atiendas mejor, vendas más y pierdas menos tiempo.</p>
          </div>
          <div className="feat-grid__items">
            {FEATURES_GRID.map((f, i) => (
              <motion.div key={i} className="feat-grid__item" initial={{ opacity: 0, y: 20 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}>
                <div className="feat-grid__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" ref={stepsRef}>
        <div className="lcontainer">
          <div className="section-header">
            <h2>Activo en <span className="hero__gradient">3 pasos</span></h2>
            <p className="section-sub">No necesitas conocimientos técnicos. Si sabes usar WhatsApp, sabes usar Wasapy.</p>
          </div>
          <div className="how__grid">
            {STEPS.map((s, i) => (
              <motion.div key={i} className="how__step" initial={{ opacity: 0, y: 25 }} animate={stepsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.15 }}>
                <div className="how__num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <span className="how__time">{s.time}</span>
              </motion.div>
            ))}
          </div>
          <div className="how__cta">
            <Link to="/auth?mode=register" className="lbtn lbtn--primary lbtn--lg"><Zap size={16} /> Empezar ahora — Es gratis <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* SECTORS */}
      <section className="sectors" ref={secRef}>
        <div className="lcontainer">
          <div className="section-header">
            <h2>Funciona con cualquier negocio</h2>
            <p className="section-sub">Si atiendes clientes por WhatsApp, Wasapy puede ayudarte. Estos son algunos de los sectores que más lo usan.</p>
          </div>
          <div className="sectors__grid">
            {SECTORS.map((s, i) => (
              <motion.div key={i} className="sectors__item" initial={{ opacity: 0, scale: 0.9 }} animate={secInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.06 }}>
                <div className="sectors__icon">{s.icon}</div>
                <span>{s.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARATIVA */}
      <section className="compare" ref={compRef}>
        <div className="lcontainer">
          <div className="section-header">
            <h2>El antes y después con Wasapy</h2>
            <p className="section-sub">Compara cómo funciona tu negocio sin automatizar frente a lo que consigues con un agente IA atendiendo por ti.</p>
          </div>
          <div className="compare__table">
            <div className="compare__header">
              <span className="compare__col compare__col--bad">Sin Wasapy</span>
              <span className="compare__col compare__col--good">Con Wasapy</span>
            </div>
            {COMPARE.map((c, i) => (
              <motion.div key={i} className="compare__row" initial={{ opacity: 0, x: -10 }} animate={compInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.08 }}>
                <span className="compare__cell compare__cell--bad"><X size={14} /> {c.without}</span>
                <span className="compare__cell compare__cell--good"><Check size={14} /> {c.with}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section className="reviews">
        <div className="lcontainer">
          <div className="section-header">
            <h2>Lo que dicen nuestros usuarios</h2>
            <p className="section-sub">Negocios reales que ya automatizan su WhatsApp con Wasapy.</p>
          </div>
          <div className="reviews__grid">
            {[
              { quote: 'Desde que activamos Wasapy, no perdemos ni una consulta fuera de horario. Las citas se agendan solas y mis clientes estan encantados.', name: 'Laura M.', role: 'Clinica dental', stars: 5 },
              { quote: 'Mis clientes no notan que hablan con una IA. Responde con mis precios, mis horarios, todo perfecto. Me ahorra 3 horas al dia.', name: 'Carlos R.', role: 'Peluqueria', stars: 5 },
              { quote: 'En la primera semana ya se agendaron 12 citas sin que yo tocara el telefono. El ROI es brutal para lo que cuesta.', name: 'Ana G.', role: 'Estudio de yoga', stars: 5 },
            ].map((r, i) => (
              <motion.div key={i} className="review-card" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="review-card__stars">{Array.from({ length: r.stars }).map((_, si) => <Star key={si} size={15} />)}</div>
                <p className="review-card__quote">"{r.quote}"</p>
                <div className="review-card__author">
                  <div className="review-card__avatar">{r.name[0]}</div>
                  <div><span className="review-card__name">{r.name}</span><span className="review-card__role">{r.role}</span></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="lcontainer">
          <div className="section-header">
            <h2>Precio claro. Sin sorpresas.</h2>
            <p className="section-sub">Un solo plan con todo incluido. Empieza gratis y decide después.</p>
          </div>
          <div className="pricing__card">
            <div className="pricing__trial"><Sparkles size={22} /><div><h3>2 días gratis</h3><p>Todo incluido. Sin tarjeta. Sin compromiso.</p></div></div>
            <div className="pricing__divider" />
            <div className="pricing__price"><span className="pricing__amount">29€</span><span className="pricing__period">/mes</span></div>
            <ul className="pricing__list">
              <li><CheckCircle size={14} /> Agente IA para WhatsApp</li>
              <li><CheckCircle size={14} /> Agendamiento automático de citas</li>
              <li><CheckCircle size={14} /> Técnicas de venta integradas</li>
              <li><CheckCircle size={14} /> Dashboard con estadísticas</li>
              <li><CheckCircle size={14} /> Historial de conversaciones</li>
              <li><CheckCircle size={14} /> Soporte incluido</li>
              <li><CheckCircle size={14} /> Sin permanencia</li>
            </ul>
            <Link to="/auth?mode=register" className="lbtn lbtn--primary lbtn--xl lbtn--full"><Zap size={18} /> Empezar prueba gratis</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq" ref={faqRef}>
        <div className="lcontainer">
          <div className="section-header"><h2>Preguntas frecuentes</h2></div>
          <div className="faq__list">
            {FAQ_DATA.map((item, i) => (
              <motion.div key={i} className={`faq__item ${faqOpen === i ? 'faq__item--open' : ''}`} initial={{ opacity: 0 }} animate={faqInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.05 }}>
                <button className="faq__q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{item.q}</span><ChevronDown size={18} />
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div className="faq__a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <div className="lcontainer">
          <h2>Tu competencia ya usa IA.<br />¿Y tú?</h2>
          <p>Empieza gratis en 5 minutos. Sin tarjeta. Sin riesgo.</p>
          <Link to="/auth?mode=register" className="lbtn lbtn--primary lbtn--xl"><Zap size={20} /> Automatizar mi WhatsApp ahora <ArrowRight size={18} /></Link>
          <span className="final-cta__note">2 días gratis · Sin tarjeta de crédito · Cancela cuando quieras</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lfooter">
        <div className="lcontainer lfooter__inner">
          <div className="lfooter__brand"><span className="logo-text logo-text--sm">wasap<span className="logo-y">y</span></span><span className="logo-io">.io</span></div>
          <p>© 2026 Wasapy. Todos los derechos reservados.</p>
          <div className="lfooter__links">
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
