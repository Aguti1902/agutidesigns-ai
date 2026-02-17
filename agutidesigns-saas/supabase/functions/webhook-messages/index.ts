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

        await supabase.from('agents').update(updates).eq('id', agentId)
        console.log('Connection update:', agentId, isConnected, 'phone:', updates.whatsapp_number || 'none')
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

        let systemPrompt = agent.system_prompt || 'Eres un asistente virtual amable. Responde en español.'

        // Load business data for context
        const { data: business } = await supabase.from('businesses').select('*').eq('user_id', agent.user_id).single()
        if (business) {
          const ctx = []
          if (business.name) ctx.push(`Negocio: ${business.name}`)
          if (business.sector) ctx.push(`Sector: ${business.sector}`)
          if (business.description) ctx.push(`Descripción: ${business.description}`)
          if (business.services) ctx.push(`Servicios:\n${business.services}`)
          if (business.prices) ctx.push(`Precios:\n${business.prices}`)
          if (business.schedule) ctx.push(`Horarios: ${business.schedule}`)
          if (business.address) ctx.push(`Dirección: ${business.address}`)
          if (business.phone) ctx.push(`Teléfono: ${business.phone}`)
          if (business.email) ctx.push(`Email: ${business.email}`)
          if (business.website) ctx.push(`Web: ${business.website}`)
          if (business.faq) ctx.push(`FAQ:\n${business.faq}`)
          if (business.extra_context) {
            try {
              const extra = JSON.parse(business.extra_context)
              for (const [k, v] of Object.entries(extra)) {
                if (v && typeof v === 'string' && v.trim()) ctx.push(`${k}: ${v}`)
              }
            } catch { ctx.push(business.extra_context) }
          }
          if (ctx.length) systemPrompt += '\n\nINFORMACIÓN DEL NEGOCIO:\n' + ctx.join('\n\n')
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

        // Call OpenAI
        const historyMsgs = (history || []).slice(-18)
        console.log('Calling OpenAI... key starts with:', OPENAI_KEY?.substring(0, 12), 'history:', historyMsgs.length, 'prompt length:', systemPrompt.length)
        
        let aiResponse = ''
        try {
          const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                ...historyMsgs,
              ],
              temperature: 0.7,
              max_tokens: 500
            })
          })
          const openaiData = await openaiRes.json()
          console.log('OpenAI status:', openaiRes.status, 'error:', openaiData.error?.message || 'none')
          aiResponse = openaiData.choices?.[0]?.message?.content || ''
          
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
        await supabase.from('agents').update({ total_messages: (agent.total_messages || 0) + 1 }).eq('id', agentId)

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
