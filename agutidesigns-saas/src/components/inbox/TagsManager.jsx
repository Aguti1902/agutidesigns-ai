import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import '../../pages/DashboardPages.css';

// Etiquetas predefinidas sugeridas
const SUGGESTED_TAGS = ['Nuevo cliente', 'VIP', 'Urgente', 'Seguimiento', 'Interesado', 'No interesado'];

export default function TagsManager({ tags = [], onSave, onClose }) {
  const [localTags, setLocalTags] = useState([...tags]);
  const [newTagInput, setNewTagInput] = useState('');

  /**
   * Añade una etiqueta desde el input
   */
  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (localTags.includes(trimmed)) {
      setNewTagInput('');
      return;
    }
    setLocalTags((prev) => [...prev, trimmed]);
    setNewTagInput('');
  };

  /**
   * Añade una etiqueta desde las sugerencias
   */
  const handleAddSuggested = (tag) => {
    if (localTags.includes(tag)) return;
    setLocalTags((prev) => [...prev, tag]);
  };

  /**
   * Elimina una etiqueta
   */
  const handleRemoveTag = (tagToRemove) => {
    setLocalTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  /**
   * Guarda los cambios y cierra
   */
  const handleSave = () => {
    onSave?.(localTags);
    onClose?.();
  };

  /**
   * Cierra sin guardar
   */
  const handleCancel = () => {
    onClose?.();
  };

  return (
    <>
      {/* Overlay de fondo */}
      <div
        style={styles.overlay}
        onClick={handleCancel}
        onKeyDown={(e) => e.key === 'Escape' && handleCancel()}
        role="button"
        tabIndex={0}
        aria-label="Cerrar"
      />

      {/* Modal/Popover */}
      <div style={styles.modal} role="dialog" aria-labelledby="tags-modal-title">
        <div style={styles.header}>
          <h3 id="tags-modal-title" style={styles.title}>
            Gestionar etiquetas
          </h3>
          <button
            onClick={handleCancel}
            style={styles.closeBtn}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div style={styles.body}>
          {/* Etiquetas actuales (removibles) */}
          {localTags.length > 0 && (
            <div style={styles.section}>
              <span style={styles.sectionLabel}>Etiquetas actuales</span>
              <div style={styles.tagsRow}>
                {localTags.map((tag) => (
                  <span key={tag} style={styles.tagPill}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={styles.removeTagBtn}
                      aria-label={`Quitar ${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Input para añadir nueva etiqueta */}
          <div style={styles.section}>
            <span style={styles.sectionLabel}>Añadir etiqueta</span>
            <div className="form-field" style={styles.addRow}>
              <input
                type="text"
                placeholder="Escribe una etiqueta..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                style={styles.input}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn--primary btn--sm"
                style={styles.addBtn}
                disabled={!newTagInput.trim()}
              >
                <Plus size={14} /> Añadir
              </button>
            </div>
          </div>

          {/* Sugerencias predefinidas */}
          <div style={styles.section}>
            <span style={styles.sectionLabel}>Sugerencias</span>
            <div style={styles.suggestionsRow}>
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddSuggested(tag)}
                  style={{
                    ...styles.suggestionPill,
                    opacity: localTags.includes(tag) ? 0.5 : 1,
                    cursor: localTags.includes(tag) ? 'default' : 'pointer',
                  }}
                  disabled={localTags.includes(tag)}
                >
                  {localTags.includes(tag) ? '✓ ' : '+ '}{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button onClick={handleCancel} className="btn btn--outline">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn--primary">
            Guardar
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    zIndex: 999,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(420px, 95vw)',
    maxHeight: '85vh',
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 'var(--radius-xl)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #1e1e1e',
  },
  title: {
    fontFamily: 'var(--font-mono)',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: 'var(--radius-md)',
  },
  body: {
    padding: '1.25rem 1.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  tagPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.4rem 0.75rem',
    background: 'rgba(var(--color-primary-rgb), 0.1)',
    border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
  },
  removeTagBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: 0,
    opacity: 0.8,
  },
  addRow: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.6rem 0.9rem',
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: 'var(--radius-md)',
    color: 'white',
    fontSize: '0.9rem',
    fontFamily: 'var(--font-body)',
    outline: 'none',
  },
  addBtn: {
    flexShrink: 0,
  },
  suggestionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  suggestionPill: {
    padding: '0.4rem 0.8rem',
    background: '#151515',
    border: '1px solid #2a2a2a',
    borderRadius: 'var(--radius-full)',
    color: '#888',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    transition: 'all 0.15s',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #1e1e1e',
    background: '#0c0c0c',
  },
};
