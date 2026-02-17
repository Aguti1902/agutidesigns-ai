import { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, AlertTriangle, Link as LinkIcon, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://xzyhrloiwapbrqmglxeo.supabase.co/functions/v1';

export default function CalendarIntegration() {
  const { user } = useAuth();
  const { activeAgent, refreshAgents } = useAgents();
  const [connected, setConnected] = useState(false);
  const [calendarInfo, setCalendarInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCalendarStatus();
  }, [user]);

  async function loadCalendarStatus() {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('google_calendar_tokens')
        .select('calendar_id, calendar_name, connected_at')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setConnected(true);
        setCalendarInfo(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/google-calendar-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      
      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || 'Error al iniciar conexión');
      }

      // Open Google OAuth in popup
      window.location.href = data.authUrl;
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar Google Calendar? La IA ya no podrá gestionar citas.')) return;
    try {
      await supabase.from('google_calendar_tokens').delete().eq('user_id', user.id);
      setConnected(false);
      setCalendarInfo(null);
    } catch (err) {
      alert('Error al desconectar: ' + err.message);
    }
  }

  async function handleToggleCalendar(enabled) {
    if (!activeAgent) return;
    await supabase.from('agents').update({ calendar_enabled: enabled }).eq('id', activeAgent.id);
    refreshAgents();
  }

  if (loading) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1><Calendar size={24} /> Google Calendar</h1>
        <p>Conecta tu calendario para que la IA pueda agendar citas automáticamente.</p>
      </div>

      {connected ? (
        <>
          <div className="billing-status billing-status--active">
            <div className="billing-status__icon"><Check size={20} /></div>
            <div style={{ flex: 1 }}>
              <h3>Calendario conectado</h3>
              <p>Tu IA puede consultar y crear eventos en <strong>{calendarInfo?.calendar_name || 'tu calendario'}</strong></p>
            </div>
            <button className="btn btn--outline btn--sm" onClick={handleDisconnect}>
              <X size={12} /> Desconectar
            </button>
          </div>

          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 className="bd-section-title"><Calendar size={16} /> Configuración del agente</h3>
            <label className="wa-toggle" style={{ marginBottom: '1rem' }}>
              <input 
                type="checkbox" 
                checked={activeAgent?.calendar_enabled || false} 
                onChange={e => handleToggleCalendar(e.target.checked)} 
              />
              <span className="wa-toggle__slider" />
              <span>Activar gestión de citas para este agente</span>
            </label>
            <p style={{ fontSize: '0.8rem', color: '#777', lineHeight: 1.6 }}>
              Cuando esté activado, tu agente podrá:
            </p>
            <ul style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: 1.8, paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Consultar huecos disponibles en tu calendario</li>
              <li>Crear citas nuevas cuando un cliente lo solicite</li>
              <li>Confirmar la fecha y hora con el cliente</li>
              <li>Añadir el teléfono del cliente en la descripción del evento</li>
            </ul>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: 'rgba(37,211,102,0.05)', border: '1px solid rgba(37,211,102,0.15)' }}>
            <p style={{ fontSize: '0.82rem', color: '#aaa', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#25D366' }}>💡 Consejo:</strong> En tu prompt de IA, añade instrucciones específicas sobre:
              horarios de trabajo, duración de citas, políticas de cancelación, etc.
            </p>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', borderRadius: '50%', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={40} style={{ color: '#25D366' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Conecta tu Google Calendar</h2>
          <p style={{ fontSize: '0.9rem', color: '#777', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Permite que tu agente de WhatsApp IA acceda a tu calendario para gestionar citas de forma automática.
          </p>
          
          {error && (
            <div className="billing-status billing-status--expired" style={{ marginBottom: '1.5rem' }}>
              <div className="billing-status__icon"><AlertTriangle size={20} /></div>
              <div><h3>Error</h3><p>{error}</p></div>
            </div>
          )}

          <button className="btn btn--primary btn--lg" onClick={handleConnect} disabled={connecting}>
            {connecting ? <Loader2 size={16} className="spin" /> : <LinkIcon size={16} />}
            {connecting ? 'Conectando...' : 'Conectar Google Calendar'}
          </button>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#0a0a0a', border: '1px solid #222', borderRadius: 'var(--radius-lg)' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ccc', marginBottom: '0.75rem' }}>¿Qué podrá hacer tu IA?</h4>
            <ul style={{ fontSize: '0.82rem', color: '#777', lineHeight: 1.8, paddingLeft: '1.5rem', textAlign: 'left', margin: 0 }}>
              <li>Ver huecos disponibles en tiempo real</li>
              <li>Agendar citas cuando un cliente lo solicite</li>
              <li>Proponer horarios basándose en tu disponibilidad</li>
              <li>Guardar datos del cliente en el evento (nombre, teléfono)</li>
            </ul>
          </div>

          <p style={{ fontSize: '0.72rem', color: '#555', marginTop: '1.5rem' }}>
            Solo necesitas conectar una vez. Podrás desconectar cuando quieras desde esta misma página.
          </p>
        </div>
      )}
    </div>
  );
}
