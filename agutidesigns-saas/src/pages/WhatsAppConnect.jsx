import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, QrCode, Check, RefreshCw, Smartphone, Wifi,
  Loader2, Power, Edit3, Save, ChevronDown, ChevronUp,
  Users, BarChart3, Zap, Phone, ArrowUpRight
} from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import ChatList from '../components/inbox/ChatList';
import ChatDetail from '../components/inbox/ChatDetail';
import TagsManager from '../components/inbox/TagsManager';
import './WhatsAppConnect.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function getHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` };
}

export default function WhatsAppConnect() {
  const { activeAgent, refreshAgents, createAgent } = useAgents();
  const { user } = useAuth();

  // Connection state
  const [qrCode, setQrCode] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [connectionOpen, setConnectionOpen] = useState(false);
  const pollRef = useRef(null);

  // Human handoff
  const [handoffEnabled, setHandoffEnabled] = useState(false);
  const [handoffNumber, setHandoffNumber] = useState('');

  // Inbox state
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [tagsConvo, setTagsConvo] = useState(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, aiMessages: 0, totalMessages: 0 });

  const isConnected = activeAgent?.whatsapp_connected === true;

  // Load agent data
  useEffect(() => {
    if (activeAgent) {
      setAgentName(activeAgent.name || '');
      setHandoffEnabled(activeAgent.human_handoff_enabled || false);
      setHandoffNumber(activeAgent.human_handoff_number || '');
      if (!isConnected) setConnectionOpen(true);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeAgent?.id]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!activeAgent) return;
    setLoadingConvos(true);
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('agent_id', activeAgent.id)
      .order('last_message_at', { ascending: false });
    const convos = data || [];
    setConversations(convos);

    const active = convos.filter(c => c.status === 'active').length;
    const aiMsgs = convos.reduce((sum, c) => sum + (c.messages_count || 0), 0);
    setStats({
      total: convos.length,
      active,
      aiMessages: activeAgent.total_messages || 0,
      totalMessages: aiMsgs,
    });
    setLoadingConvos(false);
  }, [activeAgent?.id]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvo) { setMessages([]); return; }
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConvo.id)
        .order('created_at', { ascending: true });
      setMessages(data || []);
    }
    load();
  }, [selectedConvo?.id]);

  // Realtime subscriptions
  useEffect(() => {
    if (!activeAgent) return;
    const channel = supabase
      .channel(`inbox-${activeAgent.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (selectedConvo && msg.conversation_id === selectedConvo.id) {
          setMessages(prev => [...prev, msg]);
        }
        loadConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `agent_id=eq.${activeAgent.id}` }, () => {
        loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeAgent?.id, selectedConvo?.id, loadConversations]);

  // Connection handlers
  async function handleConnect() {
    setConnecting(true); setError(''); setQrCode(null);
    try {
      let agent = activeAgent;
      if (!agent) {
        agent = await createAgent('Mi Agente IA');
        if (!agent) throw new Error('No se pudo crear el agente');
      }
      const res = await fetch(`${API_URL}/evolution-create`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ agentId: agent.id, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      const qr = data.qrcode?.base64 || data.base64 || null;
      if (qr) { setQrCode(qr); setConnecting(false); startPolling(agent.id); }
      else { await refreshAgents(); setConnecting(false); }
    } catch (err) { setError(err.message); setConnecting(false); }
  }

  async function refreshQR() {
    if (!activeAgent) return;
    try {
      const res = await fetch(`${API_URL}/evolution-create`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ agentId: activeAgent.id }),
      });
      const data = await res.json();
      const qr = data.base64 || data.qrcode?.base64;
      if (qr) setQrCode(qr);
    } catch {}
  }

  function startPolling(agentId) {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_URL}/evolution-status/${agentId}`, { headers: getHeaders() });
        const data = await res.json();
        if (data.connected) {
          setQrCode(null); clearInterval(pollRef.current);
          refreshAgents();
        }
        // Check if agent was deactivated (phone already used for trial)
        const { data: agentData } = await supabase.from('agents').select('is_active, whatsapp_connected').eq('id', agentId).single();
        if (agentData && !agentData.is_active && !agentData.whatsapp_connected) {
          setQrCode(null);
          clearInterval(pollRef.current);
          setError('Este número de WhatsApp ya se ha utilizado para una prueba gratuita. Si necesitas ayuda, contacta con soporte.');
          setConnecting(false);
        }
      } catch {}
      // Stop polling after 2 minutes
      if (attempts > 24) clearInterval(pollRef.current);
    }, 5000);
  }

  async function handleDisconnect() {
    if (!activeAgent) return;
    try { await fetch(`${API_URL}/evolution-disconnect/${activeAgent.id}`, { method: 'POST' }); } catch {}
    await supabase.from('agents').update({ whatsapp_connected: false, is_active: false, whatsapp_number: null }).eq('id', activeAgent.id);
    setQrCode(null); refreshAgents();
  }

  async function handleSaveName() {
    if (!activeAgent || !agentName.trim()) return;
    await supabase.from('agents').update({ name: agentName.trim() }).eq('id', activeAgent.id);
    setEditingName(false); refreshAgents();
  }

  async function handleHandoffSave() {
    if (!activeAgent) return;
    await supabase.from('agents').update({
      human_handoff_enabled: handoffEnabled,
      human_handoff_number: handoffNumber.trim(),
    }).eq('id', activeAgent.id);
    refreshAgents();
  }

  async function handleStatusChange(convoId, newStatus) {
    await supabase.from('conversations').update({ status: newStatus }).eq('id', convoId);
    if (selectedConvo?.id === convoId) setSelectedConvo(prev => ({ ...prev, status: newStatus }));
    loadConversations();
  }

  async function handleTagsSave(convoId, newTags) {
    await supabase.from('conversations').update({ tags: newTags }).eq('id', convoId);
    if (selectedConvo?.id === convoId) setSelectedConvo(prev => ({ ...prev, tags: newTags }));
    setTagsConvo(null);
    loadConversations();
  }

  // Filter conversations
  const filtered = conversations.filter(c => {
    if (filter === 'active' && c.status !== 'active') return false;
    if (filter === 'resolved' && c.status !== 'resolved') return false;
    if (filter === 'referred' && c.status !== 'referred') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(c.contact_name || '').toLowerCase().includes(q) && !(c.contact_phone || '').includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="wa-page">
      {/* Header */}
      <div className="wa-page__header">
        <div className="wa-page__title">
          <h1><MessageCircle size={22} /> WhatsApp</h1>
          <p>Conecta WhatsApp para responder automáticamente y gestionar reservas.</p>
        </div>
      </div>

      {/* Connection Section (collapsible) */}
      <div className={`wa-connection ${connectionOpen ? 'wa-connection--open' : ''}`}>
        <button className="wa-connection__toggle" onClick={() => setConnectionOpen(!connectionOpen)}>
          <div className="wa-connection__toggle-left">
            {isConnected ? (
              <><div className="wa-dot wa-dot--green" /> <span>Conectado · {activeAgent?.whatsapp_number?.replace('@s.whatsapp.net', '').replace(/^34/, '+34 ') || 'Sin número'}</span></>
            ) : (
              <><div className="wa-dot wa-dot--gray" /> <span>No conectado</span></>
            )}
          </div>
          {connectionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {connectionOpen && (
          <div className="wa-connection__body">
            <div className="wa-connection__grid">
              {/* Connection card */}
              <div className="wa-connection__card">
                {isConnected && !qrCode ? (
                  <div className="wa-connected-mini">
                    <div className="wa-connected-mini__status"><Check size={16} /> CONECTADO</div>
                    <p className="wa-connected-mini__number">{activeAgent?.whatsapp_number?.replace('@s.whatsapp.net', '').replace(/^34/, '+34 ') || 'Detectando...'}</p>
                    {editingName ? (
                      <div className="wa-name-edit">
                        <input value={agentName} onChange={e => setAgentName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveName()} autoFocus />
                        <button className="btn btn--primary btn--xs" onClick={handleSaveName}><Save size={12} /></button>
                      </div>
                    ) : (
                      <p className="wa-connected-mini__agent">{activeAgent?.name} <button onClick={() => setEditingName(true)}><Edit3 size={11} /></button></p>
                    )}
                    <button className="btn btn--outline btn--xs" onClick={handleDisconnect}><Power size={12} /> Desconectar</button>
                  </div>
                ) : connecting && !qrCode ? (
                  <div className="wa-loading"><Loader2 size={32} className="spin" /><p>Generando QR...</p></div>
                ) : qrCode ? (
                  <div className="wa-qr-mini">
                    <img src={qrCode} alt="QR" className="wa-qr-mini__img" />
                    <button className="btn btn--outline btn--xs" onClick={refreshQR}><RefreshCw size={12} /> Actualizar</button>
                    <p className="wa-qr-mini__hint"><Loader2 size={11} className="spin" /> Esperando escaneo...</p>
                  </div>
                ) : (
                  <div className="wa-connect-cta">
                    <QrCode size={32} />
                    <button className="btn btn--primary btn--sm" onClick={handleConnect}><Smartphone size={14} /> Conectar WhatsApp</button>
                    {error && <p className="wa-error">{error}</p>}
                  </div>
                )}
              </div>

              {/* Human handoff card */}
              <div className="wa-connection__card">
                <h4><Users size={15} /> Derivación a Humano</h4>
                <p className="wa-card-desc">Cuando un cliente pida hablar con una persona, se le enviará un enlace directo a otro número de WhatsApp.</p>
                <label className="wa-toggle">
                  <input type="checkbox" checked={handoffEnabled} onChange={e => setHandoffEnabled(e.target.checked)} />
                  <span className="wa-toggle__slider" />
                  <span>Activar derivación</span>
                </label>
                {handoffEnabled && (
                  <div className="wa-handoff-num">
                    <label><Phone size={12} /> Número (con código país, sin +)</label>
                    <input value={handoffNumber} onChange={e => setHandoffNumber(e.target.value)} placeholder="34628246032" />
                    <span className="wa-card-hint">El cliente recibirá un enlace wa.me a este número.</span>
                  </div>
                )}
                <button className="btn btn--outline btn--xs" onClick={handleHandoffSave} style={{ marginTop: '0.5rem' }}>Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="wa-stats">
        <div className="wa-stats__item"><MessageCircle size={14} /> <span>Conversaciones</span> <strong>{stats.total}</strong></div>
        <div className="wa-stats__item"><Zap size={14} /> <span>Activas</span> <strong>{stats.active}</strong></div>
        <div className="wa-stats__item"><BarChart3 size={14} /> <span>Mensajes IA</span> <strong>{stats.aiMessages}</strong></div>
        <div className="wa-stats__item"><ArrowUpRight size={14} /> <span>Total mensajes</span> <strong>{stats.totalMessages}</strong></div>
      </div>

      {/* Inbox */}
      <div className="wa-inbox">
        <div className={`wa-inbox__list ${selectedConvo ? 'wa-inbox__list--hidden-mobile' : ''}`}>
          <ChatList
            conversations={filtered}
            selectedId={selectedConvo?.id}
            onSelect={c => setSelectedConvo(c)}
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>
        <div className={`wa-inbox__detail ${!selectedConvo ? 'wa-inbox__detail--hidden-mobile' : ''}`}>
          {selectedConvo ? (
            <ChatDetail
              conversation={selectedConvo}
              messages={messages}
              agentName={activeAgent?.name || 'IA'}
              onStatusChange={(status) => handleStatusChange(selectedConvo.id, status)}
              onTagsOpen={() => setTagsConvo(selectedConvo)}
              onBack={() => setSelectedConvo(null)}
              showBackButton={true}
            />
          ) : (
            <div className="wa-inbox__empty">
              <MessageCircle size={40} />
              <p>Selecciona una conversación</p>
            </div>
          )}
        </div>
      </div>

      {/* Tags Manager */}
      {tagsConvo && (
        <TagsManager
          tags={tagsConvo.tags || []}
          onSave={(tags) => handleTagsSave(tagsConvo.id, tags)}
          onClose={() => setTagsConvo(null)}
        />
      )}
    </div>
  );
}
