import { useState, useEffect, useRef } from 'react';
import { MessageCircle, QrCode, Check, RefreshCw, Smartphone, Wifi, Loader2, AlertCircle, Power, Edit3, Save } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
  };
}

export default function WhatsAppConnect() {
  const { activeAgent, refreshAgents, createAgent } = useAgents();
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [agentName, setAgentName] = useState('');
  const pollRef = useRef(null);

  // Read connection state from activeAgent (persisted in Supabase)
  const isConnected = activeAgent?.whatsapp_connected === true;

  useEffect(() => {
    if (activeAgent) setAgentName(activeAgent.name || '');
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeAgent?.id]);

  async function handleConnect() {
    setConnecting(true);
    setError('');
    setQrCode(null);

    try {
      let agent = activeAgent;
      if (!agent) {
        agent = await createAgent('Mi Agente IA');
        if (!agent) throw new Error('No se pudo crear el agente');
      }

      const res = await fetch(`${API_URL}/evolution-create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ agentId: agent.id, userId: user?.id }),
      });
      const data = await res.json();
      console.log('[WhatsApp] Edge Function response:', data);
      
      if (!res.ok) throw new Error(data.error || 'Error');

      // Parse QR from response
      const qr = data.qrcode?.base64 || data.base64 || null;
      console.log('[WhatsApp] QR found:', !!qr);
      
      if (qr) {
        setQrCode(qr);
        setConnecting(false);
        startPolling(agent.id);
      } else {
        // No QR - probably already connected
        console.log('[WhatsApp] No QR, checking if already connected...');
        await refreshAgents();
        setConnecting(false);
      }
    } catch (err) {
      console.error('[WhatsApp] Connect error:', err);
      setError(err.message);
      setConnecting(false);
    }
  }

  async function refreshQR() {
    if (!activeAgent) return;
    try {
      const res = await fetch(`${API_URL}/evolution-create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ agentId: activeAgent.id }),
      });
      const data = await res.json();
      const qr = data.base64 || data.qrcode?.base64;
      if (qr) setQrCode(qr);
    } catch {}
  }

  function startPolling(agentId) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/evolution-status/${agentId}`, { headers: getHeaders() });
        const data = await res.json();
        if (data.connected) {
          setQrCode(null);
          clearInterval(pollRef.current);
          refreshAgents(); // This updates activeAgent.whatsapp_connected
        }
      } catch {}
    }, 5000);
  }

  async function handleDisconnect() {
    if (!activeAgent) return;
    try {
      await fetch(`${API_URL}/evolution-disconnect/${activeAgent.id}`, { method: 'POST' });
    } catch {}
    // Always update Supabase directly as fallback
    await supabase.from('agents').update({
      whatsapp_connected: false,
      is_active: false,
      whatsapp_number: null,
    }).eq('id', activeAgent.id);
    setQrCode(null);
    refreshAgents();
  }

  async function handleSaveName() {
    if (!activeAgent || !agentName.trim()) return;
    await supabase.from('agents').update({ name: agentName.trim() }).eq('id', activeAgent.id);
    setEditingName(false);
    refreshAgents();
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1>Conectar WhatsApp</h1>
        <p>Vincula tu número de WhatsApp Business{activeAgent ? <> con <strong>{activeAgent.name}</strong></> : ''}.</p>
      </div>

      {/* ── Connected State (persisted) ── */}
      {isConnected && !qrCode && (
        <div className="wa-connected">
          {/* Status banner */}
          <div className="wa-connected__status">
            <div className="wa-connected__status-dot" />
            <span>WhatsApp conectado y funcionando</span>
          </div>

          {/* Agent card grid */}
          <div className="wa-connected__grid">
            <div className="wa-connected__card">
              <div className="wa-connected__card-icon"><MessageCircle size={20} /></div>
              <div className="wa-connected__card-info">
                {editingName ? (
                  <div className="wa-agent-edit">
                    <input
                      type="text"
                      value={agentName}
                      onChange={e => setAgentName(e.target.value)}
                      placeholder="Nombre del agente"
                      onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                    />
                    <button className="btn btn--primary btn--sm" onClick={handleSaveName}><Save size={12} /></button>
                    <button className="btn btn--outline btn--sm" onClick={() => { setEditingName(false); setAgentName(activeAgent?.name || ''); }}>Cancelar</button>
                  </div>
                ) : (
                  <>
                    <span className="wa-connected__label">Nombre del agente</span>
                    <span className="wa-connected__value">{activeAgent?.name || 'Mi Agente IA'}</span>
                    <button className="wa-connected__edit" onClick={() => setEditingName(true)}><Edit3 size={11} /> Editar</button>
                  </>
                )}
              </div>
            </div>

            <div className="wa-connected__card">
              <div className="wa-connected__card-icon"><Smartphone size={20} /></div>
              <div className="wa-connected__card-info">
                <span className="wa-connected__label">Número vinculado</span>
                <span className="wa-connected__value">
                  {activeAgent?.whatsapp_number 
                    ? activeAgent.whatsapp_number.replace('@s.whatsapp.net', '').replace(/^34/, '+34 ')
                    : 'Detectando número...'}
                </span>
              </div>
            </div>

            <div className="wa-connected__card">
              <div className="wa-connected__card-icon"><Check size={20} /></div>
              <div className="wa-connected__card-info">
                <span className="wa-connected__label">Estado</span>
                <span className="wa-connected__value wa-connected__value--green">Activo — Respondiendo 24/7</span>
              </div>
            </div>
          </div>

          {/* Disconnect */}
          <div className="wa-connected__footer">
            <button className="btn btn--outline btn--sm" onClick={handleDisconnect}>
              <Power size={14} /> Desconectar WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* ── Not connected / QR flow ── */}
      {!isConnected && !qrCode && !connecting && (
        <div className="card">
          <div className="qr-section">
            <div className="qr-section__steps">
              <h3>Cómo conectar</h3>
              <ol>
                <li><Smartphone size={14} /> Asegúrate de tener <strong>WhatsApp Business</strong></li>
                <li><QrCode size={14} /> Pulsa el botón para generar el QR</li>
                <li><Wifi size={14} /> Escanea desde WhatsApp → Dispositivos vinculados</li>
              </ol>
              <button className="btn btn--primary" onClick={handleConnect} style={{ marginTop: '1rem' }}>
                <MessageCircle size={16} /> Conectar WhatsApp
              </button>
              {error && <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.75rem' }}>{error}</p>}
            </div>
            <div className="qr-section__qr">
              <div className="qr-placeholder">
                <QrCode size={48} />
                <p>Código QR</p>
                <span>Pulsa "Conectar WhatsApp" para generar</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading QR ── */}
      {connecting && !qrCode && (
        <div className="card">
          <div className="connected-state">
            <Loader2 size={40} className="spin" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
            <h3>Generando código QR...</h3>
            <p>Esto puede tardar unos segundos</p>
          </div>
        </div>
      )}

      {/* ── QR Code shown ── */}
      {qrCode && (
        <div className="card">
          <div className="qr-section">
            <div className="qr-section__steps">
              <h3>Escanea este código QR</h3>
              <ol>
                <li><Smartphone size={14} /> Abre <strong>WhatsApp Business</strong></li>
                <li><QrCode size={14} /> Ve a <strong>Ajustes → Dispositivos vinculados</strong></li>
                <li><Wifi size={14} /> Pulsa <strong>"Vincular un dispositivo"</strong></li>
                <li><Check size={14} /> Escanea el QR con la cámara</li>
              </ol>
              <div className="qr-section__polling">
                <Loader2 size={14} className="spin" />
                <span>Esperando a que escanees el código...</span>
              </div>
            </div>
            <div className="qr-section__qr">
              <img src={qrCode} alt="QR Code WhatsApp" className="qr-image" />
              <button className="btn btn--outline btn--sm" onClick={refreshQR} style={{ marginTop: '0.75rem' }}>
                <RefreshCw size={14} /> Actualizar QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="multi-agent-info">
          <div className="multi-agent-info__item">
            <div className="multi-agent-info__number"><Smartphone size={14} /></div>
            <div>
              <strong>¿Tu teléfono debe estar encendido?</strong>
              <p>Sí, tu teléfono con WhatsApp Business debe estar encendido y con internet.</p>
            </div>
          </div>
          <div className="multi-agent-info__item">
            <div className="multi-agent-info__number"><MessageCircle size={14} /></div>
            <div>
              <strong>¿Puedo seguir usando WhatsApp?</strong>
              <p>Sí. Si tú respondes manualmente, el agente no interferirá en esa conversación.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
