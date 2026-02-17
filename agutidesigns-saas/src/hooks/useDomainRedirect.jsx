import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MAIN_DOMAIN = 'agutidesigns.io';
const APP_DOMAIN = 'app.agutidesigns.io';

export function useDomainRedirect(user) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentDomain = window.location.hostname;
  const isLocalhost = currentDomain === 'localhost';
  const isAppDomain = currentDomain === APP_DOMAIN || isLocalhost;
  const isMainDomain = currentDomain === MAIN_DOMAIN;

  useEffect(() => {
    // Skip all redirects in localhost
    if (isLocalhost) return;

    // Si estás en agutidesigns.io intentando acceder a /auth → redirect a app domain
    if (isMainDomain && location.pathname === '/auth') {
      window.location.href = `https://${APP_DOMAIN}/auth`;
      return;
    }

    // Si estás en agutidesigns.io CON login → redirect a app domain
    if (isMainDomain && user) {
      window.location.href = `https://${APP_DOMAIN}/app`;
      return;
    }

    // Si estás en app.agutidesigns.io SIN login y NO estás en auth/email-confirmado → redirect a auth
    if (isAppDomain && !user && !location.pathname.includes('/auth') && !location.pathname.includes('/email-confirmado')) {
      navigate('/auth', { replace: true });
      return;
    }

    // Si estás en app.agutidesigns.io CON login en / → redirect a /app
    if (isAppDomain && user && location.pathname === '/') {
      navigate('/app', { replace: true });
    }
  }, [user, location.pathname, isAppDomain, isMainDomain, navigate, isLocalhost]);

  return { isAppDomain, isMainDomain, isLocalhost };
}
