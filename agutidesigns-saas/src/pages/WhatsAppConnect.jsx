import { useState } from 'react';
import { MessageCircle, QrCode, Check, RefreshCw, Smartphone, Wifi } from 'lucide-react';
import './DashboardPages.css';

export default function WhatsAppConnect() {
  const [connected, setConnected] = useState(false);

  return (
    <div className="page">
      <div className="page__header">
        <h1>Conectar WhatsApp</h1>
        <p>Vincula tu número de WhatsApp Business para que tu agente IA pueda responder.</p>
      </div>

      <div className="card">
        {!connected ? (
          <div className="qr-section">
            <div className="qr-section__steps">
              <h3>Cómo conectar</h3>
              <ol>
                <li><Smartphone size={14} /> Abre WhatsApp en tu teléfono</li>
                <li><QrCode size={14} /> Ve a Configuración → Dispositivos vinculados</li>
                <li><Wifi size={14} /> Escanea el código QR que aparece aquí</li>
              </ol>
            </div>

            <div className="qr-section__qr">
              <div className="qr-placeholder">
                <QrCode size={48} />
                <p>Código QR</p>
                <span>Configura Supabase para generar el QR real</span>
              </div>
              <button className="btn btn--outline btn--sm" onClick={() => setConnected(true)}>
                <RefreshCw size={14} /> Simular conexión
              </button>
            </div>
          </div>
        ) : (
          <div className="connected-state">
            <div className="connected-state__icon">
              <Check size={32} />
            </div>
            <h3>WhatsApp conectado</h3>
            <p>Tu número está vinculado. El agente IA está listo para responder.</p>
            <div className="connected-state__info">
              <span className="connected-state__dot" />
              Conectado — +34 600 000 000
            </div>
            <button className="btn btn--outline btn--sm" onClick={() => setConnected(false)}>
              Desconectar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
