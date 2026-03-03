import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit3, Download, Check, X, ChevronDown, Loader2, Receipt, ArrowRight, Copy, Layers, Zap, Star, Crown } from 'lucide-react';
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

function calcularTotales(lineas, iva, descuento, irpf = 0) {
  const subtotal = lineas.reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0);
  const desc = subtotal * ((parseFloat(descuento) || 0) / 100);
  const base = subtotal - desc;
  const ivaAmt = base * ((parseFloat(iva) || 0) / 100);
  const irpfAmt = base * ((parseFloat(irpf) || 0) / 100);
  return { subtotal, descAmt: desc, base, ivaAmt, irpfAmt, total: base + ivaAmt - irpfAmt };
}

const PAYMENT_LABELS = { transferencia: 'Transferencia bancaria', bizum: 'Bizum', paypal: 'PayPal', tarjeta: 'Tarjeta (Stripe)', efectivo: 'Efectivo', facturacion_30: 'Facturación 30 días', facturacion_60: 'Facturación 60 días' };
const TERMS_LABELS = { '50_50': '50% al inicio del proyecto · 50% a la entrega', '30_70': '30% de reserva · 70% a la entrega', '100_inicio': '100% por adelantado', '100_entrega': '100% a la entrega', mensual: 'Pago mensual', personalizado: '' };

function parseFiscal(neg) {
  let extra = {};
  try { extra = neg?.extra_context ? JSON.parse(neg.extra_context) : {}; } catch {}
  const methodsRaw = extra.payment_methods_list;
  let methods = [];
  try { methods = Array.isArray(methodsRaw) ? methodsRaw : (methodsRaw ? JSON.parse(methodsRaw) : []); } catch {}
  const termsKey = extra.payment_terms || '';
  const termsLabel = TERMS_LABELS[termsKey] || extra.payment_custom_terms || extra.payment_methods || '';
  return {
    nombre: extra.fiscal_name || neg?.name || 'Mi Negocio',
    nif: extra.fiscal_nif || '',
    direccion: extra.fiscal_address || '',
    cp: extra.fiscal_cp || '',
    ciudad: extra.fiscal_city || '',
    pais: extra.fiscal_country || 'España',
    iban: extra.fiscal_iban || '',
    logo: extra.logo || '',
    email: neg?.email || '',
    telefono: neg?.phone || '',
    web: neg?.website || '',
    bizum: extra.payment_bizum || '',
    paypal: extra.payment_paypal || '',
    stripeLink: extra.payment_stripe_link || '',
    methods,
    termsLabel,
    paymentNotes: extra.payment_custom_terms || extra.payment_notes || '',
  };
}

async function exportarPDF(pres, negocio) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
  const f = parseFiscal(negocio);
  const { subtotal, descAmt, base, ivaAmt, irpfAmt, total } = calcularTotales(pres.lineas || [], pres.iva, pres.descuento, pres.irpf || 0);

  // ── Franja verde superior ──
  doc.setFillColor(37, 211, 102);
  doc.rect(0, 0, 210, 6, 'F');

  let leftY = 14;

  // ── Logo (si existe) ──
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

  // ── Bloque derecho: tipo y número ──
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(120, 10, 76, 42, 2, 2, 'F');
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
  doc.text('PRESUPUESTO', 196, 22, { align: 'right' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text(`Nº: ${pres.numero}`, 196, 30, { align: 'right' });
  doc.text(`Fecha: ${new Date(pres.created_at || Date.now()).toLocaleDateString('es-ES')}`, 196, 36, { align: 'right' });
  doc.text(`Válido: ${pres.validez_dias || 30} días`, 196, 42, { align: 'right' });

  // ── Separador ──
  const sepY = Math.max(leftY + 4, 56);
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.4);
  doc.line(14, sepY, 196, sepY);

  // ── Destinatario ──
  let clientY = sepY + 7;
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(150, 150, 150);
  doc.text('PRESUPUESTO PARA:', 14, clientY);
  clientY += 5;
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
  doc.text(pres.cliente_nombre || 'Cliente', 14, clientY);
  clientY += 5;
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  if (pres.cliente_empresa) { doc.text(pres.cliente_empresa, 14, clientY); clientY += 4.5; }
  if (pres.cliente_email) { doc.text(pres.cliente_email, 14, clientY); }

  // ── Tabla líneas ──
  const tableY = clientY + 10;
  const rows = (pres.lineas || []).map(l => [
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
  const irpfAplicado = (parseFloat(pres.irpf) || 0) > 0;
  const boxRows = 2 + (descAmt > 0 ? 1 : 0) + (irpfAplicado ? 1 : 0);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(120, fy - 4, 76, boxRows * 6 + 4, 2, 2, 'F');
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
  doc.text('Base imponible:', 125, fy + 2); doc.text(`${subtotal.toFixed(2)}€`, rx, fy + 2, { align: 'right' });
  if (descAmt > 0) {
    fy += 6;
    doc.text(`Descuento (${pres.descuento}%):`, 125, fy + 2); doc.text(`-${descAmt.toFixed(2)}€`, rx, fy + 2, { align: 'right' });
  }
  fy += 6;
  doc.text(`IVA (${pres.iva || 0}%):`, 125, fy + 2); doc.text(`+${ivaAmt.toFixed(2)}€`, rx, fy + 2, { align: 'right' });
  if (irpfAplicado) {
    fy += 6;
    doc.setTextColor(180, 60, 60);
    doc.text(`IRPF (${pres.irpf}%) retención:`, 125, fy + 2); doc.text(`-${irpfAmt.toFixed(2)}€`, rx, fy + 2, { align: 'right' });
    doc.setTextColor(80, 80, 80);
  }
  fy += 6;
  doc.setDrawColor(37, 211, 102); doc.setLineWidth(0.6);
  doc.line(120, fy, rx, fy);
  fy += 6;
  doc.setFillColor(37, 211, 102);
  doc.roundedRect(120, fy - 4, 76, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text('TOTAL A COBRAR:', 125, fy + 2); doc.text(`${total.toFixed(2)}€`, rx, fy + 2, { align: 'right' });
  if (irpfAplicado) {
    fy += 10;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(130, 130, 130);
    doc.text(`* IRPF retenido (${irpfAmt.toFixed(2)}€) ingresado a Hacienda por el cliente (Modelo 111).`, 120, fy + 2);
  }

  // ── Notas ──
  if (pres.notas) {
    fy += 16;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
    doc.text('Notas y condiciones:', 14, fy);
    doc.setFont('helvetica', 'normal'); fy += 5;
    doc.text(doc.splitTextToSize(pres.notas, 100), 14, fy);
  }

  // ── Pie: condiciones de pago y datos bancarios ──
  const pageH = doc.internal.pageSize.height;
  const hasPaymentInfo = f.iban || f.bizum || f.termsLabel || f.methods.length > 0;
  if (hasPaymentInfo) {
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(14, pageH - 28, 196, pageH - 28);
    let footY = pageH - 23;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
    doc.text('CONDICIONES DE PAGO', 14, footY);
    footY += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120);
    if (f.termsLabel) { doc.text(f.termsLabel, 14, footY); footY += 4; }
    if (f.methods.length > 0) {
      const mStr = f.methods.map(m => PAYMENT_LABELS[m] || m).join(' · ');
      doc.text(`Métodos aceptados: ${mStr}`, 14, footY); footY += 4;
    }
    if (f.iban) doc.text(`IBAN: ${f.iban}`, 14, footY);
    if (f.bizum) doc.text(`Bizum: ${f.bizum}`, f.iban ? 100 : 14, footY);
    if (f.paypal) { footY += 4; doc.text(`PayPal: ${f.paypal}`, 14, footY); }
  }

  doc.save(`${pres.numero}.pdf`);
}

/* ── Generador de 3 paquetes ── */
const PAQUETES_CONFIG = {
  basico:      { label: 'Básico',      Icon: Zap,   color: '#6b7280', multi: 1.0, desc: 'Lo esencial para empezar', badge: 'Económico' },
  profesional: { label: 'Profesional', Icon: Star,  color: '#3b82f6', multi: 1.55, desc: 'Equilibrio calidad-precio', badge: 'Más popular' },
  premium:     { label: 'Premium',     Icon: Crown, color: '#f59e0b', multi: 2.1, desc: 'Solución completa y avanzada', badge: 'Máximo valor' },
};

function ModalTresPaquetes({ onClose, onGenerar, baseLineas, baseIva, clienteNombre, numeroBase }) {
  const [extras, setExtras] = useState({ seo: false, copywriting: false, mantenimiento: false, analytics: false, social: false, disenoPersonalizado: false });
  const [precioSeo, setPrecioSeo] = useState(350);
  const [precioCopy, setPrecioCopy] = useState(250);
  const [precioMant, setPrecioMant] = useState(60);
  const [precioAnalytics, setPrecioAnalytics] = useState(120);

  const toggleExtra = (k) => setExtras(p => ({ ...p, [k]: !p[k] }));

  const buildLineas = (paquete) => {
    const m = PAQUETES_CONFIG[paquete].multi;
    const lineasBase = baseLineas.map(l => ({ ...l, precio: Math.round(parseFloat(l.precio || 0) * m) }));
    const lineasExtras = [];
    if (paquete !== 'basico') {
      if (extras.seo && paquete === 'premium') lineasExtras.push({ descripcion: 'SEO on-page + estrategia de contenidos', cantidad: 1, precio: Math.round(precioSeo * m) });
      if (extras.copywriting) lineasExtras.push({ descripcion: 'Copywriting profesional (textos web)', cantidad: 1, precio: Math.round(precioCopy * m) });
      if (extras.analytics && paquete === 'premium') lineasExtras.push({ descripcion: 'Configuración Google Analytics + Tag Manager', cantidad: 1, precio: Math.round(precioAnalytics * m) });
    }
    if (extras.mantenimiento) lineasExtras.push({ descripcion: paquete === 'premium' ? 'Mantenimiento premium 6 meses' : 'Mantenimiento básico 3 meses', cantidad: 1, precio: Math.round(precioMant * (paquete === 'premium' ? 6 : 3)) });
    return [...lineasBase, ...lineasExtras];
  };

  const calcTotal = (paquete) => {
    const ls = buildLineas(paquete);
    return ls.reduce((s, l) => s + (parseFloat(l.cantidad) || 1) * (parseFloat(l.precio) || 0), 0) * (1 + baseIva / 100);
  };

  return (
    <div className="cal-popup-overlay">
      <div className="cal-popup" style={{ width: '720px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
        <div className="cal-popup__header">
          <h3><Layers size={16} /> Generar 3 paquetes automáticos</h3>
          <button className="cal-popup__close" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ padding: '1.25rem 1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Basado en tus líneas de servicio, generaré 3 presupuestos: <strong>Básico</strong> (precio base), <strong>Profesional</strong> (+55%) y <strong>Premium</strong> (+110%). El precio alto ancla la percepción de valor.
          </p>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', display: 'block' }}>Extras opcionales por paquete:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {[
                { key: 'seo', label: 'SEO on-page', price: precioSeo, setPrice: setPrecioSeo, note: 'Solo en Pro y Premium' },
                { key: 'copywriting', label: 'Copywriting', price: precioCopy, setPrice: setPrecioCopy, note: 'En Pro y Premium' },
                { key: 'mantenimiento', label: 'Mantenimiento', price: precioMant, setPrice: setPrecioMant, note: '3 meses básico / 6 meses premium' },
                { key: 'analytics', label: 'Analytics + GTM', price: precioAnalytics, setPrice: setPrecioAnalytics, note: 'Solo en Premium' },
              ].map(ex => (
                <div key={ex.key} className={`paquete-extra ${extras[ex.key] ? 'paquete-extra--on' : ''}`} onClick={() => toggleExtra(ex.key)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700 }}>{ex.label}</span>
                    <div className={`ai-toggle ${extras[ex.key] ? 'ai-toggle--on' : ''}`} style={{ width: 32, height: 18, flexShrink: 0 }} onClick={e => { e.stopPropagation(); toggleExtra(ex.key); }}>
                      <span className="ai-toggle__knob" style={{ width: 12, height: 12, top: 2, left: extras[ex.key] ? 16 : 2 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{ex.note}</span>
                  {extras[ex.key] && (
                    <input type="number" value={ex.price} onChange={e => ex.setPrice(Number(e.target.value))} onClick={e => e.stopPropagation()} style={{ marginTop: '0.35rem', width: '100%', padding: '0.3rem 0.5rem', background: 'var(--bg-body)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', fontSize: '0.8rem' }} placeholder="Precio €" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Preview de 3 paquetes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {(['basico', 'profesional', 'premium']).map(pkg => {
              const p = PAQUETES_CONFIG[pkg];
              const total = calcTotal(pkg);
              const ls = buildLineas(pkg);
              return (
                <div key={pkg} className={`paquete-preview ${pkg === 'profesional' ? 'paquete-preview--featured' : ''}`} style={{ '--pkg-color': p.color }}>
                  <div className="paquete-preview__head">
                    <p.Icon size={18} style={{ color: p.color }} />
                    <strong>{p.label}</strong>
                    <span className="paquete-preview__badge" style={{ background: `${p.color}20`, color: p.color }}>{p.badge}</span>
                  </div>
                  <div className="paquete-preview__price">{Math.round(total).toLocaleString('es-ES')}€</div>
                  <div className="paquete-preview__lines">
                    {ls.slice(0, 3).map((l, i) => <div key={i} className="paquete-preview__line"><Check size={11} /> {l.descripcion}</div>)}
                    {ls.length > 3 && <div className="paquete-preview__line" style={{ color: 'var(--text-tertiary)' }}>+{ls.length - 3} más...</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button className="btn btn--outline" onClick={onClose}>Cancelar</button>
            <button className="btn btn--primary" onClick={() => onGenerar({ buildLineas, baseIva, clienteNombre, numeroBase })}>
              <Layers size={14} /> Generar los 3 presupuestos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Presupuestos() {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPaquetes, setShowPaquetes] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [negocio, setNegocio] = useState(null);
  const [negocioDefaults, setNegocioDefaults] = useState({ iva: 21, irpf: 0 });
  const [form, setForm] = useState({
    numero: '', cliente_nombre: '', cliente_email: '', cliente_empresa: '',
    lineas: [{ ...LINE_EMPTY }], iva: 21, irpf: 0, descuento: 0, validez_dias: 30, notas: '', estado: 'borrador',
  });

  useEffect(() => { if (user) { load(); loadNegocio(); } }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('presupuestos').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setPresupuestos(data || []);
    setLoading(false);
  }

  async function loadNegocio() {
    const { data } = await supabase.from('businesses').select('name,email,phone,website,extra_context').eq('user_id', user.id).single();
    setNegocio(data);
    if (data?.extra_context) {
      try {
        const ex = JSON.parse(data.extra_context);
        const defaults = { iva: parseInt(ex.iva_default || '21'), irpf: parseInt(ex.irpf_default || '0') };
        setNegocioDefaults(defaults);
        setForm(f => ({ ...f, iva: defaults.iva, irpf: defaults.irpf }));
      } catch {}
    }
  }

  function openNew() {
    const numero = generarNumero(presupuestos);
    setForm({ numero, cliente_nombre: '', cliente_email: '', cliente_empresa: '', lineas: [{ ...LINE_EMPTY }], iva: negocioDefaults.iva, irpf: negocioDefaults.irpf, descuento: 0, validez_dias: 30, notas: '', estado: 'borrador' });
    setEditing(null);
    setShowForm(true);
  }

  async function generarTresPaquetes({ buildLineas, baseIva, clienteNombre, numeroBase }) {
    const paquetes = ['basico', 'profesional', 'premium'];
    for (let i = 0; i < paquetes.length; i++) {
      const pkg = paquetes[i];
      const cfg = PAQUETES_CONFIG[pkg];
      const lineas = buildLineas(pkg);
      const numero = generarNumero([...presupuestos, ...paquetes.slice(0, i).map((_, j) => ({ numero: `PRES-${String(9990 + j).padStart(4, '0')}-2099` }))]);
      const notas = `Paquete ${cfg.label} — ${cfg.desc}. ${cfg.badge}.`;
      const payload = {
        user_id: user.id, numero, estado: 'borrador',
        cliente_nombre: clienteNombre || '', cliente_email: '', cliente_empresa: '',
        lineas, iva: baseIva, descuento: 0, validez_dias: 30, notas,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('presupuestos').insert(payload);
    }
    setShowPaquetes(false);
    load();
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

  const totales = calcularTotales(form.lineas, form.iva, form.descuento, form.irpf);
  const totalPendiente = presupuestos.filter(p => p.estado === 'enviado' || p.estado === 'borrador').reduce((s, p) => s + calcularTotales(p.lineas || [], p.iva, p.descuento, p.irpf || 0).total, 0);

  return (
    <div className="page">
      <div className="page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1><FileText size={22} /> Presupuestos</h1>
          <p>Crea y gestiona tus presupuestos profesionales.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn--outline" onClick={() => setShowPaquetes(true)} title="Generar Básico + Profesional + Premium automáticamente">
            <Layers size={14} /> 3 Paquetes
          </button>
          <button className="btn btn--primary" onClick={openNew}><Plus size={14} /> Nuevo presupuesto</button>
        </div>
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
                const { total } = calcularTotales(p.lineas || [], p.iva, p.descuento, p.irpf || 0);
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

              {/* Impuestos y config */}
              <div className="form-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-field">
                  <label>IVA (%)</label>
                  <div className="chips" style={{ flexWrap: 'wrap' }}>
                    {['0','4','10','21'].map(v => (
                      <button key={v} type="button" className={`chip ${String(form.iva) === v ? 'chip--active' : ''}`} onClick={() => upd('iva', v)}>{v}%</button>
                    ))}
                  </div>
                </div>
                <div className="form-field">
                  <label>IRPF — retención (%)</label>
                  <div className="chips" style={{ flexWrap: 'wrap' }}>
                    {['0','7','15','19'].map(v => (
                      <button key={v} type="button" className={`chip ${String(form.irpf || 0) === v ? 'chip--active' : ''}`} onClick={() => upd('irpf', v)}>{v}%{v === '0' ? ' (no aplica)' : ''}</button>
                    ))}
                  </div>
                  <span className="form-field__hint">El cliente retiene este % y lo ingresa a Hacienda. Reduce lo que cobras.</span>
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
                <span>Base imponible: <strong>{totales.subtotal.toFixed(2)}€</strong></span>
                {totales.descAmt > 0 && <span>Descuento: <strong>-{totales.descAmt.toFixed(2)}€</strong></span>}
                <span>+ IVA ({form.iva || 0}%): <strong style={{ color: '#25D366' }}>+{totales.ivaAmt.toFixed(2)}€</strong></span>
                {(parseFloat(form.irpf) || 0) > 0 && (
                  <span>– IRPF ({form.irpf}%) retención: <strong style={{ color: '#ef4444' }}>-{totales.irpfAmt.toFixed(2)}€</strong></span>
                )}
                <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>TOTAL A COBRAR: {totales.total.toFixed(2)}€</span>
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

      {/* Modal 3 Paquetes */}
      {showPaquetes && (
        <ModalTresPaquetes
          onClose={() => setShowPaquetes(false)}
          onGenerar={generarTresPaquetes}
          baseLineas={[{ descripcion: 'Diseño y desarrollo web', cantidad: 1, precio: 800 }]}
          baseIva={21}
          clienteNombre=""
          numeroBase={generarNumero(presupuestos)}
        />
      )}
    </div>
  );
}
