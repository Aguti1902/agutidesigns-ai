import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Tag, Bot, User, Clock, MessageCircle, Send, ZapOff, Zap, AlertCircle } from 'lucide-react';
import '../../pages/DashboardPages.css';

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(messages = []) {
  if (!messages.length) return '0 min';
  const first = new Date(messages[0].created_at || messages[0].timestamp);
  const last = new Date(messages[messages.length - 1].created_at || messages[messages.length - 1].timestamp);
  const diffMins = Math.round((last - first) / 60000);
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export default function ChatDetail({
  conversation,
  messages = [],
  onStatusChange,
  onTagsOpen,
  agentName = 'IA',
  onBack,
  showBackButton = false,
  onSendMessage,
  onToggleAI,
}) {
  const messagesEndRef = useRef(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const aiPaused = !!conversation?.ai_paused;
  const aiCount = messages.filter(m => m.role === 'assistant' || m.sender === 'assistant' || m.sender === 'ai').length;
  const userCount = messages.filter(m => m.role === 'user' || m.sender === 'user').length;

  async function handleSend() {
    const text = replyText.trim();
    if (!text || sending) return;
    setSending(true);
    await onSendMessage?.(text);
    setReplyText('');
    setSending(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!conversation) {
    return (
      <div style={styles.empty}>
        <Bot size={48} style={{ color: '#333', marginBottom: '1rem' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#555' }}>Selecciona una conversación</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          {showBackButton && (
            <button onClick={onBack} style={styles.backBtn} aria-label="Volver"><ArrowLeft size={20} /></button>
          )}
          <div style={styles.headerInfo}>
            <h2 style={styles.contactName}>{conversation.contact_name || conversation.phone || 'Sin nombre'}</h2>
            <span style={styles.phone}>{conversation.contact_phone || conversation.phone || ''}</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={onTagsOpen}
            className="btn btn--outline btn--sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Tag size={14} /> Etiquetas
          </button>
          <select
            value={conversation.status || 'active'}
            onChange={e => onStatusChange?.(e.target.value)}
            style={styles.statusSelect}
          >
            <option value="active">Activa</option>
            <option value="resolved">Resuelta</option>
            <option value="referred">Derivada</option>
          </select>
        </div>
      </header>

      {/* Banner IA pausada */}
      {aiPaused && (
        <div style={styles.pausedBanner}>
          <div style={styles.pausedBannerLeft}>
            <ZapOff size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span>IA pausada — estás respondiendo manualmente</span>
          </div>
          <button
            style={styles.reactivateBtn}
            onClick={() => onToggleAI?.(false)}
            title="Reactivar IA"
          >
            <Zap size={12} /> Reactivar IA
          </button>
        </div>
      )}

      {/* Mensajes */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.noMessages}>
            <MessageCircle size={32} style={{ color: '#333', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem', color: '#555' }}>No hay mensajes aún</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isAI = msg.role === 'assistant' || msg.sender === 'assistant' || msg.sender === 'ai';
            const isHuman = msg.sender === 'human_agent';
            return (
              <div key={msg.id || i} style={{ ...styles.messageRow, justifyContent: (isAI || isHuman) ? 'flex-end' : 'flex-start' }}>
                <div style={{ ...styles.messageBubble, ...(isAI ? styles.messageBubbleAI : isHuman ? styles.messageBubbleHuman : styles.messageBubbleUser) }}>
                  {isAI && <span style={styles.aiBadge}><Bot size={12} /> IA</span>}
                  {isHuman && <span style={{ ...styles.aiBadge, color: '#f59e0b' }}><User size={12} /> Tú</span>}
                  <p style={styles.messageContent}>{msg.content || msg.text || msg.body}</p>
                  <span style={styles.messageTime}>{formatMessageTime(msg.created_at || msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Caja de respuesta manual */}
      <div style={styles.replyBox}>
        {!aiPaused && (
          <div style={styles.aiActiveNote}>
            <AlertCircle size={11} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
            <span>La IA se pausará automáticamente al enviar tu primer mensaje</span>
          </div>
        )}
        <div style={styles.replyRow}>
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje manual... (Enter para enviar)"
            rows={2}
            style={styles.replyTextarea}
          />
          <button
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            style={{ ...styles.sendBtn, opacity: !replyText.trim() || sending ? 0.4 : 1 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Footer estadísticas */}
      <footer style={styles.footer}>
        <span style={styles.footerStat}><Bot size={14} /> {aiCount} IA</span>
        <span style={styles.footerStat}><User size={14} /> {userCount} cliente</span>
        <span style={styles.footerStat}><Clock size={14} /> {formatDuration(messages)}</span>
      </footer>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', borderBottom: '1px solid #1e1e1e', background: '#111', flexWrap: 'wrap', gap: '0.5rem' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 },
  backBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0.25rem', borderRadius: 'var(--radius-md)' },
  headerInfo: { display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 },
  contactName: { fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  phone: { fontSize: '0.72rem', color: '#666', fontFamily: 'var(--font-mono)' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  statusSelect: { padding: '0.35rem 0.6rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', outline: 'none' },
  pausedBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.55rem 1.25rem', background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', fontSize: '0.75rem', color: '#f59e0b', fontFamily: 'var(--font-mono)' },
  pausedBannerLeft: { display: 'flex', alignItems: 'center', gap: '0.45rem' },
  reactivateBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366', borderRadius: 'var(--radius-md)', padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  noMessages: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#555' },
  messageRow: { display: 'flex', width: '100%' },
  messageBubble: { maxWidth: '78%', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  messageBubbleUser: { background: '#1a1a1a', border: '1px solid #252525', alignItems: 'flex-start' },
  messageBubbleAI: { background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.18)', alignItems: 'flex-end' },
  messageBubbleHuman: { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', alignItems: 'flex-end' },
  aiBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' },
  messageContent: { fontSize: '0.88rem', color: '#ddd', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 },
  messageTime: { fontSize: '0.62rem', color: '#555', fontFamily: 'var(--font-mono)' },
  replyBox: { borderTop: '1px solid #1e1e1e', background: '#0d0d0d', padding: '0.75rem 1rem' },
  aiActiveNote: { display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' },
  replyRow: { display: 'flex', gap: '0.5rem', alignItems: 'flex-end' },
  replyTextarea: { flex: 1, padding: '0.55rem 0.75rem', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', resize: 'none', outline: 'none', lineHeight: 1.5 },
  sendBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, background: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: '#000', cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s' },
  footer: { display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '0.5rem 1.25rem', borderTop: '1px solid #1e1e1e', background: '#111', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#666' },
  footerStat: { display: 'flex', alignItems: 'center', gap: '0.35rem' },
};
