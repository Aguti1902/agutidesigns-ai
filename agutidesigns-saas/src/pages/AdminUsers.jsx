import { useState, useEffect } from 'react';
import { Users, Search, Filter, Zap, XCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*, agents(count)')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  const filtered = users.filter(u => {
    if (filter === 'active' && u.subscription_status !== 'active') return false;
    if (filter === 'trial' && u.subscription_status !== 'trial') return false;
    if (filter === 'expired' && !['expired', 'cancelled'].includes(u.subscription_status)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(u.full_name || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1><Users size={24} /> Usuarios</h1>
        <p>Gestiona todos los usuarios registrados</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.5rem', background: '#111', border: '1px solid #222', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Filter size={14} style={{ color: '#666' }} />
          <button className={`chip ${filter === 'all' ? 'chip--active' : ''}`} onClick={() => setFilter('all')}>Todos ({users.length})</button>
          <button className={`chip ${filter === 'active' ? 'chip--active' : ''}`} onClick={() => setFilter('active')}>Activos ({users.filter(u => u.subscription_status === 'active').length})</button>
          <button className={`chip ${filter === 'trial' ? 'chip--active' : ''}`} onClick={() => setFilter('trial')}>Trial ({users.filter(u => u.subscription_status === 'trial').length})</button>
          <button className={`chip ${filter === 'expired' ? 'chip--active' : ''}`} onClick={() => setFilter('expired')}>Expirados ({users.filter(u => ['expired','cancelled'].includes(u.subscription_status)).length})</button>
        </div>
      </div>

      <div className="admin-users-table">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Plan</th>
              <th>Agentes</th>
              <th>Mensajes</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>No hay usuarios</td></tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name || 'Sin nombre'}</td>
                  <td>
                    <span className={`admin-badge admin-badge--${u.subscription_status}`}>
                      {u.subscription_status === 'active' ? <><Zap size={10} /> Activo</> :
                       u.subscription_status === 'trial' ? <><Clock size={10} /> Trial</> :
                       <><XCircle size={10} /> Expirado</>}
                    </span>
                  </td>
                  <td>{u.agents?.[0]?.count || 0}</td>
                  <td>{(u.message_limit || 500).toLocaleString('es-ES')}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('es-ES')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
