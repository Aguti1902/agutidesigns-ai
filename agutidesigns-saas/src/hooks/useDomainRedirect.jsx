import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const MAIN_DOMAIN = 'agutidesigns.io';
const APP_DOMAIN = 'app.agutidesigns.io';

export function useDomainRedirect(user) {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAuth();
  const currentDomain = window.location.hostname;
  const isLocalhost = currentDomain === 'localhost';
  const isAppDomain = currentDomain === APP_DOMAIN || isLocalhost;
  const isMainDomain = currentDomain === MAIN_DOMAIN;

  useEffect(() => {
    if (isLocalhost) return;
    // Don't redirect while auth is still loading
    if (loading) return;

    if (isMainDomain && location.pathname === '/auth') {
      window.location.href = `https://${APP_DOMAIN}/auth`;
      return;
    }

    if (isMainDomain && user) {
      window.location.href = `https://${APP_DOMAIN}/app`;
      return;
    }

    // Don't redirect to /auth if there's an OAuth callback in the URL
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hasAuthCallback = hash.includes('access_token') || hash.includes('refresh_token') || search.includes('code=') || hash.includes('error');
    if (isAppDomain && !user && !hasAuthCallback && !location.pathname.includes('/auth') && !location.pathname.includes('/email-confirmado')) {
      navigate('/auth', { replace: true });
      return;
    }

    if (isAppDomain && user && location.pathname === '/') {
      navigate('/app', { replace: true });
    }
  }, [user, loading, location.pathname, isAppDomain, isMainDomain, navigate, isLocalhost]);

  return { isAppDomain, isMainDomain, isLocalhost };
}
