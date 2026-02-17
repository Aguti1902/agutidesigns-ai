import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './EmailConfirmed.css';

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  // Check if coming from OAuth (Google, etc) - they already have session
  const isOAuth = searchParams.get('type') === 'signup' || (user && !searchParams.get('token'));

  useEffect(() => {
    // If OAuth or already logged in, skip this page entirely
    if (isOAuth || (user && window.location.hash.includes('access_token'))) {
      navigate('/app', { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/app');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, isOAuth, user]);

  return (
    <div className="email-confirmed">
      <div className="email-confirmed__card">
        <div className="email-confirmed__icon">
          <CheckCircle size={64} />
        </div>
        <h1>¡Email confirmado! ✅</h1>
        <p>Tu cuenta ha sido verificada correctamente. Ya puedes empezar a usar tu agente de WhatsApp IA.</p>
        
        <div className="email-confirmed__countdown">
          <Loader2 size={20} className="spin" />
          <span>Redirigiendo al dashboard en {countdown}...</span>
        </div>

        <button className="btn btn--primary" onClick={() => navigate('/app')}>
          Ir al dashboard ahora <ArrowRight size={16} />
        </button>

        <div className="email-confirmed__steps">
          <h3>Próximos pasos:</h3>
          <ol>
            <li>Conecta tu número de WhatsApp</li>
            <li>Configura los datos de tu negocio</li>
            <li>Personaliza tu agente IA</li>
            <li>¡Empieza a responder automáticamente!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
