import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, User, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const STATUS_MAP = { open: 'Abierto', in_progress: 'En proceso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_MAP = { low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente' };

export default function AdminTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTickets();
    const channel = supabase
      .channel('admin-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => loadTickets())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        if (selectedTicket) loadMessages(selectedTicket.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadTickets() {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, profiles!inner(full_name, email)')
      .order('created_at', { ascending: false });
    setTickets(data || []);
  }

  async function loadMessages(ticketId) {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    // Mark as viewed by admin
    await supabase.from('support_tickets').update({ admin_last_viewed_at: new Date().toISOString() }).eq('id', ticketId);
  }

  useEffect(() => {
    if (selectedTicket) loadMessages(selectedTicket.id);
    else setMessages([]);
  }, [selectedTicket?.id]);

  async function handleReply() {
    if (!replyText.trim() || !selectedTicket || !user) return;
    setSending(true);
    try {
      await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        is_admin: true,
        message: replyText.trim(),
      });
      await supabase.from('support_tickets').update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      }).eq('id', selectedTicket.id);
      setReplyText('');
      loadMessages(selectedTicket.id);
      loadTickets();
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  }

  async function handleStatusChange(ticketId, newStatus) {
    await supabase.from('support_tickets').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => ({ ...prev, status: newStatus }));
    loadTickets();
  }

  const filtered = tickets.filter(t => {
    if (filter === 'open') return ['open', 'in_progress'].includes(t.status);
    if (filter === 'resolved') return t.status === 'resolved';
    if (filter === 'closed') return t.status === 'closed';
    return true;
  });

  return (
    <div className="page">
      <div className="page__header">
        <h1><MessageSquare size={24} /> Soporte — Admin</h1>
        <p>Gestiona todos los tickets de los usuarios</p>
      </div>

      <div className="admin-tickets-filters">
        <button className={`chip ${filter === 'all' ? 'chip--active' : ''}`} onClick={() => setFilter('all')}>Todos ({tickets.length})</button>
        <button className={`chip ${filter === 'open' ? 'chip--active' : ''}`} onClick={() => setFilter('open')}>Abiertos ({tickets.filter(t => ['open','in_progress'].includes(t.status)).length})</button>
        <button className={`chip ${filter === 'resolved' ? 'chip--active' : ''}`} onClick={() => setFilter('resolved')}>Resueltos ({tickets.filter(t => t.status === 'resolved').length})</button>
        <button className={`chip ${filter === 'closed' ? 'chip--active' : ''}`} onClick={() => setFilter('closed')}>Cerrados ({tickets.filter(t => t.status === 'closed').length})</button>
      </div>

      <div className="admin-tickets-layout">
        <div className="admin-tickets-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
              <MessageSquare size={40} style={{ marginBottom: '1rem', color: '#333' }} />
              <p>No hay tickets</p>
            </div>
          ) : (
            filtered.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`ticket-row ${selectedTicket?.id === ticket.id ? 'ticket-row--selected' : ''}`}
              >
                <div className="ticket-row__left">
                  <div className="ticket-row__icon" style={{ background: ticket.status === 'open' ? '#f5950b15' : '#1a1a1a' }}>
                    {ticket.status === 'open' ? <AlertCircle size={16} style={{ color: '#f59e0b' }} /> : <CheckCircle size={16} style={{ color: '#555' }} />}
                  </div>
                  <div>
                    <span className="ticket-row__subject">{ticket.subject}</span>
                    <span className="ticket-row__meta">{ticket.profiles?.full_name} · {new Date(ticket.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
                <div className="ticket-row__right">
                  <span className={`ticket-row__status ticket-row__status--${ticket.status}`}>{STATUS_MAP[ticket.status]}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="admin-tickets-detail">
          {selectedTicket ? (
            <>
              <div className="admin-ticket-header">
                <div>
                  <h3>{selectedTicket.subject}</h3>
                  <p><User size={12} /> {selectedTicket.profiles?.full_name} ({selectedTicket.profiles?.email})</p>
                  <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '0.2rem' }}><Clock size={11} /> {new Date(selectedTicket.created_at).toLocaleString('es-ES')}</p>
                </div>
                <select value={selectedTicket.status} onChange={e => handleStatusChange(selectedTicket.id, e.target.value)} style={{ padding: '0.4rem 0.7rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.75rem' }}>
                  <option value="open">Abierto</option>
                  <option value="in_progress">En proceso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>

              <div className="ticket-thread">
                {messages.map(msg => (
                  <div key={msg.id} className={`ticket-msg ${msg.is_admin ? 'ticket-msg--admin' : 'ticket-msg--user'}`}>
                    <div className="ticket-msg__avatar">{msg.is_admin ? 'A' : 'U'}</div>
                    <div className="ticket-msg__body">
                      <div className="ticket-msg__header">
                        <span className="ticket-msg__name">{msg.is_admin ? 'Soporte Agutidesigns' : selectedTicket.profiles?.full_name}</span>
                        <span className="ticket-msg__time">{new Date(msg.created_at).toLocaleString('es-ES')}</span>
                      </div>
                      <p className="ticket-msg__content">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ticket-reply">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Escribe tu respuesta al usuario..."
                  rows={4}
                  disabled={sending}
                />
                <button className="btn btn--primary" onClick={handleReply} disabled={sending || !replyText.trim()}>
                  {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                  Enviar respuesta
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>
              <MessageSquare size={48} style={{ marginBottom: '1rem', color: '#333' }} />
              <p>Selecciona un ticket</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
