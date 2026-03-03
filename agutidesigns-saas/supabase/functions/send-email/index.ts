import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

interface EmailRequest {
  to: string
  subject: string
  template: 'welcome' | 'payment_success' | 'messages_80' | 'messages_95' | 'plan_cancelled' | 
            'ticket_created' | 'ticket_reply' | 'trial_expiring' | 'agent_connected' | 
            'invoice_generated' | 'payment_failed' | 'plan_expired' |
            'appointment_booked' | 'new_lead' | 'subscription_renewed'
  data?: Record<string, any>
}

function getTemplate(template: string, data: Record<string, any> = {}): string {
  const baseStyles = `
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e4e4e7; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #111; border: 1px solid #1e1e1e; border-radius: 16px; padding: 32px; margin-bottom: 20px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo img { height: 40px; }
    h1 { font-size: 24px; font-weight: 700; color: #25D366; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.6; color: #aaa; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 14px 28px; background: #25D366; color: #000; text-decoration: none; border-radius: 99px; font-weight: 700; font-size: 14px; margin: 16px 0; }
    .btn:hover { background: #2ee56e; }
    .footer { text-align: center; padding: 20px; font-size: 13px; color: #555; }
    .highlight { color: #25D366; font-weight: 600; }
    .alert { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 8px; padding: 16px; margin: 16px 0; }
    .alert-error { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2); }
    .stats { display: flex; gap: 16px; margin: 20px 0; }
    .stat { flex: 1; background: #0a0a0a; border: 1px solid #222; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 800; color: #25D366; display: block; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
  `

  const templates = {
    welcome: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>¡Bienvenido a Wasapy! 🚀</h1>
          <p>Hola <strong>${data.name || 'ahí'}</strong>,</p>
          <p>Estamos emocionados de tenerte con nosotros. Tu agente de WhatsApp IA está listo para empezar a atender a tus clientes 24/7.</p>
          <p><strong>Próximos pasos:</strong></p>
          <ol style="color: #aaa; line-height: 1.8;">
            <li>Conecta tu número de WhatsApp escaneando el código QR</li>
            <li>Configura los datos de tu negocio para que la IA tenga contexto</li>
            <li>Personaliza el prompt de tu agente según tu estilo</li>
            <li>¡Empieza a recibir y responder mensajes automáticamente!</li>
          </ol>
          <a href="https://app.wasapy.io/app" class="btn">Ir al dashboard</a>
          <p style="font-size: 13px; color: #666; margin-top: 24px;">Tienes <span class="highlight">${data.trialDays || 7} días de prueba gratis</span> para probarlo todo sin límites.</p>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,
    
    payment_success: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>¡Pago recibido! ✅</h1>
          <p>Hola <strong>${data.name || 'ahí'}</strong>,</p>
          <p>Tu pago de <span class="highlight">${data.amount}€</span> se ha procesado correctamente.</p>
          <div class="stats">
            <div class="stat"><span class="stat-value">${data.plan || 'Pro'}</span><span class="stat-label">Plan</span></div>
            <div class="stat"><span class="stat-value">${data.amount}€</span><span class="stat-label">Pagado</span></div>
          </div>
          <p>Tu agente de WhatsApp IA ya está activo y listo para responder a tus clientes.</p>
          <a href="https://app.wasapy.io/app" class="btn">Ir al dashboard</a>
          <p style="font-size: 13px; color: #666; margin-top: 24px;">Próxima factura: ${data.nextBilling || '—'}</p>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://app.wasapy.io/app/billing" style="color: #666;">Ver factura</a></div>
      </div>
    `,

    messages_80: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <div class="alert">
            <h1 style="margin-bottom: 8px;">⚠️ Llegando al límite de mensajes</h1>
            <p>Has usado <span class="highlight">${data.used || 0} de ${data.limit || 0} mensajes</span> este mes (${data.percentage || 0}%).</p>
          </div>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Te quedan pocos mensajes disponibles. Para que tu agente IA siga respondiendo sin interrupciones, te recomendamos ampliar tu plan.</p>
          <a href="https://app.wasapy.io/app/mensajes" class="btn">Ampliar mensajes</a>
          <p style="font-size: 13px; color: #666;">Si llegas al límite, tu agente se desconectará automáticamente hasta el próximo ciclo o hasta que añadas más mensajes.</p>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    messages_95: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <div class="alert alert-error">
            <h1 style="margin-bottom: 8px; color: #ef4444;">🚨 ¡Casi sin mensajes!</h1>
            <p>Has usado <span class="highlight">${data.used || 0} de ${data.limit || 0} mensajes</span> (${data.percentage || 0}%).</p>
          </div>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p><strong>Tu agente está a punto de desconectarse.</strong> Te quedan muy pocos mensajes. Amplía tu plan ahora para que siga atendiendo a tus clientes.</p>
          <a href="https://app.wasapy.io/app/mensajes" class="btn" style="background: #ef4444;">Ampliar ahora</a>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    plan_cancelled: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>Plan cancelado</h1>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Tu suscripción se ha cancelado correctamente. Seguirás teniendo acceso hasta el <span class="highlight">${data.accessUntil}</span>.</p>
          <p>Después de esa fecha, tu agente de WhatsApp IA se desactivará automáticamente.</p>
          <p style="margin-top: 24px;">Si cambias de opinión, puedes reactivar tu plan en cualquier momento desde el dashboard.</p>
          <a href="https://app.wasapy.io/app/billing" class="btn">Reactivar plan</a>
        </div>
        <div class="footer">© 2026 Wasapy · Esperamos verte pronto 💚</div>
      </div>
    `,

    ticket_created: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>Ticket creado #${data.ticketId || '---'}</h1>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Hemos recibido tu solicitud de soporte:</p>
          <div style="background: #0a0a0a; border: 1px solid #222; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-weight: 600; color: #fff; margin-bottom: 8px;"><strong>Asunto:</strong> ${data.subject}</p>
            <p style="color: #777; font-size: 14px; margin: 0;">${data.message}</p>
          </div>
          <p>Nuestro equipo revisará tu consulta y te responderemos en <span class="highlight">menos de 24 horas</span>.</p>
          <a href="https://app.wasapy.io/app/soporte" class="btn">Ver mis tickets</a>
        </div>
        <div class="footer">© 2026 Wasapy · Soporte</div>
      </div>
    `,

    ticket_reply: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>💬 Nueva respuesta a tu ticket</h1>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>El equipo de Agutidesigns ha respondido a tu ticket <span class="highlight">#${data.ticketId}</span>:</p>
          <div style="background: rgba(37,211,102,0.08); border: 1px solid rgba(37,211,102,0.2); border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 14px; color: #ddd; line-height: 1.6; margin: 0;">${data.replyPreview}</p>
          </div>
          <a href="https://app.wasapy.io/app/soporte" class="btn">Ver respuesta completa</a>
        </div>
        <div class="footer">© 2026 Wasapy · Soporte</div>
      </div>
    `,

    trial_expiring: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <div class="alert">
            <h1 style="margin-bottom: 8px;">⏰ Tu prueba termina en ${data.daysLeft || 2} días</h1>
          </div>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Tu periodo de prueba gratuito está a punto de expirar. Para que tu agente de WhatsApp IA siga funcionando, elige un plan antes del <span class="highlight">${data.expiryDate}</span>.</p>
          <div class="stats">
            <div class="stat"><span class="stat-value">${data.messagesUsed || 0}</span><span class="stat-label">Mensajes</span></div>
            <div class="stat"><span class="stat-value">${data.leadsGenerated || 0}</span><span class="stat-label">Leads</span></div>
          </div>
          <p>Continúa automatizando tu atención al cliente desde <strong>solo 29€/mes</strong>.</p>
          <a href="https://app.wasapy.io/app/billing" class="btn">Ver planes</a>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    agent_connected: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>✅ WhatsApp conectado con éxito</h1>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Tu número de WhatsApp <span class="highlight">${data.phone}</span> se ha conectado correctamente.</p>
          <p>Tu agente IA <strong>"${data.agentName}"</strong> ya está activo y respondiendo mensajes automáticamente.</p>
          <a href="https://app.wasapy.io/app/whatsapp" class="btn">Ver conversaciones</a>
          <p style="font-size: 13px; color: #666; margin-top: 24px;">Recibirás notificaciones cuando lleguen nuevos mensajes.</p>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    invoice_generated: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>🧾 Nueva factura disponible</h1>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Tu factura <span class="highlight">${data.invoiceNumber}</span> de <strong>${data.amount}€</strong> ya está disponible.</p>
          <p style="font-size: 13px; color: #888;">Concepto: ${data.description || 'Suscripción mensual'}</p>
          <a href="${data.pdfUrl || 'https://app.wasapy.io/app/billing'}" class="btn">Descargar factura PDF</a>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    payment_failed: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <div class="alert alert-error">
            <h1 style="margin-bottom: 8px; color: #ef4444;">❌ Pago rechazado</h1>
          </div>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>No hemos podido cobrar tu suscripción de <strong>${data.amount}€</strong>. Puede deberse a:</p>
          <ul style="color: #aaa; line-height: 1.8;">
            <li>Fondos insuficientes</li>
            <li>Tarjeta caducada</li>
            <li>Límite de gasto superado</li>
          </ul>
          <p><strong>Por favor, actualiza tu método de pago</strong> para evitar que tu agente se desactive.</p>
          <a href="https://app.wasapy.io/app/billing" class="btn" style="background: #ef4444;">Actualizar tarjeta</a>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    plan_expired: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>Tu plan ha expirado</h1>
          <p>Hola <strong>${data.name}</strong>,</p>
          <p>Tu periodo de prueba ha terminado y tu agente de WhatsApp IA se ha desactivado.</p>
          <p>Para volver a activarlo y seguir atendiendo a tus clientes automáticamente, elige un plan:</p>
          <div class="stats">
            <div class="stat"><span class="stat-value">29€</span><span class="stat-label">Starter</span></div>
            <div class="stat"><span class="stat-value">79€</span><span class="stat-label">Pro</span></div>
            <div class="stat"><span class="stat-value">199€</span><span class="stat-label">Business</span></div>
          </div>
          <a href="https://app.wasapy.io/app/billing" class="btn">Elegir plan</a>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    appointment_booked: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>📅 Nueva cita agendada</h1>
          <p>Hola <strong>${data.ownerName || 'ahí'}</strong>,</p>
          <p>Tu agente IA ha agendado una nueva cita con un cliente. Aquí están los detalles:</p>
          <div style="background: #0a0a0a; border: 1px solid #222; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #666; font-size: 13px; padding: 6px 0; width: 120px;">Cliente</td><td style="color: #fff; font-weight: 600;">${data.clientName || '—'}</td></tr>
              ${data.clientPhone ? `<tr><td style="color: #666; font-size: 13px; padding: 6px 0;">Teléfono</td><td style="color: #aaa;">${data.clientPhone}</td></tr>` : ''}
              ${data.clientEmail ? `<tr><td style="color: #666; font-size: 13px; padding: 6px 0;">Email</td><td style="color: #aaa;">${data.clientEmail}</td></tr>` : ''}
              <tr><td style="color: #666; font-size: 13px; padding: 6px 0;">Fecha</td><td style="color: #25D366; font-weight: 700;">${data.date || '—'}</td></tr>
              <tr><td style="color: #666; font-size: 13px; padding: 6px 0;">Hora</td><td style="color: #25D366; font-weight: 700;">${data.startTime || '—'}${data.endTime ? ` – ${data.endTime}` : ''}</td></tr>
              ${data.service ? `<tr><td style="color: #666; font-size: 13px; padding: 6px 0;">Servicio</td><td style="color: #aaa;">${data.service}</td></tr>` : ''}
              ${data.source ? `<tr><td style="color: #666; font-size: 13px; padding: 6px 0;">Fuente</td><td style="color: #555; font-size: 13px;">${data.source}</td></tr>` : ''}
            </table>
          </div>
          <a href="https://app.wasapy.io/app/calendario" class="btn">Ver en el calendario</a>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    new_lead: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>🔔 Nuevo lead en WhatsApp</h1>
          <p>Hola <strong>${data.ownerName || 'ahí'}</strong>,</p>
          <p>Tu agente IA acaba de iniciar conversación con un nuevo cliente potencial:</p>
          <div style="background: #0a0a0a; border: 1px solid #222; border-radius: 12px; padding: 20px; margin: 20px 0; display: flex; align-items: center; gap: 16px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(37,211,102,0.12); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;">👤</div>
            <div>
              <div style="color: #fff; font-weight: 700; font-size: 16px;">${data.contactName || 'Desconocido'}</div>
              <div style="color: #555; font-size: 13px; margin-top: 4px;">${data.contactPhone || ''}</div>
            </div>
          </div>
          ${data.firstMessage ? `<div style="background: rgba(37,211,102,0.05); border-left: 3px solid #25D366; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0;"><p style="font-size: 14px; color: #ccc; margin: 0; font-style: italic;">"${data.firstMessage}"</p></div>` : ''}
          <p style="font-size: 13px; color: #666;">Tu agente ya está respondiendo automáticamente. Puedes revisar la conversación en el panel.</p>
          <a href="https://app.wasapy.io/app/whatsapp" class="btn">Ver conversación</a>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,

    subscription_renewed: `
      <div class="container">
        <div class="logo"><img src="https://app.wasapy.io/images/Logoverde.png" alt="Wasapy" /></div>
        <div class="card">
          <h1>♻️ Suscripción renovada</h1>
          <p>Hola <strong>${data.name || 'ahí'}</strong>,</p>
          <p>Tu suscripción <span class="highlight">${data.plan || 'Pro'}</span> se ha renovado correctamente por <strong>${data.amount || '—'}€</strong>.</p>
          <div class="stats">
            <div class="stat"><span class="stat-value">${data.messageLimit || '—'}</span><span class="stat-label">Mensajes/mes</span></div>
            <div class="stat"><span class="stat-value">${data.amount || '—'}€</span><span class="stat-label">Cobrado</span></div>
          </div>
          <p>El contador de mensajes se ha reiniciado para este nuevo ciclo. ¡Listo para seguir atendiendo a tus clientes!</p>
          <a href="https://app.wasapy.io/app" class="btn">Ir al dashboard</a>
          <p style="font-size: 13px; color: #666; margin-top: 20px;">Próxima renovación: <span class="highlight">${data.nextBilling || '—'}</span></p>
        </div>
        <div class="footer">© 2026 Wasapy · <a href="https://wasapy.io" style="color: #666;">wasapy.io</a></div>
      </div>
    `,
  }

  const html = templates[template] || templates.welcome
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles}</style></head><body>${html}</body></html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const { to, subject, template, data = {} }: EmailRequest = await req.json()

    if (!to || !subject || !template) {
      return new Response(JSON.stringify({ error: 'to, subject, and template required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const html = getTemplate(template, data)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wasapy <info@wasapy.io>',
        to: [to],
        subject,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: result.message || 'Email failed' }),
        { status: res.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    return new Response(JSON.stringify({ success: true, emailId: result.id }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (error) {
    console.error('Send email error:', error)
    return new Response(JSON.stringify({ error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
