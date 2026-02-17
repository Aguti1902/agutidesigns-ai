import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Plus, Send, ArrowLeft, Clock, CheckCircle,
  AlertCircle, Loader2, Tag, ChevronRight, MessageCircle,
  Bug, CreditCard, Smartphone, Brain, Sparkles, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './DashboardPages.css';

const CATEGORIES = [
  { id: 'general', label: 'Pregunta general', icon: <HelpCircle size={16} />, color: '#888' },
  { id: 'bug', label: 'Algo no funciona', icon: <Bug size={16} />, color: '#F1250E' },
  { id: 'whatsapp', label: 'Problema con WhatsApp', icon: <Smartphone size={16} />, color: '#25D366' },
  { id: 'agent', label: 'Mi agente IA', icon: <Brain size={16} />, color: '#E5FC63' },
  { id: 'billing', label: 'Facturación / Pagos', icon: <CreditCard size={16} />, color: '#F59E0B' },
  { id: 'feature', label: 'Sugerencia / Mejora', icon: <Sparkles size={16} />, color: '#8B5CF6' },
];

const STATUS_LABELS = {
  open: { label: 'Abierto', color: '#F59E0B' },
  in_progress: { label: 'En proceso', color: '#3B82F6' },
  resolved: { label: 'Resuelto', color: '#25D366' },
  closed: { label: 'Cerrado', color: '#666' },
};

const PRIORITY_LABELS = {
  low: 'Baja',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

export default function Support() {
  const { user, profile } = useAuth();
  const [view, setView] = useState('list'); // list | new | detail
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // New ticket form
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState('normal');
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // Load tickets
  useEffect(() => {
    loadTickets();
    
    // Real-time updates
    const channel = supabase
      .channel('user-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user?.id}` }, () => loadTickets())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, (payload) => {
        if (selectedTicket && payload.new.ticket_id === selectedTicket.id) {
          loadMessages(selectedTicket.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedTicket?.id]);

  async function loadTickets() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  }

  async function loadMessages(ticketId) {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  }

  async function openTicket(ticket) {
    setSelectedTicket(ticket);
    await loadMessages(ticket.id);
    // Mark as viewed by user
    await supabase.from('support_tickets').update({ user_last_viewed_at: new Date().toISOString() }).eq('id', ticket.id);
    setView('detail');
  }

  async function handleCreateTicket(e) {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setSubmitting(true);

    try {
      const { data: ticket, error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: newSubject,
      }).select().single();

      if (error) throw error;

      await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        is_admin: false,
        message: newMessage,
      });

      setNewSubject('');
      setNewCategory('general');
      setNewPriority('normal');
      setNewMessage('');
      await loadTickets();
      setView('list');
      
      // Send confirmation email
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: `Ticket #${ticket.id.slice(0,8)} creado - Te responderemos pronto`,
            template: 'ticket_created',
            data: { 
              name: profile?.full_name || 'ahí',
              ticketId: ticket.id.slice(0,8),
              subject: newSubject,
              message: newMessage.slice(0, 150)
            }
          })
        }).catch(() => {})
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;
    setSending(true);

    try {
      await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        is_admin: false,
        message: reply,
      });

      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);

      setReply('');
      await loadMessages(selectedTicket.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page">
      <AnimatePresence mode="wait">
        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>Soporte</h1>
                <p>¿Tienes algún problema o pregunta? Crea un ticket y te respondemos lo antes posible.</p>
              </div>
              <button className="btn btn--primary" onClick={() => setView('new')}>
                <Plus size={16} /> Nuevo ticket
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
                <Loader2 size={24} className="spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">
                <HelpCircle size={40} />
                <h3>No tienes tickets</h3>
                <p>Si necesitas ayuda, crea un ticket y te respondemos en menos de 24h.</p>
                <button className="btn btn--primary" onClick={() => setView('new')}>
                  <Plus size={14} /> Crear mi primer ticket
                </button>
              </div>
            ) : (
              <div className="tickets-list">
                {tickets.map(ticket => {
                  const cat = CATEGORIES.find(c => c.id === ticket.category);
                  const status = STATUS_LABELS[ticket.status];
                  return (
                    <button key={ticket.id} className="ticket-row" onClick={() => openTicket(ticket)}>
                      <div className="ticket-row__left">
                        <div className="ticket-row__icon" style={{ color: cat?.color }}>{cat?.icon}</div>
                        <div>
                          <span className="ticket-row__subject">{ticket.subject}</span>
                          <span className="ticket-row__meta">{cat?.label} · {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="ticket-row__right">
                        <span className="ticket-row__status" style={{ color: status?.color, borderColor: status?.color + '40', background: status?.color + '10' }}>
                          {status?.label}
                        </span>
                        <ChevronRight size={16} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── NEW TICKET VIEW ── */}
        {view === 'new' && (
          <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="back-btn" onClick={() => setView('list')}>
              <ArrowLeft size={16} /> Volver a mis tickets
            </button>

            <div className="page__header">
              <h1>Nuevo ticket</h1>
              <p>Cuéntanos qué necesitas y te ayudamos.</p>
            </div>

            <form className="card" onSubmit={handleCreateTicket}>
              <div className="form-field form-field--full">
                <label>Asunto *</label>
                <input type="text" placeholder="Ej: Mi agente no responde a los mensajes" value={newSubject} onChange={e => setNewSubject(e.target.value)} required />
              </div>

              <div className="form-field form-field--full">
                <label>Categoría</label>
                <div className="chips">
                  {CATEGORIES.map(c => (
                    <button type="button" key={c.id} className={`chip ${newCategory === c.id ? 'chip--active' : ''}`} onClick={() => setNewCategory(c.id)} style={newCategory === c.id ? { borderColor: c.color, color: c.color } : {}}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field form-field--full">
                <label>Prioridad</label>
                <div className="chips">
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <button type="button" key={k} className={`chip ${newPriority === k ? 'chip--active' : ''}`} onClick={() => setNewPriority(k)}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field form-field--full">
                <label>Describe tu problema o pregunta *</label>
                <textarea placeholder="Cuéntanos con detalle qué pasa. Cuanta más información nos des, antes podremos ayudarte." value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={6} required />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setView('list')}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? <><Loader2 size={14} className="spin" /> Enviando...</> : <><Send size={14} /> Enviar ticket</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && selectedTicket && (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="back-btn" onClick={() => { setView('list'); setSelectedTicket(null); }}>
              <ArrowLeft size={16} /> Volver a mis tickets
            </button>

            <div className="page__header">
              <h1>{selectedTicket.subject}</h1>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <span className="ticket-row__status" style={{
                  color: STATUS_LABELS[selectedTicket.status]?.color,
                  borderColor: STATUS_LABELS[selectedTicket.status]?.color + '40',
                  background: STATUS_LABELS[selectedTicket.status]?.color + '10',
                }}>
                  {STATUS_LABELS[selectedTicket.status]?.label}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#555' }}>{formatDate(selectedTicket.created_at)}</span>
              </div>
            </div>

            {/* Messages thread */}
            <div className="ticket-thread">
              {messages.map(msg => (
                <div key={msg.id} className={`ticket-msg ${msg.is_admin ? 'ticket-msg--admin' : 'ticket-msg--user'}`}>
                  <div className="ticket-msg__avatar">
                    {msg.is_admin ? 'A' : profile?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="ticket-msg__body">
                    <div className="ticket-msg__header">
                      <span className="ticket-msg__name">
                        {msg.is_admin ? 'Soporte Agutidesigns' : 'Tú'}
                      </span>
                      <span className="ticket-msg__time">{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="ticket-msg__content">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            {selectedTicket.status !== 'closed' && (
              <form className="ticket-reply" onSubmit={handleReply}>
                <textarea placeholder="Escribe tu respuesta..." value={reply} onChange={e => setReply(e.target.value)} rows={3} required />
                <button type="submit" className="btn btn--primary" disabled={sending}>
                  {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                  Responder
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
