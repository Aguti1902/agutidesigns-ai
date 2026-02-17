import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://evolution-api-production-a7fc.up.railway.app'
    const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'agutidesigns-evo-2026'
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY') || ''
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const body = await req.json()
    const event = body.event || ''
    const eventLower = event.toLowerCase().replace(/_/g, '.')

    console.log('Webhook event:', event, 'instance:', body.instance)

    // Connection update
    if (eventLower.includes('connection')) {
      const instanceName = body.instance
      const agentId = instanceName?.replace('agent-', '')
      if (agentId && SUPABASE_URL && SUPABASE_KEY) {
        const state = body.data?.state || body.data?.status || ''
        const isConnected = state === 'open'
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
        const updates: any = { whatsapp_connected: isConnected, is_active: isConnected }

        // Try to extract phone number from connection event
        const ownerJid = body.data?.ownerJid || body.data?.owner || body.data?.wuid || ''
        if (ownerJid) {
          const phone = ownerJid.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/[^0-9+]/g, '')
          if (phone && phone.length >= 8) {
            updates.whatsapp_number = phone
            console.log('Phone detected from connection:', phone)
          }
        }

        // Anti-abuse: check if phone was already used for a trial
        if (isConnected && updates.whatsapp_number) {
          const phone = updates.whatsapp_number.replace(/[^0-9+]/g, '')
          
          // First get the user's subscription status
          const { data: agentData } = await supabase.from('agents').select('user_id').eq('id', agentId).single()
          let userSubscription = 'trial'
          if (agentData?.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('subscription_status')
              .eq('id', agentData.user_id)
              .single()
            userSubscription = profileData?.subscription_status || 'trial'
          }

          // Check if phone already used for trial
          const { data: usedPhone } = await supabase
            .from('used_trial_phones')
            .select('phone')
            .eq('phone', phone)
            .single()
          
          if (usedPhone && userSubscription === 'trial') {
            // Only block if user is still on trial - paid users can reuse their number
            console.log('❌ Phone already used for trial:', phone, '- disconnecting')
            updates.whatsapp_connected = false
            updates.is_active = false
            await supabase.from('agents').update(updates).eq('id', agentId)
            try {
              await fetch(`${EVOLUTION_URL}/instance/delete/agent-${agentId}`, {
                method: 'DELETE',
                headers: { 'apikey': EVOLUTION_KEY }
              })
            } catch {}
            return new Response(JSON.stringify({ 
              ok: false, 
              error: 'Este número de WhatsApp ya se ha usado para una prueba gratuita.' 
            }), { headers: { 'Content-Type': 'application/json' } })
          }
          
          if (usedPhone && userSubscription === 'active') {
            console.log('✅ Phone reused by paid user:', phone, '- allowing')
          }
          
          // If trial user with new phone, register it
          if (!usedPhone && userSubscription === 'trial' && agentData?.user_id) {
            await supabase.from('used_trial_phones').insert({
              phone,
              user_id: agentData.user_id,
            })
            console.log('✅ Registered trial phone:', phone)
          }
        }

        await supabase.from('agents').update(updates).eq('id', agentId)
        console.log('Connection update:', agentId, isConnected, 'phone:', updates.whatsapp_number || 'none')
        
        // Send email when agent connects successfully
        if (isConnected && SUPABASE_URL && SUPABASE_KEY) {
          try {
            const { data: agentData } = await supabase.from('agents').select('user_id, name').eq('id', agentId).single()
            if (agentData?.user_id) {
              const { data: profileData } = await supabase.from('profiles').select('full_name, stripe_customer_id').eq('id', agentData.user_id).single()
              if (profileData?.stripe_customer_id) {
                const custRes = await fetch(`https://api.stripe.com/v1/customers/${profileData.stripe_customer_id}`, {
                  headers: { 'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` }
                })
                const custData = await custRes.json()
                if (custData.email) {
                  await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
                    body: JSON.stringify({
                      to: custData.email,
                      subject: '✅ WhatsApp conectado - Tu agente ya está activo',
                      template: 'agent_connected',
                      data: {
                        name: profileData?.full_name || 'ahí',
                        phone: updates.whatsapp_number || 'XXX',
                        agentName: agentData.name || 'Mi Agente IA'
                      }
                    })
                  }).catch(e => console.warn('Email failed:', e))
                }
              }
            }
          } catch (e) { console.warn('Email error:', e) }
        }
      }
      return new Response(JSON.stringify({ ok: true }))
    }

    // Messages
    if (eventLower.includes('messages') && eventLower.includes('upsert')) {
      // v2.3.7 sends array of messages in body.data
      let messages = body.data
      if (!Array.isArray(messages)) messages = [messages]

      for (const message of messages) {
        if (!message || message.key?.fromMe) continue

        const instanceName = body.instance
        const agentId = instanceName?.replace('agent-', '')
        const remoteJid = message.key?.remoteJid || ''
        
        // Skip groups and status
        if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') continue

        const contactPhone = remoteJid.replace('@s.whatsapp.net', '').replace('@lid', '')
        const contactName = message.pushName || contactPhone
        const messageText = message.message?.conversation || 
                           message.message?.extendedTextMessage?.text ||
                           message.message?.imageMessage?.caption ||
                           ''

        if (!messageText || !agentId) continue

        console.log('Message from:', contactName, '(' + contactPhone + '):', messageText)

        if (!SUPABASE_URL || !SUPABASE_KEY) {
          console.log('No Supabase keys')
          continue
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

        // Get agent
        const { data: agent } = await supabase.from('agents').select('*').eq('id', agentId).single()
        if (!agent || !agent.is_active) {
          console.log('Agent not found or inactive:', agentId)
          continue
        }

        // Check message limit
        const { data: ownerProfile } = await supabase.from('profiles').select('message_limit, extra_messages').eq('id', agent.user_id).single()
        const msgLimit = (ownerProfile?.message_limit || 500) + (ownerProfile?.extra_messages || 0)
        if ((agent.total_messages || 0) >= msgLimit) {
          console.log('Message limit reached:', agent.total_messages, '>=', msgLimit)
          // Deactivate agent
          await supabase.from('agents').update({ is_active: false }).eq('id', agentId)
          // Send limit message to client
          try {
            await fetch(`${EVOLUTION_URL}/message/sendText/${body.instance}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
              body: JSON.stringify({ number: remoteJid, text: 'Este servicio no está disponible en este momento. Por favor, contacta directamente con el negocio.' })
            })
          } catch {}
          continue
        }

        let systemPrompt = agent.system_prompt || 'Eres un asistente virtual amable y profesional. Responde en español. Atiende al cliente, responde sus preguntas e intenta ayudarle al máximo.'

        // Build real calendar for the next 7 days
        const now = new Date()
        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
        const currentDay = dayNames[now.getDay()]
        const currentDate = `${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`
        const currentTime = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

        systemPrompt += `\n\n═══ CONTEXTO TEMPORAL ═══\nHOY es: ${currentDay}, ${currentDate}\nHora actual: ${currentTime}`

        // Add client context
        systemPrompt += `\n\n═══ CONTEXTO DEL CLIENTE ═══\nNombre del cliente: ${contactName}\nTeléfono: ${contactPhone}\nCanal: WhatsApp`

        // Load business data for context
        const { data: business } = await supabase.from('businesses').select('*').eq('user_id', agent.user_id).single()
        let scheduleWeekdays = ''
        let scheduleSaturday = ''
        let scheduleSunday = ''
        let scheduleNotes = ''
        if (business) {
          const ctx: string[] = []
          if (business.name) ctx.push(`NOMBRE DEL NEGOCIO: ${business.name}`)
          if (business.sector) ctx.push(`SECTOR: ${business.sector}`)
          if (business.description) ctx.push(`DESCRIPCIÓN: ${business.description}`)
          if (business.services) ctx.push(`SERVICIOS:\n${business.services}`)
          if (business.prices) ctx.push(`PRECIOS:\n${business.prices}`)
          if (business.schedule) ctx.push(`HORARIOS: ${business.schedule}`)
          if (business.address) ctx.push(`DIRECCIÓN: ${business.address}`)
          if (business.phone) ctx.push(`TELÉFONO DE CONTACTO: ${business.phone}`)
          if (business.email) ctx.push(`EMAIL: ${business.email}`)
          if (business.website) ctx.push(`WEB: ${business.website}`)
          if (business.faq) ctx.push(`PREGUNTAS FRECUENTES:\n${business.faq}`)
          if (business.extra_context) {
            try {
              const extra = JSON.parse(business.extra_context)
              const labels: Record<string, string> = {
                slogan: 'ESLOGAN', schedule_weekdays: 'HORARIO LUNES A VIERNES', schedule_saturday: 'HORARIO SÁBADO',
                schedule_sunday: 'HORARIO DOMINGO', schedule_notes: 'NOTAS SOBRE HORARIOS', google_maps: 'GOOGLE MAPS',
                services_list: 'LISTA DE SERVICIOS', prices_list: 'LISTA DE PRECIOS', offers: 'OFERTAS Y PROMOCIONES ACTUALES',
                faq_list: 'PREGUNTAS FRECUENTES', cancellation_policy: 'POLÍTICA DE CANCELACIÓN',
                payment_methods: 'MÉTODOS DE PAGO', return_policy: 'POLÍTICA DE DEVOLUCIONES',
                other_policies: 'OTRAS POLÍTICAS', team: 'EQUIPO Y PERSONAL', specialties: 'ESPECIALIDADES Y DIFERENCIADORES',
                social_media: 'REDES SOCIALES',
              }
              for (const [k, v] of Object.entries(extra)) {
                if (v && typeof v === 'string' && (v as string).trim()) {
                  const label = labels[k] || k.toUpperCase().replace(/_/g, ' ')
                  ctx.push(`${label}: ${v}`)
                  if (k === 'schedule_weekdays') scheduleWeekdays = v as string
                  if (k === 'schedule_saturday') scheduleSaturday = v as string
                  if (k === 'schedule_sunday') scheduleSunday = v as string
                  if (k === 'schedule_notes') scheduleNotes = v as string
                }
              }
            } catch { ctx.push(`INFORMACIÓN ADICIONAL:\n${business.extra_context}`) }
          }
          if (!scheduleWeekdays && business.schedule) scheduleWeekdays = business.schedule
          if (ctx.length) systemPrompt += '\n\n═══ INFORMACIÓN DEL NEGOCIO ═══\n' + ctx.join('\n\n')
        }

        // Only build calendar context if booking is enabled
        const bookingEnabled = !!agent.booking_enabled
        const todayStr = now.toISOString().split('T')[0]

        if (bookingEnabled) {
        // Build an explicit day-by-day calendar for the next 7 days
        const next7: { date: Date, dateStr: string, label: string, dayOfWeek: number }[] = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(now)
          d.setDate(d.getDate() + i)
          const dStr = d.toISOString().split('T')[0]
          const dayNum = d.getDay() // 0=dom, 1=lun ... 6=sáb
          const label = `${dayNames[dayNum]} ${d.getDate()} de ${monthNames[d.getMonth()]}`
          next7.push({ date: d, dateStr: dStr, label, dayOfWeek: dayNum })
        }

        // Load existing appointments
        let apptsByDate: Record<string, any[]> = {}
        try {
          const lastDateStr = next7[6].dateStr
          const { data: appts } = await supabase
            .from('appointments')
            .select('client_name, service, appointment_date, start_time, end_time, status')
            .eq('user_id', agent.user_id)
            .gte('appointment_date', todayStr)
            .lte('appointment_date', lastDateStr)
            .neq('status', 'cancelled')
            .order('start_time', { ascending: true })
          if (appts) {
            for (const a of appts) {
              if (!apptsByDate[a.appointment_date]) apptsByDate[a.appointment_date] = []
              apptsByDate[a.appointment_date].push(a)
            }
          }
        } catch (e) {
          console.warn('Appointments fetch error (non-fatal):', e)
        }

        // Build the full availability calendar
        let calendarContext = '\n\n═══ CALENDARIO REAL — PRÓXIMOS 7 DÍAS ═══\n'
        calendarContext += '⚠️ ESTA ES LA REFERENCIA EXACTA DE FECHAS. NO inventes días ni fechas. Usa SOLO las que aparecen aquí:\n'

        for (const day of next7) {
          const dow = day.dayOfWeek
          let schedule = 'No definido'
          const isClosed = (str: string) => {
            const s = str.trim().toLowerCase()
            return s === 'cerrado' || s === 'closed' || s === '-' || s === ''
          }
          if (dow >= 1 && dow <= 5) {
            schedule = scheduleWeekdays || 'No definido'
          } else if (dow === 6) {
            schedule = scheduleSaturday || 'No definido'
          } else if (dow === 0) {
            schedule = scheduleSunday || 'No definido'
          }
          const closed = isClosed(schedule)

          calendarContext += `\n📅 ${day.label.toUpperCase()} (${day.dateStr})`
          if (closed) {
            calendarContext += ` — CERRADO\n`
          } else {
            calendarContext += ` — Horario: ${schedule}\n`
            const dayAppts = apptsByDate[day.dateStr]
            if (dayAppts && dayAppts.length > 0) {
              for (const a of dayAppts) {
                calendarContext += `   🔴 OCUPADO ${a.start_time?.substring(0,5)}-${a.end_time?.substring(0,5)}: ${a.client_name}${a.service ? ' (' + a.service + ')' : ''}\n`
              }
              calendarContext += `   🟢 El resto de horas dentro del horario (${schedule}) están LIBRES\n`
            } else {
              calendarContext += `   🟢 TODO EL DÍA LIBRE dentro del horario (${schedule})\n`
            }
          }
        }

        if (scheduleNotes) calendarContext += `\nNOTAS: ${scheduleNotes}\n`

        calendarContext += `\n═══ REGLAS DE AGENDAMIENTO (OBLIGATORIAS) ═══
- Usa SIEMPRE las fechas EXACTAS del calendario de arriba. NUNCA inventes un día de la semana.
- Propón solo días que estén ABIERTOS y horas LIBRES.
- Ofrece 2-3 opciones concretas (ej: "miércoles 19 a las 10:00, jueves 20 a las 16:00").
- Formato de fecha al proponer: *día_semana día_mes de mes* (ej: *miércoles 19 de febrero a las 10:00*).
- Al confirmar, repite: fecha completa, hora, servicio y nombre del cliente.
- Si piden un horario OCUPADO, di que no está disponible y ofrece la siguiente hora libre.
- Cuando el cliente CONFIRME, usa la función create_appointment para guardar la cita.
- El campo appointment_date debe ser formato YYYY-MM-DD (usa las fechas entre paréntesis del calendario).`

        systemPrompt += calendarContext
        } // end if (bookingEnabled)

        // Add enhanced behavioral instructions if the prompt doesn't already include them
        if (!systemPrompt.includes('FLUJO DE CONVERSACIÓN') && !systemPrompt.includes('TÉCNICAS DE VENTA')) {
          systemPrompt += `\n\n═══ INSTRUCCIONES ADICIONALES DE COMPORTAMIENTO ═══
- Responde de forma CONCISA (2-3 párrafos máximo, esto es WhatsApp)
- Usa *negritas* para datos clave como precios, horarios o direcciones
- Termina siempre con una pregunta o llamada a la acción para mantener la conversación
- Si el cliente muestra interés en un servicio, facilita el siguiente paso (reservar, visitar, contactar)
- Usa la información del negocio como ÚNICA fuente de verdad. NUNCA inventes datos.
- Si no tienes una respuesta, sé honesto: "No tengo esa información, pero puedo preguntarlo al equipo"
- Si detectas intención de compra/reserva, facilita el proceso al máximo`
        }

        // Get or create conversation
        let { data: conv } = await supabase.from('conversations').select('id, messages_count').eq('agent_id', agentId).eq('contact_phone', contactPhone).single()
        if (!conv) {
          const { data: newConv } = await supabase.from('conversations').insert({ agent_id: agentId, contact_name: contactName, contact_phone: contactPhone, is_lead: true }).select().single()
          conv = newConv
          await supabase.from('agents').update({ total_leads: (agent.total_leads || 0) + 1 }).eq('id', agentId)
        }
        if (!conv) continue

        // Save user message
        await supabase.from('messages').insert({ conversation_id: conv.id, role: 'user', content: messageText })

        // Get history
        const { data: history } = await supabase.from('messages').select('role, content').eq('conversation_id', conv.id).order('created_at', { ascending: true }).limit(20)

        // Send "composing" (typing) status
        try {
          await fetch(`${EVOLUTION_URL}/chat/presence/${instanceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
            body: JSON.stringify({ number: remoteJid, presence: 'composing' })
          })
        } catch {}

        // Define function tools for OpenAI (only if booking enabled)
        const tools = bookingEnabled ? [
          {
            type: 'function',
            function: {
              name: 'create_appointment',
              description: 'Crea una cita/reserva cuando el cliente confirma día, hora y servicio. Usa SOLO cuando el cliente haya confirmado explícitamente.',
              parameters: {
                type: 'object',
                properties: {
                  client_name: { type: 'string', description: 'Nombre del cliente' },
                  service: { type: 'string', description: 'Servicio que solicita' },
                  appointment_date: { type: 'string', description: 'Fecha de la cita en formato YYYY-MM-DD' },
                  start_time: { type: 'string', description: 'Hora de inicio en formato HH:MM' },
                  end_time: { type: 'string', description: 'Hora de fin en formato HH:MM' },
                  notes: { type: 'string', description: 'Notas adicionales (opcional)' },
                },
                required: ['client_name', 'appointment_date', 'start_time', 'end_time'],
              },
            },
          },
        ] : []

        // Call OpenAI
        const historyMsgs = (history || []).slice(-20)
        console.log('Calling OpenAI... booking:', bookingEnabled, 'history:', historyMsgs.length, 'prompt length:', systemPrompt.length)
        
        let aiResponse = ''
        try {
          const openaiBody: any = {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...historyMsgs,
            ],
            temperature: 0.65,
            max_tokens: 600,
            presence_penalty: 0.1,
            frequency_penalty: 0.15
          }
          if (tools.length > 0) {
            openaiBody.tools = tools
            openaiBody.tool_choice = 'auto'
          }
          const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify(openaiBody)
          })
          const openaiData = await openaiRes.json()
          console.log('OpenAI status:', openaiRes.status, 'error:', openaiData.error?.message || 'none')
          
          const choice = openaiData.choices?.[0]
          
          // Handle function calls (create_appointment)
          if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
            const toolCall = choice.message.tool_calls[0]
            if (toolCall.function.name === 'create_appointment') {
              try {
                const args = JSON.parse(toolCall.function.arguments)
                console.log('Creating appointment:', JSON.stringify(args))
                
                const { error: apptError } = await supabase.from('appointments').insert({
                  user_id: agent.user_id,
                  agent_id: agentId,
                  client_name: args.client_name || contactName,
                  client_phone: contactPhone,
                  service: args.service || null,
                  appointment_date: args.appointment_date,
                  start_time: args.start_time,
                  end_time: args.end_time,
                  notes: args.notes || null,
                  status: 'confirmed',
                  created_by: 'ai',
                })
                
                if (apptError) {
                  console.error('Appointment insert error:', apptError)
                }
                
                // Call OpenAI again with the function result to get the final response
                const followUpRes = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
                  body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                      { role: 'system', content: systemPrompt },
                      ...historyMsgs,
                      choice.message,
                      { role: 'tool', tool_call_id: toolCall.id, content: apptError ? 'Error al crear la cita. Informa al cliente que hubo un problema y que lo intente de nuevo.' : `Cita creada correctamente: ${args.client_name}, ${args.appointment_date} de ${args.start_time} a ${args.end_time}${args.service ? ', servicio: ' + args.service : ''}. Confirma al cliente que su cita ha sido agendada.` }
                    ],
                    temperature: 0.65,
                    max_tokens: 400,
                  })
                })
                const followUpData = await followUpRes.json()
                aiResponse = followUpData.choices?.[0]?.message?.content || ''
                if (!aiResponse) aiResponse = `¡Tu cita ha quedado agendada para el ${args.appointment_date} de ${args.start_time} a ${args.end_time}! Si necesitas cambiar algo, avísame.`
              } catch (fnErr) {
                console.error('Function call error:', fnErr)
                aiResponse = choice.message.content || 'He intentado agendar tu cita pero ha habido un problema. ¿Podrías confirmarme los datos de nuevo?'
              }
            }
          } else {
            aiResponse = choice?.message?.content || ''
          }
          
          if (!aiResponse && openaiData.error) {
            console.error('OpenAI error:', JSON.stringify(openaiData.error))
            aiResponse = 'Disculpa, tengo un problema técnico. Por favor, inténtalo de nuevo en unos minutos.'
          } else if (!aiResponse) {
            aiResponse = 'Disculpa, no he podido procesar tu mensaje. ¿Podrías repetirlo?'
          }
        } catch (openaiErr) {
          console.error('OpenAI fetch error:', openaiErr)
          aiResponse = 'Disculpa, tengo un problema técnico temporal.'
        }
        console.log('AI:', aiResponse.substring(0, 80))

        // Save AI response
        await supabase.from('messages').insert({ conversation_id: conv.id, role: 'assistant', content: aiResponse })
        await supabase.from('conversations').update({ messages_count: (conv.messages_count || 0) + 2, last_message_at: new Date().toISOString() }).eq('id', conv.id)
        const newTotal = (agent.total_messages || 0) + 1
        await supabase.from('agents').update({ total_messages: newTotal }).eq('id', agentId)
        
        // Check message usage and send alerts
        const { data: profile } = await supabase.from('profiles').select('full_name, stripe_customer_id, last_80_alert, last_95_alert').eq('id', agent.user_id).single()
        if (profile?.stripe_customer_id) {
          const { data: allAgents } = await supabase.from('agents').select('total_messages').eq('user_id', agent.user_id)
          const totalUsed = (allAgents || []).reduce((sum, a) => sum + (a.total_messages || 0), 0)
          const limit = msgLimit
          const percentage = limit > 0 ? (totalUsed / limit) * 100 : 0
          
          const today = new Date().toISOString().split('T')[0]
          
          // Alert at 95% (critical)
          if (percentage >= 95 && profile.last_95_alert !== today) {
            try {
              const custRes = await fetch(`https://api.stripe.com/v1/customers/${profile.stripe_customer_id}`, {
                headers: { 'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` }
              })
              const custData = await custRes.json()
              if (custData.email) {
                await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
                  body: JSON.stringify({
                    to: custData.email,
                    subject: '🚨 ¡Casi sin mensajes! - Amplía tu plan ahora',
                    template: 'messages_95',
                    data: { name: profile.full_name || 'ahí', used: totalUsed, limit, percentage: Math.round(percentage) }
                  })
                }).catch(e => console.warn('Email failed:', e))
                await supabase.from('profiles').update({ last_95_alert: today }).eq('id', agent.user_id)
              }
            } catch (e) { console.warn('95% alert error:', e) }
          }
          // Alert at 80% (warning)
          else if (percentage >= 80 && profile.last_80_alert !== today) {
            try {
              const custRes = await fetch(`https://api.stripe.com/v1/customers/${profile.stripe_customer_id}`, {
                headers: { 'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` }
              })
              const custData = await custRes.json()
              if (custData.email) {
                await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
                  body: JSON.stringify({
                    to: custData.email,
                    subject: '⚠️ Llegando al límite de mensajes',
                    template: 'messages_80',
                    data: { name: profile.full_name || 'ahí', used: totalUsed, limit, percentage: Math.round(percentage) }
                  })
                }).catch(e => console.warn('Email failed:', e))
                await supabase.from('profiles').update({ last_80_alert: today }).eq('id', agent.user_id)
              }
            } catch (e) { console.warn('80% alert error:', e) }
          }
        }

        // Send via WhatsApp - use remoteJid directly
        console.log('Sending to:', remoteJid)
        const sendRes = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
          body: JSON.stringify({ number: remoteJid, text: aiResponse })
        })
        const sendData = await sendRes.json()
        console.log('Send result:', sendRes.status, JSON.stringify(sendData).substring(0, 100))
      }

      return new Response(JSON.stringify({ ok: true }))
    }

    // Other events
    console.log('Unhandled event:', event)
    return new Response(JSON.stringify({ ok: true }))
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
