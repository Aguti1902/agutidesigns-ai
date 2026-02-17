import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  AlertTriangle,
  Package,
  Plus,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAgents } from '../hooks/useAgents';
import './Messages.css';
import './DashboardPages.css';

// Packs de mensajes (mismos que Billing/Checkout)
const MSG_PACKS = [
  { id: 'pack-500', name: '+500 mensajes', messages: 500, price: '9', priceId: 'price_1T0RliC3QI1Amukvz8BJx96a' },
  { id: 'pack-1000', name: '+1.000 mensajes', messages: 1000, price: '15', priceId: 'price_1T0RljC3QI1AmukvfBI04iTh' },
  { id: 'pack-2500', name: '+2.500 mensajes', messages: 2500, price: '29', priceId: 'price_1T0RlkC3QI1AmukvaMakldlD' },
  { id: 'pack-5000', name: '+5.000 mensajes', messages: 5000, price: '49', priceId: 'price_1T0RllC3QI1Amukvpm1oLS0r' },
  { id: 'pack-10000', name: '+10.000 mensajes', messages: 10000, price: '79', priceId: 'price_1T0RlmC3QI1Amukv5Ha2LNhR' },
];

const fmt = (n) => (n ?? 0).toLocaleString('es-ES');

export default function Messages() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { agents } = useAgents();
  const [selectedPack, setSelectedPack] = useState(null);
  const [loadingAddon, setLoadingAddon] = useState(false);

  // Límite base del plan + mensajes extra comprados
  const baseLimit = profile?.message_limit ?? 500;
  const extraMessages = profile?.extra_messages ?? 0;
  const totalLimit = baseLimit + extraMessages;

  // Mensajes usados: suma de total_messages de todos los agentes
  const used = agents.reduce((sum, a) => sum + (a.total_messages || 0), 0);

  const percentUsed = totalLimit > 0 ? Math.min(100, (used / totalLimit) * 100) : 0;

  // Colores según uso: verde (<80%), amarillo (80-95%), rojo (>95%)
  const getBarColor = () => {
    if (percentUsed >= 95) return 'var(--color-error)';
    if (percentUsed >= 80) return 'var(--color-warning)';
    return 'var(--color-primary)';
  };

  const handleAddPack = () => {
    if (!selectedPack) return;
    const pack = MSG_PACKS.find((p) => p.id === selectedPack);
    if (!pack) return;
    navigate(`/app/checkout?plan=${pack.id}&mode=payment`);
  };

  // Historial de uso: solo mes actual por ahora
  const currentMonth = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const usageHistory = [
    { month: currentMonth, used, limit: totalLimit },
  ];

  return (
    <div className="page">
      <div className="page__header">
        <h1><MessageCircle size={24} /> Uso de mensajes</h1>
        <p>Gestiona tu consumo y añade packs extra cuando los necesites.</p>
      </div>

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
            <div
              className="messages-usage__fill"
              style={{
                width: `${percentUsed}%`,
                backgroundColor: getBarColor(),
              }}
            />
          </div>
        </div>

        {/* Alertas según umbral */}
        {percentUsed >= 95 && (
          <div className="messages-alert messages-alert--critical">
            <AlertTriangle size={18} />
            <div>
              <strong>¡Casi sin mensajes!</strong>
              <p>Añade más para que tu agente siga respondiendo</p>
            </div>
          </div>
        )}
        {percentUsed >= 80 && percentUsed < 95 && (
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
      <section className="messages-packs-section">
        <div className="messages-packs-header">
          <div>
            <h3><Package size={20} /> Ampliar mensajes</h3>
            <p>Selecciona un pack y se sumará a tu suscripción mensual de forma recurrente.</p>
          </div>
        </div>

        <div className="messages-packs-grid">
          {MSG_PACKS.map((pack) => {
            const isSelected = selectedPack === pack.id;
            return (
              <div
                key={pack.id}
                className={`messages-pack-card ${isSelected ? 'messages-pack-card--selected' : ''}`}
                onClick={() => setSelectedPack(isSelected ? null : pack.id)}
              >
                {isSelected && <div className="messages-pack-card__check"><MessageCircle size={14} /></div>}
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
              <span>Se cobrarán {MSG_PACKS.find(p => p.id === selectedPack)?.price}€ extra en tu próxima factura y cada mes.</span>
            </div>
            <button
              className="btn btn--primary btn--lg"
              onClick={handleAddPack}
              disabled={loadingAddon}
            >
              {loadingAddon ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
              Añadir {MSG_PACKS.find(p => p.id === selectedPack)?.price}€/mes a mi plan
            </button>
          </div>
        )}
      </section>

      {/* 3. Historial de uso */}
      <section className="messages-section">
        <h3 className="page__section-title"><BarChart3 size={18} /> Historial de uso</h3>
        <div className="messages-history">
          <table className="messages-history__table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Mensajes usados</th>
                <th>Límite</th>
              </tr>
            </thead>
            <tbody>
              {usageHistory.map((row, i) => (
                <tr key={i}>
                  <td>{row.month}</td>
                  <td>{fmt(row.used)}</td>
                  <td>{fmt(row.limit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
