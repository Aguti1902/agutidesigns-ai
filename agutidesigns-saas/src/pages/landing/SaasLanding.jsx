import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Zap, CheckCircle, ArrowRight, Shield, Brain,
  BarChart3, ChevronDown, Bot, CalendarCheck, ShoppingCart,
  Star, Sparkles, X, Check, FileText, Receipt, Users,
  Code, Palette, Globe, Monitor
} from 'lucide-react';
import './SaasLanding.css';

/* ── Chat demo específico para diseñadores ── */
function ChatDemo() {
  const msgs = [
    { from: 'user', text: '¿Cuánto cuesta una web para mi restaurante?' },
    { from: 'bot', text: 'Hola! Una web corporativa para restaurante con carta online está entre *800€ y 1.500€*. Incluye diseño, desarrollo, formulario de reservas y 1 año de mantenimiento. ¿Quieres que agendemos una llamada para ver los detalles?' },
    { from: 'user', text: 'Sí, ¿cuándo puedes?' },
    { from: 'bot', text: '✅ Tengo disponible *mañana a las 11:00* o el *jueves a las 16:00*. ¿Cuál te viene mejor?' },
  ];
  const [vis, setVis] = useState(0);
  useEffect(() => {
    if (vis < msgs.length) {
      const t = setTimeout(() => setVis(v => v + 1), vis === 0 ? 800 : 1500);
      return () => clearTimeout(t);
    }
  }, [vis]);
  return (
    <div className="mk">
      <div className="mk__bar"><span /><span /><span /></div>
      <div className="mk__head"><div className="mk__av"><Bot size={14} /></div><div><b>Guti Diseño Web</b><small>en línea • IA activa</small></div></div>
      <div className="mk__chat">
        {msgs.slice(0, vis).map((m, i) => (
          <motion.div key={i} className={`mk__m mk__m--${m.from}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <span dangerouslySetInnerHTML={{ __html: m.text.replace(/\*(.*?)\*/g, '<b>$1</b>') }} />
          </motion.div>
        ))}
        {vis < msgs.length && <div className="mk__typing"><span /><span /><span /></div>}
      </div>
      <div className="mk__input"><span>Escribe un mensaje...</span></div>
    </div>
  );
}

/* ── Dashboard mockup ── */
function DashMockup() {
  return (
    <div className="dash-mk">
      <div className="dash-mk__bar"><span /><span /><span /></div>
      <div className="dash-mk__body">
        <div className="dash-mk__side">
          <div className="dash-mk__logo">wasap<em>y</em></div>
          <div className="dash-mk__nav">
            <div className="dash-mk__ni dash-mk__ni--on">Dashboard</div>
            <div className="dash-mk__ni">WhatsApp</div>
            <div className="dash-mk__ni">Presupuestos</div>
            <div className="dash-mk__ni">Facturas</div>
            <div className="dash-mk__ni">Clientes</div>
          </div>
        </div>
        <div className="dash-mk__main">
          <div className="dash-mk__stats">
            <div className="dash-mk__st"><strong>12</strong><span>Leads hoy</span></div>
            <div className="dash-mk__st"><strong>3.200€</strong><span>Presup. pendientes</span></div>
            <div className="dash-mk__st"><strong>5</strong><span>Citas esta semana</span></div>
          </div>
          <div className="dash-mk__table">
            <div className="dash-mk__row dash-mk__row--head"><span>Cliente</span><span>Proyecto</span><span>Importe</span><span>Estado</span></div>
            <div className="dash-mk__row"><span>Bar Mediterráneo</span><span>Web + reservas</span><span>1.200€</span><span className="tag tag--g">Aceptado</span></div>
            <div className="dash-mk__row"><span>Clínica Salud+</span><span>Landing + SEO</span><span>850€</span><span className="tag tag--y">Enviado</span></div>
            <div className="dash-mk__row"><span>Tienda ModaMujer</span><span>Ecommerce</span><span>2.400€</span><span className="tag tag--b">Borrador</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PAIN_POINTS = [
  { q: '¿Cuánto cuesta una web?', t: 'La IA responde por ti', d: 'Mientras maquetar, la IA responde con tus tarifas reales, tipos de proyecto y tiempos de entrega. Filtrada y cualificada.' },
  { q: 'Leads que se enfrían', t: 'Responde en segundos, no en horas', d: 'El 78% de los leads contratan al primero que responde. Con Wasapy, tú siempre eres el primero, incluso a las 2 de la mañana.' },
  { q: 'Llamadas de discovery perdidas', t: 'Agenda automáticamente', d: 'La IA cualifica al cliente — presupuesto, plazo, tipo de proyecto — y agenda la llamada de discovery directamente en tu calendario.' },
  { q: 'Presupuestos en Word', t: 'Presupuestos y facturas profesionales', d: 'Crea presupuestos con líneas de servicio, IVA, exporta en PDF y conviértelos en factura con un clic.' },
];

const FEATURES = [
  { icon: <Bot size={20} />, t: 'IA entrenada con tus servicios', d: 'Responde con tus tarifas, tecnologías y proceso de trabajo exactos.' },
  { icon: <CalendarCheck size={20} />, t: 'Agenda llamadas de discovery', d: 'Cualifica leads y agenda llamadas automáticamente.' },
  { icon: <FileText size={20} />, t: 'Presupuestos profesionales', d: 'Crea, envía y gestiona presupuestos con exportación a PDF.' },
  { icon: <Receipt size={20} />, t: 'Facturación integrada', d: 'De presupuesto a factura con un clic. Controla cobros pendientes.' },
  { icon: <Users size={20} />, t: 'CRM de clientes', d: 'Historial completo de cada cliente: proyectos, presupuestos y facturas.' },
  { icon: <BarChart3 size={20} />, t: 'Dashboard de negocio', d: 'Métricas en tiempo real: leads, facturación pendiente y citas.' },
  { icon: <Shield size={20} />, t: 'Sin permanencia', d: 'Cancela cuando quieras. Sin contratos. Sin letra pequeña.' },
  { icon: <Brain size={20} />, t: 'Personalizable al 100%', d: 'La IA habla con tu voz, tus precios y tus condiciones.' },
];

const COMPARE = [
  { bad: 'Respondes "¿cuánto cuesta?" 10 veces al día', good: 'La IA responde con tus tarifas reales' },
  { bad: 'Leads que se enfrían mientras maquetar', good: 'Respuesta inmediata aunque estés en modo foco' },
  { bad: 'Presupuestos en Word o Excel', good: 'Presupuestos profesionales con un clic' },
  { bad: 'Facturas sin cobrar que se acumulan', good: 'Control de cobros pendientes en tiempo real' },
  { bad: 'Coordinar llamadas por WhatsApp', good: 'Discovery calls agendadas automáticamente' },
];

const REVIEWS = [
  { q: 'Antes perdía 3 horas al día respondiendo WhatsApps. Ahora la IA cualifica los leads y yo solo hablo con los que tienen presupuesto real.', n: 'Carlos M.', r: 'Diseñador web freelance · 5 años' },
  { q: 'Lo de los presupuestos me cambió la vida. En 5 minutos tengo un PDF profesional listo para enviar. Mis clientes piensan que tengo un equipo.', n: 'Laura V.', r: 'Freelance UX/Web · Girona' },
  { q: 'Un cliente me escribió a las 11 de la noche preguntando por una tienda online. La IA le respondió, le cualificó y agendó la llamada. Por la mañana tenía el proyecto.', n: 'Sergio P.', r: 'Diseñador + dev freelance' },
];

const FAQ = [
  { q: '¿Necesito conocimientos técnicos para configurarlo?', a: 'No. En 5 minutos tienes el agente funcionando. Introduces tus servicios, tarifas y forma de trabajo, y la IA empieza a cualificar leads por ti.' },
  { q: '¿La IA puede dar presupuestos exactos?', a: 'Sí. La entrenas con tus tarifas reales por tipo de proyecto. Puede dar rangos orientativos y dejar la negociación para la llamada de discovery.' },
  { q: '¿Funciona con mi WhatsApp personal?', a: 'Sí. No necesitas la API oficial de WhatsApp. Solo escaneas un QR con tu teléfono y listo.' },
  { q: '¿Los presupuestos y facturas tienen validez legal?', a: 'Son documentos profesionales en PDF con todos los campos necesarios. Para uso como facturas legales, añade tus datos fiscales en la configuración.' },
  { q: '¿Puedo seguir respondiendo yo también?', a: 'Sí. Si tú respondes manualmente, la IA se aparta. Solo actúa cuando no estás disponible.' },
  { q: '¿Cuánto cuesta?', a: '29€/mes con todo incluido. 2 días gratis sin tarjeta para que lo pruebes sin riesgo.' },
];

export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [painRef, painInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featRef, featInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [storyRef, storyInView] = useInView({ threshold: 0.15, triggerOnce: true });
  const [compRef, compInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [revRef, revInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [faqRef, faqInView] = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <div className="lp">
      {/* NAV */}
      <nav className="ln">
        <div className="lc ln__in">
          <Link to="/" className="ln__logo"><span className="lt">wasap<span className="lg">y</span></span><span className="lb">.io</span></Link>
          <div className="ln__mid"><a href="#producto">Producto</a><a href="#precios">Precios</a><a href="#faq">FAQ</a></div>
          <div className="ln__r">
            <Link to="/auth" className="ln__log">Entrar</Link>
            <Link to="/auth?mode=register" className="ln__cta"><Zap size={13} /> Prueba gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero__bg" />
        <div className="lc hero__grid">
          <motion.div className="hero__left" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="hero__pill"><Sparkles size={11} /> Para diseñadores web freelance</span>
            <h1>Tu WhatsApp IA que<br /><span className="grad">convierte leads</span> mientras maquetar</h1>
            <p>Un agente IA que responde a tus clientes potenciales, cualifica leads, agenda llamadas de discovery y gestiona tus presupuestos y facturas. <strong>Todo en un solo sitio.</strong></p>
            <div className="hero__metrics">
              <div><CheckCircle size={14} /> Configurado en 5 min</div>
              <div><CheckCircle size={14} /> Responde 24/7</div>
              <div><CheckCircle size={14} /> Presupuestos en PDF</div>
              <div><CheckCircle size={14} /> Sin permanencia</div>
            </div>
            <div className="hero__social">
              <div className="hero__avs"><span>C</span><span>L</span><span>S</span><span>A</span></div>
              <div className="hero__stars">{[1,2,3,4,5].map(i=><Star key={i} size={13}/>)}</div>
              <span>Usado por diseñadores freelance en España</span>
            </div>
          </motion.div>
          <motion.div className="hero__right" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65, delay: 0.18 }}>
            <div className="hcard">
              <span className="hcard__badge"><Zap size={11} /> 2 DÍAS GRATIS</span>
              <h3>Activa tu agente IA ahora</h3>
              <p>Sin tarjeta. Sin compromiso. Tu IA cualificando leads en 5 minutos.</p>
              <ul>
                <li><Bot size={15}/> IA entrenada con tus servicios y tarifas</li>
                <li><CalendarCheck size={15}/> Agenda llamadas de discovery</li>
                <li><FileText size={15}/> Presupuestos y facturas profesionales</li>
                <li><Users size={15}/> CRM de clientes integrado</li>
                <li><BarChart3 size={15}/> Dashboard de negocio en tiempo real</li>
              </ul>
              <Link to="/auth?mode=register" className="btn btn--p btn--full"><Zap size={16}/> Empezar prueba gratuita <ArrowRight size={15}/></Link>
              <div className="hcard__note"><Shield size={12}/> Sin tarjeta <CheckCircle size={12}/> GDPR <Zap size={12}/> Activo en 5 min</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CHAT DEMO */}
      <section className="demo-sec">
        <div className="lc demo-sec__grid">
          <div>
            <span className="tag-pill"><Bot size={12}/> En acción</span>
            <h2>Así responde tu IA cuando tú no puedes</h2>
            <p>Un cliente escribe a las 11 de la noche preguntando por una web para su restaurante. La IA responde con tus tarifas reales, cualifica el lead y agenda la llamada de discovery. Tú te enteras por la mañana con la reunión ya en tu calendario.</p>
          </div>
          <ChatDemo />
        </div>
      </section>

      {/* DASHBOARD MOCKUP */}
      <section className="dash-sec" id="producto">
        <div className="lc">
          <div className="sec-h">
            <h2>Tu negocio de diseño, <span className="grad">todo en un panel</span></h2>
            <p>Presupuestos, facturas, clientes, conversaciones de WhatsApp y métricas de negocio. Sin saltar entre herramientas.</p>
          </div>
          <DashMockup />
        </div>
      </section>

      {/* HISTORIA PERSONAL */}
      <section className="story" ref={storyRef}>
        <div className="lc story__grid">
          <motion.div className="story__img" initial={{ opacity: 0, x: -30 }} animate={storyInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="story__photo">
              <div className="story__photo-placeholder">
                <span>G</span>
                <small>Foto de Guti</small>
              </div>
            </div>
            <div className="story__badge"><Sparkles size={14}/> Fundador de Wasapy</div>
          </motion.div>
          <motion.div className="story__text" initial={{ opacity: 0, x: 30 }} animate={storyInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
            <span className="tag-pill">Por qué construí esto</span>
            <h2>De diseñador freelance a <span className="grad">perder un proyecto de 3.000€</span></h2>
            <p>Durante más de 7 años fui diseñador web autónomo. Trabajaba para restaurantes, clínicas, tiendas, consultorías... me encantaba mi trabajo. Pero siempre había algo que me frenaba: el WhatsApp.</p>
            <p>Mientras estaba en modo foco maquetando, el móvil no paraba. Siempre la misma pregunta: <em>"¿cuánto cuesta una web?"</em>. Y cuando salía de ese estado de concentración para responder, los leads ya se habían ido con la competencia.</p>
            <p>Un día perdí un proyecto de 3.000€ porque tardé 4 horas en responder. El cliente ya había firmado con otro. Ese día decidí que tenía que haber una forma mejor.</p>
            <blockquote>"Construí Wasapy para que ningún diseñador vuelva a perder un cliente por estar haciendo su trabajo."</blockquote>
            <cite>— Guti, fundador de Wasapy · 7+ años diseñador web freelance</cite>
          </motion.div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="pain" ref={painRef}>
        <div className="lc">
          <div className="sec-h">
            <h2>Diseñado para los problemas reales del freelance</h2>
            <p>Cada función de Wasapy nace de un problema real que viví como diseñador autónomo.</p>
          </div>
          <div className="pain__grid">
            {PAIN_POINTS.map((p, i) => (
              <motion.div key={i} className="pain__card" initial={{ opacity: 0, y: 22 }} animate={painInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}>
                <span className="pain__q">"{p.q}"</span>
                <div className="pain__div" />
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="feat" ref={featRef}>
        <div className="lc">
          <div className="sec-h"><h2>Todo lo que necesita tu negocio de diseño</h2></div>
          <div className="feat__grid">
            {FEATURES.map((f, i) => (
              <motion.div key={i} className="feat__card" initial={{ opacity: 0, y: 18 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}>
                <div className="feat__ico">{f.icon}</div>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GREEN CTA */}
      <section className="gcta">
        <div className="lc gcta__in">
          <div>
            <h2>Deja de responder WhatsApps. Empieza a diseñar.</h2>
            <p>2 días gratis. Sin tarjeta. Tu agente IA activo en 5 minutos.</p>
          </div>
          <Link to="/auth?mode=register" className="btn btn--w btn--xl"><Zap size={17}/> Probar gratis ahora <ArrowRight size={15}/></Link>
        </div>
      </section>

      {/* COMPARATIVA */}
      <section className="cmp" ref={compRef}>
        <div className="lc">
          <div className="sec-h"><h2>El antes y el después</h2><p>Lo que cambia cuando tienes una IA trabajando contigo.</p></div>
          <div className="cmp__table">
            <div className="cmp__head"><span className="ch ch--bad">Sin Wasapy</span><span className="ch ch--good">Con Wasapy</span></div>
            {COMPARE.map((c, i) => (
              <motion.div key={i} className="cmp__row" initial={{ opacity: 0, x: -8 }} animate={compInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.07 }}>
                <span className="cc cc--bad"><X size={13}/>{c.bad}</span>
                <span className="cc cc--good"><Check size={13}/>{c.good}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="revs" ref={revRef}>
        <div className="lc">
          <div className="sec-h"><h2>Lo que dicen otros diseñadores freelance</h2></div>
          <div className="revs__grid">
            {REVIEWS.map((r, i) => (
              <motion.div key={i} className="rev" initial={{ opacity: 0, y: 18 }} animate={revInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}>
                <div className="rev__stars">{[1,2,3,4,5].map(j=><Star key={j} size={14}/>)}</div>
                <p>"{r.q}"</p>
                <div className="rev__who"><div className="rev__av">{r.n[0]}</div><div><b>{r.n}</b><span>{r.r}</span></div></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="precios">
        <div className="lc">
          <div className="sec-h"><h2>Precio claro. Sin sorpresas.</h2><p>Un plan con todo lo que necesita un diseñador freelance.</p></div>
          <div className="pcard">
            <div className="pcard__top"><Sparkles size={20}/><div><h3>2 días gratis</h3><p>Todo incluido. Sin tarjeta.</p></div></div>
            <div className="pcard__sep"/>
            <div className="pcard__price"><span>29€</span><em>/mes</em></div>
            <ul>
              {['Agente IA para WhatsApp 24/7','Cualificación automática de leads','Agendamiento de llamadas de discovery','Presupuestos profesionales en PDF','Facturación integrada','CRM de clientes','Dashboard de negocio','Soporte incluido','Sin permanencia'].map((f, i) => (
                <li key={i}><CheckCircle size={13}/>{f}</li>
              ))}
            </ul>
            <Link to="/auth?mode=register" className="btn btn--p btn--xl btn--full"><Zap size={17}/> Empezar prueba gratis</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq" ref={faqRef}>
        <div className="lc">
          <div className="sec-h"><h2>Preguntas frecuentes</h2></div>
          <div className="faqs">
            {FAQ.map((item, i) => (
              <motion.div key={i} className={`fi ${faqOpen === i ? 'fi--open' : ''}`} initial={{ opacity: 0 }} animate={faqInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.04 }}>
                <button className="fi__q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}><span>{item.q}</span><ChevronDown size={17}/></button>
                <AnimatePresence>{faqOpen === i && (
                  <motion.div className="fi__a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}><p>{item.a}</p></motion.div>
                )}</AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="fcta">
        <div className="lc">
          <h2>Deja de perder leads.<br/>Empieza a diseñar.</h2>
          <p>La IA atiende. Tú diseñas. Los presupuestos se crean solos.</p>
          <Link to="/auth?mode=register" className="btn btn--p btn--xl"><Zap size={19}/> Probar gratis 2 días <ArrowRight size={17}/></Link>
          <span className="fcta__n">Sin tarjeta · Sin permanencia · Cancela cuando quieras</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="ft"><div className="lc ft__in">
        <div className="ft__brand"><span className="lt lt--s">wasap<span className="lg">y</span></span><span className="lb">.io</span></div>
        <p>© 2026 Wasapy — Hecho por un diseñador, para diseñadores.</p>
        <div className="ft__links">
          <a href="https://agutidesigns.io/privacidad.html" target="_blank" rel="noopener">Privacidad</a><span>·</span>
          <a href="https://agutidesigns.io/terminos.html" target="_blank" rel="noopener">Términos</a><span>·</span>
          <a href="mailto:soporte@agutidesigns.io">Contacto</a>
        </div>
      </div></footer>
    </div>
  );
}
