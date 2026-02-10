export default function Placeholder({ title = 'Próximamente' }) {
  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{title}</h1>
      <p>Esta sección estará disponible pronto.</p>
    </div>
  );
}
