import { useState, useEffect } from 'react';
import {
  Users, FileText, Receipt, MessageCircle, ChevronRight, Search,
  Loader2, TrendingUp, Repeat, Clock, Star, AlertCircle, Zap,
  Plus, X, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

/* ── Calcular lifecycle del cliente ── */
function getLifecycle(cliente) {
  const now = new Date();
  const ultima = cliente.ultima ? new Date(cliente.ultima) : null;
  const diasUltima = ultima ? Math.floor((now - ultima) / (1000 * 60 * 60 * 24)) : 999;

  if (cliente.facturas >= 2) return { id: 'recurrente', label: 'Recurrente', color: '#25D366', icon: <Repeat size={11} /> };
  if (cliente.facturas >= 1 && cliente.facturasEstado?.some(e => e === 'pagada')) return { id: 'entregado', label: 'Entregado', color: '#3b82f6', icon: <Star size={11} /> };
  if (cliente.facturasEstado?.some(e => e === 'pendiente') || cliente.presupuestosEstado?.some(e => e === 'aceptado')) return { id: 'activo', label: 'Cliente activo', color: '#8b5cf6', icon: <Zap size={11} /> };
  if (cliente.presupuestos > 0) return { id: 'prospecto', label: 'Prospecto', color: '#f59e0b', icon: <TrendingUp size={11} /> };
  if (diasUltima > 90) return { id: 'inactivo', label: 'Inactivo', color: '#555', icon: <Clock size={11} /> };
  return { id: 'lead', label: 'Lead', color: '#06b6d4', icon: <MessageCircle size={11} /> };
}

const LIFECYCLE_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'lead', label: 'Leads' },
  { id: 'prospecto', label: 'Prospectos' },
  { id: 'activo', label: 'Activos' },
  { id: 'entregado', label: 'Entregados' },
  { id: 'recurrente', label: 'Recurrentes' },
  { id: 'inactivo', label: 'Inactivos' },
];

function calcClienteTotal(presups, facts) {
  const totalFacts = (facts || []).reduce((s, f) => {
    const base = (f.lineas || []).reduce((t, l) => t + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0);
    return s + base * (1 + (parseFloat(f.iva) || 0) / 100);
  }, 0);
  return totalFacts;
}

export default function Clientes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detalle, setDetalle] = useState({ presupuestos: [], facturas: [] });
  const [filtro, setFiltro] = useState('todos');
  const [stats, setStats] = useState({ total: 0, leads: 0, activos: 0, recurrentes: 0, valorTotal: 0 });

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const agentRes = await supabase.from('agents').select('id').eq('user_id', user.id).single();
    const agentId = agentRes.data?.id || '00000000-0000-0000-0000-000000000000';

    const [{ data: presups }, { data: facts }, { data: convs }] = await Promise.all([
      supabase.from('presupuestos').select('cliente_nombre, cliente_email, cliente_empresa, created_at, estado, lineas, iva').eq('user_id', user.id),
      supabase.from('facturas').select('cliente_nombre, cliente_email, cliente_empresa, created_at, estado, lineas, iva').eq('user_id', user.id),
      supabase.from('conversations').select('contact_name, contact_phone, created_at').eq('agent_id', agentId),
    ]);

    const map = new Map();

    const upsert = (key, patch) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, { nombre: '', email: '', empresa: '', presupuestos: 0, facturas: 0, conversaciones: 0, ultima: '', presupuestosEstado: [], facturasEstado: [], lineasFacturas: [] });
      Object.assign(map.get(key), patch);
    };

    for (const p of presups || []) {
      const key = p.cliente_email || p.cliente_nombre;
      if (!key) continue;
      const cur = map.get(key);
      if (!cur) {
        upsert(key, { nombre: p.cliente_nombre, email: p.cliente_email, empresa: p.cliente_empresa, presupuestos: 1, presupuestosEstado: [p.estado], ultima: p.created_at });
      } else {
        cur.presupuestos++;
        cur.presupuestosEstado.push(p.estado);
        if (!cur.nombre && p.cliente_nombre) cur.nombre = p.cliente_nombre;
        if (!cur.empresa && p.cliente_empresa) cur.empresa = p.cliente_empresa;
        if (p.created_at > cur.ultima) cur.ultima = p.created_at;
      }
    }
    for (const f of facts || []) {
      const key = f.cliente_email || f.cliente_nombre;
      if (!key) continue;
      if (!map.has(key)) upsert(key, { nombre: f.cliente_nombre, email: f.cliente_email, empresa: f.cliente_empresa, presupuestos: 0, presupuestosEstado: [], ultima: f.created_at });
      const cur = map.get(key);
      cur.facturas++;
      cur.facturasEstado.push(f.estado);
      cur.lineasFacturas.push({ lineas: f.lineas, iva: f.iva, estado: f.estado });
      if (!cur.nombre && f.cliente_nombre) cur.nombre = f.cliente_nombre;
      if (!cur.empresa && f.cliente_empresa) cur.empresa = f.cliente_empresa;
      if (f.created_at > cur.ultima) cur.ultima = f.created_at;
    }
    for (const c of convs || []) {
      const key = c.contact_phone || c.contact_name;
      if (!key) continue;
      if (!map.has(key)) upsert(key, { nombre: c.contact_name || c.contact_phone, presupuestos: 0, presupuestosEstado: [], facturasEstado: [], lineasFacturas: [], ultima: c.created_at });
      const cur = map.get(key);
      cur.conversaciones++;
      if (c.created_at > cur.ultima) cur.ultima = c.created_at;
    }

    const all = Array.from(map.values()).sort((a, b) => new Date(b.ultima) - new Date(a.ultima));

    // Calcular stats
    const valorTotal = all.reduce((s, c) => {
      const pags = c.lineasFacturas.filter(f => f.estado === 'pagada');
      return s + calcClienteTotal([], pags);
    }, 0);
    setStats({
      total: all.length,
      leads: all.filter(c => getLifecycle(c).id === 'lead').length,
      activos: all.filter(c => ['activo', 'prospecto'].includes(getLifecycle(c).id)).length,
      recurrentes: all.filter(c => getLifecycle(c).id === 'recurrente').length,
      valorTotal,
    });
    setClientes(all);
    setLoading(false);
  }

  async function loadDetalle(cliente) {
    setSelected(cliente);
    const [{ data: ps }, { data: fs }] = await Promise.all([
      supabase.from('presupuestos').select('*').eq('user_id', user.id).or(`cliente_email.eq.${cliente.email || 'null'},cliente_nombre.eq.${cliente.nombre || 'null'}`).order('created_at', { ascending: false }),
      supabase.from('facturas').select('*').eq('user_id', user.id).or(`cliente_email.eq.${cliente.email || 'null'},cliente_nombre.eq.${cliente.nombre || 'null'}`).order('created_at', { ascending: false }),
    ]);
    setDetalle({ presupuestos: ps || [], facturas: fs || [] });
  }

  function crearPresupuesto(cliente, tipo = '') {
    const params = new URLSearchParams({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      empresa: cliente.empresa || '',
      ...(tipo ? { servicio: tipo } : {}),
    });
    navigate(`/app/presupuestos?new=1&${params.toString()}`);
  }

  const filtered = clientes.filter(c => {
    const lc = getLifecycle(c);
    const matchFiltro = filtro === 'todos' || lc.id === filtro;
    const matchSearch = !search ||
      (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.empresa || '').toLowerCase().includes(search.toLowerCase());
    return matchFiltro && matchSearch;
  });

  const valorCliente = (c) => calcClienteTotal([], c.lineasFacturas.filter(f => f.estado === 'pagada'));

  return (
    <div className="page">
      <div className="page__header">
        <h1><Users size={22} /> Clientes</h1>
        <p>Ciclo de vida de cada cliente con historial completo.</p>
      </div>

      {/* Stats de clientes */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        {[
          { v: stats.total, l: 'Total clientes', c: '#25D366' },
          { v: stats.leads, l: 'Leads activos', c: '#06b6d4' },
          { v: stats.activos, l: 'En pipeline', c: '#f59e0b' },
          { v: stats.recurrentes, l: 'Recurrentes', c: '#8b5cf6' },
          { v: stats.valorTotal > 0 ? `${Math.round(stats.valorTotal).toLocaleString('es-ES')}€` : '—', l: 'Facturado (pagado)', c: '#25D366' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card__icon" style={{ color: s.c, background: `${s.c}15` }}><Users size={16} /></div>
            <div><span className="stat-card__value">{s.v}</span><span className="stat-card__label">{s.l}</span></div>
          </div>
        ))}
      </div>

      {/* Filtros de lifecycle */}
      <div className="cl-filters">
        {LIFECYCLE_FILTERS.map(f => (
          <button key={f.id} type="button" className={`cl-filter ${filtro === f.id ? 'cl-filter--on' : ''}`} onClick={() => setFiltro(f.id)}>
            {f.label}
            <span className="cl-filter__count">{f.id === 'todos' ? clientes.length : clientes.filter(c => getLifecycle(c).id === f.id).length}</span>
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o empresa..." style={{ width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={14} /></button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1rem' }}>
        {/* Lista */}
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Users size={36} /><h3>No hay clientes{filtro !== 'todos' ? ` en "${LIFECYCLE_FILTERS.find(f => f.id === filtro)?.label}"` : ''}</h3><p>Los clientes aparecen al crear presupuestos, facturas o tener conversaciones de WhatsApp.</p></div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {filtered.map((c, i) => {
                const lc = getLifecycle(c);
                const val = valorCliente(c);
                return (
                  <button key={i} onClick={() => loadDetalle(c)} className="cl-row" style={{ background: selected?.nombre === c.nombre && selected?.email === c.email ? 'var(--bg-secondary)' : undefined }}>
                    <div className="cl-row__av">{(c.nombre || '?')[0].toUpperCase()}</div>
                    <div className="cl-row__info">
                      <div className="cl-row__top">
                        <b>{c.nombre || c.email || '—'}</b>
                        <span className="cl-badge" style={{ background: `${lc.color}18`, color: lc.color, borderColor: `${lc.color}33` }}>
                          {lc.icon} {lc.label}
                        </span>
                      </div>
                      {c.empresa && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{c.empresa}</div>}
                      <div className="cl-row__meta">
                        {c.presupuestos > 0 && <span style={{ color: '#f59e0b' }}><FileText size={10} /> {c.presupuestos}</span>}
                        {c.facturas > 0 && <span style={{ color: '#25D366' }}><Receipt size={10} /> {c.facturas}</span>}
                        {c.conversaciones > 0 && <span style={{ color: '#3b82f6' }}><MessageCircle size={10} /> {c.conversaciones}</span>}
                        {val > 0 && <span style={{ color: '#25D366', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{Math.round(val).toLocaleString('es-ES')}€</span>}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalle del cliente */}
        {selected && (
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
                    {(selected.nombre || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>{selected.nombre}</div>
                    {selected.empresa && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{selected.empresa}</div>}
                    {selected.email && <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{selected.email}</div>}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0.25rem' }}><X size={16} /></button>
              </div>

              {/* Lifecycle badge grande */}
              {(() => {
                const lc = getLifecycle(selected);
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.85rem', background: `${lc.color}12`, border: `1px solid ${lc.color}33`, borderRadius: '999px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: lc.color, marginBottom: '1rem' }}>
                    {lc.icon} {lc.label}
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                {[
                  { v: selected.presupuestos, l: 'Presupuestos', c: '#f59e0b' },
                  { v: selected.facturas, l: 'Facturas', c: '#25D366' },
                  { v: valorCliente(selected) > 0 ? `${Math.round(valorCliente(selected)).toLocaleString('es-ES')}€` : '—', l: 'Facturado', c: '#25D366' },
                ].map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.65rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Acciones de upsell */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>Acciones rápidas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <button className="cl-action" onClick={() => crearPresupuesto(selected)}>
                    <Plus size={13} /> Nuevo presupuesto
                  </button>
                  <button className="cl-action" onClick={() => crearPresupuesto(selected, 'Mantenimiento mensual web')}>
                    <Repeat size={13} /> Proponer mantenimiento
                  </button>
                  <button className="cl-action" onClick={() => crearPresupuesto(selected, 'SEO on-page y posicionamiento')}>
                    <TrendingUp size={13} /> Proponer SEO
                  </button>
                  <button className="cl-action" onClick={() => crearPresupuesto(selected, 'Rediseño web')}>
                    <Zap size={13} /> Proponer rediseño
                  </button>
                </div>
              </div>
            </div>

            {/* Presupuestos del cliente */}
            {detalle.presupuestos.length > 0 && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>PRESUPUESTOS</h4>
                  <Link to="/app/presupuestos" style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Ver todos <ArrowRight size={11} /></Link>
                </div>
                {detalle.presupuestos.map(p => {
                  const total = (p.lineas || []).reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0) * (1 + (p.iva || 0) / 100);
                  const col = { borrador: '#666', enviado: '#f59e0b', aceptado: '#25D366', rechazado: '#ef4444' }[p.estado] || '#666';
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
                      <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem' }}>{p.numero}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{new Date(p.created_at).toLocaleDateString('es-ES')}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{total.toFixed(0)}€</div><div style={{ fontSize: '0.62rem', color: col, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.estado}</div></div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Facturas del cliente */}
            {detalle.facturas.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>FACTURAS</h4>
                  <Link to="/app/facturas" style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>Ver todas <ArrowRight size={11} /></Link>
                </div>
                {detalle.facturas.map(f => {
                  const total = (f.lineas || []).reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0) * (1 + (f.iva || 0) / 100);
                  const col = { pagada: '#25D366', pendiente: '#f59e0b', vencida: '#ef4444' }[f.estado] || '#666';
                  return (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.82rem' }}>
                      <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem' }}>{f.numero}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{new Date(f.created_at).toLocaleDateString('es-ES')}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{total.toFixed(0)}€</div><div style={{ fontSize: '0.62rem', color: col, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{f.estado}</div></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
