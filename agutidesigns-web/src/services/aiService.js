/* =============================================
   AGUTIDESIGNS - AI Service
   Integración con OpenAI para chatbot, 
   presupuestos automáticos y cualificación de leads
   ============================================= */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// ── Configuración ──
// IMPORTANTE: En producción, usa variables de entorno del servidor (backend)
// Nunca expongas la API key en el frontend en producción
const getApiKey = () => {
  return import.meta.env.VITE_OPENAI_API_KEY || '';
};

// ── System Prompts ──
const CHATBOT_SYSTEM_PROMPT = `Eres el asistente virtual de Agutidesigns, una agencia de diseño web profesional potenciada con Inteligencia Artificial. Tu nombre es "Guti AI".

PERSONALIDAD Y TONO:
- Profesional pero accesible y cercano
- Cálido y humano, como hablar con un amigo que sabe de diseño web
- Con un toque fresco y optimista
- Hablas en español
- Evitas tecnicismos innecesarios
- Eres empático con las necesidades del cliente

TU OBJETIVO:
1. Cualificar al lead (entender qué necesita)
2. Resolver dudas sobre nuestros servicios
3. Guiar hacia la contratación de un pack o presupuesto personalizado
4. Recoger datos de contacto cuando el cliente muestre interés

SERVICIOS QUE OFRECEMOS:
- Pack Starter (497€): Landing page + chatbot IA básico + formulario inteligente
- Pack Business (997€): Web multipágina (hasta 5) + chatbot avanzado + automatizaciones email + CRM básico
- Pack Premium (1.997€): Web completa (hasta 10 páginas) + IA personalizada + automatizaciones completas + dashboard analytics
- Proyecto Personalizado: Presupuesto a medida según necesidades

PROCESO:
1. Primera consulta gratuita
2. Propuesta personalizada en 24h
3. Diseño y desarrollo (2-4 semanas según pack)
4. Lanzamiento + soporte continuo

REGLAS:
- Si el cliente pregunta por precios, da los precios de los packs
- Si necesita algo que no encaja en los packs, sugiere un presupuesto personalizado
- Siempre intenta recoger: nombre, email, tipo de negocio, qué necesita
- Sé conciso pero informativo (máximo 2-3 párrafos por respuesta)
- Usa emojis con moderación
- Si no sabes algo específico, invita al cliente a dejar sus datos para que Guti (Alejandro) le contacte personalmente`;

const QUOTE_SYSTEM_PROMPT = `Eres un experto en presupuestos de diseño web y automatización con IA de Agutidesigns.

Tu tarea es generar un presupuesto detallado basado en los datos del formulario del cliente.

PRECIOS BASE DE REFERENCIA:
- Landing page básica: 300-500€
- Web corporativa (3-5 páginas): 600-1.000€
- Tienda online básica: 1.200-2.000€
- Web compleja / personalizada: 2.000-5.000€
- Chatbot IA básico: 200-400€
- Chatbot IA avanzado: 400-800€
- Automatizaciones email: 150-300€
- CRM integrado: 200-500€
- Dashboard analytics: 300-600€
- Mantenimiento mensual: 50-150€/mes
- SEO básico: 200-400€
- SEO avanzado: 400-800€

FORMATO DEL PRESUPUESTO:
Genera un presupuesto profesional pero cercano, con:
1. Saludo personalizado
2. Resumen de lo que necesita el cliente
3. Desglose de servicios con precios
4. Total estimado (rango)
5. Tiempo estimado de entrega
6. Siguiente paso (agendar llamada)

REGLAS:
- Sé profesional pero cercano (tono Agutidesigns)
- Da un rango de precios (mínimo-máximo)
- Menciona que es un presupuesto orientativo
- Invita a una videollamada para definir detalles
- Responde en español`;

const LEAD_QUALIFICATION_PROMPT = `Analiza la conversación del chatbot y clasifica al lead.

Devuelve un JSON con esta estructura:
{
  "score": número del 1-10 (1=frío, 10=listo para comprar),
  "intent": "informativo" | "comparando" | "listo_para_comprar",
  "budget_range": "bajo" | "medio" | "alto",
  "recommended_pack": "starter" | "business" | "premium" | "custom",
  "key_needs": ["necesidad1", "necesidad2"],
  "contact_info": { "name": "", "email": "", "business": "" },
  "next_action": "descripción de la siguiente acción recomendada"
}`;

// ── API Call Helper ──
async function callOpenAI(messages, options = {}) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    // Modo demo sin API key - respuestas simuladas
    return generateDemoResponse(messages);
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4o-mini',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        ...options.extra,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateDemoResponse(messages);
  }
}

// ── Demo Responses (sin API key) ──
function generateDemoResponse(messages) {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  if (lastMessage.includes('precio') || lastMessage.includes('cuánto') || lastMessage.includes('costar')) {
    return `¡Buena pregunta! 😊 Tenemos tres packs diseñados para diferentes necesidades:

**Pack Starter (497€)** — Perfecto si necesitas una landing page con chatbot IA básico.

**Pack Business (997€)** — Ideal si necesitas una web más completa con hasta 5 páginas, chatbot avanzado y automatizaciones.

**Pack Premium (1.997€)** — La solución completa con hasta 10 páginas, IA personalizada y todas las automatizaciones.

¿Te gustaría que te explique alguno en detalle? También podemos hacer un **presupuesto personalizado** si tu proyecto tiene necesidades específicas.`;
  }
  
  if (lastMessage.includes('hola') || lastMessage.includes('buenas') || lastMessage.includes('hey')) {
    return `¡Hola! 👋 Soy Guti AI, el asistente virtual de Agutidesigns. Estoy aquí para ayudarte a encontrar la solución web perfecta para tu negocio.

¿En qué puedo ayudarte? Por ejemplo:
- 🌐 Información sobre nuestros packs de web + IA
- 💰 Precios y presupuestos
- 🤖 Cómo funciona la integración de IA
- 📋 Proceso de trabajo

¡Pregúntame lo que necesites!`;
  }

  if (lastMessage.includes('ia') || lastMessage.includes('inteligencia') || lastMessage.includes('chatbot')) {
    return `¡La IA es nuestro superpoder! 🤖 En Agutidesigns integramos Inteligencia Artificial en cada web para automatizar y potenciar tu negocio:

**Chatbot inteligente** — Atiende a tus clientes 24/7, resuelve dudas y cualifica leads automáticamente.

**Automatización de emails** — Seguimiento automático de leads, newsletters y comunicaciones personalizadas.

**Presupuestos automáticos** — Tu web puede generar presupuestos al instante basados en las necesidades del cliente.

Todo esto se adapta a tu negocio. ¿Te gustaría saber más sobre alguna de estas funcionalidades?`;
  }

  if (lastMessage.includes('proceso') || lastMessage.includes('cómo funciona') || lastMessage.includes('pasos')) {
    return `¡Es muy sencillo! Nuestro proceso está diseñado para que sea fácil y sin complicaciones:

**1. Consulta gratuita** — Hablamos sobre tu negocio y tus necesidades (15 min).

**2. Propuesta en 24h** — Te enviamos una propuesta personalizada con todo detallado.

**3. Diseño y desarrollo** — Creamos tu web con IA integrada (2-4 semanas según el pack).

**4. Lanzamiento + soporte** — Lanzamos tu web y te damos soporte continuo.

¿Te gustaría agendar tu consulta gratuita? Solo necesito tu nombre y email 😊`;
  }

  return `¡Gracias por tu interés! 😊 En Agutidesigns creamos páginas web profesionales potenciadas con Inteligencia Artificial.

Puedo ayudarte con información sobre:
- Nuestros **packs de Web + IA** (desde 497€)
- El **proceso de trabajo**
- **Presupuestos personalizados**
- Cómo la **IA puede automatizar** tu negocio

¿Qué te gustaría saber?`;
}

// ── Chatbot Service ──
export async function sendChatMessage(conversationHistory, userMessage) {
  const messages = [
    { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const response = await callOpenAI(messages, {
    temperature: 0.8,
    maxTokens: 800,
  });

  return response;
}

// ── Quote Generator ──
export async function generateQuote(formData) {
  const userMessage = `
Genera un presupuesto para este cliente:

DATOS DEL CLIENTE:
- Nombre: ${formData.name}
- Email: ${formData.email}
- Empresa/Negocio: ${formData.business}
- Sector: ${formData.sector}

NECESIDADES DEL PROYECTO:
- Tipo de web: ${formData.webType}
- Número de páginas estimado: ${formData.pages}
- Funcionalidades IA deseadas: ${formData.aiFeatures?.join(', ') || 'No especificadas'}
- Funcionalidades extra: ${formData.extraFeatures?.join(', ') || 'Ninguna'}
- Tiene web actualmente: ${formData.hasCurrentWeb ? 'Sí' : 'No'}
- URL web actual: ${formData.currentWebUrl || 'N/A'}
- Presupuesto aproximado del cliente: ${formData.budgetRange}
- Plazo deseado: ${formData.timeline}
- Descripción adicional: ${formData.description || 'Sin descripción adicional'}
`;

  const messages = [
    { role: 'system', content: QUOTE_SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ];

  const response = await callOpenAI(messages, {
    temperature: 0.6,
    maxTokens: 1500,
    model: 'gpt-4o-mini',
  });

  return response;
}

// ── Lead Qualification ──
export async function qualifyLead(conversationHistory) {
  const messages = [
    { role: 'system', content: LEAD_QUALIFICATION_PROMPT },
    ...conversationHistory,
    { role: 'user', content: 'Analiza esta conversación y clasifica al lead. Responde SOLO con el JSON.' },
  ];

  const response = await callOpenAI(messages, {
    temperature: 0.3,
    maxTokens: 500,
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      score: 5,
      intent: 'informativo',
      budget_range: 'medio',
      recommended_pack: 'business',
      key_needs: [],
      contact_info: {},
      next_action: 'Seguir cualificando al lead',
    };
  }
}

// ── Email Automation (simulated - en producción usar backend) ──
export async function sendAutomatedEmail(type, data) {
  // En producción esto iría a un backend que use SendGrid, Resend, etc.
  console.log(`[AI Email] Tipo: ${type}`, data);
  
  const emailTemplates = {
    welcome: {
      subject: `¡Hola ${data.name}! Bienvenido/a a Agutidesigns`,
      body: `Gracias por tu interés. En breve recibirás más información sobre nuestros servicios.`,
    },
    quote: {
      subject: `Tu presupuesto personalizado de Agutidesigns`,
      body: data.quoteContent,
    },
    followup: {
      subject: `${data.name}, ¿pudiste revisar nuestra propuesta?`,
      body: `Queríamos saber si tuviste oportunidad de revisar el presupuesto. Estamos aquí para resolver cualquier duda.`,
    },
    pack_confirmation: {
      subject: `¡Genial ${data.name}! Tu solicitud del ${data.packName || 'pack'} está en marcha`,
      body: `Hemos recibido tu solicitud para el ${data.packName || 'pack'} (${data.packPrice || ''}€). Te contactaremos en menos de 24h para empezar. ¡Esto va a ser genial!`,
    },
    new_lead: {
      subject: `[Nuevo Lead] ${data.name} quiere el ${data.packName || 'un pack'}`,
      body: `Nuevo lead:\n- Nombre: ${data.name}\n- Email: ${data.email}\n- Teléfono: ${data.phone || 'No proporcionado'}\n- Negocio: ${data.business || 'No indicado'}\n- Pack: ${data.packName || 'No definido'}`,
    },
    price_request: {
      subject: `${data.name} quiere saber el precio del ${data.packName || 'pack'}`,
      body: `Solicitud de precio:\n- Nombre: ${data.name}\n- Email: ${data.email}\n- WhatsApp: ${data.phone}\n- Negocio: ${data.business || 'No indicado'}\n- Pack: ${data.packName}\n- WhatsApp IA: ${data.whatsappPlan || 'No'}`,
    },
  };

  return {
    success: true,
    template: emailTemplates[type],
    message: `Email "${type}" preparado para ${data.email}`,
  };
}

export default {
  sendChatMessage,
  generateQuote,
  qualifyLead,
  sendAutomatedEmail,
};
