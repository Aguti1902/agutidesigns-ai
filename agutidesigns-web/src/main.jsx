import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import CalculadoraLanding from './pages/CalculadoraLanding.jsx';
import AgenteWhatsAppLanding from './pages/AgenteWhatsAppLanding.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/calculadora" element={<CalculadoraLanding />} />
        <Route path="/agente-whatsapp" element={<AgenteWhatsAppLanding />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
