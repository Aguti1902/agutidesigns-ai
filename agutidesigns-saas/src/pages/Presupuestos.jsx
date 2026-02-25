import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit3, Download, Check, X, ChevronDown, Loader2, Receipt, ArrowRight, Copy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

const ESTADOS = {
  borrador: { label: 'Borrador', color: '#666' },
  enviado: { label: 'Enviado', color: '#f59e0b' },
  aceptado: { label: 'Aceptado', color: '#25D366' },
  rechazado: { label: 'Rechazado', color: '#ef4444' },
};

const SERVICIOS_PRESET = [
  'Diseño web corporativa',
  'Landing page',
  'Tienda online (Ecommerce)',
  'Rediseño web',
  'Mantenimiento mensual',
  'SEO on-page',
  'Desarrollo a medida',
  'Copywriting',
];

const LINE_EMPTY = { descripcion: '', cantidad: 1, precio: 0 };

function generarNumero(presupuestos) {
  const year = new Date().getFullYear();
  const max = presupuestos.reduce((n, p) => {
    const m = p.numero?.match(/PRES-(\d+)/);
    return m ? Math.max(n, parseInt(m[1])) : n;
  }, 0);
  return `PRES-${String(max + 1).padStart(4, '0')}-${year}`;
}

function calcularTotales(lineas, iva, descuento) {
  const subtotal = lineas.reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0);
  const desc = subtotal * ((parseFloat(descuento) || 0) / 100);
  const base = subtotal - desc;
  const ivaAmt = base * ((parseFloat(iva) || 0) / 100);
  return { subtotal, descAmt: desc, base, ivaAmt, total: base + ivaAmt };
}

async function exportarPDF(pres, negocio) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();

  const { subtotal, descAmt, base, ivaAmt, total } = calcularTotales(pres.lineas || [], pres.iva, pres.descuento);
  const negNombre = negocio?.name || 'Mi Negocio';
  const negEmail = negocio?.email || '';
  const negTelefono = negocio?.phone || '';
  const negWeb = negocio?.website || '';

  // Header
  doc.setFillColor(37, 211, 102);
  doc.rect(0, 0, 210, 8, 'F');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(negNombre, 14, 22);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (negEmail) doc.text(negEmail, 14, 29);
  if (negTelefono) doc.text(negTelefono, 14, 34);
  if (negWeb) doc.text(negWeb, 14, 39);

  // Número y fecha
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('PRESUPUESTO', 196, 22, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(pres.numero, 196, 30, { align: 'right' });
  doc.text(`Fecha: ${new Date(pres.created_at).toLocaleDateString('es-ES')}`, 196, 37, { align: 'right' });
  doc.text(`Válido: ${pres.validez_dias || 30} días`, 196, 44, { align: 'right' });

  // Destinatario
  doc.setDrawColor(230, 230, 230);
  doc.line(14, 48, 196, 48);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('PARA:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(pres.cliente_nombre || 'Cliente', 14, 62);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (pres.cliente_empresa) doc.text(pres.cliente_empresa, 14, 68);
  if (pres.cliente_email) doc.text(pres.cliente_email, 14, 73);

  // Tabla de líneas
  const rows = (pres.lineas || []).map(l => [
    l.descripcion,
    l.cantidad,
    `${parseFloat(l.precio || 0).toFixed(2)}€`,
    `${((parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0)).toFixed(2)}€`,
  ]);
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
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', rightX - 50, finalY); doc.text(`${subtotal.toFixed(2)}€`, rightX, finalY, { align: 'right' });
  if (descAmt > 0) {
    finalY += 6;
    doc.text(`Descuento (${pres.descuento}%):`, rightX - 50, finalY); doc.text(`-${descAmt.toFixed(2)}€`, rightX, finalY, { align: 'right' });
  }
  finalY += 6;
  doc.text(`IVA (${pres.iva}%):`, rightX - 50, finalY); doc.text(`${ivaAmt.toFixed(2)}€`, rightX, finalY, { align: 'right' });
  finalY += 2;
  doc.setDrawColor(37, 211, 102); doc.line(rightX - 60, finalY, rightX, finalY);
  finalY += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 20);
  doc.text('TOTAL:', rightX - 50, finalY); doc.text(`${total.toFixed(2)}€`, rightX, finalY, { align: 'right' });

  if (pres.notas) {
    finalY += 14;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
    doc.text('Notas y condiciones:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    finalY += 6;
    const lines = doc.splitTextToSize(pres.notas, 170);
    doc.text(lines, 14, finalY);
  }

  doc.save(`${pres.numero}.pdf`);
}

export default function Presupuestos() {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [negocio, setNegocio] = useState(null);
  const [form, setForm] = useState({
    numero: '', cliente_nombre: '', cliente_email: '', cliente_empresa: '',
    lineas: [{ ...LINE_EMPTY }], iva: 21, descuento: 0, validez_dias: 30, notas: '', estado: 'borrador',
  });

  useEffect(() => { if (user) { load(); loadNegocio(); } }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('presupuestos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setPresupuestos(data || []);
    setLoading(false);
  }

  async function loadNegocio() {
    const { data } = await supabase.from('businesses').select('*').eq('user_id', user.id).single();
    setNegocio(data);
  }

  function openNew() {
    const numero = generarNumero(presupuestos);
    setForm({ numero, cliente_nombre: '', cliente_email: '', cliente_empresa: '', lineas: [{ ...LINE_EMPTY }], iva: 21, descuento: 0, validez_dias: 30, notas: '', estado: 'borrador' });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({ ...p, lineas: p.lineas?.length ? p.lineas : [{ ...LINE_EMPTY }] });
    setEditing(p.id);
    setShowForm(true);
  }

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updLinea = (i, k, v) => { const ls = [...form.lineas]; ls[i] = { ...ls[i], [k]: v }; upd('lineas', ls); };
  const addLinea = () => upd('lineas', [...form.lineas, { ...LINE_EMPTY }]);
  const removeLinea = (i) => upd('lineas', form.lineas.filter((_, j) => j !== i));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, user_id: user.id, updated_at: new Date().toISOString() };
    if (editing) {
      await supabase.from('presupuestos').update(payload).eq('id', editing);
    } else {
      await supabase.from('presupuestos').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function cambiarEstado(id, estado) {
    await supabase.from('presupuestos').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
    load();
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    await supabase.from('presupuestos').delete().eq('id', id);
    load();
  }

  async function generarFactura(pres) {
    const { data: facts } = await supabase.from('facturas').select('numero').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    const maxF = (facts || []).reduce((n, f) => { const m = f.numero?.match(/FACT-(\d+)/); return m ? Math.max(n, parseInt(m[1])) : n; }, 0);
    const numeroF = `FACT-${String(maxF + 1).padStart(4, '0')}-${new Date().getFullYear()}`;
    const vence = new Date(); vence.setDate(vence.getDate() + 30);
    await supabase.from('facturas').insert({
      user_id: user.id, presupuesto_id: pres.id, numero: numeroF,
      cliente_nombre: pres.cliente_nombre, cliente_email: pres.cliente_email, cliente_empresa: pres.cliente_empresa,
      lineas: pres.lineas, iva: pres.iva, estado: 'pendiente',
      fecha_vencimiento: vence.toISOString().split('T')[0], notas: pres.notas,
    });
    alert(`Factura ${numeroF} creada correctamente`);
  }

  const totales = calcularTotales(form.lineas, form.iva, form.descuento);
  const totalPendiente = presupuestos.filter(p => p.estado === 'enviado' || p.estado === 'borrador').reduce((s, p) => s + calcularTotales(p.lineas || [], p.iva, p.descuento).total, 0);

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><FileText size={22} /> Presupuestos</h1>
          <p>Crea y gestiona tus presupuestos profesionales.</p>
        </div>
        <button className="btn btn--primary" onClick={openNew}><Plus size={14} /> Nuevo presupuesto</button>
      </div>

      {/* Stats rápidas */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}><FileText size={18} /></div>
          <div><span className="stat-card__value">{presupuestos.length}</span><span className="stat-card__label">Total</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><FileText size={18} /></div>
          <div><span className="stat-card__value">{presupuestos.filter(p => p.estado === 'enviado').length}</span><span className="stat-card__label">Enviados</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}><Check size={18} /></div>
          <div><span className="stat-card__value">{presupuestos.filter(p => p.estado === 'aceptado').length}</span><span className="stat-card__label">Aceptados</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366' }}><Receipt size={18} /></div>
          <div><span className="stat-card__value">{totalPendiente.toFixed(0)}€</span><span className="stat-card__label">Pendiente</span></div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>
      ) : presupuestos.length === 0 ? (
        <div className="empty-state">
          <FileText size={40} />
          <h3>Aún no tienes presupuestos</h3>
          <p>Crea tu primer presupuesto profesional en segundos.</p>
          <button className="btn btn--primary" onClick={openNew}><Plus size={14} /> Crear presupuesto</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                {['Número', 'Cliente', 'Importe', 'Estado', 'Fecha', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {presupuestos.map(p => {
                const { total } = calcularTotales(p.lineas || [], p.iva, p.descuento);
                const est = ESTADOS[p.estado] || ESTADOS.borrador;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700 }}>{p.numero}</td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.88rem' }}>
                      <div>{p.cliente_nombre || '—'}</div>
                      {p.cliente_empresa && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{p.cliente_empresa}</div>}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700 }}>{total.toFixed(2)}€</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <select value={p.estado} onChange={e => cambiarEstado(p.id, e.target.value)}
                        style={{ background: `${est.color}18`, color: est.color, border: `1px solid ${est.color}44`, borderRadius: 'var(--radius-full)', padding: '0.25rem 0.65rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                        {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(p.created_at).toLocaleDateString('es-ES')}</td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn--outline btn--sm" onClick={() => openEdit(p)} title="Editar"><Edit3 size={12} /></button>
                        <button className="btn btn--outline btn--sm" onClick={() => exportarPDF(p, negocio)} title="Exportar PDF"><Download size={12} /></button>
                        {p.estado === 'aceptado' && <button className="btn btn--outline btn--sm" onClick={() => generarFactura(p)} title="Crear factura"><Receipt size={12} /></button>}
                        <button className="btn btn--outline btn--sm" style={{ color: '#ef4444', borderColor: '#ef444433' }} onClick={() => eliminar(p.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Formulario */}
      {showForm && (
        <div className="cal-popup-overlay">
          <div className="cal-popup" style={{ width: '720px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="cal-popup__header">
              <h3>{editing ? 'Editar presupuesto' : 'Nuevo presupuesto'}</h3>
              <button className="cal-popup__close" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={save} style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="form-grid" style={{ marginBottom: '1.25rem' }}>
                <div className="form-field">
                  <label>Número *</label>
                  <input value={form.numero} onChange={e => upd('numero', e.target.value)} required />
                </div>
                <div className="form-field">
                  <label>Estado</label>
                  <select value={form.estado} onChange={e => upd('estado', e.target.value)} style={{ width: '100%', padding: '0.65rem 0.9rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                    {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Nombre del cliente *</label>
                  <input value={form.cliente_nombre} onChange={e => upd('cliente_nombre', e.target.value)} placeholder="María García" required />
                </div>
                <div className="form-field">
                  <label>Email</label>
                  <input type="email" value={form.cliente_email} onChange={e => upd('cliente_email', e.target.value)} placeholder="maria@empresa.com" />
                </div>
                <div className="form-field form-field--full">
                  <label>Empresa</label>
                  <input value={form.cliente_empresa} onChange={e => upd('cliente_empresa', e.target.value)} placeholder="Nombre de la empresa (opcional)" />
                </div>
              </div>

              {/* Líneas */}
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>SERVICIOS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {form.lineas.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <input value={l.descripcion} onChange={e => updLinea(i, 'descripcion', e.target.value)} placeholder="Descripción del servicio" style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem' }} />
                    </div>
                    <input type="number" min="1" value={l.cantidad} onChange={e => updLinea(i, 'cantidad', e.target.value)} placeholder="Cant." style={{ padding: '0.55rem 0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem', textAlign: 'center' }} />
                    <div style={{ position: 'relative' }}>
                      <input type="number" min="0" step="0.01" value={l.precio} onChange={e => updLinea(i, 'precio', e.target.value)} placeholder="Precio" style={{ width: '100%', padding: '0.55rem 0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.88rem', textAlign: 'right' }} />
                    </div>
                    <button type="button" onClick={() => removeLinea(i)} style={{ background: 'none', border: 'none', color: '#ef444488', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button type="button" className="btn btn--outline btn--sm" onClick={addLinea}><Plus size={12} /> Añadir línea</button>
              </div>

              {/* Totales y config */}
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-field">
                  <label>IVA (%)</label>
                  <input type="number" min="0" max="100" value={form.iva} onChange={e => upd('iva', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Descuento (%)</label>
                  <input type="number" min="0" max="100" value={form.descuento} onChange={e => upd('descuento', e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Validez (días)</label>
                  <input type="number" min="1" value={form.validez_dias} onChange={e => upd('validez_dias', e.target.value)} />
                </div>
              </div>

              {/* Resumen */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Subtotal: <strong>{totales.subtotal.toFixed(2)}€</strong></span>
                {totales.descAmt > 0 && <span>Descuento: <strong>-{totales.descAmt.toFixed(2)}€</strong></span>}
                <span>IVA ({form.iva}%): <strong>{totales.ivaAmt.toFixed(2)}€</strong></span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>TOTAL: {totales.total.toFixed(2)}€</span>
              </div>

              <div className="form-field" style={{ marginBottom: '1.5rem' }}>
                <label>Notas y condiciones</label>
                <textarea value={form.notas} onChange={e => upd('notas', e.target.value)} rows={3} placeholder="Condiciones de pago, garantías, plazos de entrega..." />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                  {editing ? 'Guardar cambios' : 'Crear presupuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
