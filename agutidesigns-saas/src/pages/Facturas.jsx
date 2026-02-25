import { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Edit3, Download, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: '#f59e0b' },
  pagada: { label: 'Pagada', color: '#25D366' },
  vencida: { label: 'Vencida', color: '#ef4444' },
};

function calcularTotales(lineas, iva) {
  const subtotal = (lineas || []).reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0);
  const ivaAmt = subtotal * ((parseFloat(iva) || 0) / 100);
  return { subtotal, ivaAmt, total: subtotal + ivaAmt };
}

function isVencida(f) {
  return f.estado === 'pendiente' && f.fecha_vencimiento && new Date(f.fecha_vencimiento) < new Date();
}

async function exportarPDF(fact, negocio) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
  const { subtotal, ivaAmt, total } = calcularTotales(fact.lineas, fact.iva);
  const negNombre = negocio?.name || 'Mi Negocio';

  doc.setFillColor(37, 211, 102);
  doc.rect(0, 0, 210, 8, 'F');
  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
  doc.text(negNombre, 14, 22);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  if (negocio?.email) doc.text(negocio.email, 14, 29);
  if (negocio?.phone) doc.text(negocio.phone, 14, 34);

  doc.setFontSize(24); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
  doc.text('FACTURA', 196, 22, { align: 'right' });
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text(fact.numero, 196, 30, { align: 'right' });
  doc.text(`Fecha: ${new Date(fact.created_at).toLocaleDateString('es-ES')}`, 196, 37, { align: 'right' });
  if (fact.fecha_vencimiento) doc.text(`Vencimiento: ${new Date(fact.fecha_vencimiento).toLocaleDateString('es-ES')}`, 196, 44, { align: 'right' });

  doc.setDrawColor(230, 230, 230); doc.line(14, 48, 196, 48);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 100, 100);
  doc.text('FACTURAR A:', 14, 55);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20); doc.setFontSize(11);
  doc.text(fact.cliente_nombre || 'Cliente', 14, 62);
  doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  if (fact.cliente_empresa) doc.text(fact.cliente_empresa, 14, 68);
  if (fact.cliente_email) doc.text(fact.cliente_email, 14, 73);

  const rows = (fact.lineas || []).map(l => [l.descripcion, l.cantidad, `${parseFloat(l.precio || 0).toFixed(2)}€`, `${((parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0)).toFixed(2)}€`]);
  autoTable(doc, {
    startY: 80,
    head: [['Descripción', 'Cant.', 'Precio unit.', 'Total']],
    body: rows,
    headStyles: { fillColor: [37, 211, 102], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  let finalY = doc.lastAutoTable?.finalY + 8 || 160;
  const rightX = 196;
  doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  doc.text('Base imponible:', rightX - 50, finalY); doc.text(`${subtotal.toFixed(2)}€`, rightX, finalY, { align: 'right' });
  finalY += 6; doc.text(`IVA (${fact.iva}%):`, rightX - 50, finalY); doc.text(`${ivaAmt.toFixed(2)}€`, rightX, finalY, { align: 'right' });
  finalY += 2; doc.setDrawColor(37, 211, 102); doc.line(rightX - 60, finalY, rightX, finalY);
  finalY += 6; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 20);
  doc.text('TOTAL:', rightX - 50, finalY); doc.text(`${total.toFixed(2)}€`, rightX, finalY, { align: 'right' });

  if (fact.notas) {
    finalY += 14;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    doc.text('Notas:', 14, finalY); doc.setFont('helvetica', 'normal');
    finalY += 6;
    doc.text(doc.splitTextToSize(fact.notas, 170), 14, finalY);
  }
  doc.save(`${fact.numero}.pdf`);
}

export default function Facturas() {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [negocio, setNegocio] = useState(null);
  const [form, setForm] = useState({
    numero: '', cliente_nombre: '', cliente_email: '', cliente_empresa: '',
    lineas: [{ descripcion: '', cantidad: 1, precio: 0 }],
    iva: 21, estado: 'pendiente', fecha_vencimiento: '', notas: '',
  });

  useEffect(() => { if (user) { load(); loadNegocio(); } }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('facturas').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    const updated = [];
    for (const f of data || []) {
      if (isVencida(f)) {
        await supabase.from('facturas').update({ estado: 'vencida' }).eq('id', f.id);
        updated.push({ ...f, estado: 'vencida' });
      } else updated.push(f);
    }
    setFacturas(updated);
    setLoading(false);
  }

  async function loadNegocio() {
    const { data } = await supabase.from('businesses').select('*').eq('user_id', user.id).single();
    setNegocio(data);
  }

  function openNew() {
    const year = new Date().getFullYear();
    const max = facturas.reduce((n, f) => { const m = f.numero?.match(/FACT-(\d+)/); return m ? Math.max(n, parseInt(m[1])) : n; }, 0);
    const numero = `FACT-${String(max + 1).padStart(4, '0')}-${year}`;
    const vence = new Date(); vence.setDate(vence.getDate() + 30);
    setForm({ numero, cliente_nombre: '', cliente_email: '', cliente_empresa: '', lineas: [{ descripcion: '', cantidad: 1, precio: 0 }], iva: 21, estado: 'pendiente', fecha_vencimiento: vence.toISOString().split('T')[0], notas: '' });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(f) {
    setForm({ ...f, lineas: f.lineas?.length ? f.lineas : [{ descripcion: '', cantidad: 1, precio: 0 }], fecha_vencimiento: f.fecha_vencimiento || '' });
    setEditing(f.id);
    setShowForm(true);
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updL = (i, k, v) => { const ls = [...form.lineas]; ls[i] = { ...ls[i], [k]: v }; upd('lineas', ls); };

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, user_id: user.id, updated_at: new Date().toISOString() };
    if (editing) await supabase.from('facturas').update(payload).eq('id', editing);
    else await supabase.from('facturas').insert(payload);
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function marcarPagada(id) {
    await supabase.from('facturas').update({ estado: 'pagada', updated_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta factura?')) return;
    await supabase.from('facturas').delete().eq('id', id);
    load();
  }

  const totales = calcularTotales(form.lineas, form.iva);
  const pendienteTotal = facturas.filter(f => f.estado === 'pendiente').reduce((s, f) => s + calcularTotales(f.lineas || [], f.iva).total, 0);
  const vencidasCount = facturas.filter(f => f.estado === 'vencida').length;

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><Receipt size={22} /> Facturas</h1>
          <p>Controla tus facturas y cobros pendientes.</p>
        </div>
        <button className="btn btn--primary" onClick={openNew}><Plus size={14} /> Nueva factura</button>
      </div>

      {vencidasCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
          <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem' }}><strong style={{ color: '#ef4444' }}>{vencidasCount} factura{vencidasCount > 1 ? 's' : ''} vencida{vencidasCount > 1 ? 's' : ''}</strong> — Revísalas y contacta con los clientes.</span>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}><Receipt size={18} /></div><div><span className="stat-card__value">{facturas.length}</span><span className="stat-card__label">Total</span></div></div>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Receipt size={18} /></div><div><span className="stat-card__value">{facturas.filter(f => f.estado === 'pendiente').length}</span><span className="stat-card__label">Pendientes</span></div></div>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}><Check size={18} /></div><div><span className="stat-card__value">{facturas.filter(f => f.estado === 'pagada').length}</span><span className="stat-card__label">Pagadas</span></div></div>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366' }}><Receipt size={18} /></div><div><span className="stat-card__value">{pendienteTotal.toFixed(0)}€</span><span className="stat-card__label">Por cobrar</span></div></div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>
      ) : facturas.length === 0 ? (
        <div className="empty-state">
          <Receipt size={40} />
          <h3>Aún no tienes facturas</h3>
          <p>Crea tu primera factura o genera una desde un presupuesto aceptado.</p>
          <button className="btn btn--primary" onClick={openNew}><Plus size={14} /> Crear factura</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                {['Número', 'Cliente', 'Importe', 'Estado', 'Vencimiento', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {facturas.map(f => {
                const { total } = calcularTotales(f.lineas || [], f.iva);
                const est = ESTADOS[f.estado] || ESTADOS.pendiente;
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-light)', background: f.estado === 'vencida' ? 'rgba(239,68,68,0.03)' : undefined }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700 }}>{f.numero}</td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.88rem' }}>
                      <div>{f.cliente_nombre || '—'}</div>
                      {f.cliente_empresa && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{f.cliente_empresa}</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700 }}>{total.toFixed(2)}€</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{ background: `${est.color}18`, color: est.color, border: `1px solid ${est.color}44`, borderRadius: 'var(--radius-full)', padding: '0.25rem 0.65rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700 }}>{est.label}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', color: f.estado === 'vencida' ? '#ef4444' : 'var(--text-tertiary)' }}>
                      {f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn--outline btn--sm" onClick={() => openEdit(f)} title="Editar"><Edit3 size={12} /></button>
                        <button className="btn btn--outline btn--sm" onClick={() => exportarPDF(f, negocio)} title="Exportar PDF"><Download size={12} /></button>
                        {f.estado !== 'pagada' && <button className="btn btn--outline btn--sm" style={{ color: '#25D366', borderColor: '#25D36633' }} onClick={() => marcarPagada(f.id)} title="Marcar como pagada"><Check size={12} /></button>}
                        <button className="btn btn--outline btn--sm" style={{ color: '#ef4444', borderColor: '#ef444433' }} onClick={() => eliminar(f.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="cal-popup-overlay">
          <div className="cal-popup" style={{ width: '680px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="cal-popup__header">
              <h3>{editing ? 'Editar factura' : 'Nueva factura'}</h3>
              <button className="cal-popup__close" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={save} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="form-field"><label>Número *</label><input value={form.numero} onChange={e => upd('numero', e.target.value)} required /></div>
                <div className="form-field"><label>Fecha vencimiento</label><input type="date" value={form.fecha_vencimiento} onChange={e => upd('fecha_vencimiento', e.target.value)} /></div>
                <div className="form-field"><label>Nombre cliente *</label><input value={form.cliente_nombre} onChange={e => upd('cliente_nombre', e.target.value)} required /></div>
                <div className="form-field"><label>Email</label><input type="email" value={form.cliente_email} onChange={e => upd('cliente_email', e.target.value)} /></div>
                <div className="form-field form-field--full"><label>Empresa</label><input value={form.cliente_empresa} onChange={e => upd('cliente_empresa', e.target.value)} /></div>
              </div>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>SERVICIOS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {form.lineas.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: '0.5rem', alignItems: 'center' }}>
                    <input value={l.descripcion} onChange={e => updL(i, 'descripcion', e.target.value)} placeholder="Servicio" style={{ padding: '0.55rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }} />
                    <input type="number" min="1" value={l.cantidad} onChange={e => updL(i, 'cantidad', e.target.value)} placeholder="Cant." style={{ padding: '0.55rem 0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem', textAlign: 'center' }} />
                    <input type="number" min="0" step="0.01" value={l.precio} onChange={e => updL(i, 'precio', e.target.value)} placeholder="Precio" style={{ padding: '0.55rem 0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem', textAlign: 'right' }} />
                    <button type="button" onClick={() => upd('lineas', form.lineas.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef444488', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn--outline btn--sm" style={{ marginBottom: '1.25rem' }} onClick={() => upd('lineas', [...form.lineas, { descripcion: '', cantidad: 1, precio: 0 }])}><Plus size={12} /> Añadir línea</button>
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-field"><label>IVA (%)</label><input type="number" min="0" max="100" value={form.iva} onChange={e => upd('iva', e.target.value)} /></div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Base imponible: <strong>{totales.subtotal.toFixed(2)}€</strong></span>
                <span>IVA ({form.iva}%): <strong>{totales.ivaAmt.toFixed(2)}€</strong></span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>TOTAL: {totales.total.toFixed(2)}€</span>
              </div>
              <div className="form-field" style={{ marginBottom: '1.5rem' }}><label>Notas</label><textarea value={form.notas} onChange={e => upd('notas', e.target.value)} rows={2} /></div>
              <div className="form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />}{editing ? 'Guardar' : 'Crear factura'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
