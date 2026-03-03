import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import {
  Zap, CheckCircle, ArrowRight, BarChart3, ChevronDown, Bot, CalendarCheck,
  Sparkles, X, Check, FileText, Calendar, MessageCircle, Send,
  TrendingUp, Calculator, Target, UserCheck, PhoneCall, Menu,
  Globe, Layers, Star, Mail, ExternalLink
} from 'lucide-react';
import './SaasLanding.css';

/* ═══════════════════════════════════════════
   COOKIE BANNER
═══════════════════════════════════════════ */
function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem('wasapy_cookies') === null; } catch { return false; }
  });
  const [expanded, setExpanded] = useState(false);

  const accept = (all) => {
    try { localStorage.setItem('wasapy_cookies', all ? 'all' : 'essential'); } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <motion.div className="ck-banner"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.3, delay: 1.5 }}>
      <div className="ck-banner__top">
        <div className="ck-banner__txt">
          <strong>Usamos cookies</strong>
          <p>Las esenciales son necesarias para el funcionamiento de la plataforma. Las analíticas nos ayudan a mejorar el servicio.{' '}
            <Link to="/cookies" className="ck-banner__link">Política de cookies</Link>
          </p>
        </div>
        <div className="ck-banner__btns">
          <button className="ck-banner__btn ck-banner__btn--ghost" onClick={() => accept(false)}>Solo esenciales</button>
          <button className="ck-banner__btn ck-banner__btn--primary" onClick={() => accept(true)}>Aceptar todas</button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SOCIAL PROOF TOAST (bottom-left)
═══════════════════════════════════════════ */
const SP_USERS = [
  { name: 'María S.', city: 'Barcelona', ago: 'hace 2 min' },
  { name: 'Carlos M.', city: 'Madrid', ago: 'hace 5 min' },
  { name: 'Ana R.', city: 'Valencia', ago: 'hace 1 min' },
  { name: 'Pablo G.', city: 'Sevilla', ago: 'hace 8 min' },
  { name: 'Lucía F.', city: 'Bilbao', ago: 'hace 3 min' },
  { name: 'Diego H.', city: 'Málaga', ago: 'hace 6 min' },
  { name: 'Sara N.', city: 'Zaragoza', ago: 'hace 4 min' },
  { name: 'Javier L.', city: 'Alicante', ago: 'hace 7 min' },
  { name: 'Marta C.', city: 'Murcia', ago: 'hace 2 min' },
  { name: 'Rubén P.', city: 'Vigo', ago: 'hace 10 min' },
];

function SocialProofToast() {
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let current = 0;
    let hideTimer;
    const show = () => {
      setIdx(current % SP_USERS.length);
      current++;
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 4000);
    };
    const startTimer = setTimeout(() => {
      show();
      const iv = setInterval(show, 9000);
      return () => clearInterval(iv);
    }, 5000);
    return () => { clearTimeout(startTimer); clearTimeout(hideTimer); };
  }, []);

  const u = SP_USERS[idx];
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="sp-toast"
          initial={{ opacity: 0, x: -16, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -16, scale: 0.95 }}
          transition={{ duration: 0.22 }}>
          <div className="sp-toast__av">{u.name.charAt(0)}</div>
          <div className="sp-toast__body">
            <div className="sp-toast__text"><strong>{u.name}</strong>, {u.city}</div>
            <div className="sp-toast__sub">Nuevo en Wasapy · {u.ago}</div>
          </div>
          <div className="sp-toast__dot" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   USER COUNTER STRIP
═══════════════════════════════════════════ */
function UserCounter() {
  const [count, setCount] = useState(1180);
  const [ref, inView] = useInView({ threshold: 0.5, triggerOnce: true });

  useEffect(() => {
    if (!inView) return;
    const target = 1247;
    let current = 1180;
    const iv = setInterval(() => {
      current += 3;
      if (current >= target) { setCount(target); clearInterval(iv); }
      else setCount(current);
    }, 28);
    return () => clearInterval(iv);
  }, [inView]);

  return (
    <div className="uctr" ref={ref}>
      <div className="lc uctr__in">
        <div className="uctr__left">
          <div className="uctr__avatars">
            {['MF','LG','IP','CR','AS','PD'].map((av, i) => (
              <div key={i} className="uctr__av" style={{ '--i': i }}>{av}</div>
            ))}
          </div>
          <div className="uctr__text">
            <span className="uctr__num">{count.toLocaleString('es-ES')}+</span>
            <span>diseñadores web ya usan Wasapy</span>
          </div>
        </div>
        <div className="uctr__right">
          <div className="uctr__stars">
            {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
          </div>
          <span className="uctr__rating">4.9/5 valoración media</span>
          <div className="uctr__sep" />
          <span className="uctr__tag"><span className="uctr__pulse" />En directo ahora</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ANNOUNCEMENT BAR
═══════════════════════════════════════════ */
function AnnouncementBar() {
  const [closed, setClosed] = useState(() => {
    try { return localStorage.getItem('wasapy_ann') === '1'; } catch { return false; }
  });
  if (closed) return null;
  return (
    <div className="ann">
      <div className="ann__inner">
        <span className="ann__dot" />
        <span className="ann__txt--full">Nuevo · Presupuestos IA con tu branding se generan y envían solos</span>
        <span className="ann__txt--short">Presupuestos IA automáticos</span>
        <a href="#precios" className="ann__cta">Ver planes <ArrowRight size={11} /></a>
      </div>
      <button className="ann__x" onClick={() => { setClosed(true); try { localStorage.setItem('wasapy_ann', '1'); } catch {} }} aria-label="Cerrar"><X size={12} /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO NOTIFICATION — live toast on mockup
═══════════════════════════════════════════ */
function HeroNotif() {
  const [idx, setIdx] = useState(-1);
  const NOTIFS = [
    { icon: <MessageCircle size={12} />, text: 'Nuevo lead — Carlos pregunta por web', sub: 'Tu IA ya respondió · hace 3s', col: 'green' },
    { icon: <CalendarCheck size={12} />, text: 'Discovery call agendada — Mar 11:00', sub: 'Ana García · confirmada automáticamente', col: 'blue' },
    { icon: <FileText size={12} />, text: 'Presupuesto enviado por WhatsApp', sub: '1.370€ · Restaurante La Mar', col: 'green' },
    { icon: <UserCheck size={12} />, text: 'Lead cualificado — Budget 1.200€+', sub: 'Clínica Salud · score alto', col: 'purple' },
  ];

  useEffect(() => {
    let current = 0;
    let hideTimer;
    const show = () => {
      setIdx(current % NOTIFS.length);
      current++;
      hideTimer = setTimeout(() => setIdx(-1), 3200);
    };
    const t = setTimeout(() => {
      show();
      const iv = setInterval(show, 5000);
      return () => clearInterval(iv);
    }, 1600);
    return () => { clearTimeout(t); clearTimeout(hideTimer); };
  }, []);

  return (
    <AnimatePresence>
      {idx >= 0 && (
        <motion.div className={`h-notif h-notif--${NOTIFS[idx].col}`}
          initial={{ opacity: 0, y: -10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.94 }}
          transition={{ duration: 0.22 }}>
          <div className="h-notif__ico">{NOTIFS[idx].icon}</div>
          <div>
            <div className="h-notif__text">{NOTIFS[idx].text}</div>
            <div className="h-notif__sub">{NOTIFS[idx].sub}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   DASHBOARD MOCKUP (hero right)
═══════════════════════════════════════════ */
function DashMockup() {
  return (
    <div className="dash-mk">
      <div className="dash-mk__shimmer" />
      <div className="dash-mk__bar"><span /><span /><span /></div>
      <div className="dash-mk__body">
        <div className="dash-mk__side">
          <div className="dash-mk__logo">wasap<em>y</em></div>
          <div className="dash-mk__nav">
            <div className="dash-mk__ni dash-mk__ni--on">Dashboard</div>
            <div className="dash-mk__ni">WhatsApp</div>
            <div className="dash-mk__ni">Presupuestos</div>
            <div className="dash-mk__ni">Clientes</div>
            <div className="dash-mk__ni">Config. IA</div>
          </div>
        </div>
        <div className="dash-mk__main">
          <div className="dash-mk__stats">
            <div className="dash-mk__st"><strong>8</strong><span>Leads hoy</span></div>
            <div className="dash-mk__st"><strong>4.200€</strong><span>Presup. activos</span></div>
            <div className="dash-mk__st"><strong>3</strong><span>Calls esta semana</span></div>
          </div>
          <div className="dash-mk__table">
            <div className="dash-mk__row dash-mk__row--head"><span>Cliente</span><span>Proyecto</span><span>Importe</span><span>Estado</span></div>
            <div className="dash-mk__row"><span>Clínica Salud+</span><span>Landing + SEO</span><span>1.100€</span><span className="tag tag--g">Aceptado</span></div>
            <div className="dash-mk__row"><span>Bar Mediterráneo</span><span>Web + reservas</span><span>950€</span><span className="tag tag--y">Enviado</span></div>
            <div className="dash-mk__row"><span>Tienda ModaMujer</span><span>Ecommerce</span><span>2.400€</span><span className="tag tag--b">Borrador</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHOWCASE 1 — Animated inbox (lead arrives)
═══════════════════════════════════════════ */
function ShowcaseInbox() {
  const [stage, setStage] = useState(0);
  const DELAYS = [1400, 1800, 2200, 2000, 3200];

  useEffect(() => {
    const t = setTimeout(() => setStage(s => (s + 1) % 5), DELAYS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="sc-mock">
      <div className="sc-mock__bar"><span /><span /><span /></div>
      <div className="sc-mock__head">
        <div className="sc-mock__av"><MessageCircle size={13} /></div>
        <div>
          <b>Carlos Ruiz</b>
          <small>WhatsApp · hace un momento</small>
        </div>
        <div className="sc-mock__badge">IA activa</div>
      </div>
      <div className="sc-mock__chat">
        {stage === 0 && (
          <div className="sc-mock__idle">
            <div className="sc-mock__pulse" />
            <span>Esperando mensajes...</span>
          </div>
        )}
        {stage >= 1 && (
          <div className="sc-msg sc-msg--in sc-anim">
            Hola, busco diseñador para hacerme la web de mi restaurante. ¿Cuánto cobras?
          </div>
        )}
        {stage === 2 && (
          <div className="sc-typing sc-anim">
            <span /><span /><span />
          </div>
        )}
        {stage >= 3 && (
          <div className="sc-msg sc-msg--out sc-anim">
            ¡Hola! Web restaurante con carta digital y sistema de reservas desde <strong>900€</strong>. ¿Tienes fecha de apertura? Te propongo una llamada rápida para darte precio exacto.
          </div>
        )}
        {stage >= 4 && (
          <div className="sc-lead-card sc-anim">
            <div className="sc-lead-card__head"><UserCheck size={11} /> Lead cualificado automáticamente</div>
            <div className="sc-lead-card__row"><span>Proyecto</span><span>Web restaurante</span></div>
            <div className="sc-lead-card__row"><span>Budget est.</span><span>900€ – 1.400€</span></div>
            <div className="sc-lead-card__row"><span>Score</span><span className="sc-hot">Caliente</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHOWCASE 2 — Animated calendar booking
═══════════════════════════════════════════ */
function ShowcaseCalendar() {
  const [stage, setStage] = useState(0);
  const DELAYS = [1500, 2000, 2000, 2200, 3200];

  useEffect(() => {
    const t = setTimeout(() => setStage(s => (s + 1) % 5), DELAYS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  const slots = ['9:00', '10:00', '11:00', '12:00', '16:00'];

  return (
    <div className="sc-mock sc-mock--cal">
      <div className="sc-mock__bar"><span /><span /><span /></div>
      <div className="sc-cal__head">
        <Calendar size={13} /> Agenda · Esta semana
      </div>
      <div className="sc-cal__grid">
        <div className="sc-cal__cols">
          <div className="sc-cal__tc" />
          {days.map(d => <div key={d} className="sc-cal__dh">{d}</div>)}
        </div>
        {slots.map((time, ti) => (
          <div key={time} className="sc-cal__row">
            <div className="sc-cal__time">{time}</div>
            {days.map((d, di) => {
              const isTarget = ti === 2 && di === 1;
              const isBooked = stage >= 3 && isTarget;
              const isPulsing = stage >= 1 && stage < 3 && isTarget;
              return (
                <div key={d} className={`sc-slot ${isPulsing ? 'sc-slot--pulse' : ''} ${isBooked ? 'sc-slot--booked' : ''}`}>
                  {isBooked && <span>Ana G.</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {stage >= 2 && stage < 4 && (
        <div className="sc-cal__notif sc-anim">
          <Bot size={11} /> Ana G. quiere agendar — propongo Mar 11:00
        </div>
      )}
      {stage >= 4 && (
        <div className="sc-cal__confirm sc-anim">
          <Check size={11} /><Check size={11} /> Cita confirmada · Mar 11:00 · Enlace enviado
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHOWCASE 3 — Animated budget generation
═══════════════════════════════════════════ */
function ShowcaseBudget() {
  const [stage, setStage] = useState(0);
  const DELAYS = [1000, 1600, 1600, 1800, 2000, 3000];

  useEffect(() => {
    const t = setTimeout(() => setStage(s => (s + 1) % 6), DELAYS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="sc-mock sc-mock--budget">
      <div className="sc-mock__bar"><span /><span /><span /></div>
      <div className="sc-budget">
        {stage === 0 && (
          <div className="sc-budget__empty sc-anim">
            <FileText size={28} />
            <span>Generando presupuesto...</span>
          </div>
        )}
        {stage >= 1 && (
          <div className="sc-budget__header sc-anim">
            <div className="sc-budget__logo">Tu Estudio Web</div>
            <div>
              <div className="sc-budget__ref">Propuesta #042</div>
              <div className="sc-budget__client">Para: Carlos Ruiz · Restaurante La Mar</div>
            </div>
          </div>
        )}
        {stage >= 2 && (
          <div className="sc-budget__lines sc-anim">
            <div className="sc-budget__line"><span>Web corporativa</span><span>900€</span></div>
            <div className="sc-budget__line"><span>Carta digital</span><span>200€</span></div>
            <div className="sc-budget__line"><span>Sistema reservas</span><span>150€</span></div>
            <div className="sc-budget__line"><span>Hosting año 1</span><span>120€</span></div>
          </div>
        )}
        {stage >= 3 && (
          <div className="sc-budget__total sc-anim">
            <span>Total</span>
            <span>1.370€ + IVA</span>
          </div>
        )}
        {stage >= 4 && stage < 5 && (
          <div className="sc-budget__sending sc-anim">
            <div className="sc-budget__prog"><div className="sc-budget__prog-fill" /></div>
            <span>Enviando por WhatsApp...</span>
          </div>
        )}
        {stage >= 5 && (
          <div className="sc-budget__sent sc-anim">
            <Check size={11} /><Check size={11} /> Presupuesto enviado · hace un momento
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ROI CALCULATOR
═══════════════════════════════════════════ */
function RoiCalculator() {
  const [leads, setLeads] = useState(20);
  const [ticket, setTicket] = useState(1200);
  const conversionSin = 0.08;
  const conversionCon = 0.22;
  const sinWasapy = Math.round(leads * conversionSin * ticket);
  const conWasapy = Math.round(leads * conversionCon * ticket);
  const diff = conWasapy - sinWasapy;

  return (
    <div className="roi-calc">
      <div className="roi-calc__inputs">
        <div className="roi-calc__field">
          <label>Consultas de diseño web / mes por WhatsApp</label>
          <input type="range" min="5" max="80" value={leads} onChange={e => setLeads(+e.target.value)} />
          <span className="roi-calc__val">{leads}</span>
        </div>
        <div className="roi-calc__field">
          <label>Ticket medio de tu proyecto (€)</label>
          <input type="range" min="300" max="5000" step="100" value={ticket} onChange={e => setTicket(+e.target.value)} />
          <span className="roi-calc__val">{ticket.toLocaleString('es-ES')}€</span>
        </div>
      </div>
      <div className="roi-calc__results">
        <div className="roi-calc__col">
          <span className="roi-calc__label">Sin Wasapy</span>
          <span className="roi-calc__num roi-calc__num--dim">{sinWasapy.toLocaleString('es-ES')}€/mes</span>
          <small>~{Math.round(conversionSin * 100)}% conversión (respuesta lenta)</small>
        </div>
        <div className="roi-calc__arrow"><ArrowRight size={20} /></div>
        <div className="roi-calc__col roi-calc__col--hl">
          <span className="roi-calc__label">Con Wasapy</span>
          <span className="roi-calc__num">{conWasapy.toLocaleString('es-ES')}€/mes</span>
          <small>~{Math.round(conversionCon * 100)}% conversión (respuesta inmediata)</small>
        </div>
      </div>
      <div className="roi-calc__diff">
        +{diff.toLocaleString('es-ES')}€/mes de facturación potencial extra
      </div>
      <p className="roi-calc__disclaimer">
        Estimación basada en datos del sector freelance. Sin IA: respuesta media 4h, {Math.round(conversionSin * 100)}% cierre. Con IA: respuesta &lt;10s, cualificación automática, {Math.round(conversionCon * 100)}% cierre.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FLOATING CHAT (simulación local)
═══════════════════════════════════════════ */
function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wasapy_chat') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const chatRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('wasapy_chat', JSON.stringify(msgs));
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const respond = useCallback((text) => {
    const lower = text.toLowerCase();
    if (lower.includes('precio') || lower.includes('cuánto') || lower.includes('coste') || lower.includes('plan'))
      return 'Tenemos 3 planes: Starter (29€/mes), Pro (79€/mes) y Agency (149€/mes). Todos incluyen IA en WhatsApp, presupuestos PDF y CRM de clientes. ¿Cuál encaja con tu volumen?';
    if (lower.includes('wordpress') || lower.includes('diseño') || lower.includes('diseñador') || lower.includes('freelance'))
      return 'Wasapy está hecho específicamente para diseñadores web freelance. Mientras estás maquetando en WordPress o Elementor, la IA gestiona tus leads, agenda discovery calls y envía presupuestos. Tú diseñas, ella vende.';
    if (lower.includes('agenda') || lower.includes('llamada') || lower.includes('cita') || lower.includes('calendar') || lower.includes('discovery'))
      return 'La IA agenda discovery calls directamente en tu calendario. Se sincroniza con Calendly para que no tengas dobles reservas. La reunión aparece ya confirmada sin que hagas nada.';
    if (lower.includes('presupuesto') || lower.includes('factura') || lower.includes('pdf'))
      return 'Puedes configurar tus tarifas reales (web corporativa, landing, ecommerce…). La IA genera presupuestos PDF con tu branding, IVA/IRPF y los envía por WhatsApp automáticamente.';
    if (lower.includes('whatsapp') || lower.includes('conectar') || lower.includes('qr'))
      return 'Solo escaneas un QR desde la app. Sin WhatsApp Business API, sin configuración técnica. En menos de 5 minutos tu IA ya está atendiendo leads.';
    return 'Wasapy es el CRM con IA para diseñadores web freelance. Gestiona tus leads de WhatsApp, agenda discovery calls y envía presupuestos mientras tú diseñas. ¿Qué más quieres saber?';
  }, []);

  function handleSend(text) {
    if (!text.trim()) return;
    const userMsg = { from: 'user', text: text.trim(), ts: Date.now() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      setMsgs(prev => [...prev, { from: 'bot', text: respond(text), ts: Date.now() }]);
    }, 600 + Math.random() * 400);
  }

  const quickReplies = ['Soy diseñador web freelance', 'Quiero ver los precios', 'Cómo funciona'];

  return (
    <>
      <button className={`fc-fab ${open ? 'fc-fab--hide' : ''}`} onClick={() => setOpen(true)} aria-label="Abrir chat">
        <MessageCircle size={22} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fc-panel" role="dialog" aria-label="Chat Wasapy"
            initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.95 }} transition={{ duration: 0.2 }}>
            <div className="fc-panel__head">
              <div className="fc-panel__info">
                <div className="fc-panel__av"><Bot size={16} /></div>
                <div><b>Wasapy</b><small>IA · Siempre disponible</small></div>
              </div>
              <button className="fc-panel__close" onClick={() => setOpen(false)} aria-label="Cerrar chat"><X size={16} /></button>
            </div>
            <div className="fc-panel__msgs" ref={chatRef}>
              {msgs.length === 0 && (
                <div className="fc-panel__welcome">
                  <Bot size={28} />
                  <b>Hola, soy la IA de Wasapy</b>
                  <span>Hecho para diseñadores web freelance. Pregunta lo que quieras.</span>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`fc-msg fc-msg--${m.from}`}>{m.text}</div>
              ))}
            </div>
            {msgs.length === 0 && (
              <div className="fc-panel__quick">
                {quickReplies.map(q => (
                  <button key={q} onClick={() => handleSend(q)}>{q}</button>
                ))}
              </div>
            )}
            <form className="fc-panel__input" onSubmit={e => { e.preventDefault(); handleSend(input); }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu pregunta..." autoFocus />
              <button type="submit" disabled={!input.trim()} aria-label="Enviar"><Send size={15} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════
   DATA — Web designer focused
═══════════════════════════════════════════ */
const STEPS = [
  {
    icon: <MessageCircle size={24} />,
    title: 'Conecta tu WhatsApp',
    desc: 'Escanea un QR desde el panel. Sin API oficial, sin configuración técnica. En 5 minutos tu IA ya atiende leads mientras tú diseñas.',
  },
  {
    icon: <Layers size={24} />,
    title: 'Configura tus servicios',
    desc: 'Dile a la IA qué webs haces, a qué precio y cómo trabajas. Landing pages, ecommerce, branding — ella lo aprende y vende como tú.',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'La IA vende mientras diseñas',
    desc: 'Cualifica leads, propone horarios de tu calendario, genera presupuestos PDF y hace seguimiento. Tú te enteras cuando el proyecto está listo para cerrar.',
  },
];

const FEATURES = [
  {
    icon: <UserCheck size={22} />,
    title: 'Cualificación de leads web',
    desc: 'La IA detecta si el potencial cliente tiene presupuesto para tu diseño, qué tipo de web necesita y cuándo quiere empezar.',
  },
  {
    icon: <CalendarCheck size={22} />,
    title: 'Discovery calls automáticas',
    desc: 'Sincroniza con Calendly y la IA propone tus slots reales. La reunión aparece en tu Google Calendar ya confirmada.',
  },
  {
    icon: <FileText size={22} />,
    title: 'Presupuestos PDF con tu branding',
    desc: 'Genera propuestas profesionales con tus tarifas reales — web, landing, ecommerce — con IVA/IRPF y tu logo. Enviadas por WhatsApp.',
  },
  {
    icon: <Target size={22} />,
    title: 'Seguimiento automático',
    desc: 'Si el lead no responde al presupuesto, la IA hace follow-up en tu nombre. Nunca pierdas un proyecto por no hacer seguimiento.',
  },
  {
    icon: <PhoneCall size={22} />,
    title: 'Derivación inteligente',
    desc: 'Proyectos grandes o clientes con dudas complejas: la IA te avisa con todo el contexto para que cierres tú la venta.',
  },
  {
    icon: <BarChart3 size={22} />,
    title: 'CRM para tu estudio',
    desc: 'Todos tus leads, presupuestos y proyectos en un único panel. Sin Excel, sin caos. Enfócate en diseñar, no en administrar.',
  },
];

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: '29', annual: '24',
    msgs: '1.000', agents: '1',
    features: ['1 agente IA (1 WhatsApp)', '1.000 mensajes/mes', 'Presupuestos en PDF', 'CRM de clientes', 'Dashboard básico', 'Soporte por email'],
  },
  {
    id: 'pro', name: 'Pro', price: '79', annual: '66', popular: true,
    msgs: '3.000', agents: '3',
    features: ['3 agentes IA (3 WhatsApp)', '3.000 mensajes/mes', 'Presupuestos + facturas', 'CRM completo + etiquetas', 'Dashboard avanzado', 'Soporte prioritario', 'Prompt personalizado por agente'],
  },
  {
    id: 'agency', name: 'Agency', price: '149', annual: '124',
    msgs: '8.000', agents: 'Ilimitados',
    features: ['Agentes ilimitados', '8.000 mensajes/mes', 'Todo lo de Pro', 'Marca blanca', 'API personalizada', 'Soporte 24/7 dedicado', 'Onboarding personalizado'],
  },
];

const REVIEWS = [
  {
    name: 'Marcos F.',
    role: 'Diseñador web freelance · Madrid',
    av: 'MF',
    stars: 5,
    text: 'Antes perdía 2 o 3 leads por semana por no responder a tiempo. Con Wasapy la IA responde sola y ya tengo 3 discovery calls nuevas esta semana sin haber hecho nada.',
    metric: '+3 discovery calls la primera semana',
  },
  {
    name: 'Laura G.',
    role: 'Agencia WordPress · Barcelona',
    av: 'LG',
    stars: 5,
    text: 'Los presupuestos automáticos me han cambiado la vida. Antes tardaba 2 horas en cada propuesta. Ahora la IA lo hace sola, con mi logo y mis condiciones, y el cliente lo recibe al momento.',
    metric: '6h/semana ahorradas en presupuestos',
  },
  {
    name: 'Iván P.',
    role: 'WordPress & WooCommerce · Valencia',
    av: 'IP',
    stars: 5,
    text: 'Nunca pensé que una IA pudiera hablar tan bien de mis servicios. La configuré con mis tarifas y mi tono, y los clientes no notan la diferencia. Es exactamente como yo respondería.',
    metric: '4 proyectos cerrados el primer mes',
  },
];

const FAQ_DATA = [
  { q: '¿Funciona con mi WhatsApp normal o necesito WhatsApp Business?', a: 'Funciona con tu WhatsApp normal. Solo escaneas un QR desde el panel y la IA empieza a atender. Sin WhatsApp Business API, sin configuración técnica complicada.' },
  { q: '¿La IA sabe responder sobre mis servicios de diseño web?', a: 'Sí. Configuras tus servicios reales: web corporativa, landing pages, ecommerce, branding, SEO... con tus precios y condiciones. La IA habla con tus tarifas y tu tono.' },
  { q: '¿Puedo usarlo si tengo varios clientes y proyectos activos?', a: 'Es perfecto para eso. El CRM te muestra todos tus leads, presupuestos activos y el estado de cada proyecto en un único panel. Desde Starter tienes lo esencial.' },
  { q: '¿La IA puede enviar presupuestos de diseño web en PDF?', a: 'Sí. Cuando un lead pide precio, la IA genera un PDF profesional con tus tarifas, IVA/IRPF y tu logo, y lo envía directamente por WhatsApp.' },
  { q: '¿Puedo seguir respondiendo yo cuando quiera?', a: 'Sí. Si respondes manualmente, la IA se aparta automáticamente. Solo actúa cuando tú estás en modo foco o no disponible. Tú controlas cuándo.' },
  { q: '¿Qué pasa si me quedo sin mensajes?', a: 'La IA se pausa automáticamente. Puedes comprar packs extra de mensajes desde el panel sin cambiar de plan. Desde 9€ por pack adicional.' },
  { q: '¿Es difícil de configurar si no soy técnico?', a: 'Para nada. Si sabes diseñar webs, puedes configurar Wasapy. El onboarding guiado te lleva paso a paso en menos de 15 minutos. Sin código, sin API, sin dolor de cabeza.' },
];

/* ═══════════════════════════════════════════
   MAIN LANDING
═══════════════════════════════════════════ */
export default function SaasLanding() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [annual, setAnnual] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [featRef, featInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [roiRef, roiInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [pricingRef, pricingInView] = useInView({ threshold: 0.05, triggerOnce: true });
  const [storyRef, storyInView] = useInView({ threshold: 0.15, triggerOnce: true });
  const [reviewsRef, reviewsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [faqRef, faqInView] = useInView({ threshold: 0.05, triggerOnce: true });

  return (
    <div className="lp">
      <div className="lp__grid-bg" />

      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <AnnouncementBar />

      {/* ═══ NAVBAR ═══ */}
      <nav className="ln">
        <div className="lc ln__in">
          <div className="ln__logo-wrap">
            <Link to="/" className="ln__logo">
              <span className="lt">wasap<span className="lg">y</span></span>
              <span className="lb">.io</span>
            </Link>
            <span className="ln__new">IA</span>
          </div>
          <div className="ln__mid">
            <a href="#como-funciona">Producto</a>
            <a href="#precios">Precios</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="ln__r">
            <Link to="/auth" className="ln__log">Entrar <ArrowRight size={12} /></Link>
            <Link to="/auth?mode=register" className="ln__cta"><Zap size={13} /> 2 días gratis</Link>
          </div>
          <button className="ln__burger" onClick={() => setMobileNav(v => !v)} aria-label="Menú">
            <Menu size={22} />
          </button>
        </div>
        <AnimatePresence>
          {mobileNav && (
            <motion.div className="ln__fullmenu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <button className="ln__fullmenu-close" onClick={() => setMobileNav(false)} aria-label="Cerrar menú"><X size={24} /></button>
              <nav className="ln__fullmenu-links">
                <a href="#como-funciona" onClick={() => setMobileNav(false)}>Producto</a>
                <a href="#precios" onClick={() => setMobileNav(false)}>Precios</a>
                <a href="#faq" onClick={() => setMobileNav(false)}>FAQ</a>
                <Link to="/auth" onClick={() => setMobileNav(false)}>Entrar</Link>
              </nav>
              <Link to="/auth?mode=register" className="ln__fullmenu-cta" onClick={() => setMobileNav(false)}>
                <Zap size={16} /> 2 días gratis
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero__orb" />
        <div className="hero__orb hero__orb--2" />
        <div className="lc hero__grid">
          <motion.div className="hero__left" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>

            <div className="hero__live">
              <span className="hero__live-dot" />
              IA activa · Atendiendo leads ahora mismo
            </div>

            <h1>
              El agente IA que <strong className="grad">vende webs por ti.</strong>
            </h1>

            <p>Tu agente responde en WhatsApp con tus tarifas reales, cualifica el lead, agenda la discovery call y manda el presupuesto PDF — <em>mientras tú diseñas o simplemente vives</em>.</p>

            <div className="hero__ctas">
              <Link to="/auth?mode=register" className="btn btn--p btn--xl"><Zap size={15} /> Probar 2 días gratis</Link>
              <a href="#como-funciona" className="btn btn--ghost btn--xl">Ver cómo funciona <ArrowRight size={14} /></a>
            </div>


          </motion.div>

          <motion.div className="hero__right" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.65, delay: 0.18 }}>
            <div className="hero__mock-wrap">
              <DashMockup />
              <HeroNotif />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ USER COUNTER STRIP ═══ */}
      <UserCounter />

      {/* ═══ CÓMO FUNCIONA (3 pasos) ═══ */}
      <section className="steps" id="como-funciona">
        <div className="lc">
          <div className="sec-h">
            <span className="tag-pill"><Sparkles size={12} /> En 5 minutos</span>
            <h2>De leads perdidos a proyectos cerrados</h2>
            <p>Tres pasos y tu IA está vendiendo mientras tú diseñas.</p>
          </div>
          <div className="steps__grid">
            {STEPS.map((s, i) => (
              <motion.div key={i} className="step"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.12 }}>
                <div className="step__num">{i + 1}</div>
                <div className="step__ico">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HISTORIA / FUNDADOR ═══ */}
      <section className="story" ref={storyRef}>
        <div className="lc story__grid">
          <motion.div className="story__img"
            initial={{ opacity: 0, x: -30 }}
            animate={storyInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}>
            <div className="story__photo">
              <img src="/images/ImagenGuti.png" alt="Guti — CEO de Wasapy" />
            </div>
            <div className="story__badge"><Sparkles size={13} /> Fundador & CEO · Wasapy</div>
          </motion.div>

          <motion.div className="story__text"
            initial={{ opacity: 0, x: 30 }}
            animate={storyInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <span className="tag-pill">Por qué construí esto</span>
            <h2>7 años diseñando webs.<br /><span className="grad">Siempre me faltaba lo mismo.</span></h2>
            <p>Soy Guti. Llevo más de 7 años como diseñador web freelance, trabajando con restaurantes, clínicas, tiendas y consultorías. Me encantaba mi trabajo. Pero siempre había un mismo cuello de botella: el WhatsApp.</p>
            <p>Mientras estaba maquetando en WordPress, el móvil no paraba. Siempre la misma pregunta: <em>"¿cuánto cuesta una web?"</em>. Y cuando salía del estado de concentración para responder, el lead ya se había ido con otro diseñador.</p>
            <p>Un día perdí un proyecto de 3.000€ porque tardé 4 horas en responder. Ese día decidí construir lo que siempre me faltó: una IA que atiende, cualifica y agenda mientras yo diseño. Eso es Wasapy.</p>
            <blockquote>"Construí Wasapy para que ningún diseñador vuelva a perder un cliente por estar haciendo su trabajo."</blockquote>
            <cite>— Guti · CEO de Wasapy · 7+ años diseñador web freelance</cite>
          </motion.div>
        </div>
      </section>

      {/* ═══ SHOWCASE 1 — Leads en WhatsApp ═══ */}
      <section className="showcase" id="producto">
        <div className="lc showcase__grid">
          <motion.div className="showcase__text"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}>
            <span className="tag-pill"><MessageCircle size={12} /> Leads en WhatsApp</span>
            <h2>Nunca más pierdas<br />un cliente por estar<br /><span className="grad">diseñando.</span></h2>
            <p>Estás maquetando en WordPress y el móvil no para. Cuando salís del modo foco para responder, el lead ya se fue con otro diseñador que contestó antes.</p>
            <p>Tu agente IA responde en segundos, con tus precios reales, cualifica el lead y te lo pasa listo para cerrar.</p>
            <div className="showcase__pts">
              <div><CheckCircle size={14} /> Respuesta inmediata 24/7, incluso a las 3AM</div>
              <div><CheckCircle size={14} /> Habla con tu tono y tus tarifas reales</div>
              <div><CheckCircle size={14} /> Cualifica el lead antes de pasártelo</div>
            </div>
          </motion.div>
          <motion.div className="showcase__demo"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <ShowcaseInbox />
          </motion.div>
        </div>
      </section>

      {/* ═══ SHOWCASE 2 — Discovery calls ═══ */}
      <section className="showcase showcase--alt">
        <div className="lc showcase__grid showcase__grid--rev">
          <motion.div className="showcase__demo"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <ShowcaseCalendar />
          </motion.div>
          <motion.div className="showcase__text"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}>
            <span className="tag-pill"><CalendarCheck size={12} /> Discovery calls</span>
            <h2>Reuniones de descubrimiento<br />en tu agenda,<br /><span className="grad">sin esfuerzo.</span></h2>
            <p>Sin ir y venir de mensajes para cuadrar horarios. La IA consulta tu disponibilidad real y el cliente elige su slot directamente.</p>
            <p>La reunión aparece en tu Google Calendar ya confirmada. Tú te enteras cuando ya está cerrado.</p>
            <div className="showcase__pts">
              <div><CheckCircle size={14} /> Sincronizado con Calendly</div>
              <div><CheckCircle size={14} /> Sin solapamientos ni dobles reservas</div>
              <div><CheckCircle size={14} /> Recordatorio automático al cliente</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SHOWCASE 3 — Presupuestos ═══ */}
      <section className="showcase">
        <div className="lc showcase__grid">
          <motion.div className="showcase__text"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}>
            <span className="tag-pill"><FileText size={12} /> Presupuestos</span>
            <h2>Propuestas PDF con<br />tu branding, enviadas<br /><span className="grad">mientras duermes.</span></h2>
            <p>Cuando el lead está listo para un precio, la IA genera tu presupuesto personalizado en PDF — tu logo, tus servicios, tus condiciones, IVA/IRPF incluidos.</p>
            <p>Lo envía por WhatsApp y si el cliente no responde en 48h, hace follow-up automático en tu nombre.</p>
            <div className="showcase__pts">
              <div><CheckCircle size={14} /> PDF con tu identidad visual</div>
              <div><CheckCircle size={14} /> IVA, IRPF y condiciones incluidos</div>
              <div><CheckCircle size={14} /> Follow-up automático si no responde</div>
            </div>
          </motion.div>
          <motion.div className="showcase__demo"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <ShowcaseBudget />
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES (6 cards) ═══ */}
      <section className="feat" ref={featRef}>
        <div className="lc">
          <div className="sec-h">
            <span className="tag-pill"><Zap size={12} /> Funcionalidades</span>
            <h2>Todo lo que necesita<br />tu estudio de diseño web</h2>
            <p>Cada función nace de un problema real del freelance de diseño web.</p>
          </div>
          <div className="feat__grid">
            {FEATURES.map((f, i) => (
              <motion.div key={i} className="feat__card" initial={{ opacity: 0, y: 18 }} animate={featInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.06 }}>
                <div className="feat__ico">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ POR QUÉ WASAPY — ROI ═══ */}
      <section className="roi" ref={roiRef}>
        <div className="lc">
          <div className="sec-h">
            <span className="tag-pill"><TrendingUp size={12} /> Impacto real</span>
            <h2>Lo que cambia cuando<br />dejas de responder tú</h2>
            <p>Un agente IA no descansa, no se olvida y nunca responde tarde.</p>
          </div>

          <motion.div className="roi__claims" initial={{ opacity: 0, y: 20 }} animate={roiInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45 }}>
            {[
              { icon: <Target size={22} />, title: 'Cero leads perdidos por respuesta lenta', desc: 'El lead que escribe a las 2AM mientras tú duermes recibe respuesta en segundos. No se va con la competencia.' },
              { icon: <CalendarCheck size={22} />, title: 'Más discovery calls, menos gestión', desc: 'La IA agenda sola, sin ir y venir de mensajes. Tus horas de diseño quedan intactas.' },
              { icon: <TrendingUp size={22} />, title: 'Más proyectos cerrados', desc: 'Leads cualificados + presupuestos rápidos + seguimiento automático = más proyectos firmados al mes.' },
            ].map((c, i) => (
              <div key={i} className="roi__claim">
                <div className="roi__claim-ico">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={roiInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45, delay: 0.15 }}>
            <div className="roi__calc-head">
              <Calculator size={18} />
              <div>
                <h3>Calculadora de ROI para diseñadores web</h3>
                <p>Estima cuánto más podrías facturar con respuesta inmediata a tus leads.</p>
              </div>
            </div>
            <RoiCalculator />
          </motion.div>
        </div>
      </section>

      {/* ═══ PRICING (3 planes) ═══ */}
      <section className="pricing" id="precios" ref={pricingRef}>
        <div className="lc">
          <div className="sec-h">
            <h2>Precio claro. Sin sorpresas.</h2>
            <p>Elige el plan que encaja con tu volumen de leads y proyectos.</p>
          </div>

          <div className="pricing__toggle">
            <span className={!annual ? 'pricing__t--on' : ''}>Mensual</span>
            <button className={`pricing__switch ${annual ? 'pricing__switch--on' : ''}`} onClick={() => setAnnual(v => !v)} aria-label="Toggle anual">
              <span className="pricing__knob" />
            </button>
            <span className={annual ? 'pricing__t--on' : ''}>Anual <em>2 meses gratis</em></span>
          </div>

          <div className="pricing__grid">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.id} className={`pcard ${plan.popular ? 'pcard--pop' : ''}`}
                initial={{ opacity: 0, y: 22 }} animate={pricingInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}>
                {plan.popular && <div className="pcard__badge">Más popular</div>}
                <h3>{plan.name}</h3>
                <div className="pcard__price">
                  <span>{annual ? plan.annual : plan.price}€</span>
                  <em>/mes</em>
                </div>
                <div className="pcard__meta">{plan.msgs} mensajes/mes · {plan.agents} agente{plan.agents !== '1' ? 's' : ''}</div>
                <ul>
                  {plan.features.map((f, fi) => <li key={fi}><Check size={13} />{f}</li>)}
                </ul>
                <Link to={`/auth?mode=register&plan=${plan.id}`} className={`btn ${plan.popular ? 'btn--p' : 'btn--outline'} btn--full`}>
                  {plan.popular ? <><Zap size={14} /> Empezar con {plan.name}</> : <>Elegir {plan.name}</>}
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="pricing__addon">
            <Sparkles size={14} />
            <span>¿Necesitas más mensajes? Compra <strong>packs extra</strong> desde 9€ sin cambiar de plan.</span>
          </div>
        </div>
      </section>

      {/* ═══ RESEÑAS ═══ */}
      <section className="reviews" ref={reviewsRef}>
        <div className="lc">
          <div className="reviews__head">
            <div className="reviews__rating">
              <div className="reviews__stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <span className="reviews__avg">4.9</span>
              <span className="reviews__total">/ 5 · +120 diseñadores web</span>
            </div>
            <div className="sec-h" style={{ marginBottom: 0 }}>
              <span className="tag-pill"><Star size={11} fill="#f59e0b" color="#f59e0b" /> Reseñas reales</span>
              <h2>Lo que dicen los diseñadores<br />que ya usan Wasapy</h2>
            </div>
          </div>
          <div className="reviews__grid">
            {REVIEWS.map((r, i) => (
              <motion.div key={i} className="rcard"
                initial={{ opacity: 0, y: 20 }}
                animate={reviewsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}>
                <div className="rcard__stars">
                  {[...Array(r.stars)].map((_, si) => <Star key={si} size={13} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="rcard__text">"{r.text}"</p>
                <div className="rcard__metric"><CheckCircle size={11} /> {r.metric}</div>
                <div className="rcard__footer">
                  <div className="rcard__av">{r.av}</div>
                  <div>
                    <div className="rcard__name">{r.name}</div>
                    <div className="rcard__role">{r.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="faq" id="faq" ref={faqRef}>
        <div className="lc">
          <div className="sec-h">
            <h2>Preguntas frecuentes<br />de diseñadores web</h2>
          </div>
          <div className="faqs">
            {FAQ_DATA.map((item, i) => (
              <motion.div key={i} className={`fi ${faqOpen === i ? 'fi--open' : ''}`} initial={{ opacity: 0 }} animate={faqInView ? { opacity: 1 } : {}} transition={{ delay: i * 0.04 }}>
                <button className="fi__q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}><span>{item.q}</span><ChevronDown size={17} /></button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div className="fi__a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
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
      <section className="fcta">
        <div className="lc">
          <h2>Deja de perder proyectos<br />por estar diseñando.</h2>
          <p>La IA atiende. Tú diseñas. Los presupuestos se crean solos.</p>
          <Link to="/auth?mode=register" className="btn btn--p btn--xl"><Zap size={19} /> Probar 2 días gratis <ArrowRight size={17} /></Link>
          <span className="fcta__n">Sin tarjeta · Sin permanencia · Cancela cuando quieras</span>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="ft">
        <div className="ft__glow" />
        <div className="lc">

          {/* Top strip — stats */}
          <div className="ft__strip">
            <div className="ft__strip-stat"><span>+1.200</span> diseñadores activos</div>
            <div className="ft__strip-div" />
            <div className="ft__strip-stat"><span>4.9/5</span> valoración media</div>
            <div className="ft__strip-div" />
            <div className="ft__strip-stat"><span>97%</span> leads respondidos sin intervención</div>
            <div className="ft__strip-div" />
            <div className="ft__strip-stat"><span>&lt;10s</span> tiempo de respuesta IA</div>
          </div>

          {/* Main grid */}
          <div className="ft__main">
            <div className="ft__brand-col">
              <div className="ft__logo-wrap">
                <span className="lt">wasap<span className="lg">y</span></span>
                <span className="lb">.io</span>
              </div>
              <p className="ft__tagline">El CRM con IA para diseñadores web freelance.<br />Hecho por un diseñador, para diseñadores.</p>
              <div className="ft__cta-sm">
                <Link to="/auth?mode=register" className="btn btn--p" style={{ padding: '0.55rem 1.2rem', fontSize: '0.78rem' }}>
                  <Zap size={13} /> Probar 2 días gratis
                </Link>
              </div>
            </div>

            <div className="ft__col">
              <h4>Producto</h4>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#producto">Funcionalidades</a>
              <a href="#precios">Precios</a>
              <a href="#faq">FAQ</a>
            </div>

            <div className="ft__col">
              <h4>Para diseñadores</h4>
              <a href="#producto">Gestión de leads</a>
              <a href="#producto">Discovery calls</a>
              <a href="#producto">Presupuestos PDF</a>
              <a href="#producto">CRM WordPress</a>
            </div>

            <div className="ft__col">
              <h4>Empresa</h4>
              <a href="https://wasapy.io" target="_blank" rel="noopener">wasapy.io <ExternalLink size={10} /></a>
              <a href="mailto:info@wasapy.io"><Mail size={11} /> info@wasapy.io</a>
              <Link to="/privacidad">Privacidad</Link>
              <Link to="/terminos">Términos de uso</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="ft__bottom">
            <span className="ft__copy">© {new Date().getFullYear()} Wasapy · wasapy.io · Todos los derechos reservados</span>
            <span className="ft__made">🇪🇸 Hecho con todo en España</span>
          </div>

        </div>
      </footer>

      <FloatingChat />
      <SocialProofToast />
      <CookieBanner />
    </div>
  );
}
