import { Link } from 'react-router-dom';
import './LegalPage.css';

export default function PrivacidadPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-nav">
        <Link to="/" className="legal-nav__logo">wasap<span>y</span>.io</Link>
        <Link to="/" className="legal-nav__back">← Volver al inicio</Link>
      </div>

      <div className="legal-doc">
        <div className="legal-doc__head">
          <span className="legal-doc__tag">Legal</span>
          <h1>Política de Privacidad</h1>
          <p>Última actualización: marzo de 2025</p>
        </div>

        <div className="legal-doc__body">

          <section>
            <h2>1. Responsable del tratamiento</h2>
            <p>En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), le informamos que los datos personales recabados serán tratados por:</p>
            <div className="legal-doc__card">
              <div><strong>Titular:</strong> Alejandro Gutiérrez Gómez</div>
              <div><strong>NIF:</strong> 48063365N</div>
              <div><strong>Dirección:</strong> Avinguda Porta Diagonal 30, 08940, Cornellà de Llobregat, Barcelona</div>
              <div><strong>Sitio web:</strong> wasapy.io</div>
              <div><strong>Correo electrónico:</strong> info@wasapy.io</div>
            </div>
          </section>

          <section>
            <h2>2. Datos que recabamos</h2>
            <p>Recabamos las siguientes categorías de datos personales:</p>
            <ul>
              <li><strong>Datos de registro:</strong> nombre, apellidos, correo electrónico y contraseña (cifrada).</li>
              <li><strong>Datos de negocio:</strong> nombre comercial, sector, descripción de servicios y precios que el usuario introduce voluntariamente.</li>
              <li><strong>Datos de uso:</strong> conversaciones gestionadas por el agente IA, métricas de uso del servicio, logs de acceso e interacciones con el panel.</li>
              <li><strong>Datos de facturación:</strong> nombre fiscal, dirección fiscal y datos de pago procesados de forma segura por Stripe (Wasapy no almacena números de tarjeta).</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, navegador y sistema operativo.</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalidades del tratamiento</h2>
            <p>Sus datos serán tratados para las siguientes finalidades:</p>
            <ul>
              <li>Prestación del servicio Wasapy (gestión de agentes IA, presupuestos, CRM y agenda).</li>
              <li>Gestión de la relación contractual y facturación.</li>
              <li>Comunicaciones relacionadas con el servicio (avisos de cuenta, actualizaciones, alertas de seguridad).</li>
              <li>Mejora y desarrollo de nuevas funcionalidades mediante análisis agregado y anonimizado.</li>
              <li>Cumplimiento de obligaciones legales y fiscales.</li>
              <li>Envío de comunicaciones comerciales propias, previa obtención del consentimiento cuando sea exigible.</li>
            </ul>
          </section>

          <section>
            <h2>4. Base jurídica del tratamiento</h2>
            <ul>
              <li><strong>Ejecución de contrato</strong> (art. 6.1.b RGPD): prestación del servicio contratado.</li>
              <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): mejora del servicio y seguridad de la plataforma.</li>
              <li><strong>Obligación legal</strong> (art. 6.1.c RGPD): cumplimiento de normativa fiscal y mercantil.</li>
              <li><strong>Consentimiento</strong> (art. 6.1.a RGPD): comunicaciones comerciales y cookies no esenciales.</li>
            </ul>
          </section>

          <section>
            <h2>5. Conservación de los datos</h2>
            <p>Los datos se conservarán mientras la relación contractual esté vigente. Tras la cancelación de la cuenta, los datos se eliminarán en un plazo máximo de <strong>90 días</strong>, salvo los que deban conservarse por obligación legal (datos fiscales: 5 años; logs de seguridad: 1 año).</p>
          </section>

          <section>
            <h2>6. Destinatarios y transferencias internacionales</h2>
            <p>Compartimos datos únicamente con los siguientes encargados del tratamiento, bajo contrato DPA, y únicamente en la medida necesaria:</p>
            <div className="legal-doc__table">
              <div className="legal-doc__tr legal-doc__tr--head">
                <span>Proveedor</span><span>Finalidad</span><span>País</span>
              </div>
              <div className="legal-doc__tr">
                <span>Supabase Inc.</span><span>Base de datos y autenticación</span><span>EE.UU. (SCCs)</span>
              </div>
              <div className="legal-doc__tr">
                <span>Stripe, Inc.</span><span>Procesamiento de pagos</span><span>EE.UU. (SCCs)</span>
              </div>
              <div className="legal-doc__tr">
                <span>OpenAI, L.L.C.</span><span>Generación de respuestas IA</span><span>EE.UU. (SCCs)</span>
              </div>
              <div className="legal-doc__tr">
                <span>Vercel / Netlify</span><span>Hospedaje de la aplicación</span><span>EE.UU. (SCCs)</span>
              </div>
            </div>
            <p>Las transferencias internacionales se amparan en las Cláusulas Contractuales Tipo (SCCs) aprobadas por la Comisión Europea.</p>
          </section>

          <section>
            <h2>7. Derechos del interesado</h2>
            <p>Puede ejercer en cualquier momento los siguientes derechos dirigiéndose a <a href="mailto:info@wasapy.io">info@wasapy.io</a> con asunto «Protección de datos» e identificación suficiente:</p>
            <ul>
              <li><strong>Acceso:</strong> conocer qué datos tratamos sobre usted.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Supresión:</strong> solicitar el borrado de sus datos («derecho al olvido»).</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento para determinadas finalidades.</li>
              <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado y legible por máquina.</li>
              <li><strong>Limitación:</strong> solicitar la restricción del tratamiento en determinadas circunstancias.</li>
            </ul>
            <p>Tiene derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos</strong> (aepd.es) si considera que el tratamiento no es conforme a la normativa.</p>
          </section>

          <section>
            <h2>8. Seguridad de los datos</h2>
            <p>Aplicamos medidas técnicas y organizativas apropiadas para proteger sus datos frente a acceso no autorizado, pérdida, alteración o divulgación, incluyendo cifrado en tránsito (TLS 1.3), cifrado en reposo, control de acceso basado en roles y auditorías periódicas de seguridad.</p>
          </section>

          <section>
            <h2>9. Datos de menores</h2>
            <p>El servicio Wasapy está dirigido exclusivamente a personas mayores de 18 años. No recabamos conscientemente datos de menores de edad. Si detecta que un menor ha facilitado datos sin autorización, contacte con nosotros para proceder a su eliminación inmediata.</p>
          </section>

          <section>
            <h2>10. Cambios en esta política</h2>
            <p>Nos reservamos el derecho a actualizar esta política para adaptarla a cambios normativos o funcionales. Le notificaremos cualquier cambio sustancial mediante correo electrónico o aviso destacado en la plataforma con al menos 15 días de antelación.</p>
          </section>

          <section>
            <h2>11. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad: <a href="mailto:info@wasapy.io">info@wasapy.io</a></p>
          </section>

        </div>

        <div className="legal-doc__footer">
          <Link to="/terminos">Términos y Condiciones</Link>
          <Link to="/cookies">Política de Cookies</Link>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
