import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  Zap, CheckCircle, ArrowRight, Shield, Brain,
  BarChart3, ChevronDown, Bot, CalendarCheck,
  Star, Sparkles, X, Check, FileText, Receipt, Users,
  Smartphone, Calendar, Video, Clock, Bell, Wifi, Link2
} from 'lucide-react';
import './SaasLanding.css';

/* ── Chat demo ── */
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
      <div className="mk__head"><div className="mk__av"><Bot size={14} /></div><div><b>Guti Diseño Web</b><small>en línea · IA activa</small></div></div>
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

/* ── Phone Mockup (App) ── */
function PhoneMockup() {
  return (
    <div className="phone">
      <div className="phone__notch" />
      <div className="phone__screen">
        <div className="phone__status">
          <span>10:42</span>
          <div className="phone__status-r"><Wifi size={9} /><span className="phone__batt" /></div>
        </div>
        <div className="phone__head">
          <div className="phone__av-sm">W</div>
          <strong>Agenda</strong>
        </div>
        <div className="phone__day">
          <div><b>Lunes</b><small>24 febrero</small></div>
          <div className="phone__tabs">
            <span className="phone__tab phone__tab--on">Día</span>
            <span className="phone__tab">Semana</span>
          </div>
        </div>
        <div className="phone__team">
          <span style={{background:'#25D366'}}>Alejandro</span>
          <span style={{background:'#3B82F6'}}>Laura</span>
          <span style={{background:'#8B5CF6'}}>Mario</span>
        </div>
        <div className="phone__slots-bar">
          <span>Huecos disponibles</span>
          <em>7 libres</em>
        </div>
        <div className="phone__slots">
          {['10:00','10:30','11:00','12:30','16:00','17:30','18:00'].map(t => (
            <span key={t} className="phone__slot">{t}</span>
          ))}
        </div>
        <div className="phone__appts">
          <div className="phone__appt">
            <span className="phone__time">09:00</span>
            <div className="phone__ainfo"><b>Ana García</b><small>Corte + Peinado · 45 min</small></div>
            <span className="phone__ast phone__ast--ok">Confirmado</span>
          </div>
          <div className="phone__appt phone__appt--hl">
            <span className="phone__time">10:00</span>
            <div className="phone__ainfo"><b>Seleccionado</b><small>Toca para reservar</small></div>
            <span className="phone__ast phone__ast--av">Disponible</span>
          </div>
          <div className="phone__appt">
            <span className="phone__time">12:00</span>
            <div className="phone__ainfo"><b>Carlos López</b><small>Barba completa · 30 min</small></div>
            <span className="phone__ast phone__ast--pend">Pendiente</span>
          </div>
          <div className="phone__appt">
            <span className="phone__time">16:00</span>
            <div className="phone__ainfo"><b>María Ruiz</b><small>Mechas · 90 min</small></div>
            <span className="phone__ast phone__ast--ok">Confirmado</span>
          </div>
          <div className="phone__appt">
            <span className="phone__time">18:00</span>
            <div className="phone__ainfo"><b>Juan Martínez</b><small>Corte degradado · 30 min</small></div>
            <span className="phone__ast phone__ast--ok">Confirmado</span>
          </div>
        </div>
        <div className="phone__fab">+</div>
        <div className="phone__bnav">
          <div className="phone__bnav-i phone__bnav-i--on"><Calendar size={12}/><span>Agenda</span></div>
          <div className="phone__bnav-i"><Users size={12}/><span>Equipo</span></div>
          <div className="phone__bnav-i"><Bell size={12}/><span>Avisos</span></div>
        </div>
      </div>
    </div>
  );
}

/* ── Integration Logos (SVG) ── */
function GoogleCalendarLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="7" width="28" height="25" rx="3" fill="#fff"/>
      <path d="M4 10a3 3 0 013-3h22a3 3 0 013 3v3H4v-3z" fill="#4285F4"/>
      <rect x="9" y="5" width="3" height="5" rx="1.5" fill="#1A73E8"/>
      <rect x="24" y="5" width="3" height="5" rx="1.5" fill="#1A73E8"/>
      <rect x="9" y="17" width="5" height="2" rx="1" fill="#4285F4"/>
      <rect x="9" y="22" width="5" height="2" rx="1" fill="#EA4335"/>
      <rect x="16" y="17" width="5" height="2" rx="1" fill="#34A853"/>
      <rect x="16" y="22" width="5" height="2" rx="1" fill="#FBBC04"/>
      <rect x="23" y="17" width="5" height="2" rx="1" fill="#EA4335"/>
      <rect x="23" y="22" width="5" height="2" rx="1" fill="#34A853"/>
    </svg>
  );
}

function CalendlyLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="15" fill="#006BFF"/>
      <circle cx="18" cy="18" r="8" stroke="#fff" strokeWidth="2.5" fill="none"/>
      <path d="M18 13v6l4 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TeamsLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="30" height="30" rx="6" fill="#6264A7"/>
      <path d="M11 13h14v1.5H19.25V25h-2.5V14.5H11V13z" fill="#fff"/>
      <circle cx="27" cy="11" r="4" fill="#7B83EB"/>
      <circle cx="27" cy="11" r="2.5" fill="#fff"/>
    </svg>
  );
}

function ZoomLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="30" height="30" rx="8" fill="#2D8CFF"/>
      <rect x="8" y="12" width="14" height="12" rx="2.5" fill="#fff"/>
      <path d="M24 14.5l5-2.5v12l-5-2.5v-7z" fill="#fff"/>
    </svg>
  );
}

/* ── Animated CRM Module Mockups ── */
function ReservasMock() {
  return (
    <div className="cw cw--rv">
      <div className="cw__bar"><span /><span /><span /></div>
      <div className="cw__top">Calendario de Reservas</div>
      <div className="cw__body">
        <div className="rv__days">{['Lun','Mar','Mié','Jue','Vie'].map(d => <span key={d}>{d}</span>)}</div>
        {['09:00','10:00','11:00','12:00'].map((t, ti) => (
          <div key={t} className="rv__row">
            <span className="rv__t">{t}</span>
            {[0,1,2,3,4].map(di => {
              const busy = (ti===0&&di===2)||(ti===3&&di===0)||(ti===1&&di===4);
              const a1 = ti===1&&di===1;
              const a2 = ti===2&&di===3;
              return (
                <div key={di} className={`rv__c${busy?' rv__c--bsy':''}${a1?' rv__c--a1':''}${a2?' rv__c--a2':''}`}>
                  {ti===0&&di===2&&<small>Ana G.</small>}
                  {ti===3&&di===0&&<small>María</small>}
                  {ti===1&&di===4&&<small>Carlos</small>}
                  {a1&&<small className="rv__fill">Reservado</small>}
                  {a2&&<small className="rv__fill rv__fill--2">Reservado</small>}
                </div>
              );
            })}
          </div>
        ))}
        <div className="rv__toast"><CheckCircle size={10} /> Reserva confirmada — Mar 10:00</div>
        <div className="ani-cur" />
      </div>
    </div>
  );
}

function PresupMock() {
  return (
    <div className="cw cw--ps">
      <div className="cw__bar"><span /><span /><span /></div>
      <div className="cw__top">Nuevo Presupuesto</div>
      <div className="cw__body">
        <div className="ps__client"><small>Cliente</small><b>Bar Mediterráneo</b></div>
        <div className="ps__lines">
          <div className="ps__ln"><span>Diseño web corporativo</span><b>800 €</b></div>
          <div className="ps__ln"><span>SEO básico (3 meses)</span><b>350 €</b></div>
          <div className="ps__ln ps__ln--new"><span>Hosting anual</span><b>120 €</b></div>
        </div>
        <div className="ps__sep" />
        <div className="ps__total"><span>Total (IVA incl.)</span><b className="ps__tnum">1.270 €</b></div>
        <div className="ps__actions">
          <div className="ps__btn ps__btn--add">+ Añadir línea</div>
          <div className="ps__btn ps__btn--send">Enviar PDF</div>
        </div>
        <div className="ps__toast"><CheckCircle size={10} /> PDF enviado al cliente</div>
        <div className="ani-cur" />
      </div>
    </div>
  );
}

function FacturasMock() {
  return (
    <div className="cw cw--fc">
      <div className="cw__bar"><span /><span /><span /></div>
      <div className="cw__top">Facturación</div>
      <div className="cw__body">
        <div className="fc__card">
          <div className="fc__head"><div><small>Presupuesto</small><b>#PS-042</b></div><span className="fc__st">Aceptado ✓</span></div>
          <div className="fc__info"><span>Bar Mediterráneo</span><b>1.270 €</b></div>
          <div className="fc__btn">Generar factura →</div>
        </div>
        <div className="fc__result">
          <div className="fc__check"><CheckCircle size={24} /></div>
          <b>Factura #FC-042 generada</b>
          <span>1.270 € — Lista para enviar</span>
        </div>
        <div className="ani-cur" />
      </div>
    </div>
  );
}

function ClientesMock() {
  return (
    <div className="cw cw--cm">
      <div className="cw__bar"><span /><span /><span /></div>
      <div className="cw__top">Clientes</div>
      <div className="cw__body">
        <div className="cm__search"><span>Buscar clientes...</span></div>
        <div className="cm__list">
          <div className="cm__row"><div className="cm__av" style={{background:'#25D366'}}>A</div><div className="cm__nfo"><b>Ana García</b><small>3 proyectos · 2.450 €</small></div></div>
          <div className="cm__row cm__row--hl">
            <div className="cm__av" style={{background:'#3B82F6'}}>C</div>
            <div className="cm__nfo"><b>Carlos López</b><small>5 proyectos · 4.800 €</small></div>
            <div className="cm__detail"><div><small>Último proyecto</small><span>Web corporativa</span></div><div><small>Última actividad</small><span>Hace 3 días</span></div></div>
          </div>
          <div className="cm__row"><div className="cm__av" style={{background:'#8B5CF6'}}>M</div><div className="cm__nfo"><b>María Ruiz</b><small>2 proyectos · 1.200 €</small></div></div>
        </div>
        <div className="ani-cur" />
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

const CALENDAR_APPS = [
  { name: 'Google Calendar', Logo: GoogleCalendarLogo, desc: 'Sync bidireccional en tiempo real' },
  { name: 'Calendly', Logo: CalendlyLogo, desc: 'Importa disponibilidad automática' },
  { name: 'Microsoft Teams', Logo: TeamsLogo, desc: 'Reuniones y agenda integradas' },
  { name: 'Zoom', Logo: ZoomLogo, desc: 'Videoconferencias con un clic' },
];

export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [painRef, painInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [featRef, featInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [storyRef, storyInView] = useInView({ threshold: 0.15, triggerOnce: true });
  const [compRef, compInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [revRef, revInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [faqRef, faqInView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [appRef, appInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [calRef, calInView] = useInView({ threshold: 0.1, triggerOnce: true });

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

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="hero__glow2" />
        <div className="lc hero__grid">
          <motion.div className="hero__left" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="hero__pill"><Sparkles size={11} /> Potenciado con Inteligencia Artificial</span>
            <h1>Tu WhatsApp IA que<br /><strong className="grad">multiplica tus reservas</strong></h1>
            <p>Un asistente de IA que atiende a tus clientes por WhatsApp, Instagram y teléfono 24/7. Gestiona reservas, pagos, documentos y facturación desde una única plataforma.</p>
            <div className="hero__metrics">
              <div className="hero__metric"><Clock size={14} /> <span>Configuración en 5 min</span></div>
              <div className="hero__metric"><Shield size={14} /> <span>GDPR compliance</span></div>
              <div className="hero__metric"><BarChart3 size={14} /> <span>+40% reservas</span></div>
              <div className="hero__metric"><Zap size={14} /> <span>IA 24/7</span></div>
            </div>
            <div className="hero__social">
              <div className="hero__avs"><span>C</span><span>L</span><span>S</span><span>A</span></div>
              <div className="hero__stars">{[1,2,3,4,5].map(i=><Star key={i} size={13}/>)}</div>
              <span>Usado por +50 negocios en España</span>
            </div>
          </motion.div>
          <motion.div className="hero__right" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65, delay: 0.18 }}>
            <div className="hcard">
              <span className="hcard__badge"><Zap size={11} /> 15 DÍAS GRATIS</span>
              <h3>Prueba todo el potencial de Wasapy sin coste</h3>
              <p>Crea tu cuenta en 2 minutos y accede a todas las funcionalidades. Sin tarjeta de crédito, sin permanencia.</p>
              <ul>
                <li><Bot size={15}/> IA en WhatsApp e Instagram</li>
                <li><CalendarCheck size={15}/> Reservas inteligentes</li>
                <li><Users size={15}/> CRM y gestión de clientes</li>
                <li><Receipt size={15}/> Facturación y punto de venta</li>
                <li><FileText size={15}/> Documentos y consentimientos</li>
              </ul>
              <Link to="/auth?mode=register" className="btn btn--p btn--full"><Zap size={16}/> Empezar prueba gratuita <ArrowRight size={15}/></Link>
              <div className="hcard__note"><Shield size={12}/> Sin tarjeta <CheckCircle size={12}/> GDPR <Zap size={12}/> Activo en 2 min</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ VISTA REAL - DASHBOARD ═══ */}
      <section className="dash-sec" id="producto">
        <div className="lc">
          <div className="sec-h">
            <span className="tag-pill"><BarChart3 size={12}/> Vista real del producto</span>
            <h2>Tu negocio de diseño, <span className="grad">todo en un panel</span></h2>
            <p>Presupuestos, facturas, clientes, conversaciones de WhatsApp y métricas de negocio. Sin saltar entre herramientas.</p>
          </div>
          <DashMockup />
        </div>
      </section>

      {/* ═══ MÓDULOS DEL CRM ═══ */}
      <section className="show-sec" id="modulos">
        <div className="lc">
          <div className="sec-h">
            <span className="tag-pill"><Sparkles size={12}/> Módulos del CRM</span>
            <h2>Cada herramienta que necesitas, <span className="grad">en un solo lugar</span></h2>
            <p>Mira cómo funciona cada módulo del CRM. Sin capturas estáticas — esto es lo que verás al usarlo.</p>
          </div>

          <div className="show-row">
            <div className="show-row__text">
              <div className="show-row__ico"><CalendarCheck size={20}/></div>
              <h3>Reservas inteligentes sin ir y venir</h3>
              <p>Tus clientes reservan solos. Tú controlas disponibilidad, servicios y recordatorios automáticos.</p>
              <ul className="show-row__list">
                <li><CheckCircle size={13}/> Reserva online desde WhatsApp</li>
                <li><CheckCircle size={13}/> Control de disponibilidad en tiempo real</li>
                <li><CheckCircle size={13}/> Recordatorios automáticos por WhatsApp</li>
                <li><CheckCircle size={13}/> Vista semanal y diaria del equipo</li>
              </ul>
            </div>
            <div className="show-row__mock"><ReservasMock /></div>
          </div>

          <div className="show-row show-row--rev">
            <div className="show-row__text">
              <div className="show-row__ico"><FileText size={20}/></div>
              <h3>Presupuestos profesionales en 2 clics</h3>
              <p>Crea presupuestos con líneas de servicio, descuentos, IVA y exporta a PDF al instante.</p>
              <ul className="show-row__list">
                <li><CheckCircle size={13}/> Plantillas personalizables</li>
                <li><CheckCircle size={13}/> Líneas de servicio con IVA automático</li>
                <li><CheckCircle size={13}/> Exportación directa a PDF</li>
                <li><CheckCircle size={13}/> Envío al cliente desde el CRM</li>
              </ul>
            </div>
            <div className="show-row__mock"><PresupMock /></div>
          </div>

          <div className="show-row">
            <div className="show-row__text">
              <div className="show-row__ico"><Receipt size={20}/></div>
              <h3>De presupuesto a factura con un clic</h3>
              <p>Convierte cualquier presupuesto aceptado en factura. Controla cobros pendientes y genera informes.</p>
              <ul className="show-row__list">
                <li><CheckCircle size={13}/> Conversión automática desde presupuesto</li>
                <li><CheckCircle size={13}/> Numeración secuencial inteligente</li>
                <li><CheckCircle size={13}/> Control de cobros pendientes</li>
                <li><CheckCircle size={13}/> Exportación y envío por email</li>
              </ul>
            </div>
            <div className="show-row__mock"><FacturasMock /></div>
          </div>

          <div className="show-row show-row--rev">
            <div className="show-row__text">
              <div className="show-row__ico"><Users size={20}/></div>
              <h3>Todos tus clientes en un solo lugar</h3>
              <p>Historial completo de cada cliente: proyectos, presupuestos, facturas y conversaciones.</p>
              <ul className="show-row__list">
                <li><CheckCircle size={13}/> Ficha detallada por cliente</li>
                <li><CheckCircle size={13}/> Historial de interacciones completo</li>
                <li><CheckCircle size={13}/> Etiquetas y segmentación</li>
                <li><CheckCircle size={13}/> Búsqueda instantánea</li>
              </ul>
            </div>
            <div className="show-row__mock"><ClientesMock /></div>
          </div>
        </div>
      </section>

      {/* ═══ APP NATIVA ═══ */}
      <section className="app-sec" ref={appRef}>
        <div className="lc app-sec__grid">
          <motion.div className="app-sec__left" initial={{ opacity: 0, x: -30 }} animate={appInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}>
            <span className="tag-pill"><Smartphone size={12}/> App nativa para tu negocio</span>
            <h2>Gestiona tu agenda desde <span className="grad">cualquier lugar.</span></h2>
            <p>Una app pensada para tu negocio: consulta disponibilidad, organiza citas y gestiona tu agenda de forma simple y rápida, estés donde estés.</p>
            <div className="app-sec__note"><Clock size={13}/> Próximamente en iOS y Android</div>
            <div className="app-sec__features">
              <div className="app-sec__feat">
                <div className="app-sec__feat-ico"><Calendar size={16}/></div>
                <div><b>Hecha para tu día a día</b><span>Una experiencia clara, ágil y profesional para gestionar citas sin complicaciones.</span></div>
              </div>
              <div className="app-sec__feat">
                <div className="app-sec__feat-ico"><CalendarCheck size={16}/></div>
                <div><b>Agenda siempre al día</b><span>Consulta huecos, ocupación y cambios al momento para organizar mejor cada jornada.</span></div>
              </div>
              <div className="app-sec__feat">
                <div className="app-sec__feat-ico"><Zap size={16}/></div>
                <div><b>Reserva en 3 toques</b><span>Crea, mueve o cancela citas en segundos con una navegación rápida e intuitiva.</span></div>
              </div>
              <div className="app-sec__feat">
                <div className="app-sec__feat-ico"><Smartphone size={16}/></div>
                <div><b>Todo en un solo lugar</b><span>Tu agenda, tus clientes y tus avisos reunidos en una única app para trabajar con más control.</span></div>
              </div>
            </div>
            <div className="store-badges">
              <div className="store-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                <div><small>Disponible en</small><strong>App Store</strong></div>
              </div>
              <div className="store-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M3.18 23.54c.46.29 1.07.32 1.6.02l14-8.04-3.44-3.44L3.18 23.54zm17.42-10.76c.56-.32.9-.9.9-1.53s-.34-1.21-.9-1.53L17.52 8l-3.76 3.76 3.76 3.76 3.08-1.76zM2.39 1.32C2.15 1.6 2 2.01 2 2.5v19c0 .49.15.9.39 1.18L13.1 12 2.39 1.32zm12.9 8.48L18.68 6.4l-3.1-1.77c-.53-.3-1.14-.27-1.6.02L2.18.46l13.11 9.34z"/></svg>
                <div><small>Disponible en</small><strong>Google Play</strong></div>
              </div>
            </div>
          </motion.div>
          <motion.div className="app-sec__right" initial={{ opacity: 0, x: 30 }} animate={appInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }}>
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* ═══ CALENDARIO & INTEGRACIONES ═══ */}
      <section className="cal-sec" ref={calRef}>
        <div className="lc">
          <div className="sec-h">
            <span className="tag-pill"><Link2 size={12}/> Conexiones reales</span>
            <h2>Tus reservas, <span className="grad">sincronizadas con todo</span></h2>
            <p>Conecta tu calendario favorito y sincroniza reservas automáticamente. Evita dobles reservas y conflictos de agenda.</p>
          </div>
          <div className="cal-sec__grid">
            <motion.div className="cal-sec__integrations" initial={{ opacity: 0, y: 20 }} animate={calInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              {CALENDAR_APPS.map((app, i) => (
                <motion.div key={i} className="cal-card" initial={{ opacity: 0, y: 16 }} animate={calInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 }}>
                  <div className="cal-card__logo"><app.Logo /></div>
                  <div className="cal-card__info">
                    <b>{app.name}</b>
                    <span>{app.desc}</span>
                  </div>
                  <div className="cal-card__status"><CheckCircle size={14}/> Conectado</div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div className="cal-sec__features" initial={{ opacity: 0, y: 20 }} animate={calInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
              <h3>Sincronización en tiempo real</h3>
              <p>Conecta tu cuenta con OAuth y sincroniza automáticamente. Sin configuración manual.</p>
              <ul className="cal-sec__list">
                <li><CheckCircle size={14}/> Sync al crear, modificar o cancelar reservas</li>
                <li><CheckCircle size={14}/> Evita dobles reservas y conflictos de agenda</li>
                <li><CheckCircle size={14}/> Tu equipo ve todo en su calendario habitual</li>
                <li><CheckCircle size={14}/> Videollamadas automáticas con Zoom y Teams</li>
                <li><CheckCircle size={14}/> Recordatorios y notificaciones integradas</li>
                <li><CheckCircle size={14}/> Compatible con cualquier flujo de trabajo</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ CHAT DEMO ═══ */}
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

      {/* ═══ HISTORIA PERSONAL ═══ */}
      <section className="story" ref={storyRef}>
        <div className="lc story__grid">
          <motion.div className="story__img" initial={{ opacity: 0, x: -30 }} animate={storyInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5 }}>
            <div className="story__photo">
              <img src="/images/ImagenGuti.png" alt="Guti — Fundador de Wasapy" />
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

      {/* ═══ PAIN POINTS ═══ */}
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

      {/* ═══ FEATURES GRID ═══ */}
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

      {/* ═══ GREEN CTA ═══ */}
      <section className="gcta">
        <div className="lc gcta__in">
          <div>
            <h2>Deja de responder WhatsApps. Empieza a diseñar.</h2>
            <p>2 días gratis. Sin tarjeta. Tu agente IA activo en 5 minutos.</p>
          </div>
          <Link to="/auth?mode=register" className="btn btn--w btn--xl"><Zap size={17}/> Probar gratis ahora <ArrowRight size={15}/></Link>
        </div>
      </section>

      {/* ═══ COMPARATIVA ═══ */}
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

      {/* ═══ REVIEWS ═══ */}
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

      {/* ═══ PRICING ═══ */}
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

      {/* ═══ FAQ ═══ */}
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

      {/* ═══ FINAL CTA ═══ */}
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
