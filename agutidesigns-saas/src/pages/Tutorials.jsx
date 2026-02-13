import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, MessageCircle, Building, Brain, CreditCard,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, Lightbulb,
  ArrowRight, Smartphone, QrCode, Settings, Wifi, MousePointer,
  Type, List, Clock, MapPin, DollarSign, HelpCircle, Shield,
  Users, Sparkles, Copy, Save, Eye, Zap, Lock, Mail,
  LayoutDashboard, RefreshCw
} from 'lucide-react';
import './DashboardPages.css';

function TutorialStep({ number, title, desc, tip, warning }) {
  return (
    <div className="tut-step">
      <div className="tut-step__number">{number}</div>
      <div className="tut-step__content">
        <h4 className="tut-step__title">{title}</h4>
        <p className="tut-step__desc">{desc}</p>
        {tip && (
          <div className="tut-step__tip">
            <Lightbulb size={14} />
            <span>{tip}</span>
          </div>
        )}
        {warning && (
          <div className="tut-step__warning">
            <AlertCircle size={14} />
            <span>{warning}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TutorialCard({ tutorial, isOpen, onToggle }) {
  return (
    <div className={`tut-card ${isOpen ? 'tut-card--open' : ''}`}>
      <button className="tut-card__header" onClick={onToggle}>
        <div className="tut-card__header-left">
          <div className="tut-card__icon">{tutorial.icon}</div>
          <div>
            <h3>{tutorial.title}</h3>
            <p>{tutorial.desc}</p>
          </div>
        </div>
        <div className="tut-card__header-right">
          <span className="tut-card__duration"><Clock size={12} /> {tutorial.duration}</span>
          <span className="tut-card__steps-count">{tutorial.steps.length} pasos</span>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {isOpen && (
        <div className="tut-card__body">
          {tutorial.intro && <p className="tut-card__intro">{tutorial.intro}</p>}

          <div className="tut-steps">
            {tutorial.steps.map((step, i) => (
              <TutorialStep key={i} number={i + 1} {...step} />
            ))}
          </div>

          {tutorial.result && (
            <div className="tut-card__result">
              <CheckCircle size={16} />
              <span>{tutorial.result}</span>
            </div>
          )}

          {tutorial.faq && tutorial.faq.length > 0 && (
            <div className="tut-card__faq">
              <h4><HelpCircle size={14} /> Dudas frecuentes</h4>
              {tutorial.faq.map((item, i) => (
                <div key={i} className="tut-card__faq-item">
                  <strong>{item.q}</strong>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const tutorials = [
  {
    icon: <LayoutDashboard size={22} />,
    title: 'Primeros pasos: ¿por dónde empiezo?',
    desc: 'Guía completa para configurar tu agente desde cero. Empieza aquí.',
    duration: '5 min',
    intro: 'Bienvenido. Configurar tu agente de WhatsApp IA es muy sencillo. Solo tienes que seguir estos pasos en orden. No necesitas saber nada de programación ni de tecnología.',
    steps: [
      { title: 'Lo primero: rellena los datos de tu negocio', desc: 'Haz clic en "Mi Negocio" en el menú de la izquierda. Ahí tendrás que rellenar la información básica: nombre de tu negocio, a qué te dedicas, tus servicios, precios y horarios. La IA necesita esta información para poder responder a tus clientes.', tip: 'No hace falta que lo rellenes todo de golpe. Empieza por lo básico (nombre, servicios y horarios) y luego ve añadiendo más.' },
      { title: 'Configura cómo quieres que hable tu agente', desc: 'Ve a "Prompt IA" en el menú. Aquí decides la personalidad de tu agente: si quieres que sea cercano, profesional, divertido... También eliges qué puede hacer (responder preguntas, gestionar citas, captar datos de clientes...).', tip: 'Si no sabes qué elegir, deja las opciones por defecto. Ya funcionan bien para la mayoría de negocios.' },
      { title: 'Conecta tu WhatsApp', desc: 'Ve a "WhatsApp" en el menú. Verás un código QR en pantalla. Coge tu teléfono, abre WhatsApp, ve a Ajustes → Dispositivos vinculados → Vincular dispositivo, y escanea ese código QR con la cámara de tu teléfono.', warning: 'Necesitas WhatsApp Business (la app verde con una B). Si solo tienes WhatsApp normal, descarga WhatsApp Business de la tienda de apps. Es gratis.' },
      { title: '¡Ya está! Tu agente está activo', desc: 'Una vez conectado el WhatsApp, tu agente empezará a responder automáticamente a los mensajes que recibas. Puedes ver las conversaciones y estadísticas desde el Dashboard.', tip: 'Pruébalo tú mismo: pídele a un amigo que te escriba por WhatsApp y verás cómo el agente responde solo.' },
    ],
    result: 'Tu agente de WhatsApp IA está activo y respondiendo a tus clientes 24/7.',
    faq: [
      { q: '¿Cuánto tarda en estar todo listo?', a: 'Si ya tienes claros tus servicios y precios, en 10-15 minutos lo tienes funcionando.' },
      { q: '¿Puedo cambiarlo después?', a: 'Sí, puedes modificar todo en cualquier momento: datos del negocio, personalidad del agente, reglas...' },
      { q: '¿Y si el agente no sabe responder algo?', a: 'Si no tiene la información, le dirá al cliente que contacte contigo directamente. Nunca se inventará datos.' },
    ],
  },
  {
    icon: <Building size={22} />,
    title: 'Cómo rellenar los datos de tu negocio',
    desc: 'Paso a paso para que la IA tenga toda la información necesaria.',
    duration: '10 min',
    intro: 'Esta es la parte más importante. Cuanta más información le des a la IA, mejores serán sus respuestas. Piensa que es como darle un manual de tu negocio.',
    steps: [
      { title: 'Ve a "Mi Negocio" en el menú lateral', desc: 'En la barra de la izquierda, haz clic en "Mi Negocio". Se abrirá una página con varias secciones desplegables.' },
      { title: 'Abre la sección "Información general"', desc: 'Haz clic en "Información general" para desplegarla. Rellena:\n\n• Nombre del negocio: exactamente como quieres que la IA lo diga.\n• Sector: el tipo de negocio (peluquería, restaurante, clínica...).\n• Eslogan: una frase corta que resuma tu negocio.\n• Descripción: aquí cuéntale a la IA todo sobre tu negocio. Qué hacéis, vuestra historia, qué os diferencia.', tip: 'En la descripción, escribe como si le explicaras a un amigo a qué te dedicas. No hace falta ser formal.' },
      { title: 'Rellena "Contacto y ubicación"', desc: 'Pon tu teléfono, email, web y dirección. Si tienes un link de Google Maps, añádelo. Así cuando un cliente pregunte "¿dónde estáis?", la IA podrá enviar la ubicación.', tip: 'Si no tienes web, no pasa nada. Deja ese campo vacío.' },
      { title: 'Añade tus horarios', desc: 'Rellena los horarios de lunes a viernes, sábados y domingos. Si hay días especiales o festivos, ponlo en "Notas sobre horarios".', tip: 'Ejemplo: "Lunes a Viernes: 9:00 - 20:00". Así de simple.' },
      { title: 'Lista tus servicios y precios', desc: 'Esta es clave. Escribe todos los servicios que ofreces y sus precios. Un servicio por línea, con su precio al lado.\n\nEjemplo:\n- Corte caballero: 15€\n- Tinte: 30€\n- Manicura: 20€', tip: 'Si tienes ofertas o promociones, ponlas en el campo "Ofertas actuales". La IA las mencionará cuando sea relevante.' },
      { title: 'Añade las preguntas frecuentes', desc: 'Piensa en las preguntas que te hacen los clientes por WhatsApp una y otra vez. Escríbelas con su respuesta.\n\nEjemplo:\n¿Aceptáis reservas?\nSí, por WhatsApp o llamando al 600 000 000.\n\n¿Tenéis parking?\nSí, parking gratuito en la puerta.', tip: 'Cuantas más preguntas frecuentes añadas, menos mensajes tendrás que responder tú personalmente.' },
      { title: 'Políticas del negocio', desc: 'Si tienes política de cancelación, métodos de pago, política de devoluciones... ponlo aquí. La IA lo usará cuando sea necesario.' },
      { title: 'Dale al botón "Guardar"', desc: 'Cuando termines, baja hasta abajo y pulsa el botón verde "Guardar toda la información". Verás una confirmación de que se ha guardado correctamente.', warning: 'Si no le das a Guardar, los cambios se pierden. ¡No te olvides!' },
    ],
    result: 'Tu agente IA ahora conoce tu negocio y puede responder con información real y precisa.',
    faq: [
      { q: '¿Puedo volver a editar después?', a: 'Sí, cuando quieras. Si cambias precios o servicios, ven aquí y actualiza.' },
      { q: '¿Qué pasa si no relleno todo?', a: 'Funciona igualmente, pero con menos información. La IA solo responderá sobre lo que sepa.' },
      { q: '¿La IA se inventa cosas si no tiene info?', a: 'No. Si no tiene un dato, le dirá al cliente que contacte contigo directamente.' },
    ],
  },
  {
    icon: <Brain size={22} />,
    title: 'Cómo configurar la personalidad de tu agente',
    desc: 'Define cómo habla, qué puede hacer y qué no puede hacer.',
    duration: '5 min',
    intro: 'Tu agente puede tener la personalidad que quieras. Puede ser simpático, profesional, gracioso... Tú decides. Aquí te explicamos cómo configurarlo paso a paso.',
    steps: [
      { title: 'Ve a "Prompt IA" en el menú lateral', desc: 'Haz clic en "Prompt IA" en la barra de la izquierda.' },
      { title: 'Pon un nombre a tu agente', desc: 'Escribe cómo quieres que se llame. Ejemplo: "Asistente de Peluquería María" o "Sara, tu asistente virtual". Este nombre lo usará al presentarse.', tip: 'Usa un nombre que suene natural y cercano. Evita nombres robóticos como "Bot-3000".' },
      { title: 'Elige el idioma', desc: 'Selecciona en qué idioma quieres que responda. Si tienes clientes de varios idiomas, elige "Detectar idioma del cliente" y la IA responderá en el idioma de cada persona.' },
      { title: 'Elige la personalidad', desc: 'Verás 5 opciones. Haz clic en la que más se parezca a cómo quieres que hable:\n\n• Cercano y amigable: como un amigo que trabaja ahí\n• Profesional: serio pero accesible\n• Formal: trato de usted, muy corporativo\n• Divertido: con humor, desenfadado\n• Empático: muy atento a cómo se siente el cliente', tip: 'Si no sabes cuál elegir, "Cercano y amigable" funciona bien para la mayoría de negocios.' },
      { title: 'Elige qué puede hacer tu agente', desc: 'Selecciona las funciones haciendo clic en cada una:\n\n• Responder preguntas frecuentes\n• Gestionar citas y reservas\n• Captar datos de contacto (nombre, teléfono)\n• Informar sobre precios\n• Recomendar servicios\n• Gestionar quejas\n• Seguimiento post-servicio\n• Informar de ofertas\n• Derivar a humano si no puede resolver', tip: 'Las más útiles para empezar: "Responder preguntas", "Informar precios" y "Captar datos". El resto puedes añadirlo después.' },
      { title: 'Elige las restricciones', desc: 'Esto es lo que NO quieres que haga. Por ejemplo:\n\n• No ofrecer descuentos por su cuenta\n• No inventar información\n• No hablar de la competencia\n• Derivar consultas complejas a una persona real', tip: 'Te recomendamos dejar activas "No inventar información" y "Derivar consultas complejas a humano". Así tu agente será honesto y seguro.' },
      { title: 'Personaliza el saludo y la despedida', desc: 'Escribe cómo quieres que salude cuando alguien le escribe por primera vez. Ejemplo:\n\n"¡Hola! 👋 Soy Sara, la asistente virtual de Peluquería María. ¿En qué puedo ayudarte?"\n\nY cómo se despide:\n\n"¡Gracias por contactar! Si necesitas algo más, aquí estaré. ¡Buen día! 😊"' },
      { title: 'Haz clic en "Generar prompt"', desc: 'Pulsa el botón verde grande "Generar prompt de mi agente". Verás un texto largo que aparece abajo. Ese es el "cerebro" de tu agente: las instrucciones que sigue para responder.', tip: 'No necesitas entender ni modificar ese texto. Se genera automáticamente con lo que has elegido.' },
      { title: 'Guarda el prompt', desc: 'Debajo del texto generado, pulsa "Guardar como prompt activo". ¡Listo! Tu agente ya tiene su personalidad configurada.', warning: 'Si no le das a Guardar, tu agente seguirá con la configuración anterior.' },
    ],
    result: 'Tu agente tiene personalidad propia y responde siguiendo tus reglas.',
    faq: [
      { q: '¿Puedo cambiar la personalidad después?', a: 'Sí, las veces que quieras. Vuelve a Prompt IA, cambia lo que necesites, regenera y guarda.' },
      { q: '¿Qué es un "prompt"?', a: 'Es simplemente un texto con instrucciones para la IA. Es como un manual de comportamiento. No necesitas editarlo a mano, se genera solo.' },
      { q: '¿Puedo tener diferentes personalidades para diferentes horarios?', a: 'De momento no, pero es algo que estamos desarrollando.' },
    ],
  },
  {
    icon: <MessageCircle size={22} />,
    title: 'Cómo conectar tu WhatsApp paso a paso',
    desc: 'Vincula tu número para que el agente responda por ti.',
    duration: '3 min',
    intro: 'Para que tu agente pueda responder por WhatsApp, necesitas vincular tu número. Es como cuando conectas WhatsApp Web en tu ordenador, pero en vez de tú responder, responde la IA.',
    steps: [
      { title: 'Asegúrate de tener WhatsApp Business', desc: 'Necesitas la app WhatsApp Business (tiene una "B" en el icono, es verde más oscuro que el WhatsApp normal). Si no la tienes, descárgala gratis desde la App Store o Google Play.', warning: 'WhatsApp normal NO funciona para esto. Tiene que ser WhatsApp Business. Es gratis y puedes tener las dos apps en el mismo teléfono.' },
      { title: 'Ve a "WhatsApp" en el menú lateral', desc: 'En tu dashboard, haz clic en "WhatsApp" en la barra de la izquierda. Verás una página con un código QR grande.' },
      { title: 'Abre WhatsApp Business en tu teléfono', desc: 'Coge tu teléfono y abre la app WhatsApp Business.' },
      { title: 'Ve a la vinculación de dispositivos', desc: 'En WhatsApp Business:\n\n• En iPhone: toca "Configuración" (abajo a la derecha) → "Dispositivos vinculados"\n• En Android: toca los tres puntos (arriba a la derecha) → "Dispositivos vinculados"' },
      { title: 'Toca "Vincular un dispositivo"', desc: 'Se abrirá la cámara de tu teléfono con un escáner de QR.' },
      { title: 'Escanea el código QR de la pantalla', desc: 'Apunta la cámara de tu teléfono al código QR que aparece en tu dashboard. Espera unos segundos hasta que se vincule.', tip: 'Si el QR no funciona, pulsa "Actualizar QR" y prueba de nuevo. A veces caducan si tardan mucho.' },
      { title: '¡Conectado!', desc: 'Verás un mensaje de "WhatsApp conectado" con un punto verde. Eso significa que todo funciona. Tu agente IA ya está respondiendo por ti.' },
    ],
    result: 'Tu WhatsApp está vinculado y el agente IA responde automáticamente a tus clientes.',
    faq: [
      { q: '¿Mi teléfono tiene que estar encendido?', a: 'Sí, tu teléfono debe estar encendido y con conexión a internet. Si se apaga, el agente deja de funcionar hasta que lo enciendas.' },
      { q: '¿Puedo seguir usando WhatsApp normal?', a: 'Sí. Tú sigues usando WhatsApp como siempre. El agente responde automáticamente, pero si tú contestas a un mensaje, el agente se detiene en esa conversación.' },
      { q: '¿Ven mis clientes que es un bot?', a: 'No. Los mensajes salen desde tu número normal de WhatsApp Business. Para el cliente parece que eres tú respondiendo.' },
      { q: '¿Se desconecta solo?', a: 'A veces WhatsApp puede desconectar dispositivos vinculados. Si pasa, vuelve a escanear el QR.' },
    ],
  },
  {
    icon: <CreditCard size={22} />,
    title: 'Suscripción y pagos',
    desc: 'Cómo funciona el trial, los planes y cómo pagar.',
    duration: '2 min',
    intro: 'Al registrarte tienes 2 días de prueba gratis con acceso a todo. Aquí te explicamos qué pasa después y cómo elegir un plan.',
    steps: [
      { title: 'Tu prueba gratuita', desc: 'Al crear tu cuenta, tienes 2 días para probar todo el servicio sin pagar nada. No te pedimos tarjeta de crédito para la prueba.', tip: 'Aprovecha los 2 días para configurar tu negocio, el prompt y conectar WhatsApp. Así cuando empieces a pagar, ya estará todo funcionando.' },
      { title: 'Ve a "Suscripción" en el menú', desc: 'Ahí verás cuánto te queda de prueba y los planes disponibles.' },
      { title: 'Elige un plan', desc: 'Tenemos tres planes:\n\n• Starter (29€/mes): 500 mensajes/mes, 1 agente\n• Pro (79€/mes): 5.000 mensajes/mes, 3 agentes\n• Business (199€/mes): 20.000 mensajes/mes, agentes ilimitados\n\nElige el que se adapte a tu volumen de mensajes.' },
      { title: 'Realiza el pago', desc: 'Haz clic en "Elegir [plan]" y te llevará a una página de pago segura (Stripe). Puedes pagar con tarjeta de crédito o débito.', tip: 'El pago es mensual. Puedes cancelar cuando quieras, no hay permanencia.' },
    ],
    result: 'Tu suscripción está activa y tu agente sigue funcionando sin interrupciones.',
    faq: [
      { q: '¿Qué pasa si se me acaba el trial y no pago?', a: 'Tu agente se desactiva y deja de responder. Tus datos se mantienen. Cuando pagues, todo vuelve a funcionar.' },
      { q: '¿Puedo cambiar de plan?', a: 'Sí, puedes subir o bajar de plan en cualquier momento desde "Suscripción".' },
      { q: '¿Hay descuentos por pago anual?', a: 'Sí, contacta con nosotros por WhatsApp y te hacemos un precio especial.' },
      { q: '¿Puedo cancelar cuando quiera?', a: 'Sí, sin permanencia ni penalización. Cancelas y al final del mes deja de cobrarse.' },
    ],
  },
  {
    icon: <HelpCircle size={22} />,
    title: 'Problemas comunes y soluciones',
    desc: 'Si algo no funciona, revisa esto antes de contactar soporte.',
    duration: '3 min',
    intro: 'Aquí encontrarás las soluciones a los problemas más habituales.',
    steps: [
      { title: 'El agente no responde a los mensajes', desc: 'Comprueba:\n\n1. ¿Tu WhatsApp está conectado? Ve a "WhatsApp" y mira si dice "Conectado" con punto verde.\n2. ¿Tu teléfono está encendido y con internet?\n3. ¿Has guardado el prompt? Ve a "Prompt IA" y asegúrate de que hay un prompt guardado.\n4. ¿Tienes suscripción activa? Ve a "Suscripción" y comprueba.', tip: 'En el 90% de los casos es porque WhatsApp se ha desconectado. Vuelve a escanear el QR.' },
      { title: 'El agente responde cosas incorrectas', desc: 'La IA responde con lo que le has dado en "Mi Negocio". Si dice algo mal:\n\n1. Ve a "Mi Negocio" y corrige la información\n2. Asegúrate de que los precios están actualizados\n3. Guarda los cambios' },
      { title: 'El QR no funciona o no carga', desc: '1. Refresca la página (F5 o Cmd+R)\n2. Prueba desde otro navegador\n3. Comprueba que tienes WhatsApp Business actualizado a la última versión\n4. Si sigue sin funcionar, cierra WhatsApp en el teléfono, ábrelo de nuevo, y prueba otra vez' },
      { title: 'No me llega el email de verificación', desc: '1. Revisa la carpeta de spam/correo no deseado\n2. Espera 2-3 minutos, a veces tarda\n3. Comprueba que escribiste bien el email\n4. Prueba con otro email si el problema persiste' },
      { title: 'Necesito ayuda personalizada', desc: 'Si nada de esto resuelve tu problema, escríbenos directamente por WhatsApp y te ayudamos en el momento.' },
    ],
    result: 'Si sigues estos pasos, la mayoría de problemas se resuelven en minutos.',
  },
];

export default function Tutorials() {
  const [openTutorial, setOpenTutorial] = useState(0);

  const toggle = (i) => setOpenTutorial(openTutorial === i ? -1 : i);

  return (
    <div className="page">
      <div className="page__header">
        <h1>Tutoriales</h1>
        <p>Guías paso a paso para que saques el máximo partido a tu agente IA. Si es tu primera vez, empieza por arriba.</p>
      </div>

      <div className="tut-list">
        {tutorials.map((t, i) => (
          <TutorialCard key={i} tutorial={t} isOpen={openTutorial === i} onToggle={() => toggle(i)} />
        ))}
      </div>

      {/* Help CTA */}
      <div className="tut-help">
        <HelpCircle size={20} />
        <div>
          <h4>¿Sigues con dudas?</h4>
          <p>Escríbenos por WhatsApp y te ayudamos personalmente.</p>
        </div>
        <Link to="/app/soporte" className="btn btn--primary">
          <HelpCircle size={14} /> Crear ticket de soporte
        </Link>
      </div>
    </div>
  );
}
