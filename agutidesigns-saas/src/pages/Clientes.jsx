import { useState, useEffect } from 'react';
import { Users, FileText, Receipt, MessageCircle, ChevronRight, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

export default function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detalle, setDetalle] = useState({ presupuestos: [], facturas: [], conversaciones: [] });

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const [{ data: presups }, { data: facts }, { data: convs }] = await Promise.all([
      supabase.from('presupuestos').select('cliente_nombre, cliente_email, cliente_empresa, created_at').eq('user_id', user.id),
      supabase.from('facturas').select('cliente_nombre, cliente_email, cliente_empresa, created_at').eq('user_id', user.id),
      supabase.from('conversations').select('contact_name, contact_phone, created_at').eq('agent_id', (await supabase.from('agents').select('id').eq('user_id', user.id).single()).data?.id || '00000000-0000-0000-0000-000000000000'),
    ]);

    const map = new Map();
    for (const p of presups || []) {
      if (!p.cliente_email && !p.cliente_nombre) continue;
      const key = p.cliente_email || p.cliente_nombre;
      if (!map.has(key)) map.set(key, { nombre: p.cliente_nombre, email: p.cliente_email, empresa: p.cliente_empresa, presupuestos: 0, facturas: 0, conversaciones: 0, ultima: p.created_at });
      map.get(key).presupuestos++;
      if (p.created_at > map.get(key).ultima) map.get(key).ultima = p.created_at;
    }
    for (const f of facts || []) {
      if (!f.cliente_email && !f.cliente_nombre) continue;
      const key = f.cliente_email || f.cliente_nombre;
      if (!map.has(key)) map.set(key, { nombre: f.cliente_nombre, email: f.cliente_email, empresa: f.cliente_empresa, presupuestos: 0, facturas: 0, conversaciones: 0, ultima: f.created_at });
      else { map.get(key).empresa = map.get(key).empresa || f.cliente_empresa; }
      map.get(key).facturas++;
      if (f.created_at > map.get(key).ultima) map.get(key).ultima = f.created_at;
    }
    for (const c of convs || []) {
      const key = c.contact_phone || c.contact_name;
      if (!map.has(key)) map.set(key, { nombre: c.contact_name || c.contact_phone, email: '', empresa: '', presupuestos: 0, facturas: 0, conversaciones: 0, ultima: c.created_at });
      map.get(key).conversaciones++;
      if (c.created_at > map.get(key).ultima) map.get(key).ultima = c.created_at;
    }

    setClientes(Array.from(map.values()).sort((a, b) => new Date(b.ultima) - new Date(a.ultima)));
    setLoading(false);
  }

  async function loadDetalle(cliente) {
    setSelected(cliente);
    const [{ data: ps }, { data: fs }] = await Promise.all([
      supabase.from('presupuestos').select('*').eq('user_id', user.id).or(`cliente_email.eq.${cliente.email || ''},cliente_nombre.eq.${cliente.nombre || ''}`).order('created_at', { ascending: false }),
      supabase.from('facturas').select('*').eq('user_id', user.id).or(`cliente_email.eq.${cliente.email || ''},cliente_nombre.eq.${cliente.nombre || ''}`).order('created_at', { ascending: false }),
    ]);
    setDetalle({ presupuestos: ps || [], facturas: fs || [] });
  }

  const filtered = clientes.filter(c =>
    (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.empresa || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page__header">
        <h1><Users size={22} /> Clientes</h1>
        <p>Historial de clientes extraído de presupuestos, facturas y conversaciones de WhatsApp.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1rem' }}>
        {/* Lista */}
        <div>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ width: '100%', padding: '0.65rem 0.9rem 0.65rem 2.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: '0.9rem' }} />
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="spin" style={{ color: '#555' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Users size={36} /><h3>No hay clientes aún</h3><p>Los clientes aparecerán aquí cuando crees presupuestos, facturas o tengas conversaciones de WhatsApp.</p></div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {filtered.map((c, i) => (
                <button key={i} onClick={() => loadDetalle(c)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border-light)', background: selected?.nombre === c.nombre && selected?.email === c.email ? 'var(--bg-secondary)' : 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                    {(c.nombre || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}>{c.nombre || c.email || '—'}</div>
                    {c.empresa && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{c.empresa}</div>}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                      {c.presupuestos > 0 && <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}><FileText size={10} /> {c.presupuestos} presup.</span>}
                      {c.facturas > 0 && <span style={{ fontSize: '0.65rem', color: '#25D366', fontFamily: 'var(--font-mono)' }}><Receipt size={10} /> {c.facturas} fact.</span>}
                      {c.conversaciones > 0 && <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontFamily: 'var(--font-mono)' }}><MessageCircle size={10} /> {c.conversaciones} convs.</span>}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalle */}
        {selected && (
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(37,211,102,0.1)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
                  {(selected.nombre || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem' }}>{selected.nombre}</h3>
                  {selected.empresa && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selected.empresa}</div>}
                  {selected.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{selected.email}</div>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                {[{ v: selected.presupuestos, l: 'Presupuestos', c: '#f59e0b' }, { v: selected.facturas, l: 'Facturas', c: '#25D366' }, { v: selected.conversaciones, l: 'Conversaciones', c: '#3b82f6' }].map((s, i) => (
                  <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0.65rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: s.c }}>{s.v}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {detalle.presupuestos.length > 0 && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>PRESUPUESTOS</h4>
                {detalle.presupuestos.map(p => {
                  const total = (p.lineas || []).reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0) * (1 + (p.iva || 0) / 100);
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                      <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{p.numero}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(p.created_at).toLocaleDateString('es-ES')}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}>{total.toFixed(2)}€</div><div style={{ fontSize: '0.65rem', color: p.estado === 'aceptado' ? '#25D366' : p.estado === 'enviado' ? '#f59e0b' : 'var(--text-tertiary)' }}>{p.estado}</div></div>
                    </div>
                  );
                })}
              </div>
            )}

            {detalle.facturas.length > 0 && (
              <div className="card">
                <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>FACTURAS</h4>
                {detalle.facturas.map(f => {
                  const total = (f.lineas || []).reduce((s, l) => s + (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio) || 0), 0) * (1 + (f.iva || 0) / 100);
                  return (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                      <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{f.numero}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(f.created_at).toLocaleDateString('es-ES')}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}>{total.toFixed(2)}€</div><div style={{ fontSize: '0.65rem', color: f.estado === 'pagada' ? '#25D366' : f.estado === 'vencida' ? '#ef4444' : '#f59e0b' }}>{f.estado}</div></div>
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
