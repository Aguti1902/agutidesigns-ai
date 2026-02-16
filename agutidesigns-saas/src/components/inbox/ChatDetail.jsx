import { useEffect, useRef } from 'react';
import { ArrowLeft, Tag, MoreVertical, Bot, User, Clock, MessageCircle } from 'lucide-react';
import '../../pages/DashboardPages.css';

/**
 * Formatea una fecha a hora legible
 */
function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * Calcula la duración total de la conversación
 */
function formatDuration(messages = []) {
  if (!messages.length) return '0 min';
  const first = new Date(messages[0].created_at || messages[0].timestamp);
  const last = new Date(messages[messages.length - 1].created_at || messages[messages.length - 1].timestamp);
  const diffMs = last - first;
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} min`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Obtiene el estilo del badge de estado
 */
function getStatusBadgeStyle(status) {
  switch (status?.toLowerCase()) {
    case 'activa':
      return { background: 'rgba(var(--color-primary-rgb), 0.15)', color: 'var(--color-primary)' };
    case 'resuelta':
      return { background: '#1a1a1a', color: '#888' };
    case 'derivada':
      return { background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)' };
    default:
      return { background: '#1a1a1a', color: '#888' };
  }
}

export default function ChatDetail({
  conversation,
  messages = [],
  onStatusChange,
  onTagsOpen,
  agentName = 'IA',
  onBack,
  showBackButton = false,
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll al final cuando cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div style={styles.empty}>
        <Bot size={48} style={{ color: '#333', marginBottom: '1rem' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#555' }}>
          Selecciona una conversación
        </p>
      </div>
    );
  }

  const statusStyle = getStatusBadgeStyle(conversation.status);
  const aiCount = messages.filter((m) => m.role === 'assistant' || m.sender === 'assistant' || m.sender === 'ai').length;
  const userCount = messages.filter((m) => m.role === 'user' || m.sender === 'user').length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          {showBackButton && (
            <button onClick={onBack} style={styles.backBtn} aria-label="Volver">
              <ArrowLeft size={20} />
            </button>
          )}
          <div style={styles.headerInfo}>
            <h2 style={styles.contactName}>{conversation.contact_name || conversation.phone || 'Sin nombre'}</h2>
            <span style={styles.phone}>{conversation.phone || ''}</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.statusBadge, ...statusStyle }}>{conversation.status || 'Activa'}</span>
          <button onClick={onTagsOpen} className="btn btn--outline btn--sm" style={styles.tagsBtn}>
            <Tag size={14} /> Etiquetas
          </button>
          <select
            value={conversation.status || 'activa'}
            onChange={(e) => onStatusChange?.(e.target.value)}
            style={styles.statusSelect}
          >
            <option value="activa">Activa</option>
            <option value="resuelta">Resuelta</option>
            <option value="derivada">Derivada</option>
          </select>
          <button style={styles.moreBtn} aria-label="Más opciones">
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Área de mensajes */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.noMessages}>
            <MessageCircle size={32} style={{ color: '#333', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem', color: '#555' }}>No hay mensajes aún</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isAI = msg.role === 'assistant' || msg.sender === 'assistant' || msg.sender === 'ai';
            return (
              <div
                key={msg.id || i}
                style={{
                  ...styles.messageRow,
                  justifyContent: isAI ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    ...styles.messageBubble,
                    ...(isAI ? styles.messageBubbleAI : styles.messageBubbleUser),
                  }}
                >
                  {isAI && (
                    <span style={styles.aiBadge}>
                      <Bot size={12} /> IA
                    </span>
                  )}
                  <p style={styles.messageContent}>{msg.content || msg.text || msg.body}</p>
                  <span style={styles.messageTime}>{formatMessageTime(msg.created_at || msg.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer con estadísticas */}
      <footer style={styles.footer}>
        <span style={styles.footerStat}>
          <Bot size={14} /> {aiCount} IA
        </span>
        <span style={styles.footerStat}>
          <User size={14} /> {userCount} cliente
        </span>
        <span style={styles.footerStat}>
          <Clock size={14} /> {formatDuration(messages)}
        </span>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0a0a0a',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#555',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #1e1e1e',
    background: '#111',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: 'var(--radius-md)',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  contactName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'white',
  },
  phone: {
    fontSize: '0.75rem',
    color: '#666',
    fontFamily: 'var(--font-mono)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  statusBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.2rem 0.6rem',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-mono)',
    border: '1px solid transparent',
  },
  tagsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  statusSelect: {
    padding: '0.4rem 0.75rem',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: 'var(--radius-md)',
    color: 'white',
    fontSize: '0.75rem',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    outline: 'none',
  },
  moreBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  noMessages: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#555',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  messageBubbleUser: {
    background: '#1a1a1a',
    border: '1px solid #252525',
    alignItems: 'flex-start',
  },
  messageBubbleAI: {
    background: 'rgba(var(--color-primary-rgb), 0.12)',
    border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
    alignItems: 'flex-end',
  },
  aiBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    color: 'var(--color-primary)',
  },
  messageContent: {
    fontSize: '0.9rem',
    color: '#ddd',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
  },
  messageTime: {
    fontSize: '0.65rem',
    color: '#555',
    fontFamily: 'var(--font-mono)',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '0.6rem 1.25rem',
    borderTop: '1px solid #1e1e1e',
    background: '#111',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: '#666',
  },
  footerStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
};
