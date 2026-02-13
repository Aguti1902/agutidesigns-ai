import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AgentsProvider } from './hooks/useAgents';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AgentsProvider>
          <App />
        </AgentsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
