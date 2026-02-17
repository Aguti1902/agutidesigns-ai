import { Search, MessageCircle, Check, ArrowUpRight, Filter } from 'lucide-react';
import '../../pages/DashboardPages.css';

/**
 * Formatea una fecha a tiempo relativo (ej: "hace 5 min", "hace 2 h")
 */
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays < 7) return `hace ${diffDays} d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * Obtiene el color del badge según el estado
 */
function getStatusBadgeStyle(status) {
  switch (status?.toLowerCase()) {
    case 'active':
      return { background: 'rgba(var(--color-primary-rgb), 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(var(--color-primary-rgb), 0.3)' };
    case 'resolved':
      return { background: '#1a1a1a', color: '#888', border: '1px solid #333' };
    case 'referred':
      return { background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', border: '1px solid rgba(245,158,11,0.25)' };
    default:
      return { background: '#1a1a1a', color: '#888', border: '1px solid #333' };
  }
}

const STATUS_LABELS = { active: 'Activa', resolved: 'Resuelta', referred: 'Derivada' };

export default function ChatList({
  conversations = [],
  selectedId,
  onSelect,
  filter = 'todas',
  onFilterChange,
  searchQuery = '',
  onSearchChange,
}) {
  const filters = [
    { id: 'all', label: 'Todas', icon: MessageCircle },
    { id: 'active', label: 'Activas', icon: Check },
    { id: 'resolved', label: 'Resueltas', icon: Check },
    { id: 'referred', label: 'Derivadas', icon: ArrowUpRight },
  ];

  return (
    <div className="chat-list" style={styles.container}>
      {/* Barra de búsqueda */}
      <div style={styles.searchWrapper}>
        <Search size={18} style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar conversaciones..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Botones de filtro */}
      <div style={styles.filtersRow}>
        <Filter size={14} style={{ color: '#666', flexShrink: 0 }} />
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange?.(f.id)}
            className={`chip ${filter === f.id ? 'chip--active' : ''}`}
            style={styles.filterBtn}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de conversaciones */}
      <div style={styles.list}>
        {conversations.length === 0 ? (
          <div style={styles.empty}>
            <MessageCircle size={40} style={{ color: '#333', marginBottom: '0.75rem' }} />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#555' }}>
              No hay conversaciones
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = selectedId === conv.id;
            const statusStyle = getStatusBadgeStyle(conv.status);
            const initial = (conv.contact_name || conv.phone || '?')[0].toUpperCase();

            return (
              <button
                key={conv.id}
                onClick={() => onSelect?.(conv)}
                style={{
                  ...styles.convItem,
                  borderColor: isSelected ? 'var(--color-primary)' : '#1e1e1e',
                  background: isSelected ? 'rgba(var(--color-primary-rgb), 0.05)' : '#111',
                }}
                className="ticket-row"
              >
                <div style={styles.convLeft}>
                  {/* Avatar con inicial */}
                  <div style={styles.avatar}>{initial}</div>
                  <div style={styles.convInfo}>
                    <span style={styles.contactName}>{conv.contact_name || conv.phone || 'Sin nombre'}</span>
                    <span style={styles.phone}>{conv.phone || ''}</span>
                    <span style={styles.preview} title={conv.last_message}>
                      {conv.last_message ? (conv.last_message.length > 45 ? `${conv.last_message.slice(0, 45)}...` : conv.last_message) : 'Sin mensajes'}
                    </span>
                  </div>
                </div>
                <div style={styles.convRight}>
                  <span style={styles.timeAgo}>{formatTimeAgo(conv.updated_at || conv.last_message_at)}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...statusStyle,
                    }}
                  >
                    {STATUS_LABELS[conv.status] || 'Activa'}
                  </span>
                  {Array.isArray(conv.tags) && conv.tags.length > 0 && (
                    <div style={styles.tagsRow}>
                      {conv.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} style={styles.tagPill}>
                          {tag}
                        </span>
                      ))}
                      {conv.tags.length > 2 && (
                        <span style={styles.tagPill}>+{conv.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                  {conv.messages_count != null && (
                    <span style={styles.msgCount}>
                      <MessageCircle size={12} /> {conv.messages_count}
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#111',
    borderRight: '1px solid #1e1e1e',
  },
  searchWrapper: {
    position: 'relative',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #1e1e1e',
  },
  searchIcon: {
    position: 'absolute',
    left: '1.25rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#555',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.6rem 0.9rem 0.6rem 2.5rem',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: 'var(--radius-md)',
    color: 'white',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.6rem 1rem',
    borderBottom: '1px solid #1e1e1e',
  },
  filterBtn: {
    padding: '0.35rem 0.75rem',
    fontSize: '0.72rem',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    color: '#555',
  },
  convItem: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.75rem',
    padding: '1rem 1rem',
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textAlign: 'left',
    width: '100%',
    color: 'inherit',
  },
  convLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: '50%',
    background: 'rgba(var(--color-primary-rgb), 0.15)',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '0.95rem',
    flexShrink: 0,
  },
  convInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    minWidth: 0,
  },
  contactName: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'white',
  },
  phone: {
    fontSize: '0.7rem',
    color: '#666',
    fontFamily: 'var(--font-mono)',
  },
  preview: {
    fontSize: '0.78rem',
    color: '#888',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: '0.2rem',
  },
  convRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.3rem',
    flexShrink: 0,
  },
  timeAgo: {
    fontSize: '0.65rem',
    color: '#555',
    fontFamily: 'var(--font-mono)',
  },
  statusBadge: {
    fontSize: '0.6rem',
    fontWeight: 700,
    padding: '0.15rem 0.5rem',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-mono)',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.2rem',
    justifyContent: 'flex-end',
  },
  tagPill: {
    fontSize: '0.6rem',
    padding: '0.1rem 0.4rem',
    background: 'rgba(var(--color-primary-rgb), 0.1)',
    color: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'var(--font-mono)',
  },
  msgCount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.2rem',
    fontSize: '0.65rem',
    color: '#555',
    fontFamily: 'var(--font-mono)',
  },
};
