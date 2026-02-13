import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SaasLanding from './pages/SaasLanding.jsx';
import App from './App.jsx';
import CalculadoraLanding from './pages/CalculadoraLanding.jsx';
import AgenteWhatsAppLanding from './pages/AgenteWhatsAppLanding.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SaasLanding />} />
        <Route path="/web" element={<App />} />
        <Route path="/presupuesto-web" element={<CalculadoraLanding />} />
        <Route path="/agente-whatsapp" element={<AgenteWhatsAppLanding />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
