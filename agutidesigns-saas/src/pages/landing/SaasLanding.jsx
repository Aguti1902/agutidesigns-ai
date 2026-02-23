import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Zap, Clock, Users, TrendingUp, CheckCircle,
  ArrowRight, Shield, Brain, BarChart3, ChevronDown, Bot,
  CalendarCheck, ShoppingCart, Smartphone, Lock,
  Star, Play, Sparkles, Sun, Moon, X, Check,
  Scissors, Stethoscope, UtensilsCrossed, Dumbbell, Store, Briefcase, GraduationCap, Wrench,
  Send, Phone, Globe
} from 'lucide-react';
import './SaasLanding.css';

/* ── Animated counter ── */
function CountUp({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({ threshold: 0.5, triggerOnce: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => { start += step; if (start >= end) { setCount(end); clearInterval(timer); } else setCount(Math.floor(start)); }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── WhatsApp chat demo ── */
function ChatDemo() {
  const msgs = [
    { from: 'user', text: 'Hola, quiero reservar para mañana' },
    { from: 'bot', text: '¡Hola! Tengo disponible mañana:\n\n• *10:00*\n• *12:30*\n• *16:00*\n\n¿Cuál te viene mejor?' },
    { from: 'user', text: 'A las 16:00' },
    { from: 'bot', text: '✅ Cita *confirmada* para mañana a las *16:00*. ¡Te esperamos!' },
  ];
  const [vis, setVis] = useState(0);
  useEffect(() => { if (vis < msgs.length) { const t = setTimeout(() => setVis(v => v + 1), vis === 0 ? 1000 : 1400); return () => clearTimeout(t); } }, [vis]);
  return (
    <div className="wd">
      <div className="wd__top"><div className="wd__dot wd__dot--r" /><div className="wd__dot wd__dot--y" /><div className="wd__dot wd__dot--g" /></div>
      <div className="wd__head"><div className="wd__av"><Bot size={16} /></div><div><b className="wd__name">Tu Negocio IA</b><span className="wd__on">en línea</span></div></div>
      <div className="wd__body">
        {msgs.slice(0, vis).map((m, i) => (
          <motion.div key={i} className={`wd__m wd__m--${m.from}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <span dangerouslySetInnerHTML={{ __html: m.text.replace(/\*(.*?)\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
          </motion.div>
        ))}
        {vis < msgs.length && <div className="wd__typing"><span /><span /><span /></div>}
      </div>
    </div>
  );
}

/* ── Data ── */
const SHOWCASES = [
  {
    tag: 'Asistente IA',
    tagIcon: <Bot size={14} />,
    title: 'Responde como tú, pero 24 horas al día',
    desc: 'Tu agente IA aprende de la información de tu negocio — servicios, precios, horarios, FAQ — y responde a cada cliente de forma natural, con la personalidad que tú elijas. Como si fueras tú, pero sin descansar.',
    bullets: ['Respuestas instantáneas en segundos', 'Solo usa datos reales de tu negocio', 'Personalidad configurable: cercano, formal, divertido...', 'Si no sabe algo, avisa y deriva a ti'],
    mockup: 'chat',
  },
  {
    tag: 'Citas automáticas',
    tagIcon: <CalendarCheck size={14} />,
    title: 'La IA agenda citas mientras tú trabajas',
    desc: 'Tu agente ve la disponibilidad real de tu agenda, propone horarios libres al cliente y confirma la reserva automáticamente. Todo por WhatsApp, sin que toques el teléfono.',
    bullets: ['Ve tu calendario en tiempo real', 'Propone 2-3 opciones disponibles', 'Confirma y guarda la cita automáticamente', 'Respeta tus horarios de apertura'],
    mockup: 'calendar',
  },
  {
    tag: 'Ventas inteligentes',
    tagIcon: <ShoppingCart size={14} />,
    title: 'Vende más sin mover un dedo',
    desc: 'La IA detecta oportunidades de venta en cada conversación. Recomienda servicios, hace upselling y supera objeciones de forma natural — como lo haría tu mejor vendedor.',
    bullets: ['Recomienda el servicio ideal para cada cliente', 'Upselling y cross-selling inteligente', 'Supera objeciones con datos reales', 'Facilita el siguiente paso: reservar, comprar, visitar'],
    mockup: 'dashboard',
  },
];

const STATS = [
  { num: 5, suffix: ' min', label: 'Configuración completa' },
  { num: 95, suffix: '%', label: 'Respuestas correctas' },
  { num: 24, suffix: '/7', label: 'Atención automática' },
  { num: 29, suffix: '€', label: '/mes todo incluido' },
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

const REVIEWS = [
  { quote: 'Desde que activamos Wasapy, no perdemos ni una consulta fuera de horario. Las citas se agendan solas y mis clientes están encantados con la rapidez.', name: 'Laura M.', role: 'Clínica dental', stars: 5 },
  { quote: 'Mis clientes no notan que hablan con una IA. Responde con mis precios, mis horarios, todo perfecto. Me ahorra al menos 3 horas al día.', name: 'Carlos R.', role: 'Peluquería', stars: 5 },
  { quote: 'En la primera semana ya se agendaron 12 citas sin que yo tocara el teléfono. El retorno de inversión es brutal para lo que cuesta.', name: 'Ana G.', role: 'Estudio de yoga', stars: 5 },
];

const COMPARE = [
  { without: 'Pierdes clientes fuera de horario', withText: 'Atención automática 24/7' },
  { without: 'Tardas horas en responder', withText: 'Respuesta en segundos' },
  { without: 'Agendas citas a mano', withText: 'La IA agenda citas sola' },
  { without: 'Olvidas recoger datos', withText: 'Captación de leads automática' },
  { without: 'Pierdes ventas por no responder', withText: 'La IA recomienda y vende' },
];

const FAQ = [
  { q: '¿Es difícil de configurar?', a: 'No. Sin código, en 5 minutos está funcionando. Te guiamos paso a paso con tutoriales incluidos en la plataforma.' },
  { q: '¿Qué pasa si la IA responde mal?', a: 'Solo responde con la información de TU negocio. Si no sabe algo, avisa y deriva a ti directamente. Nunca inventa datos.' },
  { q: '¿Funciona con mi tipo de negocio?', a: 'Si atiendes clientes por WhatsApp, te sirve. Restaurantes, clínicas, peluquerías, tiendas, servicios, consultorías, academias...' },
  { q: '¿Puedo seguir usando WhatsApp yo?', a: 'Sí. Si tú respondes manualmente, el agente se quita de en medio. Solo actúa cuando no estás.' },
  { q: '¿Cuánto cuesta?', a: 'Desde 29€/mes. Tienes 2 días gratis sin tarjeta para probarlo sin ningún riesgo.' },
  { q: '¿Necesito la API de WhatsApp Business?', a: 'No. Funciona con tu WhatsApp normal. Solo escaneas un QR y listo.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Sin permanencia, sin penalizaciones, sin letra pequeña. Cancelas y listo.' },
];

/* ── Showcase Mockups ── */
function MockChat() {
  return (
    <div className="smk">
      <div className="smk__bar"><span /><span /><span /></div>
      <div className="smk__inner smk__inner--chat">
        <div className="smk-m smk-m--in">Hola, ¿cuánto cuesta un corte?</div>
        <div className="smk-m smk-m--out">¡Hola! El corte caballero es <b>15€</b> y señora <b>20€</b>. ¿Reservamos cita?</div>
        <div className="smk-m smk-m--in">Sí, para mañana tarde</div>
        <div className="smk-m smk-m--out">Perfecto, te puedo ofrecer las <b>16:00</b> o las <b>17:30</b>. ¿Cuál prefieres?</div>
        <div className="smk-m smk-m--in">A las 16</div>
        <div className="smk-m smk-m--out">✅ Cita confirmada mañana a las <b>16:00</b>. ¡Te esperamos!</div>
      </div>
    </div>
  );
}
function MockCalendar() {
  return (
    <div className="smk">
      <div className="smk__bar"><span /><span /><span /></div>
      <div className="smk__inner">
        <div className="smk-cal__head"><strong>Febrero 2026</strong></div>
        <div className="smk-cal__days"><span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span></div>
        <div className="smk-cal__grid">
          <div>17</div><div className="smk-cal__today">18</div><div>19</div><div>20</div><div>21</div>
        </div>
        <div className="smk-cal__events">
          <div className="smk-cal__ev"><b>10:00</b> María G. — Corte</div>
          <div className="smk-cal__ev smk-cal__ev--ai"><b>14:00</b> Carlos R. — Tinte</div>
          <div className="smk-cal__ev"><b>16:30</b> Ana M. — Mechas</div>
          <div className="smk-cal__ev smk-cal__ev--ai"><b>18:00</b> Pedro L. — Barba</div>
        </div>
      </div>
    </div>
  );
}
function MockDashboard() {
  return (
    <div className="smk smk--wide">
      <div className="smk__bar"><span /><span /><span /></div>
      <div className="smk__inner smk__inner--dash">
        <div className="smk-d__side">
          <div className="smk-d__logo">wasap<em>y</em></div>
          <div className="smk-d__nav">
            <div className="smk-d__ni smk-d__ni--on"><BarChart3 size={10} /> Dashboard</div>
            <div className="smk-d__ni"><MessageCircle size={10} /> WhatsApp</div>
            <div className="smk-d__ni"><Brain size={10} /> Prompt IA</div>
            <div className="smk-d__ni"><CalendarCheck size={10} /> Citas</div>
          </div>
        </div>
        <div className="smk-d__main">
          <div className="smk-d__stats">
            <div className="smk-d__st"><strong>247</strong><span>Mensajes</span></div>
            <div className="smk-d__st"><strong>18</strong><span>Leads</span></div>
            <div className="smk-d__st"><strong>12</strong><span>Citas</span></div>
            <div className="smk-d__st"><strong>95%</strong><span>Precisión</span></div>
          </div>
          <div className="smk-d__convos">
            <div className="smk-d__convo"><div className="smk-d__convo-dot" /><div><b>María G.</b><span>¿Tienen disponibilidad ma...</span></div><small>14:32</small></div>
            <div className="smk-d__convo"><div className="smk-d__convo-dot smk-d__convo-dot--new" /><div><b>Carlos R.</b><span>Perfecto, a las 16:00 me...</span></div><small>14:28</small></div>
            <div className="smk-d__convo"><div className="smk-d__convo-dot" /><div><b>Ana M.</b><span>¿Cuánto cuesta el trata...</span></div><small>13:15</small></div>
          </div>
        </div>
      </div>
    </div>
  );
}
const MOCKUP_MAP = { chat: MockChat, calendar: MockCalendar, dashboard: MockDashboard };

/* ══════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════ */
export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);

  function toggleTheme() {
    const d = document.documentElement;
    if (d.getAttribute('data-theme') === 'dark') { d.removeAttribute('data-theme'); localStorage.setItem('theme', ''); }
    else { d.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
  }

  return (
    <div className="lp">

      {/* ═══ NAV ═══ */}
      <nav className="ln">
        <div className="lc ln__inner">
          <Link to="/" className="ln__logo"><span className="logo-t">wasap<span className="logo-g">y</span></span><span className="logo-badge">.io</span></Link>
          <div className="ln__links">
            <a href="#product">Producto</a>
            <a href="#pricing">Precios</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="ln__right">
            <button className="ln__theme" onClick={toggleTheme} aria-label="Toggle theme"><Sun size={15} className="ln__ico--l" /><Moon size={15} className="ln__ico--d" /></button>
            <Link to="/auth" className="ln__login">Entrar</Link>
            <Link to="/auth?mode=register" className="ln__cta"><Zap size={14} /> Prueba gratis</Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="lc hero__inner">
          <motion.div className="hero__txt" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <motion.span className="hero__pill" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Sparkles size={12} /> Agente WhatsApp IA para negocios
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              Automatiza tu WhatsApp.<br /><span className="grad">Crece sin límites.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              Un agente de inteligencia artificial que atiende a tus clientes, agenda citas y cierra ventas por WhatsApp. <strong>24 horas al día, 7 días a la semana.</strong> Sin código. Sin complicaciones.
            </motion.p>
            <motion.div className="hero__acts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Link to="/auth?mode=register" className="btn btn--p btn--xl"><Zap size={18} /> Empezar gratis <ArrowRight size={16} /></Link>
              <a href="#product" className="btn btn--o btn--xl"><Play size={16} /> Ver cómo funciona</a>
            </motion.div>
            <motion.span className="hero__note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              <CheckCircle size={13} /> 2 días gratis · Sin tarjeta · Cancela cuando quieras
            </motion.span>
          </motion.div>
          <motion.div className="hero__visual" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
            <ChatDemo />
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS STRIP ═══ */}
      <section className="strip">
        <div className="lc strip__inner">
          {STATS.map((s, i) => (
            <div key={i} className="strip__item">
              <span className="strip__num"><CountUp end={s.num} suffix={s.suffix} /></span>
              <span className="strip__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRODUCT SHOWCASES ═══ */}
      <section className="showcases" id="product">
        <div className="lc">
          <div className="sh"><h2>Lo que Wasapy hace por tu negocio</h2><p className="sp">Tres funciones que convierten tu WhatsApp en una máquina de atender, vender y agendar. Sin esfuerzo.</p></div>
          {SHOWCASES.map((s, i) => {
            const Mockup = MOCKUP_MAP[s.mockup];
            const reverse = i % 2 !== 0;
            return <ShowcaseRow key={i} s={s} reverse={reverse} Mockup={Mockup} />;
          })}
        </div>
      </section>

      {/* ═══ GREEN CTA ═══ */}
      <section className="gcta">
        <div className="lc gcta__inner">
          <div>
            <h2>Empieza a automatizar hoy</h2>
            <p>2 días gratis. Sin tarjeta. Sin compromiso. Tu agente IA activo en 5 minutos.</p>
          </div>
          <Link to="/auth?mode=register" className="btn btn--w btn--xl"><Zap size={18} /> Probar gratis ahora <ArrowRight size={16} /></Link>
        </div>
      </section>

      {/* ═══ SECTORS ═══ */}
      <SectionAnimated>
        <div className="lc">
          <div className="sh"><h2>Para cualquier tipo de negocio</h2><p className="sp">Si atiendes clientes por WhatsApp, Wasapy puede ayudarte. Estos son algunos de los sectores que más lo usan.</p></div>
          <div className="sectors">
            {SECTORS.map((s, i) => (
              <motion.div key={i} className="sector" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="sector__ico">{s.icon}</div><span>{s.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionAnimated>

      {/* ═══ COMPARE ═══ */}
      <SectionAnimated className="sec--alt">
        <div className="lc">
          <div className="sh"><h2>El antes y el después</h2><p className="sp">Compara cómo funciona tu negocio sin automatizar frente a lo que consigues con un agente IA atendiendo por ti.</p></div>
          <div className="cmp">
            <div className="cmp__head"><span className="cmp__h cmp__h--bad">Sin Wasapy</span><span className="cmp__h cmp__h--good">Con Wasapy</span></div>
            {COMPARE.map((c, i) => (
              <motion.div key={i} className="cmp__row" initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <span className="cmp__c cmp__c--bad"><X size={14} />{c.without}</span>
                <span className="cmp__c cmp__c--good"><Check size={14} />{c.withText}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionAnimated>

      {/* ═══ REVIEWS ═══ */}
      <SectionAnimated>
        <div className="lc">
          <div className="sh"><h2>Lo que dicen nuestros usuarios</h2><p className="sp">Negocios reales que ya automatizan su WhatsApp con Wasapy.</p></div>
          <div className="revs">
            {REVIEWS.map((r, i) => (
              <motion.div key={i} className="rev" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="rev__stars">{Array.from({ length: r.stars }).map((_, si) => <Star key={si} size={15} />)}</div>
                <p>"{r.quote}"</p>
                <div className="rev__who"><div className="rev__av">{r.name[0]}</div><div><b>{r.name}</b><span>{r.role}</span></div></div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionAnimated>

      {/* ═══ HOW IT WORKS ═══ */}
      <SectionAnimated className="sec--alt">
        <div className="lc">
          <div className="sh"><h2>Activo en <span className="grad">3 pasos</span></h2><p className="sp">No necesitas conocimientos técnicos. Si sabes usar WhatsApp, sabes usar Wasapy.</p></div>
          <div className="steps">
            {[
              { n: '1', t: 'Conecta tu WhatsApp', d: 'Escaneas un QR code desde tu móvil. Solo 10 segundos.', time: '10 seg' },
              { n: '2', t: 'Entrena a la IA', d: 'Añade servicios, precios y horarios. La IA aprende al instante.', time: '3 min' },
              { n: '3', t: 'Activa y listo', d: 'Tu agente empieza a atender clientes automáticamente.', time: '¡Ya!' },
            ].map((s, i) => (
              <motion.div key={i} className="step" initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="step__n">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <span className="step__time">{s.time}</span>
              </motion.div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/auth?mode=register" className="btn btn--p btn--lg"><Zap size={16} /> Empezar ahora — Es gratis <ArrowRight size={14} /></Link>
          </div>
        </div>
      </SectionAnimated>

      {/* ═══ PRICING ═══ */}
      <SectionAnimated id="pricing">
        <div className="lc">
          <div className="sh"><h2>Precio claro. Sin sorpresas.</h2><p className="sp">Un solo plan con todo incluido. Empieza gratis y decide después.</p></div>
          <div className="price-card">
            <div className="price-card__top"><Sparkles size={22} /><div><h3>2 días gratis</h3><p>Todo incluido. Sin tarjeta. Sin compromiso.</p></div></div>
            <div className="price-card__sep" />
            <div className="price-card__amount"><span>29€</span><em>/mes</em></div>
            <ul>{['Agente IA para WhatsApp', 'Agendamiento automático de citas', 'Técnicas de venta integradas', 'Dashboard con estadísticas', 'Historial de conversaciones', 'Soporte incluido', 'Sin permanencia'].map((f, i) => <li key={i}><CheckCircle size={14} />{f}</li>)}</ul>
            <Link to="/auth?mode=register" className="btn btn--p btn--xl btn--full"><Zap size={18} /> Empezar prueba gratis</Link>
          </div>
        </div>
      </SectionAnimated>

      {/* ═══ FAQ ═══ */}
      <SectionAnimated className="sec--alt" id="faq">
        <div className="lc">
          <div className="sh"><h2>Preguntas frecuentes</h2></div>
          <div className="faqs">
            {FAQ.map((item, i) => (
              <div key={i} className={`faq-item ${faqOpen === i ? 'faq-item--open' : ''}`}>
                <button className="faq-item__q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{item.q}</span><ChevronDown size={18} />
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div className="faq-item__a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </SectionAnimated>

      {/* ═══ FINAL CTA ═══ */}
      <section className="fcta">
        <div className="lc">
          <h2>Tu competencia ya usa IA.<br />¿Y tú?</h2>
          <p>Empieza gratis en 5 minutos. Sin tarjeta. Sin riesgo.</p>
          <Link to="/auth?mode=register" className="btn btn--p btn--xl"><Zap size={20} /> Automatizar mi WhatsApp <ArrowRight size={18} /></Link>
          <span className="fcta__note">2 días gratis · Sin tarjeta de crédito · Cancela cuando quieras</span>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="ft">
        <div className="lc ft__inner">
          <div className="ft__brand"><span className="logo-t logo-t--s">wasap<span className="logo-g">y</span></span><span className="logo-badge">.io</span></div>
          <p>© 2026 Wasapy. Todos los derechos reservados.</p>
          <div className="ft__links">
            <a href="https://agutidesigns.io/privacidad.html" target="_blank" rel="noopener">Privacidad</a><span>·</span>
            <a href="https://agutidesigns.io/terminos.html" target="_blank" rel="noopener">Términos</a><span>·</span>
            <a href="mailto:soporte@agutidesigns.io">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Helper components ── */
function SectionAnimated({ children, className = '', id }) {
  return <section className={`sec ${className}`} id={id}>{children}</section>;
}

function ShowcaseRow({ s, reverse, Mockup }) {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true });
  return (
    <motion.div ref={ref} className={`sc ${reverse ? 'sc--rev' : ''}`} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
      <div className="sc__txt">
        <span className="sc__tag">{s.tagIcon} {s.tag}</span>
        <h3>{s.title}</h3>
        <p>{s.desc}</p>
        <ul>{s.bullets.map((b, i) => <li key={i}><CheckCircle size={14} />{b}</li>)}</ul>
      </div>
      <div className="sc__vis"><Mockup /></div>
    </motion.div>
  );
}
