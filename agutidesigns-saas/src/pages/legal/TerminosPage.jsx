import { Link } from 'react-router-dom';
import './LegalPage.css';

export default function TerminosPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-nav">
        <Link to="/" className="legal-nav__logo">wasap<span>y</span>.io</Link>
        <Link to="/" className="legal-nav__back">← Volver al inicio</Link>
      </div>

      <div className="legal-doc">
        <div className="legal-doc__head">
          <span className="legal-doc__tag">Legal</span>
          <h1>Términos y Condiciones</h1>
          <p>Última actualización: marzo de 2025</p>
        </div>

        <div className="legal-doc__body">

          <section>
            <h2>1. Datos del prestador</h2>
            <div className="legal-doc__card">
              <div><strong>Titular:</strong> Alejandro Gutiérrez Gómez</div>
              <div><strong>NIF:</strong> 48063365N</div>
              <div><strong>Dirección:</strong> Avinguda Porta Diagonal 30, 08940, Cornellà de Llobregat, Barcelona</div>
              <div><strong>Sitio web:</strong> wasapy.io</div>
              <div><strong>Correo:</strong> info@wasapy.io</div>
            </div>
          </section>

          <section>
            <h2>2. Objeto y ámbito</h2>
            <p>Los presentes Términos y Condiciones (en adelante, «Términos») regulan el acceso y uso de la plataforma Wasapy (en adelante, «el Servicio»), disponible en wasapy.io, que ofrece herramientas de gestión comercial basadas en inteligencia artificial para profesionales del diseño web, incluyendo agente IA en WhatsApp, CRM, generación de presupuestos en PDF y agenda de discovery calls.</p>
            <p>Al registrarse o utilizar el Servicio, el usuario acepta íntegramente estos Términos. Si no está de acuerdo, debe abstenerse de usar el Servicio.</p>
          </section>

          <section>
            <h2>3. Acceso y registro</h2>
            <ul>
              <li>El acceso al Servicio requiere registro previo con una cuenta de correo electrónico válida.</li>
              <li>El usuario es responsable de mantener la confidencialidad de sus credenciales y de toda actividad que se realice bajo su cuenta.</li>
              <li>Wasapy se reserva el derecho a suspender o cancelar cuentas que incumplan estos Términos, sin previo aviso en casos de fraude o uso abusivo.</li>
              <li>El usuario debe tener al menos 18 años para usar el Servicio.</li>
            </ul>
          </section>

          <section>
            <h2>4. Planes, precios y facturación</h2>
            <ul>
              <li>El Servicio se ofrece bajo diferentes planes de suscripción (Starter, Pro, Agency) con facturación mensual o anual según la elección del usuario.</li>
              <li>Los precios están expresados en euros (€) e incluyen el IVA aplicable según la normativa vigente.</li>
              <li>Los pagos son gestionados de forma segura por <strong>Stripe, Inc.</strong> Wasapy no almacena datos de tarjetas de crédito.</li>
              <li>La suscripción se renueva automáticamente al final de cada período salvo cancelación expresa antes de la fecha de renovación.</li>
              <li>Los packs adicionales de mensajes son de pago único y no son reembolsables una vez consumidos parcialmente.</li>
              <li>Wasapy se reserva el derecho a modificar los precios con un preaviso mínimo de 30 días mediante notificación al correo electrónico del usuario.</li>
            </ul>
          </section>

          <section>
            <h2>5. Período de prueba</h2>
            <p>El Servicio ofrece un período de prueba gratuito de <strong>2 días</strong> desde el registro, sin necesidad de facilitar datos de pago. Al finalizar el período de prueba, el acceso al Servicio quedará restringido hasta que el usuario seleccione un plan de pago.</p>
          </section>

          <section>
            <h2>6. Política de cancelación y reembolso</h2>
            <ul>
              <li>El usuario puede cancelar su suscripción en cualquier momento desde el panel de configuración de su cuenta.</li>
              <li>La cancelación surte efecto al finalizar el período de facturación en curso. No se emiten reembolsos prorrateados por el tiempo restante del período.</li>
              <li>En caso de error técnico imputable a Wasapy que impida el uso del Servicio durante más de 48 horas consecutivas, el usuario podrá solicitar compensación proporcional a <a href="mailto:info@wasapy.io">info@wasapy.io</a>.</li>
            </ul>
          </section>

          <section>
            <h2>7. Uso aceptable</h2>
            <p>El usuario se compromete a utilizar el Servicio de conformidad con la legalidad vigente y se prohíbe expresamente:</p>
            <ul>
              <li>Usar el agente IA para enviar spam, mensajes no solicitados o comunicaciones fraudulentas.</li>
              <li>Suplantar la identidad de terceros o inducir a error a los destinatarios de los mensajes.</li>
              <li>Usar el Servicio para actividades ilegales, discriminatorias o que vulneren derechos de terceros.</li>
              <li>Intentar acceder sin autorización a sistemas, datos o cuentas de otros usuarios.</li>
              <li>Realizar ingeniería inversa, descompilar o copiar el software de la plataforma.</li>
              <li>Revender o sublicenciar el acceso al Servicio sin autorización expresa por escrito.</li>
            </ul>
            <p>El incumplimiento de estas normas podrá dar lugar a la suspensión inmediata de la cuenta sin derecho a reembolso.</p>
          </section>

          <section>
            <h2>8. Propiedad intelectual</h2>
            <p>Todos los derechos de propiedad intelectual sobre la plataforma Wasapy (código, diseño, marca, logotipos, textos y funcionalidades) son titularidad de Alejandro Gutiérrez Gómez. Se concede al usuario una licencia limitada, personal, no exclusiva e intransferible para usar el Servicio conforme a estos Términos.</p>
            <p>Los contenidos que el usuario introduce en la plataforma (textos de negocio, tarifas, descripciones de servicios) son de su exclusiva propiedad. Al introducirlos, el usuario otorga a Wasapy una licencia para procesarlos con el único fin de prestar el Servicio.</p>
          </section>

          <section>
            <h2>9. Limitación de responsabilidad</h2>
            <ul>
              <li>Wasapy no garantiza que el agente IA cierre ventas ni que los resultados comerciales sean los esperados. La efectividad del Servicio depende de múltiples factores fuera de nuestro control.</li>
              <li>El Servicio se ofrece «tal como está». Wasapy no se responsabiliza de daños indirectos, lucro cesante o pérdida de datos derivados del uso o imposibilidad de uso del Servicio.</li>
              <li>La responsabilidad máxima de Wasapy frente al usuario se limita al importe pagado por el usuario en los últimos 3 meses.</li>
              <li>Wasapy no es responsable de las comunicaciones enviadas por el agente IA si el usuario ha configurado instrucciones incorrectas, engañosas o contrarias a la legalidad.</li>
            </ul>
          </section>

          <section>
            <h2>10. Disponibilidad del servicio</h2>
            <p>Wasapy se esfuerza por mantener una disponibilidad del 99,5% mensual. No obstante, pueden producirse interrupciones por mantenimiento programado (con previo aviso), fallos de proveedores externos o causas de fuerza mayor. Wasapy no garantiza disponibilidad ininterrumpida.</p>
          </section>

          <section>
            <h2>11. Modificaciones de los Términos</h2>
            <p>Wasapy podrá modificar estos Términos en cualquier momento. Los cambios sustanciales serán notificados al usuario con al menos <strong>15 días de antelación</strong> por correo electrónico. El uso continuado del Servicio tras dicho plazo implica la aceptación de los nuevos Términos.</p>
          </section>

          <section>
            <h2>12. Legislación aplicable y jurisdicción</h2>
            <p>Estos Términos se rigen por la legislación española. Para la resolución de controversias, las partes se someten a los Juzgados y Tribunales de <strong>Barcelona</strong>, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.</p>
          </section>

          <section>
            <h2>13. Contacto</h2>
            <p>Para cualquier consulta sobre estos Términos: <a href="mailto:info@wasapy.io">info@wasapy.io</a></p>
          </section>

        </div>

        <div className="legal-doc__footer">
          <Link to="/privacidad">Política de Privacidad</Link>
          <Link to="/cookies">Política de Cookies</Link>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
