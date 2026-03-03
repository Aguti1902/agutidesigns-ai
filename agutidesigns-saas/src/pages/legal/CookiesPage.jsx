import { Link } from 'react-router-dom';
import './LegalPage.css';

export default function CookiesPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-nav">
        <Link to="/" className="legal-nav__logo">wasap<span>y</span>.io</Link>
        <Link to="/" className="legal-nav__back">← Volver al inicio</Link>
      </div>

      <div className="legal-doc">
        <div className="legal-doc__head">
          <span className="legal-doc__tag">Legal</span>
          <h1>Política de Cookies</h1>
          <p>Última actualización: marzo de 2025</p>
        </div>

        <div className="legal-doc__body">

          <section>
            <h2>1. ¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Permiten que el sitio recuerde sus preferencias, mantenga su sesión activa y recopile información estadística de navegación.</p>
          </section>

          <section>
            <h2>2. Responsable del uso de cookies</h2>
            <div className="legal-doc__card">
              <div><strong>Titular:</strong> Alejandro Gutiérrez Gómez</div>
              <div><strong>NIF:</strong> 48063365N</div>
              <div><strong>Sitio web:</strong> wasapy.io</div>
              <div><strong>Contacto:</strong> info@wasapy.io</div>
            </div>
          </section>

          <section>
            <h2>3. Tipos de cookies que utilizamos</h2>

            <h3>3.1 Cookies estrictamente necesarias</h3>
            <p>Imprescindibles para el funcionamiento básico de la plataforma. No requieren consentimiento.</p>
            <div className="legal-doc__table">
              <div className="legal-doc__tr legal-doc__tr--head">
                <span>Nombre</span><span>Proveedor</span><span>Finalidad</span><span>Duración</span>
              </div>
              <div className="legal-doc__tr">
                <span>sb-access-token</span><span>Supabase</span><span>Autenticación de sesión</span><span>Sesión</span>
              </div>
              <div className="legal-doc__tr">
                <span>sb-refresh-token</span><span>Supabase</span><span>Renovación de sesión</span><span>7 días</span>
              </div>
              <div className="legal-doc__tr">
                <span>wasapy_ann</span><span>Wasapy</span><span>Preferencia barra de anuncio</span><span>Permanente</span>
              </div>
              <div className="legal-doc__tr">
                <span>wasapy_cookies</span><span>Wasapy</span><span>Preferencia de consentimiento de cookies</span><span>1 año</span>
              </div>
            </div>

            <h3>3.2 Cookies analíticas</h3>
            <p>Nos ayudan a entender cómo interactúan los usuarios con la plataforma. Solo se activan si usted acepta las cookies analíticas.</p>
            <div className="legal-doc__table">
              <div className="legal-doc__tr legal-doc__tr--head">
                <span>Nombre</span><span>Proveedor</span><span>Finalidad</span><span>Duración</span>
              </div>
              <div className="legal-doc__tr">
                <span>_ga, _ga_*</span><span>Google Analytics</span><span>Estadísticas de uso anónimas</span><span>2 años</span>
              </div>
            </div>

            <h3>3.3 Cookies de preferencias</h3>
            <p>Almacenan preferencias del usuario dentro de la plataforma.</p>
            <div className="legal-doc__table">
              <div className="legal-doc__tr legal-doc__tr--head">
                <span>Nombre</span><span>Proveedor</span><span>Finalidad</span><span>Duración</span>
              </div>
              <div className="legal-doc__tr">
                <span>wasapy_chat</span><span>Wasapy</span><span>Historial de chat en la landing</span><span>Permanente</span>
              </div>
            </div>
          </section>

          <section>
            <h2>4. Cómo gestionar las cookies</h2>
            <p>Puede gestionar sus preferencias de cookies en cualquier momento a través del panel de consentimiento disponible en el pie de página de la web. Además, puede configurar su navegador para bloquear o eliminar cookies:</p>
            <ul>
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
            </ul>
            <p>Tenga en cuenta que bloquear ciertas cookies puede afectar al funcionamiento de la plataforma.</p>
          </section>

          <section>
            <h2>5. Transferencias internacionales</h2>
            <p>Algunos proveedores de cookies (como Google Analytics) pueden transferir datos a servidores en Estados Unidos. Dichas transferencias se realizan bajo las garantías de las Cláusulas Contractuales Tipo (SCCs) aprobadas por la Comisión Europea.</p>
          </section>

          <section>
            <h2>6. Actualizaciones de esta política</h2>
            <p>Esta política puede actualizarse para reflejar cambios en las cookies utilizadas o en la normativa aplicable. Le recomendamos revisarla periódicamente. Los cambios significativos serán comunicados mediante aviso en la web.</p>
          </section>

          <section>
            <h2>7. Contacto</h2>
            <p>Para cualquier consulta sobre el uso de cookies: <a href="mailto:info@wasapy.io">info@wasapy.io</a></p>
          </section>

        </div>

        <div className="legal-doc__footer">
          <Link to="/privacidad">Política de Privacidad</Link>
          <Link to="/terminos">Términos y Condiciones</Link>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
