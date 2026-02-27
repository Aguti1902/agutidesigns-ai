import { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Edit3, Download, Check, X, Loader2, AlertTriangle, FileSpreadsheet, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

async function exportarExcel(facturas, negocio) {
  const XLSX = await import('xlsx');
  const extra = (() => { try { return negocio?.extra_context ? JSON.parse(negocio.extra_context) : {}; } catch { return {}; } })();
  const negNombre = extra.fiscal_name || negocio?.name || 'Mi Negocio';
  const negNif = extra.fiscal_nif || '';

  // Filas principales
  const rows = facturas.map(f => {
    const { subtotal, ivaAmt, total } = calcularTotales(f.lineas, f.iva);
    return {
      'Número': f.numero || '',
      'Fecha emisión': f.created_at ? new Date(f.created_at).toLocaleDateString('es-ES') : '',
      'Fecha vencimiento': f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString('es-ES') : '',
      'Cliente': f.cliente_nombre || '',
      'Empresa cliente': f.cliente_empresa || '',
      'Email cliente': f.cliente_email || '',
      'Base imponible (€)': parseFloat(subtotal.toFixed(2)),
      'IVA %': parseFloat(f.iva) || 21,
      'Cuota IVA (€)': parseFloat(ivaAmt.toFixed(2)),
      'Total (€)': parseFloat(total.toFixed(2)),
      'Estado': { pendiente: 'Pendiente', pagada: 'Pagada', vencida: 'Vencida' }[f.estado] || f.estado,
      'Notas': f.notas || '',
    };
  });

  // Totales
  const totalBase = facturas.reduce((s, f) => s + calcularTotales(f.lineas, f.iva).subtotal, 0);
  const totalIva = facturas.reduce((s, f) => s + calcularTotales(f.lineas, f.iva).ivaAmt, 0);
  const totalTotal = facturas.reduce((s, f) => s + calcularTotales(f.lineas, f.iva).total, 0);
  const totalPagado = facturas.filter(f => f.estado === 'pagada').reduce((s, f) => s + calcularTotales(f.lineas, f.iva).total, 0);
  const totalPendiente = facturas.filter(f => f.estado !== 'pagada').reduce((s, f) => s + calcularTotales(f.lineas, f.iva).total, 0);

  rows.push({});
  rows.push({
    'Número': 'TOTALES',
    'Base imponible (€)': parseFloat(totalBase.toFixed(2)),
    'Cuota IVA (€)': parseFloat(totalIva.toFixed(2)),
    'Total (€)': parseFloat(totalTotal.toFixed(2)),
    'Estado': `Cobrado: ${totalPagado.toFixed(2)}€ | Pendiente: ${totalPendiente.toFixed(2)}€`,
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Anchos de columna
  ws['!cols'] = [
    { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 22 }, { wch: 26 },
    { wch: 18 }, { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 30 },
  ];

  // Hoja de resumen
  const resumenRows = [
    { 'Campo': 'Negocio', 'Valor': negNombre },
    { 'Campo': 'NIF/CIF', 'Valor': negNif },
    { 'Campo': 'Exportado el', 'Valor': new Date().toLocaleDateString('es-ES') },
    { 'Campo': '' },
    { 'Campo': 'Total facturas', 'Valor': facturas.length },
    { 'Campo': 'Facturas pagadas', 'Valor': facturas.filter(f => f.estado === 'pagada').length },
    { 'Campo': 'Facturas pendientes', 'Valor': facturas.filter(f => f.estado === 'pendiente').length },
    { 'Campo': 'Facturas vencidas', 'Valor': facturas.filter(f => f.estado === 'vencida').length },
    { 'Campo': '' },
    { 'Campo': 'Base imponible total', 'Valor': `${totalBase.toFixed(2)} €` },
    { 'Campo': 'IVA total', 'Valor': `${totalIva.toFixed(2)} €` },
    { 'Campo': 'Total facturado', 'Valor': `${totalTotal.toFixed(2)} €` },
    { 'Campo': 'Cobrado', 'Valor': `${totalPagado.toFixed(2)} €` },
    { 'Campo': 'Pendiente de cobro', 'Valor': `${totalPendiente.toFixed(2)} €` },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  wsResumen['!cols'] = [{ wch: 24 }, { wch: 22 }];

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
  XLSX.utils.book_append_sheet(wb, ws, 'Facturas');

  const año = new Date().getFullYear();
  XLSX.writeFile(wb, `Facturas_${negNombre.replace(/\s+/g, '_')}_${año}.xlsx`);
}

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

const PAYMENT_LABELS_F = { transferencia: 'Transferencia bancaria', bizum: 'Bizum', paypal: 'PayPal', tarjeta: 'Tarjeta (Stripe)', efectivo: 'Efectivo', facturacion_30: 'Facturación 30 días', facturacion_60: 'Facturación 60 días' };
const TERMS_LABELS_F = { '50_50': '50% al inicio · 50% a la entrega', '30_70': '30% reserva · 70% a la entrega', '100_inicio': '100% por adelantado', '100_entrega': '100% a la entrega', mensual: 'Pago mensual', personalizado: '' };

function parseFiscal(neg) {
  let extra = {};
  try { extra = neg?.extra_context ? JSON.parse(neg.extra_context) : {}; } catch {}
  const methodsRaw = extra.payment_methods_list;
  let methods = [];
  try { methods = Array.isArray(methodsRaw) ? methodsRaw : (methodsRaw ? JSON.parse(methodsRaw) : []); } catch {}
  const termsLabel = TERMS_LABELS_F[extra.payment_terms || ''] || extra.payment_custom_terms || extra.payment_methods || '';
  return {
    nombre: extra.fiscal_name || neg?.name || 'Mi Negocio',
    nif: extra.fiscal_nif || '',
    direccion: extra.fiscal_address || '',
    cp: extra.fiscal_cp || '',
    ciudad: extra.fiscal_city || '',
    iban: extra.fiscal_iban || '',
    logo: extra.logo || '',
    email: neg?.email || '',
    telefono: neg?.phone || '',
    web: neg?.website || '',
    bizum: extra.payment_bizum || '',
    paypal: extra.payment_paypal || '',
    methods,
    termsLabel,
  };
}

async function exportarPDF(fact, negocio) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
  const f = parseFiscal(negocio);
  const { subtotal, ivaAmt, total } = calcularTotales(fact.lineas, fact.iva);

  // ── Franja verde superior ──
  doc.setFillColor(37, 211, 102);
  doc.rect(0, 0, 210, 6, 'F');

  let leftY = 14;

  // ── Logo ──
  if (f.logo) {
    try {
      doc.addImage(f.logo, 'PNG', 14, leftY, 40, 20, '', 'FAST');
      leftY = 38;
    } catch {}
  }

  // ── Datos del emisor ──
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
  doc.text(f.nombre, 14, leftY);
  leftY += 5;
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(90, 90, 90);
  if (f.nif) { doc.text(`NIF/CIF: ${f.nif}`, 14, leftY); leftY += 4.5; }
  if (f.direccion) { doc.text(f.direccion, 14, leftY); leftY += 4.5; }
  if (f.cp || f.ciudad) { doc.text([f.cp, f.ciudad].filter(Boolean).join(' · '), 14, leftY); leftY += 4.5; }
  if (f.telefono) { doc.text(`Tel: ${f.telefono}`, 14, leftY); leftY += 4.5; }
  if (f.email) { doc.text(f.email, 14, leftY); leftY += 4.5; }
  if (f.web) { doc.text(f.web, 14, leftY); leftY += 4.5; }

  // ── Bloque derecho ──
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(120, 10, 76, 46, 2, 2, 'F');
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
  doc.text('FACTURA', 196, 22, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text(`Nº: ${fact.numero}`, 196, 30, { align: 'right' });
  doc.text(`Fecha: ${new Date(fact.created_at || Date.now()).toLocaleDateString('es-ES')}`, 196, 36, { align: 'right' });
  if (fact.fecha_vencimiento) doc.text(`Vencimiento: ${new Date(fact.fecha_vencimiento).toLocaleDateString('es-ES')}`, 196, 42, { align: 'right' });
  const estadoLabel = { pendiente: 'PENDIENTE', pagada: 'PAGADA', vencida: 'VENCIDA' }[fact.estado] || '';
  const estadoColor = { pendiente: [245, 158, 11], pagada: [37, 211, 102], vencida: [239, 68, 68] }[fact.estado] || [100, 100, 100];
  doc.setFillColor(...estadoColor);
  doc.roundedRect(148, 47, 48, 7, 1, 1, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
  doc.text(estadoLabel, 172, 52, { align: 'center' });

  // ── Separador ──
  const sepY = Math.max(leftY + 4, 58);
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.4);
  doc.line(14, sepY, 196, sepY);

  // ── Datos del cliente ──
  let clientY = sepY + 7;
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(150, 150, 150);
  doc.text('FACTURAR A:', 14, clientY);
  clientY += 5;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
  doc.text(fact.cliente_nombre || 'Cliente', 14, clientY);
  clientY += 5;
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  if (fact.cliente_empresa) { doc.text(fact.cliente_empresa, 14, clientY); clientY += 4.5; }
  if (fact.cliente_email) doc.text(fact.cliente_email, 14, clientY);

  // ── Tabla ──
  const tableY = clientY + 10;
  const rows = (fact.lineas || []).map(l => [
    l.descripcion, l.cantidad,
    `${parseFloat(l.precio || 0).toFixed(2)}€`,
    `${((parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0)).toFixed(2)}€`,
  ]);
  autoTable(doc, {
    startY: tableY,
    head: [['Descripción', 'Cant.', 'Precio unit.', 'Total']],
    body: rows,
    headStyles: { fillColor: [37, 211, 102], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: { 0: { cellWidth: 88 }, 1: { halign: 'center', cellWidth: 18 }, 2: { halign: 'right', cellWidth: 30 }, 3: { halign: 'right', cellWidth: 30 } },
    margin: { left: 14, right: 14 },
    tableLineColor: [230, 230, 230], tableLineWidth: 0.3,
  });

  // ── Totales ──
  let fy = (doc.lastAutoTable?.finalY || tableY + 30) + 6;
  const rx = 196;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(120, fy - 4, 76, 22, 2, 2, 'F');
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text('Base imponible:', 125, fy + 2); doc.text(`${subtotal.toFixed(2)}€`, rx, fy + 2, { align: 'right' });
  fy += 6;
  doc.text(`IVA (${fact.iva}%):`, 125, fy + 2); doc.text(`${ivaAmt.toFixed(2)}€`, rx, fy + 2, { align: 'right' });
  fy += 6;
  doc.setDrawColor(37, 211, 102); doc.setLineWidth(0.6);
  doc.line(120, fy, rx, fy);
  fy += 6;
  doc.setFillColor(37, 211, 102);
  doc.roundedRect(120, fy - 4, 76, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', 125, fy + 2); doc.text(`${total.toFixed(2)}€`, rx, fy + 2, { align: 'right' });

  // ── Notas ──
  if (fact.notas) {
    fy += 16;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
    doc.text('Notas:', 14, fy); doc.setFont('helvetica', 'normal'); fy += 5;
    doc.text(doc.splitTextToSize(fact.notas, 100), 14, fy);
  }

  // ── Pie con métodos de pago e IBAN ──
  const pageH = doc.internal.pageSize.height;
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(14, pageH - 30, 196, pageH - 30);
  let footY = pageH - 25;
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
  doc.text('DATOS DE PAGO', 14, footY);
  footY += 4;
  doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
  if (f.termsLabel) { doc.text(f.termsLabel, 14, footY); footY += 3.5; }
  if (f.iban) { doc.text(`IBAN: ${f.iban}`, 14, footY); }
  if (f.bizum) { doc.text(`Bizum: ${f.bizum}`, f.iban ? 105 : 14, footY); }
  if (f.paypal) { footY += 3.5; doc.text(`PayPal: ${f.paypal}`, 14, footY); }
  if (f.methods.length > 0) {
    const mStr = f.methods.map(m => PAYMENT_LABELS_F[m] || m).join(' · ');
    footY += 3.5; doc.text(`Métodos: ${mStr}`, 14, footY);
  }
  doc.text(`${f.nombre}${f.nif ? ` · NIF: ${f.nif}` : ''}`, 14, pageH - 5);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 196, pageH - 5, { align: 'right' });

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
  const [exportando, setExportando] = useState(false);
  const [filtroAño, setFiltroAño] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
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
    const { data } = await supabase.from('businesses').select('name,email,phone,website,extra_context').eq('user_id', user.id).single();
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

  // Años disponibles para filtrar
  const años = ['todos', ...Array.from(new Set(facturas.map(f => f.created_at ? new Date(f.created_at).getFullYear().toString() : null).filter(Boolean))).sort((a, b) => b - a)];

  // Facturas filtradas
  const facturasFiltradas = facturas.filter(f => {
    const matchAño = filtroAño === 'todos' || (f.created_at && new Date(f.created_at).getFullYear().toString() === filtroAño);
    const matchEstado = filtroEstado === 'todos' || f.estado === filtroEstado;
    return matchAño && matchEstado;
  });

  const pendienteTotal = facturasFiltradas.filter(f => f.estado === 'pendiente').reduce((s, f) => s + calcularTotales(f.lineas || [], f.iva).total, 0);
  const vencidasCount = facturasFiltradas.filter(f => f.estado === 'vencida').length;
  const totalFacturado = facturasFiltradas.reduce((s, f) => s + calcularTotales(f.lineas || [], f.iva).total, 0);

  async function handleExportExcel() {
    setExportando(true);
    await exportarExcel(facturasFiltradas, negocio);
    setExportando(false);
  }

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><Receipt size={22} /> Facturas</h1>
          <p>Controla tus facturas y cobros pendientes.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn btn--outline"
            onClick={handleExportExcel}
            disabled={exportando || facturasFiltradas.length === 0}
            title="Exportar a Excel para el gestor"
          >
            {exportando ? <Loader2 size={14} className="spin" /> : <FileSpreadsheet size={14} />}
            {exportando ? 'Generando...' : 'Exportar Excel'}
          </button>
          <button className="btn btn--primary" onClick={openNew}><Plus size={14} /> Nueva factura</button>
        </div>
      </div>

      {vencidasCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem' }}>
          <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem' }}><strong style={{ color: '#ef4444' }}>{vencidasCount} factura{vencidasCount > 1 ? 's' : ''} vencida{vencidasCount > 1 ? 's' : ''}</strong> — Revísalas y contacta con los clientes.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="fact-filters">
        <div className="fact-filters__group">
          <Filter size={13} />
          <span>Año:</span>
          {años.map(a => (
            <button key={a} type="button" className={`fact-filter-btn ${filtroAño === a ? 'fact-filter-btn--on' : ''}`} onClick={() => setFiltroAño(a)}>
              {a === 'todos' ? 'Todos' : a}
            </button>
          ))}
        </div>
        <div className="fact-filters__group">
          <span>Estado:</span>
          {[['todos','Todos'],['pendiente','Pendiente'],['pagada','Pagada'],['vencida','Vencida']].map(([v, l]) => (
            <button key={v} type="button" className={`fact-filter-btn ${filtroEstado === v ? 'fact-filter-btn--on' : ''}`} onClick={() => setFiltroEstado(v)}>
              {l}
            </button>
          ))}
        </div>
        {(filtroAño !== 'todos' || filtroEstado !== 'todos') && (
          <div className="fact-filters__total">
            <span>{facturasFiltradas.length} facturas · <strong>{totalFacturado.toFixed(2)}€</strong> total</span>
            <button type="button" onClick={() => { setFiltroAño('todos'); setFiltroEstado('todos'); }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline' }}>Limpiar filtros</button>
          </div>
        )}
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}><Receipt size={18} /></div><div><span className="stat-card__value">{facturasFiltradas.length}</span><span className="stat-card__label">Total</span></div></div>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Receipt size={18} /></div><div><span className="stat-card__value">{facturasFiltradas.filter(f => f.estado === 'pendiente').length}</span><span className="stat-card__label">Pendientes</span></div></div>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.1)', color: '#25D366' }}><Check size={18} /></div><div><span className="stat-card__value">{facturasFiltradas.filter(f => f.estado === 'pagada').length}</span><span className="stat-card__label">Pagadas</span></div></div>
        <div className="stat-card"><div className="stat-card__icon" style={{ background: 'rgba(37,211,102,0.08)', color: '#25D366' }}><Receipt size={18} /></div><div><span className="stat-card__value">{pendienteTotal.toFixed(0)}€</span><span className="stat-card__label">Por cobrar</span></div></div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>
      ) : facturasFiltradas.length === 0 ? (
        <div className="empty-state">
          <Receipt size={40} />
          <h3>{facturas.length === 0 ? 'Aún no tienes facturas' : 'No hay facturas con estos filtros'}</h3>
          <p>{facturas.length === 0 ? 'Crea tu primera factura o genera una desde un presupuesto aceptado.' : 'Prueba a cambiar los filtros de año o estado.'}</p>
          {facturas.length === 0 && <button className="btn btn--primary" onClick={openNew}><Plus size={14} /> Crear factura</button>}
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
              {facturasFiltradas.map(f => {
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
