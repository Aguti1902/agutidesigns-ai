import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MAIN_DOMAIN = 'agutidesigns.io';
const APP_DOMAIN = 'app.agutidesigns.io';

export function useDomainRedirect(user) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentDomain = window.location.hostname;
  const isAppDomain = currentDomain === APP_DOMAIN || currentDomain === 'localhost';
  const isMainDomain = currentDomain === MAIN_DOMAIN || currentDomain === 'localhost';

  useEffect(() => {
    // Si estás en app.agutidesigns.io SIN login → redirect a main domain /auth
    if (isAppDomain && !user && !location.pathname.includes('/email-confirmado')) {
      window.location.href = `https://${MAIN_DOMAIN}/auth`;
      return;
    }

    // Si estás en agutidesigns.io CON login y en landing/auth → redirect a app domain
    if (isMainDomain && user && (location.pathname === '/' || location.pathname === '/auth')) {
      window.location.href = `https://${APP_DOMAIN}/app`;
      return;
    }

    // Si estás en app.agutidesigns.io CON login pero en / → redirect interno a /app
    if (isAppDomain && user && location.pathname === '/') {
      navigate('/app', { replace: true });
    }
  }, [user, location.pathname, isAppDomain, isMainDomain, navigate]);

  return { isAppDomain, isMainDomain };
}
