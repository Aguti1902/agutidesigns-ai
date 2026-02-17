import { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, AlertTriangle, Link as LinkIcon, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';
import './WhatsAppConnect.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1';
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8:00 to 18:00
const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

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

  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  useEffect(() => { loadCalendarStatus(); }, [user]);

  async function loadCalendarStatus() {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase.from('google_calendar_tokens').select('calendar_id, calendar_name, connected_at').eq('user_id', user.id).single();
      if (data) { setConnected(true); setCalendarInfo(data); loadEvents(); }
    } catch {} finally { setLoading(false); }
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
                      return (
                        <div key={h} className="cal-grid__cell">
                          {isFirstHour && dayEvents.map((ev, ei) => {
                            const start = new Date(ev.start);
                            const end = new Date(ev.end);
                            const durationHours = Math.max((end - start) / 3600000, 0.5);
                            const topOffset = (start.getMinutes() / 60) * 48;
                            return (
                              <div key={ei} className="cal-event" style={{ top: `${topOffset}px`, height: `${durationHours * 48 - 2}px` }} title={`${ev.summary}\n${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}>
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

          {/* Tips */}
          <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem', background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}>
            <p style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#25D366' }}>💡 Consejo:</strong> En tu prompt de IA, añade horarios de trabajo, duración de citas y políticas de cancelación para que la IA sea más precisa al proponer huecos.
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
