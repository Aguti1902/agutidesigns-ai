import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Zap, Clock, Users, TrendingUp, CheckCircle,
  ArrowRight, Shield, Brain, BarChart3, ChevronDown, Bot,
  CalendarCheck, ShoppingCart, Smartphone, Lock, Star, Sparkles,
  Sun, Moon, X, Check, Send, ChevronRight,
  Scissors, Stethoscope, UtensilsCrossed, Dumbbell, Store, Briefcase, GraduationCap, Wrench
} from 'lucide-react';
import './SaasLanding.css';

function CountUp({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ threshold: 0.5, triggerOnce: true });
  useEffect(() => {
    if (!inView) return;
    let n = 0; const step = end / 50;
    const t = setInterval(() => { n += step; if (n >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(n)); }, 20);
    return () => clearInterval(t);
  }, [inView, end]);
  return <span ref={ref}>{count}{suffix}</span>;
}

const HERO_FEATURES = [
  { icon: <Bot size={18} />, text: 'IA en WhatsApp' },
  { icon: <CalendarCheck size={18} />, text: 'Reservas inteligentes' },
  { icon: <ShoppingCart size={18} />, text: 'Ventas automaticas' },
  { icon: <BarChart3 size={18} />, text: 'Dashboard y analytics' },
  { icon: <Brain size={18} />, text: 'Prompt personalizable' },
];

const PRODUCT_SECTIONS = [
  {
    id: 'ai-chat',
    tag: 'ASISTENTE IA',
    title: 'Tu agente IA responde como tú, pero 24/7',
    desc: 'Entrena a la IA con la información real de tu negocio. Servicios, precios, horarios, FAQ... Responde a cada cliente de forma natural, con el tono que tú elijas.',
    cardTitle: 'Atención inteligente por WhatsApp',
    cardDesc: 'Tu agente entiende lo que el cliente necesita y responde con información real de tu negocio. Sin intervención, sin errores.',
    bullets: ['Respuestas instantáneas en segundos', 'Personalidad configurable: cercano, profesional, divertido', 'Solo usa datos reales de tu negocio, nunca inventa', 'Detecta intención de compra y facilita la venta', 'Deriva a humano cuando no sabe la respuesta', 'Funciona con tu WhatsApp actual'],
    mockup: 'chat',
  },
  {
    id: 'calendar',
    tag: 'CITAS AUTOMÁTICAS',
    title: 'Todo tu calendario en un solo panel',
    desc: 'La IA ve tu disponibilidad en tiempo real, propone horarios libres al cliente y confirma la reserva automáticamente.',
    cardTitle: 'Gestión completa de reservas',
    cardDesc: 'Vista semanal real con todas las citas de tu negocio. La IA agenda por ti y tú solo te presentas.',
    bullets: ['Vista semanal con horarios de apertura', 'La IA propone 2-3 opciones disponibles', 'Confirma y guarda la cita sin intervención', 'Diferencia citas manuales de las creadas por IA', 'Respeta tus horarios y días de cierre', 'Control de cancelaciones y huecos libres'],
    mockup: 'calendar',
  },
  {
    id: 'dashboard',
    tag: 'DASHBOARD',
    title: 'Estadísticas, conversaciones y control total',
    desc: 'Visualiza mensajes enviados, leads captados, citas agendadas y conversaciones activas. Todo en tiempo real.',
    cardTitle: 'Todo tu negocio en un vistazo',
    cardDesc: 'Panel intuitivo con métricas en tiempo real para que sepas exactamente cómo rinde tu agente IA.',
    bullets: ['Métricas: mensajes, leads, citas, precisión', 'Historial completo de cada conversación', 'Configuración del prompt y personalidad IA', 'Gestión de suscripción y facturación', 'Soporte integrado desde la plataforma'],
    mockup: 'dashboard',
  },
];

const SECTORS = [
  { icon: <Scissors size={20} />, name: 'Peluquerías', desc: 'Citas, precios, horarios' },
  { icon: <Stethoscope size={20} />, name: 'Clínicas', desc: 'Reservas de consultas' },
  { icon: <UtensilsCrossed size={20} />, name: 'Restaurantes', desc: 'Reservas de mesa' },
  { icon: <Dumbbell size={20} />, name: 'Gimnasios', desc: 'Clases y membresías' },
  { icon: <Store size={20} />, name: 'Tiendas', desc: 'Info y disponibilidad' },
  { icon: <Briefcase size={20} />, name: 'Consultorías', desc: 'Agendar reuniones' },
  { icon: <GraduationCap size={20} />, name: 'Academias', desc: 'Matrículas y horarios' },
  { icon: <Wrench size={20} />, name: 'Servicios', desc: 'Presupuestos y citas' },
];

const REVIEWS = [
  { quote: 'Desde que activamos Wasapy, no perdemos ni una consulta fuera de horario. Las citas se agendan solas.', name: 'Laura M.', role: 'Clínica dental' },
  { quote: 'Mis clientes no notan que hablan con una IA. Me ahorra al menos 3 horas al día.', name: 'Carlos R.', role: 'Peluquería' },
  { quote: 'En la primera semana se agendaron 12 citas sin que tocara el teléfono. El ROI es brutal.', name: 'Ana G.', role: 'Estudio de yoga' },
];

const FAQ = [
  { q: '¿Es difícil de configurar?', a: 'No. Sin código, en 5 minutos está funcionando. Te guiamos paso a paso con tutoriales dentro de la plataforma.' },
  { q: '¿Y si la IA responde mal?', a: 'Solo responde con la información de TU negocio. Nunca inventa. Si no sabe algo, avisa y deriva a ti directamente.' },
  { q: '¿Funciona con mi tipo de negocio?', a: 'Si atiendes clientes por WhatsApp, sí. Restaurantes, clínicas, peluquerías, tiendas, servicios, consultorías...' },
  { q: '¿Puedo seguir usando mi WhatsApp?', a: 'Sí. Si respondes manualmente, el agente se aparta. Solo actúa cuando no estás.' },
  { q: '¿Cuánto cuesta?', a: '29€/mes con todo incluido. 2 días gratis sin tarjeta para que lo pruebes sin riesgo.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin permanencia, sin penalizaciones, sin letra pequeña.' },
];

/* ── MOCKUPS ── */
function MockChat() {
  return (
    <div className="mk">
      <div className="mk__bar"><span /><span /><span /></div>
      <div className="mk__head"><div className="mk__av"><Bot size={14} /></div><div><b>Tu Negocio IA</b><small>en línea</small></div></div>
      <div className="mk__chat">
        <div className="mk__m mk__m--in">Hola, ¿cuánto cuesta un corte de pelo?</div>
        <div className="mk__m mk__m--out">¡Hola! El corte caballero es <b>15€</b> y señora <b>20€</b>. ¿Te gustaría reservar cita?</div>
        <div className="mk__m mk__m--in">Sí, para mañana por la tarde</div>
        <div className="mk__m mk__m--out">Tengo disponible mañana a las <b>16:00</b> o <b>17:30</b>. ¿Cuál prefieres?</div>
        <div className="mk__m mk__m--in">A las 16:00</div>
        <div className="mk__m mk__m--out">✅ Cita <b>confirmada</b> mañana a las <b>16:00</b>. ¡Te esperamos!</div>
      </div>
      <div className="mk__input"><span>Escribe un mensaje...</span><Send size={14} /></div>
    </div>
  );
}

function MockCalendar() {
  return (
    <div className="mk mk--lg">
      <div className="mk__bar"><span /><span /><span /></div>
      <div className="mk-cal">
        <div className="mk-cal__top">
          <div><b>Calendario de Reservas</b><small>Gestiona todas las citas de tu negocio</small></div>
          <span className="mk-cal__badge">+ Nueva Reserva</span>
        </div>
        <div className="mk-cal__week">
          <div className="mk-cal__wh"><small>Hora</small></div>
          {['Lun 17', 'Mar 18', 'Mié 19', 'Jue 20', 'Vie 21'].map((d, i) => (
            <div key={i} className={`mk-cal__wd ${i === 1 ? 'mk-cal__wd--today' : ''}`}><small>{d}</small></div>
          ))}
        </div>
        <div className="mk-cal__body">
          <div className="mk-cal__hours">
            {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(h => <div key={h} className="mk-cal__h">{h}</div>)}
          </div>
          <div className="mk-cal__grid">
            <div className="mk-cal__ev" style={{ gridColumn: 2, gridRow: '1/2' }}>María G.<br /><small>Corte</small></div>
            <div className="mk-cal__ev mk-cal__ev--ai" style={{ gridColumn: 3, gridRow: '3/4' }}>Carlos R.<br /><small>Tinte</small></div>
            <div className="mk-cal__ev" style={{ gridColumn: 2, gridRow: '6/7' }}>Ana M.<br /><small>Mechas</small></div>
            <div className="mk-cal__ev mk-cal__ev--ai" style={{ gridColumn: 4, gridRow: '4/5' }}>Pedro L.<br /><small>Barba</small></div>
            <div className="mk-cal__ev" style={{ gridColumn: 5, gridRow: '2/3' }}>Sara T.<br /><small>Keratina</small></div>
            <div className="mk-cal__ev mk-cal__ev--ai" style={{ gridColumn: 3, gridRow: '7/8' }}>Luis A.<br /><small>Corte</small></div>
          </div>
        </div>
        <div className="mk-cal__legend"><span className="mk-cal__ldot" /> Manual <span className="mk-cal__ldot mk-cal__ldot--ai" /> Agendada por IA</div>
      </div>
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="mk mk--lg">
      <div className="mk__bar"><span /><span /><span /></div>
      <div className="mk-dash">
        <div className="mk-dash__side">
          <div className="mk-dash__logo">wasap<em>y</em></div>
          <nav className="mk-dash__nav">
            <div className="mk-dash__ni mk-dash__ni--on"><BarChart3 size={11} /> Dashboard</div>
            <div className="mk-dash__ni"><MessageCircle size={11} /> WhatsApp</div>
            <div className="mk-dash__ni"><Brain size={11} /> Prompt IA</div>
            <div className="mk-dash__ni"><CalendarCheck size={11} /> Citas</div>
            <div className="mk-dash__ni"><Shield size={11} /> Soporte</div>
          </nav>
        </div>
        <div className="mk-dash__main">
          <div className="mk-dash__stats">
            <div className="mk-dash__st"><strong>247</strong><span>Mensajes</span></div>
            <div className="mk-dash__st"><strong>18</strong><span>Leads</span></div>
            <div className="mk-dash__st"><strong>12</strong><span>Citas hoy</span></div>
            <div className="mk-dash__st"><strong>95%</strong><span>Precisión</span></div>
          </div>
          <div className="mk-dash__convos">
            <small className="mk-dash__convos-title">Conversaciones recientes</small>
            {[
              { name: 'María G.', msg: '¿Tienen disponibilidad mañana por...', time: '14:32', unread: false },
              { name: 'Carlos R.', msg: 'Perfecto, a las 16:00 me viene...', time: '14:28', unread: true },
              { name: 'Ana M.', msg: '¿Cuánto cuesta el tratamiento de...', time: '13:15', unread: false },
              { name: 'Pedro L.', msg: 'Quiero cancelar mi cita del juev...', time: '12:40', unread: true },
            ].map((c, i) => (
              <div key={i} className="mk-dash__convo">
                <div className={`mk-dash__dot ${c.unread ? 'mk-dash__dot--new' : ''}`} />
                <div className="mk-dash__convo-info"><b>{c.name}</b><span>{c.msg}</span></div>
                <small>{c.time}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCKUPS = { chat: MockChat, calendar: MockCalendar, dashboard: MockDashboard };

/* ══════════════════════════════════ */
export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const toggle = () => {
    const d = document.documentElement;
    const isDark = d.getAttribute('data-theme') === 'dark';
    if (isDark) { d.removeAttribute('data-theme'); localStorage.setItem('theme', ''); }
    else { d.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
  };

  return (
    <div className="lp">
      {/* NAV */}
      <nav className="ln"><div className="lc ln__in">
        <Link to="/" className="ln__logo"><span className="lt">wasap<span className="lg">y</span></span><span className="lb">.io</span></Link>
        <div className="ln__mid"><a href="#product">Producto</a><a href="#sectors">Sectores</a><a href="#pricing">Precios</a><a href="#faq">FAQ</a></div>
        <div className="ln__r">
          <button className="ln__theme" onClick={toggle}><Sun size={15} className="ln__il" /><Moon size={15} className="ln__id" /></button>
          <Link to="/auth" className="ln__log">Entrar</Link>
          <Link to="/auth?mode=register" className="ln__cta"><Zap size={14} /> Prueba gratis</Link>
        </div>
      </div></nav>

      {/* ═══ HERO — Nexi style ═══ */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="lc hero__grid">
          <motion.div className="hero__left" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="hero__pill"><Sparkles size={12} /> Potenciado con Inteligencia Artificial</span>
            <h1>El WhatsApp con IA que <span className="grad">multiplica tus reservas</span></h1>
            <p>Un asistente IA que atiende a tus clientes por WhatsApp 24/7. Gestiona reservas, responde preguntas y cierra ventas desde una única plataforma.</p>
            <div className="hero__metrics">
              <div><Clock size={15} /> Configuración en 5 min</div>
              <div><Shield size={15} /> GDPR compliance</div>
              <div><TrendingUp size={15} /> +40% reservas</div>
              <div><Bot size={15} /> IA 24/7</div>
            </div>
            <div className="hero__social">
              <div className="hero__avatars"><span>L</span><span>C</span><span>A</span><span>P</span></div>
              <div className="hero__social-stars">{[1,2,3,4,5].map(i => <Star key={i} size={13} />)}</div>
              <span className="hero__social-text">Usado por negocios en España</span>
            </div>
          </motion.div>

          <motion.div className="hero__right" initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
            <div className="hero-card">
              <span className="hero-card__badge"><Zap size={12} /> 2 DÍAS GRATIS</span>
              <h3>Prueba todo el potencial de Wasapy sin coste</h3>
              <p>Crea tu cuenta en 2 minutos y accede a todas las funcionalidades. Sin tarjeta de crédito, sin permanencia.</p>
              <ul className="hero-card__features">
                {HERO_FEATURES.map((f, i) => <li key={i}>{f.icon}<span>{f.text}</span></li>)}
              </ul>
              <Link to="/auth?mode=register" className="btn btn--p btn--xl btn--full"><Zap size={16} /> Empezar prueba gratuita <ArrowRight size={16} /></Link>
              <div className="hero-card__note"><Lock size={12} /> Sin tarjeta <Shield size={12} /> GDPR <Zap size={12} /> Activo en 2 min</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="strip"><div className="lc strip__in">
        {[{ n: 5, s: ' min', l: 'Configuración' }, { n: 95, s: '%', l: 'Respuestas correctas' }, { n: 24, s: '/7', l: 'Atención automática' }, { n: 29, s: '€', l: '/mes todo incluido' }].map((s, i) => (
          <div key={i} className="strip__it"><span className="strip__n"><CountUp end={s.n} suffix={s.s} /></span><span className="strip__l">{s.l}</span></div>
        ))}
      </div></section>

      {/* ═══ PRODUCT SECTIONS ═══ */}
      <div id="product">
        {PRODUCT_SECTIONS.map((sec, i) => {
          const Mk = MOCKUPS[sec.mockup];
          return <ProductSection key={i} sec={sec} idx={i} Mk={Mk} />;
        })}
      </div>

      {/* ═══ GREEN CTA ═══ */}
      <section className="gcta"><div className="lc gcta__in">
        <div><h2>Activa tu agente IA en 5 minutos</h2><p>2 días gratis. Sin tarjeta. Sin compromiso. Tu WhatsApp automatizado hoy mismo.</p></div>
        <Link to="/auth?mode=register" className="btn btn--w btn--xl"><Zap size={18} /> Probar gratis ahora <ArrowRight size={16} /></Link>
      </div></section>

      {/* ═══ SECTORS ═══ */}
      <Sec id="sectors" alt>
        <div className="sh"><h2>Para cualquier tipo de negocio</h2><p className="sp">Si atiendes clientes por WhatsApp, Wasapy puede ayudarte.</p></div>
        <div className="sectors">{SECTORS.map((s, i) => (
          <motion.div key={i} className="sector" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
            <div className="sector__ic">{s.icon}</div><b>{s.name}</b><span>{s.desc}</span>
          </motion.div>
        ))}</div>
      </Sec>

      {/* ═══ REVIEWS ═══ */}
      <Sec>
        <div className="sh"><h2>Lo que dicen nuestros usuarios</h2></div>
        <div className="revs">{REVIEWS.map((r, i) => (
          <motion.div key={i} className="rev" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <div className="rev__stars">{[1,2,3,4,5].map(j => <Star key={j} size={14} />)}</div>
            <p>"{r.quote}"</p>
            <div className="rev__who"><div className="rev__av">{r.name[0]}</div><div><b>{r.name}</b><span>{r.role}</span></div></div>
          </motion.div>
        ))}</div>
      </Sec>

      {/* ═══ HOW IT WORKS ═══ */}
      <Sec alt>
        <div className="sh"><h2>Activo en <span className="grad">3 pasos</span></h2><p className="sp">No necesitas conocimientos técnicos. Si sabes usar WhatsApp, sabes usar Wasapy.</p></div>
        <div className="steps">{[
          { n: '1', t: 'Conecta tu WhatsApp', d: 'Escaneas un QR code. 10 segundos.', time: '10 seg' },
          { n: '2', t: 'Entrena a la IA', d: 'Añade tus servicios, precios y horarios.', time: '3 min' },
          { n: '3', t: 'Activa y listo', d: 'Tu agente atiende clientes automáticamente.', time: '¡Ya!' },
        ].map((s, i) => (
          <motion.div key={i} className="step" initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
            <div className="step__n">{s.n}</div><h3>{s.t}</h3><p>{s.d}</p><span className="step__time">{s.time}</span>
          </motion.div>
        ))}</div>
      </Sec>

      {/* ═══ PRICING ═══ */}
      <Sec id="pricing">
        <div className="sh"><h2>Precio claro. Sin sorpresas.</h2><p className="sp">Un solo plan con todo incluido.</p></div>
        <div className="pcard">
          <div className="pcard__top"><Sparkles size={22} /><div><h3>2 días gratis</h3><p>Todo incluido. Sin tarjeta. Sin compromiso.</p></div></div>
          <div className="pcard__sep" />
          <div className="pcard__price"><span>29€</span><em>/mes</em></div>
          <ul>{['Agente IA para WhatsApp', 'Agendamiento automático de citas', 'Técnicas de venta integradas', 'Dashboard con estadísticas', 'Historial de conversaciones', 'Soporte incluido', 'Sin permanencia'].map((f, i) => <li key={i}><CheckCircle size={14} />{f}</li>)}</ul>
          <Link to="/auth?mode=register" className="btn btn--p btn--xl btn--full"><Zap size={18} /> Empezar prueba gratis</Link>
        </div>
      </Sec>

      {/* ═══ FAQ ═══ */}
      <Sec alt id="faq">
        <div className="sh"><h2>Preguntas frecuentes</h2></div>
        <div className="faqs">{FAQ.map((item, i) => (
          <div key={i} className={`fi ${faqOpen === i ? 'fi--open' : ''}`}>
            <button className="fi__q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}><span>{item.q}</span><ChevronDown size={18} /></button>
            <AnimatePresence>{faqOpen === i && (
              <motion.div className="fi__a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}><p>{item.a}</p></motion.div>
            )}</AnimatePresence>
          </div>
        ))}</div>
      </Sec>

      {/* ═══ FINAL CTA ═══ */}
      <section className="fcta"><div className="lc">
        <h2>Tu competencia ya usa IA.<br />¿Y tú?</h2>
        <p>Empieza gratis en 5 minutos. Sin tarjeta. Sin riesgo.</p>
        <Link to="/auth?mode=register" className="btn btn--p btn--xl"><Zap size={20} /> Automatizar mi WhatsApp <ArrowRight size={18} /></Link>
        <span className="fcta__n">2 días gratis · Sin tarjeta · Cancela cuando quieras</span>
      </div></section>

      {/* FOOTER */}
      <footer className="ft"><div className="lc ft__in">
        <div className="ft__brand"><span className="lt lt--s">wasap<span className="lg">y</span></span><span className="lb">.io</span></div>
        <p>© 2026 Wasapy. Todos los derechos reservados.</p>
        <div className="ft__links"><a href="https://agutidesigns.io/privacidad.html" target="_blank" rel="noopener">Privacidad</a><span>·</span><a href="https://agutidesigns.io/terminos.html" target="_blank" rel="noopener">Términos</a><span>·</span><a href="mailto:soporte@agutidesigns.io">Contacto</a></div>
      </div></footer>
    </div>
  );
}

function Sec({ children, alt, id }) {
  return <section className={`sec ${alt ? 'sec--a' : ''}`} id={id}><div className="lc">{children}</div></section>;
}

function ProductSection({ sec, idx, Mk }) {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const rev = idx % 2 !== 0;
  return (
    <section className={`psec ${rev ? 'psec--rev' : ''} ${idx % 2 === 0 ? '' : 'psec--alt'}`} ref={ref}>
      <div className="lc">
        <div className="psec__header">
          <span className="psec__tag">{sec.tag}</span>
          <h2>{sec.title}</h2>
          <p>{sec.desc}</p>
        </div>
        <motion.div className={`psec__grid ${rev ? 'psec__grid--rev' : ''}`} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
          <div className="psec__visual"><Mk /></div>
          <div className="psec__bullets">
            <h3 className="psec__bullets-title">{sec.cardTitle}</h3>
            <p className="psec__bullets-desc">{sec.cardDesc}</p>
            <ul>{sec.bullets.map((b, i) => <li key={i}><CheckCircle size={16} /><span>{b}</span></li>)}</ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
