import { useState, useEffect, useRef } from 'react';
import { Calendar, Check, Loader2, AlertTriangle, Link as LinkIcon, X, RefreshCw, ChevronLeft, ChevronRight, Clock, MapPin, FileText, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';
import './WhatsAppConnect.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1';
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00
const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

function parseScheduleRange(str) {
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.trim().toLowerCase();
  if (cleaned === 'cerrado' || cleaned === 'closed' || cleaned === '-' || cleaned === '') return null;
  const match = cleaned.match(/(\d{1,2})[:\.]?(\d{2})?\s*[-–a]\s*(\d{1,2})[:\.]?(\d{2})?/);
  if (!match) return null;
  return {
    open: parseInt(match[1]),
    openMin: parseInt(match[2] || '0'),
    close: parseInt(match[3]),
    closeMin: parseInt(match[4] || '0'),
  };
}

function isWithinBusinessHours(schedule, dayIndex, hour) {
  if (!schedule) return false;
  let range = null;
  if (dayIndex >= 0 && dayIndex <= 4) range = schedule.weekdays;
  else if (dayIndex === 5) range = schedule.saturday;
  else if (dayIndex === 6) range = schedule.sunday;
  if (!range) return false;
  return hour >= range.open && hour < range.close;
}

function getWeekDays(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

function formatWeekRange(days) {
  const first = days[0];
  const last = days[6];
  const opts = { day: 'numeric', month: 'short' };
  return `${first.toLocaleDateString('es-ES', opts)} – ${last.toLocaleDateString('es-ES', opts)} de ${first.getFullYear()}`;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export default function CalendarIntegration() {
  const { user } = useAuth();
  const { activeAgent, refreshAgents } = useAgents();
  const [connected, setConnected] = useState(false);
  const [calendarInfo, setCalendarInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [businessSchedule, setBusinessSchedule] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const popupRef = useRef(null);

  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  useEffect(() => { loadCalendarStatus(); loadBusinessSchedule(); }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setSelectedEvent(null);
      }
    }
    if (selectedEvent) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedEvent]);

  async function loadCalendarStatus() {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('google_calendar_tokens').select('calendar_id, calendar_name, connected_at').eq('user_id', user.id).single();
      if (data) { setConnected(true); setCalendarInfo(data); loadEvents(); }
    } catch {} finally { setLoading(false); }
  }

  async function loadBusinessSchedule() {
    if (!user) return;
    try {
      const { data: biz } = await supabase.from('businesses').select('extra_context, schedule').eq('user_id', user.id).single();
      if (biz) {
        let extra = {};
        if (biz.extra_context) {
          try { extra = JSON.parse(biz.extra_context); } catch {}
        }
        const schedule = {
          weekdays: parseScheduleRange(extra.schedule_weekdays || biz.schedule),
          saturday: parseScheduleRange(extra.schedule_saturday),
          sunday: parseScheduleRange(extra.schedule_sunday),
        };
        if (schedule.weekdays || schedule.saturday || schedule.sunday) {
          setBusinessSchedule(schedule);
        }
      }
    } catch {}
  }

  async function loadEvents() {
    if (!user) return;
    setLoadingEvents(true);
    try {
      const res = await fetch(`${API_URL}/google-calendar-events?userId=${user.id}&action=list`);
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch {} finally { setLoadingEvents(false); }
  }

  async function handleConnect() {
    setConnecting(true); setError('');
    try {
      const res = await fetch(`${API_URL}/google-calendar-auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
      const data = await res.json();
      if (!res.ok || !data.authUrl) throw new Error(data.error || 'Error');
      window.location.href = data.authUrl;
    } catch (err) { setError(err.message); setConnecting(false); }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Google Calendar?')) return;
    try {
      await supabase.from('google_calendar_tokens').delete().eq('user_id', user.id);
      if (activeAgent) await fetch(`${API_URL}/toggle-calendar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: activeAgent.id, enabled: false }) });
      setConnected(false); setCalendarInfo(null); setEvents([]); refreshAgents();
    } catch (err) { alert('Error: ' + err.message); }
  }

  function prevWeek() { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }
  function nextWeek() { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }
  function goToday() { setCurrentDate(new Date()); }

  function getEventsForDayAndHour(day, hour) {
    return events.filter(e => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      if (!isSameDay(start, day)) return false;
      return start.getHours() <= hour && end.getHours() > hour;
    });
  }

  function getEventStyle(event) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const startMin = start.getMinutes();
    const duration = (end - start) / (1000 * 60 * 60);
    return { top: `${(startMin / 60) * 100}%`, height: `${Math.max(duration, 0.5) * 100}%` };
  }

  if (loading) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>;
  }

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><Calendar size={24} /> Google Calendar</h1>
          <p>Conecta tu calendario para que la IA agende citas automáticamente.</p>
        </div>
        {connected && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn--outline btn--sm" onClick={loadEvents} disabled={loadingEvents}>
              {loadingEvents ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Actualizar
            </button>
            <button className="btn btn--outline btn--sm" onClick={handleDisconnect} style={{ color: '#888' }}>
              <X size={12} /> Desconectar
            </button>
          </div>
        )}
      </div>

      {connected ? (
        <>
          {/* Status */}
          <div className="billing-status billing-status--active" style={{ marginBottom: '1.5rem' }}>
            <div className="billing-status__icon"><Check size={20} /></div>
            <div style={{ flex: 1 }}>
              <h3>Calendario conectado</h3>
              <p>Sincronizado con <strong>{calendarInfo?.calendar_name || 'Google Calendar'}</strong></p>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="cal-nav">
            <button className="btn btn--outline btn--sm" onClick={goToday}>Hoy</button>
            <button className="cal-nav__arrow" onClick={prevWeek}><ChevronLeft size={18} /></button>
            <button className="cal-nav__arrow" onClick={nextWeek}><ChevronRight size={18} /></button>
            <span className="cal-nav__range">{formatWeekRange(weekDays)}</span>
          </div>

          {/* Weekly Calendar Grid */}
          <div className="cal-grid">
            {/* Header row */}
            <div className="cal-grid__header">
              <div className="cal-grid__time-header" />
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                const isWeekend = i >= 5;
                return (
                  <div key={i} className={`cal-grid__day-header ${isToday ? 'cal-grid__day-header--today' : ''} ${isWeekend ? 'cal-grid__day-header--weekend' : ''}`}>
                    <span className="cal-grid__day-name">{DAY_NAMES[i]}</span>
                    <span className={`cal-grid__day-num ${isToday ? 'cal-grid__day-num--today' : ''}`}>{day.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {/* Time rows */}
            <div className="cal-grid__body">
              <div className="cal-grid__times">
                {HOURS.map(h => (
                  <div key={h} className="cal-grid__time-label">{String(h).padStart(2, '0')}:00</div>
                ))}
              </div>
              {weekDays.map((day, di) => {
                const isWeekend = di >= 5;
                return (
                  <div key={di} className={`cal-grid__col ${isWeekend ? 'cal-grid__col--weekend' : ''}`}>
                    {HOURS.map(h => {
                      const dayEvents = getEventsForDayAndHour(day, h);
                      const isFirstHour = dayEvents.length > 0 && new Date(dayEvents[0].start).getHours() === h;
                      const isBizHour = isWithinBusinessHours(businessSchedule, di, h);
                      return (
                        <div key={h} className={`cal-grid__cell ${isBizHour ? 'cal-grid__cell--open' : businessSchedule ? 'cal-grid__cell--closed' : ''}`}>
                          {isFirstHour && dayEvents.map((ev, ei) => {
                            const start = new Date(ev.start);
                            const end = new Date(ev.end);
                            const durationHours = Math.max((end - start) / 3600000, 0.5);
                            const topOffset = (start.getMinutes() / 60) * 48;
                            return (
                              <div
                                key={ei}
                                className={`cal-event ${selectedEvent === ev ? 'cal-event--selected' : ''}`}
                                style={{ top: `${topOffset}px`, height: `${durationHours * 48 - 2}px` }}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(selectedEvent === ev ? null : ev); }}
                              >
                                <span className="cal-event__time">{start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="cal-event__title">{ev.summary || 'Ocupado'}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Detail Popup */}
          {selectedEvent && (() => {
            const start = new Date(selectedEvent.start);
            const end = new Date(selectedEvent.end);
            const duration = Math.round((end - start) / 60000);
            const durationStr = duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60 ? duration % 60 + 'min' : ''}` : `${duration}min`;
            return (
              <div className="cal-popup-overlay">
                <div className="cal-popup" ref={popupRef}>
                  <div className="cal-popup__header">
                    <h3>{selectedEvent.summary || 'Sin título'}</h3>
                    <button className="cal-popup__close" onClick={() => setSelectedEvent(null)}><X size={16} /></button>
                  </div>
                  <div className="cal-popup__body">
                    <div className="cal-popup__row">
                      <Clock size={14} />
                      <div>
                        <span className="cal-popup__label">Fecha y hora</span>
                        <span className="cal-popup__value">
                          {start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="cal-popup__value">
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          <span className="cal-popup__duration">{durationStr}</span>
                        </span>
                      </div>
                    </div>
                    {selectedEvent.location && (
                      <div className="cal-popup__row">
                        <MapPin size={14} />
                        <div>
                          <span className="cal-popup__label">Ubicación</span>
                          <span className="cal-popup__value">{selectedEvent.location}</span>
                        </div>
                      </div>
                    )}
                    {selectedEvent.description && (
                      <div className="cal-popup__row">
                        <FileText size={14} />
                        <div>
                          <span className="cal-popup__label">Descripción</span>
                          <span className="cal-popup__value cal-popup__value--desc">{selectedEvent.description}</span>
                        </div>
                      </div>
                    )}
                    {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                      <div className="cal-popup__row">
                        <User size={14} />
                        <div>
                          <span className="cal-popup__label">Asistentes</span>
                          {selectedEvent.attendees.map((a, i) => (
                            <span key={i} className="cal-popup__value">{a.email}{a.responseStatus === 'accepted' ? ' ✓' : ''}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedEvent.status && (
                      <div className="cal-popup__row">
                        <Check size={14} />
                        <div>
                          <span className="cal-popup__label">Estado</span>
                          <span className="cal-popup__value">{selectedEvent.status === 'confirmed' ? 'Confirmado' : selectedEvent.status === 'tentative' ? 'Provisional' : selectedEvent.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Business hours legend */}
          {businessSchedule && (
            <div className="cal-legend">
              <div className="cal-legend__item">
                <span className="cal-legend__dot cal-legend__dot--open" />
                <span>Horario abierto</span>
              </div>
              <div className="cal-legend__item">
                <span className="cal-legend__dot cal-legend__dot--closed" />
                <span>Fuera de horario</span>
              </div>
              {businessSchedule.weekdays && (
                <span className="cal-legend__schedule">
                  L-V: {String(businessSchedule.weekdays.open).padStart(2,'0')}:{String(businessSchedule.weekdays.openMin).padStart(2,'0')} – {String(businessSchedule.weekdays.close).padStart(2,'0')}:{String(businessSchedule.weekdays.closeMin).padStart(2,'0')}
                </span>
              )}
              {businessSchedule.saturday && (
                <span className="cal-legend__schedule">
                  Sáb: {String(businessSchedule.saturday.open).padStart(2,'0')}:{String(businessSchedule.saturday.openMin).padStart(2,'0')} – {String(businessSchedule.saturday.close).padStart(2,'0')}:{String(businessSchedule.saturday.closeMin).padStart(2,'0')}
                </span>
              )}
              {businessSchedule.sunday && (
                <span className="cal-legend__schedule">
                  Dom: {String(businessSchedule.sunday.open).padStart(2,'0')}:{String(businessSchedule.sunday.openMin).padStart(2,'0')} – {String(businessSchedule.sunday.close).padStart(2,'0')}:{String(businessSchedule.sunday.closeMin).padStart(2,'0')}
                </span>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="card" style={{ padding: '1.25rem', marginTop: '1rem', background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}>
            <p style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#25D366' }}>💡 Consejo:</strong> Configura tus horarios en <strong>Mi Negocio → Horarios</strong> para que se reflejen aquí. Haz clic en un evento para ver sus detalles.
            </p>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginTop: '1rem' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', borderRadius: '50%', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={40} style={{ color: '#25D366' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Conecta tu Google Calendar</h2>
          <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Tu agente IA podrá ver tu agenda y proponer horarios libres a tus clientes automáticamente.
          </p>
          {error && (
            <div className="billing-status billing-status--expired" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <div className="billing-status__icon"><AlertTriangle size={20} /></div>
              <div><h3>Error</h3><p>{error}</p></div>
            </div>
          )}
          <button className="btn btn--primary btn--lg" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 size={16} className="spin" /> : <LinkIcon size={16} />}
            {connecting ? 'Conectando...' : 'Conectar Google Calendar'}
          </button>
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#0a0a0a', border: '1px solid #222', borderRadius: 'var(--radius-lg)', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ccc', marginBottom: '0.75rem' }}>¿Qué podrá hacer tu IA?</h4>
            <ul style={{ fontSize: '0.82rem', color: '#777', lineHeight: 1.8, paddingLeft: '1.5rem', margin: 0 }}>
              <li>Ver huecos disponibles en tiempo real</li>
              <li>Proponer horarios basándose en tu disponibilidad</li>
              <li>Confirmar citas directamente por WhatsApp</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
