import { useState, useEffect } from 'react';
import { Users, Search, Filter, Zap, XCircle, Clock, Crown, Package, Infinity, AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './DashboardPages.css';

function getPlanLabel(u) {
  if (u.subscription_status === 'active') {
    if (u.message_limit >= 20000) return { label: 'Agency', color: '#a78bfa', Icon: Infinity };
    if (u.message_limit >= 5000)  return { label: 'Pro',    color: '#25D366', Icon: Crown };
    return { label: 'Starter', color: '#60a5fa', Icon: Package };
  }
  return null;
}

function getTrialStatus(u) {
  if (u.subscription_status !== 'trial') return null;
  const now = new Date();
  const ends = u.trial_ends_at ? new Date(u.trial_ends_at) : null;
  if (!ends) return { active: false, label: 'Trial expirado', daysLeft: null };
  const diff = Math.ceil((ends - now) / (1000 * 60 * 60 * 24));
  if (diff > 0) return { active: true, label: `Trial activo (${diff}d)`, daysLeft: diff };
  return { active: false, label: `Trial expirado (${Math.abs(diff)}d)`, daysLeft: diff };
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*, agents(count)')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  const now = new Date();

  const counts = {
    all: users.length,
    active: users.filter(u => u.subscription_status === 'active').length,
    trial_active: users.filter(u => u.subscription_status === 'trial' && u.trial_ends_at && new Date(u.trial_ends_at) > now).length,
    trial_expired: users.filter(u => u.subscription_status === 'trial' && (!u.trial_ends_at || new Date(u.trial_ends_at) <= now)).length,
    expired: users.filter(u => ['expired', 'cancelled'].includes(u.subscription_status)).length,
  };

  const filtered = users.filter(u => {
    if (filter === 'active' && u.subscription_status !== 'active') return false;
    if (filter === 'trial_active') {
      if (u.subscription_status !== 'trial') return false;
      if (!u.trial_ends_at || new Date(u.trial_ends_at) <= now) return false;
    }
    if (filter === 'trial_expired') {
      if (u.subscription_status !== 'trial') return false;
      if (u.trial_ends_at && new Date(u.trial_ends_at) > now) return false;
    }
    if (filter === 'expired' && !['expired', 'cancelled'].includes(u.subscription_status)) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = (u.full_name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
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
        <p>Todos los usuarios registrados en Wasapy</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: counts.all, color: '#555' },
          { label: 'Suscritos', value: counts.active, color: '#25D366' },
          { label: 'Trial activo', value: counts.trial_active, color: '#f59e0b' },
          { label: 'Trial expirado', value: counts.trial_expired, color: '#f87171' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #222', borderRadius: 'var(--radius-lg)', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.4rem', background: '#111', border: '1px solid #222', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '0.85rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button className={`chip ${filter === 'all' ? 'chip--active' : ''}`} onClick={() => setFilter('all')}>Todos ({counts.all})</button>
          <button className={`chip ${filter === 'active' ? 'chip--active' : ''}`} onClick={() => setFilter('active')}>Suscritos ({counts.active})</button>
          <button className={`chip ${filter === 'trial_active' ? 'chip--active' : ''}`} onClick={() => setFilter('trial_active')}>Trial activo ({counts.trial_active})</button>
          <button className={`chip ${filter === 'trial_expired' ? 'chip--active' : ''}`} onClick={() => setFilter('trial_expired')}>Trial expirado ({counts.trial_expired})</button>
          <button className={`chip ${filter === 'expired' ? 'chip--active' : ''}`} onClick={() => setFilter('expired')}>Cancelado ({counts.expired})</button>
        </div>
      </div>

      <div className="admin-users-table">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Trial / Plan</th>
              <th>Agentes</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>No hay usuarios</td></tr>
            ) : (
              filtered.map(u => {
                const trialStatus = getTrialStatus(u);
                const plan = getPlanLabel(u);
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name || <span style={{ color: '#555' }}>Sin nombre</span>}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#aaa' }}>
                        <Mail size={12} />
                        {u.email || <span style={{ color: '#555' }}>—</span>}
                      </span>
                    </td>
                    <td>
                      {u.subscription_status === 'active' ? (
                        <span className="admin-badge admin-badge--active"><Zap size={10} /> Suscrito</span>
                      ) : u.subscription_status === 'trial' ? (
                        trialStatus?.active
                          ? <span className="admin-badge admin-badge--trial"><Clock size={10} /> Trial activo</span>
                          : <span className="admin-badge admin-badge--expired"><AlertTriangle size={10} /> Trial expirado</span>
                      ) : (
                        <span className="admin-badge admin-badge--expired"><XCircle size={10} /> Cancelado</span>
                      )}
                    </td>
                    <td>
                      {plan ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: plan.color }}>
                          <plan.Icon size={12} /> {plan.label}
                        </span>
                      ) : trialStatus ? (
                        <span style={{ fontSize: '0.75rem', color: trialStatus.active ? '#f59e0b' : '#f87171' }}>
                          {trialStatus.label}
                        </span>
                      ) : (
                        <span style={{ color: '#555', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{u.agents?.[0]?.count || 0}</td>
                    <td style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
