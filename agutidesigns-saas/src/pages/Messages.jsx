import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, AlertTriangle, Package, Plus, Loader2,
  BarChart3, Check, XCircle, Zap, WifiOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import { supabase } from '../lib/supabase';
import './Messages.css';
import './DashboardPages.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const API_URL = import.meta.env.VITE_API_URL || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1` : '');

const MSG_PACKS = [
  { id: 'pack-500', name: '+500 mensajes', messages: 500, price: '9', priceId: 'price_1T1qUMFjBSJ299OprGXORk0J' },
  { id: 'pack-1000', name: '+1.000 mensajes', messages: 1000, price: '15', priceId: 'price_1T1qUNFjBSJ299OpBO38XWfG' },
  { id: 'pack-2500', name: '+2.500 mensajes', messages: 2500, price: '29', priceId: 'price_1T1qUOFjBSJ299OpY8sL9IBL' },
  { id: 'pack-5000', name: '+5.000 mensajes', messages: 5000, price: '49', priceId: 'price_1T1qUPFjBSJ299OpTTZodJ3B' },
  { id: 'pack-10000', name: '+10.000 mensajes', messages: 10000, price: '79', priceId: 'price_1T1qUPFjBSJ299OpqtaOMyK3' },
];

const fmt = (n) => (n ?? 0).toLocaleString('es-ES');

export default function Messages() {
  const { user, profile, updateProfile } = useAuth();
  const { agents } = useAgents();
  const [selectedPack, setSelectedPack] = useState(null);
  const [loadingAddon, setLoadingAddon] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const baseLimit = profile?.message_limit ?? 500;
  const extraMessages = profile?.extra_messages ?? 0;
  const totalLimit = baseLimit + extraMessages;
  const used = agents.reduce((sum, a) => sum + (a.total_messages || 0), 0);
  const percentUsed = totalLimit > 0 ? Math.min(100, (used / totalLimit) * 100) : 0;
  const isExhausted = used >= totalLimit;

  const getBarColor = () => {
    if (percentUsed >= 95) return 'var(--color-error)';
    if (percentUsed >= 80) return 'var(--color-warning)';
    return 'var(--color-primary)';
  };

  async function handleAddPack() {
    if (!selectedPack || loadingAddon) return;
    const pack = MSG_PACKS.find(p => p.id === selectedPack);
    if (!pack) return;

    setLoadingAddon(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_URL}/stripe-add-addon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, priceId: pack.priceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo añadir el pack');
      }
      setSuccessMsg(`+${fmt(pack.messages)} mensajes añadidos a tu plan. Se cobrarán ${pack.price}€/mes.`);
      setSelectedPack(null);
      // Refresh profile to get updated extra_messages
      if (user?.id) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (p) updateProfile({ extra_messages: p.extra_messages });
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAddon(false);
    }
  }

  const currentMonth = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const usageHistory = [{ month: currentMonth, used, limit: totalLimit }];

  return (
    <div className="page">
      <div className="page__header">
        <h1><MessageCircle size={24} /> Uso de mensajes</h1>
        <p>Gestiona tu consumo y añade packs extra cuando los necesites.</p>
      </div>

      {/* Banner: mensajes agotados */}
      {isExhausted && (
        <div className="messages-exhausted">
          <div className="messages-exhausted__icon"><WifiOff size={22} /></div>
          <div className="messages-exhausted__text">
            <h3>Has agotado tus mensajes</h3>
            <p>La IA se ha desconectado automáticamente. Para volver a activarla, amplía tus mensajes o espera al próximo ciclo de facturación.</p>
          </div>
          <a href="#packs" className="btn btn--primary btn--sm"><Zap size={14} /> Ampliar mensajes</a>
        </div>
      )}

      {/* Success / Error feedback */}
      {successMsg && (
        <div className="billing-status billing-status--active" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><Check size={20} /></div>
          <div><h3>¡Pack añadido!</h3><p>{successMsg}</p></div>
          <button onClick={() => setSuccessMsg(null)} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}
      {errorMsg && (
        <div className="billing-status billing-status--expired" style={{ position: 'relative' }}>
          <div className="billing-status__icon"><AlertTriangle size={20} /></div>
          <div><h3>Error</h3><p>{errorMsg}</p></div>
          <button onClick={() => setErrorMsg(null)} className="billing-status__close"><XCircle size={18} /></button>
        </div>
      )}

      {/* 1. Barra de uso */}
      <section className="messages-section">
        <h3 className="page__section-title"><BarChart3 size={18} /> Consumo del mes</h3>
        <div className="messages-usage-card">
          <div className="messages-usage__info">
            <span className="messages-usage__text">
              <strong>{fmt(used)}</strong> de <strong>{fmt(totalLimit)}</strong> mensajes usados este mes
            </span>
          </div>
          <div className="messages-usage__bar">
            <div className="messages-usage__fill" style={{ width: `${percentUsed}%`, backgroundColor: getBarColor() }} />
          </div>
        </div>

        {!isExhausted && percentUsed >= 95 && (
          <div className="messages-alert messages-alert--critical">
            <AlertTriangle size={18} />
            <div>
              <strong>¡Casi sin mensajes!</strong>
              <p>Añade más para que tu agente siga respondiendo</p>
            </div>
          </div>
        )}
        {!isExhausted && percentUsed >= 80 && percentUsed < 95 && (
          <div className="messages-alert messages-alert--warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Estás llegando al límite de mensajes</strong>
              <p>Considera añadir un pack extra para no interrumpir el servicio</p>
            </div>
          </div>
        )}
      </section>

      {/* 2. Packs de mensajes */}
      <section className="messages-packs-section" id="packs">
        <div className="messages-packs-header">
          <div>
            <h3><Package size={20} /> Ampliar mensajes</h3>
            <p>Selecciona un pack. Se cobra al instante con tu tarjeta guardada y se suma a tu suscripción mensual.</p>
          </div>
        </div>

        <div className="messages-packs-grid">
          {MSG_PACKS.map((pack) => {
            const isSelected = selectedPack === pack.id;
            return (
              <div key={pack.id} className={`messages-pack-card ${isSelected ? 'messages-pack-card--selected' : ''}`} onClick={() => setSelectedPack(isSelected ? null : pack.id)}>
                {isSelected && <div className="messages-pack-card__check"><Check size={14} /></div>}
                <span className="messages-pack-card__count">+{fmt(pack.messages)}</span>
                <span className="messages-pack-card__label">mensajes/mes</span>
                <span className="messages-pack-card__price">{pack.price}€<span>/mes</span></span>
                <span className="messages-pack-card__unit">{((Number(pack.price) / pack.messages) * 1000).toFixed(1)}€ / 1.000 msgs</span>
              </div>
            );
          })}
        </div>

        {selectedPack && (
          <div className="messages-packs-cta">
            <div className="messages-packs-cta__info">
              <strong>+{fmt(MSG_PACKS.find(p => p.id === selectedPack)?.messages)} mensajes/mes</strong>
              <span>Se cobra ahora con tu tarjeta guardada. {MSG_PACKS.find(p => p.id === selectedPack)?.price}€/mes recurrente.</span>
            </div>
            <button className="btn btn--primary btn--lg" onClick={handleAddPack} disabled={loadingAddon}>
              {loadingAddon ? <Loader2 size={16} className="spin" /> : <Zap size={16} />}
              {loadingAddon ? 'Procesando...' : `Añadir ${MSG_PACKS.find(p => p.id === selectedPack)?.price}€/mes`}
            </button>
          </div>
        )}
      </section>

      {/* 3. Historial de uso */}
      <section className="messages-section">
        <h3 className="page__section-title"><BarChart3 size={18} /> Historial de uso</h3>
        <div className="messages-history">
          <table className="messages-history__table">
            <thead><tr><th>Mes</th><th>Mensajes usados</th><th>Límite</th></tr></thead>
            <tbody>
              {usageHistory.map((row, i) => (
                <tr key={i}><td>{row.month}</td><td>{fmt(row.used)}</td><td>{fmt(row.limit)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
