import { useState, useEffect, useRef } from 'react';
import { Calendar, Check, Loader2, X, RefreshCw, ChevronLeft, ChevronRight, Clock, MapPin, FileText, User, Plus, Phone, Trash2, Edit3, Lock, Bot, Power } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00
const DAY_NAMES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const STATUS_LABELS = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', completed: 'Completada' };
const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#25D366', cancelled: '#ef4444', completed: '#888' };

function parseScheduleRange(str) {
  if (!str || typeof str !== 'string') return null;
  const cleaned = str.trim().toLowerCase();
  if (cleaned === 'cerrado' || cleaned === 'closed' || cleaned === '-' || cleaned === '') return null;
  const match = cleaned.match(/(\d{1,2})[:\.]?(\d{2})?\s*[-–a]\s*(\d{1,2})[:\.]?(\d{2})?/);
  if (!match) return null;
  return { open: parseInt(match[1]), openMin: parseInt(match[2] || '0'), close: parseInt(match[3]), closeMin: parseInt(match[4] || '0') };
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

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarIntegration() {
  const { user } = useAuth();
  const { activeAgent, refreshAgents } = useAgents();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [businessSchedule, setBusinessSchedule] = useState(null);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bookingEnabled, setBookingEnabled] = useState(false);
  const [togglingBooking, setTogglingBooking] = useState(false);
  const popupRef = useRef(null);
  const formRef = useRef(null);

  const [formData, setFormData] = useState({ client_name: '', client_phone: '', service: '', appointment_date: '', start_time: '10:00', end_time: '11:00', notes: '' });

  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  useEffect(() => { if (user) { loadAppointments(); loadBusinessSchedule(); } }, [user]);
  useEffect(() => { if (user) loadAppointments(); }, [currentDate]);
  useEffect(() => { if (activeAgent) setBookingEnabled(!!activeAgent.booking_enabled); }, [activeAgent]);

  async function toggleBooking() {
    if (!activeAgent) return;
    setTogglingBooking(true);
    const newVal = !bookingEnabled;
    try {
      await supabase.from('agents').update({ booking_enabled: newVal, updated_at: new Date().toISOString() }).eq('id', activeAgent.id);
      setBookingEnabled(newVal);
      refreshAgents();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setTogglingBooking(false); }
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (selectedAppt && popupRef.current && !popupRef.current.contains(e.target)) setSelectedAppt(null);
      if (showForm && formRef.current && !formRef.current.contains(e.target)) { setShowForm(false); setEditingAppt(null); }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedAppt, showForm]);

  async function loadAppointments() {
    if (!user) return;
    setLoading(true);
    try {
      const startDate = toDateStr(weekDays[0]);
      const endDate = toDateStr(weekDays[6]);
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });
      setAppointments(data || []);
    } catch {} finally { setLoading(false); }
  }

  async function loadBusinessSchedule() {
    if (!user) return;
    try {
      const { data: biz } = await supabase.from('businesses').select('extra_context, schedule').eq('user_id', user.id).single();
      if (biz) {
        let extra = {};
        if (biz.extra_context) { try { extra = JSON.parse(biz.extra_context); } catch {} }
        const schedule = {
          weekdays: parseScheduleRange(extra.schedule_weekdays || biz.schedule),
          saturday: parseScheduleRange(extra.schedule_saturday),
          sunday: parseScheduleRange(extra.schedule_sunday),
        };
        if (schedule.weekdays || schedule.saturday || schedule.sunday) setBusinessSchedule(schedule);
      }
    } catch {}
  }

  function prevWeek() { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }
  function nextWeek() { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }
  function goToday() { setCurrentDate(new Date()); }

  function getApptsForDayAndHour(day, hour) {
    const dayStr = toDateStr(day);
    return appointments.filter(a => {
      if (a.appointment_date !== dayStr) return false;
      const startH = parseInt(a.start_time.split(':')[0]);
      const endH = parseInt(a.end_time.split(':')[0]);
      const endM = parseInt(a.end_time.split(':')[1] || '0');
      const effectiveEnd = endM > 0 ? endH + 1 : endH;
      return startH <= hour && effectiveEnd > hour;
    });
  }

  function isFirstHourOfAppt(appt, hour) {
    return parseInt(appt.start_time.split(':')[0]) === hour;
  }

  function openNewForm(day, hour) {
    const dateStr = toDateStr(day);
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
    setFormData({ client_name: '', client_phone: '', service: '', appointment_date: dateStr, start_time: startTime, end_time: endTime, notes: '' });
    setEditingAppt(null);
    setShowForm(true);
    setSelectedAppt(null);
  }

  function openEditForm(appt) {
    setFormData({
      client_name: appt.client_name || '',
      client_phone: appt.client_phone || '',
      service: appt.service || '',
      appointment_date: appt.appointment_date,
      start_time: appt.start_time?.substring(0, 5) || '10:00',
      end_time: appt.end_time?.substring(0, 5) || '11:00',
      notes: appt.notes || '',
    });
    setEditingAppt(appt);
    setShowForm(true);
    setSelectedAppt(null);
  }

  async function handleSaveAppt(e) {
    e.preventDefault();
    if (!formData.client_name.trim() || !formData.appointment_date) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        agent_id: activeAgent?.id || null,
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone.trim() || null,
        service: formData.service.trim() || null,
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes.trim() || null,
        status: 'confirmed',
        created_by: 'manual',
        updated_at: new Date().toISOString(),
      };
      if (editingAppt) {
        await supabase.from('appointments').update(payload).eq('id', editingAppt.id);
      } else {
        await supabase.from('appointments').insert(payload);
      }
      setShowForm(false);
      setEditingAppt(null);
      loadAppointments();
    } catch (err) { alert('Error: ' + err.message); } finally { setSaving(false); }
  }

  async function handleCancelAppt(appt) {
    if (!confirm(`¿Cancelar la cita de ${appt.client_name}?`)) return;
    await supabase.from('appointments').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', appt.id);
    setSelectedAppt(null);
    loadAppointments();
  }

  async function handleDeleteAppt(appt) {
    if (!confirm(`¿Eliminar definitivamente la cita de ${appt.client_name}?`)) return;
    await supabase.from('appointments').delete().eq('id', appt.id);
    setSelectedAppt(null);
    loadAppointments();
  }

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><Calendar size={24} /> Citas y Reservas</h1>
          <p>Tu agenda de citas. La IA puede agendar citas automáticamente desde WhatsApp.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn--primary btn--sm" onClick={() => { setFormData({ client_name: '', client_phone: '', service: '', appointment_date: toDateStr(today), start_time: '10:00', end_time: '11:00', notes: '' }); setEditingAppt(null); setShowForm(true); }}>
            <Plus size={12} /> Nueva cita
          </button>
          <button className="btn btn--outline btn--sm" onClick={loadAppointments} disabled={loading}>
            {loading ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Actualizar
          </button>
        </div>
      </div>

      {/* AI Booking Toggle - Prominent */}
      <div className={`cal-booking-toggle ${bookingEnabled ? 'cal-booking-toggle--on' : ''}`}>
        <div className="cal-booking-toggle__info">
          <div className="cal-booking-toggle__icon">
            <Bot size={22} />
          </div>
          <div>
            <h3>Agendamiento automático por IA</h3>
            <p>{bookingEnabled
              ? 'La IA puede agendar citas desde WhatsApp consultando tu disponibilidad.'
              : 'Activa para que la IA agende citas automáticamente cuando un cliente lo solicite.'
            }</p>
          </div>
        </div>
        <button
          className={`cal-booking-toggle__switch ${bookingEnabled ? 'cal-booking-toggle__switch--on' : ''}`}
          onClick={toggleBooking}
          disabled={togglingBooking || !activeAgent}
        >
          {togglingBooking ? <Loader2 size={14} className="spin" /> : <Power size={14} />}
          {bookingEnabled ? 'Activado' : 'Desactivado'}
        </button>
      </div>

      {/* Google Calendar - Próximamente */}
      <div className="cal-gcal-badge">
        <Lock size={14} />
        <span>Google Calendar — <strong>Próximamente</strong></span>
        <span className="cal-gcal-badge__desc">Sincronización con Google Calendar estará disponible pronto</span>
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
                  const dayAppts = getApptsForDayAndHour(day, h);
                  const isBizHour = isWithinBusinessHours(businessSchedule, di, h);
                  return (
                    <div
                      key={h}
                      className={`cal-grid__cell ${isBizHour ? 'cal-grid__cell--open' : businessSchedule ? 'cal-grid__cell--closed' : ''}`}
                      onDoubleClick={() => openNewForm(day, h)}
                    >
                      {dayAppts.filter(a => isFirstHourOfAppt(a, h)).map((appt, ei) => {
                        const startH = parseInt(appt.start_time.split(':')[0]);
                        const startM = parseInt(appt.start_time.split(':')[1] || '0');
                        const endH = parseInt(appt.end_time.split(':')[0]);
                        const endM = parseInt(appt.end_time.split(':')[1] || '0');
                        const durationHours = Math.max((endH + endM / 60) - (startH + startM / 60), 0.5);
                        const topOffset = (startM / 60) * 48;
                        const isAi = appt.created_by === 'ai';
                        return (
                          <div
                            key={ei}
                            className={`cal-event ${isAi ? 'cal-event--ai' : ''} ${selectedAppt?.id === appt.id ? 'cal-event--selected' : ''}`}
                            style={{ top: `${topOffset}px`, height: `${durationHours * 48 - 2}px` }}
                            onClick={(e) => { e.stopPropagation(); setSelectedAppt(selectedAppt?.id === appt.id ? null : appt); }}
                          >
                            <span className="cal-event__time">
                              {appt.start_time?.substring(0, 5)} - {appt.end_time?.substring(0, 5)}
                            </span>
                            <span className="cal-event__title">{appt.client_name}{appt.service ? ` · ${appt.service}` : ''}</span>
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

      {/* Appointment Detail Popup */}
      {selectedAppt && (() => {
        const startH = selectedAppt.start_time?.substring(0, 5);
        const endH = selectedAppt.end_time?.substring(0, 5);
        const dateObj = new Date(selectedAppt.appointment_date + 'T12:00:00');
        const isAi = selectedAppt.created_by === 'ai';
        return (
          <div className="cal-popup-overlay">
            <div className="cal-popup" ref={popupRef}>
              <div className="cal-popup__header">
                <div>
                  <h3>{selectedAppt.client_name}</h3>
                  {isAi && <span className="cal-popup__ai-badge">Agendada por IA</span>}
                </div>
                <button className="cal-popup__close" onClick={() => setSelectedAppt(null)}><X size={16} /></button>
              </div>
              <div className="cal-popup__body">
                <div className="cal-popup__row">
                  <Clock size={14} />
                  <div>
                    <span className="cal-popup__label">Fecha y hora</span>
                    <span className="cal-popup__value">{dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="cal-popup__value">{startH} – {endH}</span>
                  </div>
                </div>
                {selectedAppt.client_phone && (
                  <div className="cal-popup__row">
                    <Phone size={14} />
                    <div>
                      <span className="cal-popup__label">Teléfono</span>
                      <span className="cal-popup__value">{selectedAppt.client_phone}</span>
                    </div>
                  </div>
                )}
                {selectedAppt.service && (
                  <div className="cal-popup__row">
                    <FileText size={14} />
                    <div>
                      <span className="cal-popup__label">Servicio</span>
                      <span className="cal-popup__value">{selectedAppt.service}</span>
                    </div>
                  </div>
                )}
                {selectedAppt.notes && (
                  <div className="cal-popup__row">
                    <FileText size={14} />
                    <div>
                      <span className="cal-popup__label">Notas</span>
                      <span className="cal-popup__value cal-popup__value--desc">{selectedAppt.notes}</span>
                    </div>
                  </div>
                )}
                <div className="cal-popup__row">
                  <Check size={14} />
                  <div>
                    <span className="cal-popup__label">Estado</span>
                    <span className="cal-popup__value" style={{ color: STATUS_COLORS[selectedAppt.status] }}>{STATUS_LABELS[selectedAppt.status] || selectedAppt.status}</span>
                  </div>
                </div>
              </div>
              <div className="cal-popup__actions">
                <button className="btn btn--outline btn--sm" onClick={() => openEditForm(selectedAppt)}><Edit3 size={12} /> Editar</button>
                <button className="btn btn--outline btn--sm" style={{ color: '#ef4444', borderColor: '#ef444433' }} onClick={() => handleCancelAppt(selectedAppt)}><X size={12} /> Cancelar</button>
                <button className="btn btn--outline btn--sm" style={{ color: '#666', borderColor: '#33333366' }} onClick={() => handleDeleteAppt(selectedAppt)}><Trash2 size={12} /> Eliminar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New / Edit Appointment Form */}
      {showForm && (
        <div className="cal-popup-overlay">
          <div className="cal-popup" ref={formRef} style={{ width: '480px' }}>
            <div className="cal-popup__header">
              <h3>{editingAppt ? 'Editar cita' : 'Nueva cita'}</h3>
              <button className="cal-popup__close" onClick={() => { setShowForm(false); setEditingAppt(null); }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveAppt} className="cal-popup__body" style={{ gap: '0.75rem' }}>
              <div className="form-field">
                <label>Nombre del cliente *</label>
                <input type="text" placeholder="Ej: María García" value={formData.client_name} onChange={e => setFormData(p => ({ ...p, client_name: e.target.value }))} required />
              </div>
              <div className="form-grid" style={{ marginBottom: 0 }}>
                <div className="form-field">
                  <label>Teléfono</label>
                  <input type="text" placeholder="+34 600 000 000" value={formData.client_phone} onChange={e => setFormData(p => ({ ...p, client_phone: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label>Servicio</label>
                  <input type="text" placeholder="Ej: Corte de pelo" value={formData.service} onChange={e => setFormData(p => ({ ...p, service: e.target.value }))} />
                </div>
              </div>
              <div className="form-field">
                <label>Fecha *</label>
                <input type="date" value={formData.appointment_date} onChange={e => setFormData(p => ({ ...p, appointment_date: e.target.value }))} required />
              </div>
              <div className="form-grid" style={{ marginBottom: 0 }}>
                <div className="form-field">
                  <label>Hora inicio *</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData(p => ({ ...p, start_time: e.target.value }))} required />
                </div>
                <div className="form-field">
                  <label>Hora fin *</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData(p => ({ ...p, end_time: e.target.value }))} required />
                </div>
              </div>
              <div className="form-field">
                <label>Notas</label>
                <textarea placeholder="Notas adicionales..." value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
              <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn--outline" onClick={() => { setShowForm(false); setEditingAppt(null); }}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                  {editingAppt ? 'Guardar cambios' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <span className="cal-legend__schedule">L-V: {String(businessSchedule.weekdays.open).padStart(2,'0')}:{String(businessSchedule.weekdays.openMin).padStart(2,'0')} – {String(businessSchedule.weekdays.close).padStart(2,'0')}:{String(businessSchedule.weekdays.closeMin).padStart(2,'0')}</span>
          )}
          {businessSchedule.saturday && (
            <span className="cal-legend__schedule">Sáb: {String(businessSchedule.saturday.open).padStart(2,'0')}:{String(businessSchedule.saturday.openMin).padStart(2,'0')} – {String(businessSchedule.saturday.close).padStart(2,'0')}:{String(businessSchedule.saturday.closeMin).padStart(2,'0')}</span>
          )}
          {businessSchedule.sunday && (
            <span className="cal-legend__schedule">Dom: {String(businessSchedule.sunday.open).padStart(2,'0')}:{String(businessSchedule.sunday.openMin).padStart(2,'0')} – {String(businessSchedule.sunday.close).padStart(2,'0')}:{String(businessSchedule.sunday.closeMin).padStart(2,'0')}</span>
          )}
        </div>
      )}

      {/* Tip */}
      <div className="card" style={{ padding: '1.25rem', marginTop: '1rem', background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}>
        <p style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: '#25D366' }}>Tip:</strong> Haz doble clic en una celda del calendario para crear una cita rápida. Las citas creadas por la IA aparecen con un indicador especial.
        </p>
      </div>
    </div>
  );
}
